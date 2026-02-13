<?php

namespace App\Http\Controllers;

use App\Events\AttendanceRecorded;
use App\Models\Attendance;
use App\Models\Classes;
use App\Models\Qrcode;
use App\Models\Schedule;
use App\Models\StudentProfile;
use App\Models\TeacherProfile;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceController extends Controller
{
    protected WhatsAppService $whatsapp;

    public function __construct(WhatsAppService $whatsapp)
    {
        $this->whatsapp = $whatsapp;
    }

    /**
     * Scan QR Code (Self)
     *
     * Record attendance by scanning a valid QR code.
     * Accessible by both Student and Teacher.
     */
    public function scan(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'exists:qrcodes,token'],
            'device_id' => ['nullable', 'integer'],
        ]);

        $qr = Qrcode::with('schedule:id,class_id,teacher_id,subject_name,start_time,end_time,room')->where('token', $data['token'])->firstOrFail();

        if (! $qr->is_active || $qr->isExpired()) {
            return response()->json(['message' => 'QR tidak aktif atau sudah kadaluarsa'], 422);
        }

        $user = $request->user();
        $now = now();

        if ($qr->type === 'student' && $user->user_type !== 'student') {
            return response()->json(['message' => 'QR hanya untuk siswa'], 403);
        }

        if ($qr->type === 'teacher' && $user->user_type !== 'teacher') {
            return response()->json(['message' => 'QR hanya untuk guru'], 403);
        }

        if ($user->user_type === 'student' && ! $user->studentProfile) {
            return response()->json(['message' => 'Profil siswa tidak ditemukan'], 422);
        }

        if ($user->user_type === 'teacher' && ! $user->teacherProfile) {
            return response()->json(['message' => 'Profil guru tidak ditemukan'], 422);
        }

        // Check if student is on leave (cannot scan if on leave)
        if ($user->user_type === 'student' && $user->studentProfile) {
            $activeLeave = \App\Models\StudentLeavePermission::where('student_id', $user->studentProfile->id)
                ->where('date', $now->toDateString())
                ->where('status', 'active')
                ->first();

            if ($activeLeave) {
                // Check if this schedule is during the leave period
                if ($activeLeave->shouldHideFromAttendance($qr->schedule)) {
                    $leaveType = match ($activeLeave->type) {
                        'sakit' => 'Sakit',
                        'izin' => 'Izin',
                        'izin_pulang' => 'Izin Pulang',
                        'dispensasi' => 'Dispensasi',
                        default => 'Izin',
                    };

                    return response()->json([
                        'message' => "Anda sedang dalam status {$leaveType} dan tidak dapat melakukan presensi",
                        'leave_permission' => $activeLeave,
                    ], 422);
                }
            }
        }

        $attributes = [
            'attendee_type' => $user->user_type,
            'student_id' => $user->user_type === 'student' ? $user->studentProfile->id : null,
            'teacher_id' => $user->user_type === 'teacher' ? $user->teacherProfile->id : null,
            'schedule_id' => $qr->schedule_id,
        ];

        $lockKey = "attendance_scan_{$user->id}_{$qr->schedule_id}_{$now->toDateString()}";

        // Prevent race conditions with atomic lock
        return Cache::lock($lockKey, 10)->block(5, function () use ($attributes, $now, $qr, $user) {
            return DB::transaction(function () use ($attributes, $now, $qr, $user) {
                if ($user->user_type === 'student') {
                    $user->devices()->where('id', request('device_id'))->where('active', true)->update(['last_used_at' => $now]);
                }

                $existing = Attendance::where($attributes)
                    ->whereDate('date', $now->toDateString())
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    return response()->json([
                        'message' => 'Presensi sudah tercatat',
                        'attendance' => new \App\Http\Resources\AttendanceResource($existing->load(['student.user', 'teacher.user', 'schedule.class'])),
                    ]);
                }

                $attendance = Attendance::create([
                    ...$attributes,
                    'date' => $now,
                    'qrcode_id' => $qr->id,
                    'status' => $this->determineStatus($qr->schedule, $now), // Use strict status check
                    'checked_in_at' => $now,
                    'source' => 'qrcode',
                ]);

                // dispatch event after creation to ensure ID is available
                AttendanceRecorded::dispatch($attendance);

                Log::info('attendance.recorded', [
                    'attendance_id' => $attendance->id,
                    'schedule_id' => $attendance->schedule_id,
                    'user_id' => $user->id,
                    'attendee_type' => $attendance->attendee_type,
                    'status' => $attendance->status,
                ]);

                return response()->json(new \App\Http\Resources\AttendanceResource($attendance->loadMissing(['student.user', 'teacher.user', 'schedule.class'])));
            });
        });
    }

    /**
     * Scan Student QR Code (Teacher)
     *
     * Record attendance for a student by scanning their QR code (NISN).
     * Accessible only by Teachers.
     */
    public function scanStudent(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'], // Accept 'token' as per frontend, but treat as NISN
            'device_id' => ['nullable', 'integer'],
        ]);

        $nisn = $data['token']; // Frontend sends 'token', but for student scan it's NISN

        $user = $request->user();
        if ($user->user_type !== 'teacher' || ! $user->teacherProfile) {
            return response()->json(['message' => 'Hanya guru yang dapat melakukan scan ini'], 403);
        }

        $student = StudentProfile::with('user')->where('nisn', $nisn)->first();
        if (! $student) {
            return response()->json(['message' => 'Siswa dengan NISN ini tidak ditemukan'], 404);
        }

        // Find active schedule for this teacher
        $now = now();
        $day = $now->format('l'); // English day name (e.g., Thursday)
        $time = $now->format('H:i:s');

        // Find schedule that matches day and time
        // We use a looser check: Schedule for this teacher, today.
        // Ideally we check time, but for now let's just find the *current* one.
        $schedule = Schedule::with('class')
            ->where('teacher_id', $user->teacherProfile->id)
            ->where('day', $day)
            ->where('start_time', '<=', $time)
            ->where('end_time', '>=', $time)
            ->first();

        if (! $schedule) {
            return response()->json(['message' => 'Tidak ada jadwal mengajar aktif saat ini.'], 422);
        }

        if ($schedule->class_id !== $student->class_id) {
            return response()->json([
                'message' => "Siswa ini ({$student->user->name}) bukan dari kelas jadwal saat ini ({$schedule->class->name})",
            ], 422);
        }

        // Check for leave
        $activeLeave = \App\Models\StudentLeavePermission::where('student_id', $student->id)
            ->where('date', $now->toDateString())
            ->where('status', 'active')
            ->first();

        if ($activeLeave && $activeLeave->shouldHideFromAttendance($schedule)) {
            $leaveType = $this->getLeaveTypeLabel($activeLeave->type);

            return response()->json([
                'message' => "Siswa sedang dalam status {$leaveType}",
                'leave_permission' => $activeLeave,
            ], 422);
        }

        $attributes = [
            'attendee_type' => 'student',
            'student_id' => $student->id,
            'schedule_id' => $schedule->id,
        ];

        // Lock to prevent duplicates
        $lockKey = "attendance_scan_student_{$student->id}_{$schedule->id}_{$now->toDateString()}";

        // Using Cache Lock
        $lock = Cache::lock($lockKey, 10);

        try {
            if ($lock->get()) {
                $existing = Attendance::where($attributes)
                    ->whereDate('date', $now->toDateString())
                    ->first();

                if ($existing) {
                    return response()->json([
                        'message' => 'Presensi siswa sudah tercatat',
                        'status' => $existing->status,
                        'student' => $student,
                    ]);
                }

                $attendance = Attendance::create([
                    'attendee_type' => 'student',
                    'student_id' => $student->id,
                    'schedule_id' => $schedule->id,
                    'date' => $now,
                    'status' => 'present',
                    'checked_in_at' => $now,
                    'source' => 'teacher_scan',
                ]);

                AttendanceRecorded::dispatch($attendance);

                return response()->json([
                    'message' => 'Presensi berhasil dicatat',
                    'status' => $attendance->status,
                    'student' => $student,
                ]);
            } else {
                return response()->json(['message' => 'Sedang memproses...'], 429);
            }
        } finally {
            $lock->release();
        }
    }

    /**
     * Determine status based on schedule time
     */
    private function determineStatus($schedule, $checkInTime): string
    {
        if (! $schedule || ! $schedule->start_time) {
            return 'present';
        }

        $startTime = Carbon::parse($schedule->start_time);

        // Use today's date combined with schedule time for comparison
        $scheduledDateTime = Carbon::createFromTime(
            $startTime->hour,
            $startTime->minute,
            $startTime->second
        );

        // Grace period from settings
        $gracePeriod = (int) (\App\Models\Setting::where('key', 'grace_period')->value('value') ?? 15);
        $lateThreshold = $scheduledDateTime->copy()->addMinutes($gracePeriod);

        if ($checkInTime->gt($lateThreshold)) {
            return 'late';
        }

        return 'present';
    }

    /**
     * Manual Attendance Input
     *
     * Manually record attendance for a student.
     * Accessible by Teachers (for their class/schedule).
     */
    public function storeManual(Request $request): JsonResponse
    {
        $data = $request->validate([
            'attendee_type' => ['required', 'in:student'],
            'student_id' => ['required', 'exists:student_profiles,id'],
            'schedule_id' => ['required', 'exists:schedules,id'],
            'status' => ['required', 'in:present,late,excused,sick,absent,dinas,izin,pulang,return'],
            'date' => ['required', 'date'],
            'reason' => ['nullable', 'string'],
        ]);

        $user = $request->user();
        $schedule = Schedule::findOrFail($data['schedule_id']);

        // Authorization: Teacher must be the owner or Admin/Waka
        if ($user->user_type === 'teacher' && $schedule->teacher_id !== $user->teacherProfile->id) {
            // Also check if Homeroom Teacher? Maybe not for manual input of subject attendance.
            // But waka/admin might use this too.
            // For now, restrict to schedule teacher.
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $now = Carbon::parse($data['date']);

        // Map 'pulang' to 'return' for database enum
        $status = $data['status'] === 'pulang' ? 'return' : $data['status'];

        $attributes = [
            'attendee_type' => 'student',
            'student_id' => $data['student_id'],
            'schedule_id' => $data['schedule_id'],
        ];

        $attendance = Attendance::updateOrCreate(
            [
                ...$attributes,
                'date' => $now->toDateString(), // Use only date part for uniqueness? Or datetime? Table usually has date column as date or datetime. Seeder uses timestamps.
                // Migration says date is datetime. But unique logic usually per day per schedule.
                // Let's assume we want to update if exists.
            ],
            [
                'status' => $status,
                'checked_in_at' => $now, // Or keep original check in? If manual overwrite, maybe update time too.
                'source' => 'manual',
                'reason' => $data['reason'] ?? null,
            ]
        );

        // If updated, we might want to log it?

        return response()->json([
            'message' => 'Kehadiran berhasil disimpan',
            'attendance' => $attendance,
        ]);
    }

    /**
     * Close Attendance Session
     *
     * Close the attendance for a schedule, marking all unscanned students as absent (Alpha).
     */
    public function close(Request $request, Schedule $schedule): JsonResponse
    {
        // 1. Validate User is the Teacher of this schedule
        $user = $request->user();
        if ($user->user_type !== 'teacher' || $schedule->teacher_id !== $user->teacherProfile->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $now = now();
        $today = $now->toDateString();

        // 2. Get all students in the class
        $students = StudentProfile::where('class_id', $schedule->class_id)->get();

        // 3. Get existing attendance for this schedule today
        $existingStudentIds = Attendance::where('schedule_id', $schedule->id)
            ->where('attendee_type', 'student')
            ->whereDate('date', $today)
            ->pluck('student_id')
            ->all();

        // 4. Get students on leave today
        $leavePermissions = \App\Models\StudentLeavePermission::where('class_id', $schedule->class_id)
            ->where('date', $today)
            ->where('status', 'active')
            ->get()
            ->keyBy('student_id');

        $absentCount = 0;
        $onLeaveCount = 0;

        foreach ($students as $student) {
            if (in_array($student->id, $existingStudentIds)) {
                continue;
            }

            // Check if student is on leave
            $leavePermission = $leavePermissions->get($student->id);

            if ($leavePermission && $leavePermission->shouldHideFromAttendance($schedule)) {
                // Student is on leave - create attendance with leave status
                $status = match ($leavePermission->type) {
                    'sakit' => 'sick',
                    'izin', 'izin_pulang', 'dispensasi' => 'izin',
                    default => 'izin',
                };

                Attendance::create([
                    'attendee_type' => 'student',
                    'student_id' => $student->id,
                    'schedule_id' => $schedule->id,
                    'date' => $now,
                    'status' => $status,
                    'source' => 'system_close',
                    'reason' => $leavePermission->reason ?? ('Otomatis: '.$this->getLeaveTypeLabel($leavePermission->type)),
                ]);
                $onLeaveCount++;
            } else {
                // Student is not on leave and hasn't scanned - mark as absent
                Attendance::create([
                    'attendee_type' => 'student',
                    'student_id' => $student->id,
                    'schedule_id' => $schedule->id,
                    'date' => $now,
                    'status' => 'absent', // Alpha
                    'source' => 'system_close', // Mark as system generated
                    'reason' => 'Tidak melakukan scan presensi',
                ]);
                $absentCount++;
            }
        }

        return response()->json([
            'message' => "Absensi ditutup. {$absentCount} siswa ditandai Alpha, {$onLeaveCount} siswa izin/sakit.",
            'absent_count' => $absentCount,
            'on_leave_count' => $onLeaveCount,
        ]);
    }

    /**
     * Get leave type label in Indonesian
     */
    private function getLeaveTypeLabel(string $type): string
    {
        return match ($type) {
            'sakit' => 'Sakit',
            'izin' => 'Izin',
            'izin_pulang' => 'Izin Pulang',
            'dispensasi' => 'Dispensasi',
            default => $type,
        };
    }

    /**
     * Get My Attendance History
     *
     * Retrieve attendance history for the currently authenticated student.
     */
    public function me(Request $request): JsonResponse
    {
        if ($request->user()->user_type !== 'student' || ! $request->user()->studentProfile) {
            abort(403, 'Hanya untuk siswa');
        }

        $query = Attendance::query()
            ->with(['schedule.teacher.user:id,name', 'schedule.class:id,name'])
            ->where('student_id', $request->user()->studentProfile->id);

        if ($request->filled('from')) {
            $query->whereDate('date', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('date', '<=', $request->date('to'));
        }

        if ($request->filled('status')) {
            $request->validate([
                'status' => ['in:present,late,excused,sick,absent,dinas,izin,return'],
            ]);
            $query->where('status', $request->string('status'));
        }

        $attendances = $query->latest('date')->paginate();

        return \App\Http\Resources\AttendanceResource::collection($attendances)->response();
    }

    /**
     * Get My Attendance Summary
     *
     * Retrieve a statistical summary of attendance for the currently authenticated student.
     */
    public function summaryMe(Request $request): JsonResponse
    {
        if ($request->user()->user_type !== 'student' || ! $request->user()->studentProfile) {
            abort(403, 'Hanya untuk siswa');
        }

        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $studentId = $request->user()->studentProfile->id;

        $baseQuery = Attendance::query()->where('student_id', $studentId);

        if ($request->filled('from')) {
            $baseQuery->whereDate('date', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $baseQuery->whereDate('date', '<=', $request->date('to'));
        }

        $statusSummary = (clone $baseQuery)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->get();

        $dailySummary = (clone $baseQuery)
            ->selectRaw('DATE(date) as day, status, count(*) as total')
            ->groupBy('day', 'status')
            ->orderBy('day')
            ->get();

        return response()->json([
            'status_summary' => $statusSummary,
            'daily_summary' => $dailySummary,
        ]);
    }

    /**
     * Get My Teaching Attendance
     *
     * Retrieve attendance/teaching history for the currently authenticated teacher.
     */
    public function meTeaching(Request $request): JsonResponse
    {
        if ($request->user()->user_type !== 'teacher' || ! $request->user()->teacherProfile) {
            abort(403, 'Hanya untuk guru');
        }

        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'status' => ['nullable', 'in:present,late,excused,sick,absent,dinas,izin,return'],
        ]);

        $teacherId = $request->user()->teacherProfile->id;

        $query = Attendance::query()
            ->with(['schedule.class:id,name', 'schedule.teacher.user:id,name'])
            ->where('attendee_type', 'teacher')
            ->where('teacher_id', $teacherId);

        if ($request->filled('from')) {
            $query->whereDate('date', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('date', '<=', $request->date('to'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return \App\Http\Resources\AttendanceResource::collection($query->latest('date')->paginate())->response();
    }

    /**
     * Get My Teaching Summary
     *
     * Retrieve a statistical summary of teaching activities for the currently authenticated teacher.
     */
    public function summaryTeaching(Request $request): JsonResponse
    {
        if ($request->user()->user_type !== 'teacher' || ! $request->user()->teacherProfile) {
            abort(403, 'Hanya untuk guru');
        }

        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $teacherId = $request->user()->teacherProfile->id;

        $query = Attendance::query()
            ->where('attendee_type', 'teacher')
            ->where('teacher_id', $teacherId);

        if ($request->filled('from')) {
            $query->whereDate('date', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('date', '<=', $request->date('to'));
        }

        $statusSummary = (clone $query)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->get();

        return response()->json([
            'status_summary' => $statusSummary,
            'total_sessions' => $query->count(),
        ]);
    }

    /**
     * Get Taught Students Attendance Summary
     *
     * Retrieve attendance summary for students taught by the currently authenticated teacher.
     * Useful for identifying students with high absence rates.
     */
    public function studentsAttendanceSummary(Request $request): JsonResponse
    {
        if ($request->user()->user_type !== 'teacher' || ! $request->user()->teacherProfile) {
            abort(403, 'Hanya untuk guru');
        }

        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'threshold' => ['nullable', 'integer', 'min:1'],
        ]);

        $teacherId = $request->user()->teacherProfile->id;

        $query = Attendance::query()
            ->with(['student.user', 'schedule.class'])
            ->where('attendee_type', 'student')
            ->whereHas('schedule', function ($q) use ($teacherId): void {
                $q->where('teacher_id', $teacherId);
            });

        if ($request->filled('from')) {
            $query->whereDate('date', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('date', '<=', $request->date('to'));
        }

        $perPage = $this->resolvePerPage($request);
        $studentIds = [];
        if ($perPage) {
            $studentIdsPage = (clone $query)
                ->select('student_id')
                ->distinct()
                ->orderBy('student_id')
                ->paginate($perPage);

            $studentIds = $studentIdsPage->getCollection()->pluck('student_id')->all();

            $raw = (clone $query)
                ->whereIn('student_id', $studentIds)
                ->selectRaw('student_id, status, count(*) as total')
                ->groupBy('student_id', 'status')
                ->get();
        } else {
            $raw = (clone $query)
                ->selectRaw('student_id, status, count(*) as total')
                ->groupBy('student_id', 'status')
                ->get();
        }

        $grouped = $raw->groupBy('student_id')->map(function ($rows): array {
            $totals = $rows->pluck('total', 'status')->all();

            return [
                'student_id' => $rows->first()->student_id,
                'totals' => $totals,
            ];
        })->values();

        if ($request->filled('threshold')) {
            $threshold = $request->integer('threshold');
            $grouped = $grouped->filter(function (array $item) use ($threshold): bool {
                foreach ($item['totals'] as $count) {
                    if ($count >= $threshold) {
                        return true;
                    }
                }

                return false;
            })->values();
        }

        if (! $perPage) {
            $studentIds = $grouped->pluck('student_id')->all();
        }

        $students = StudentProfile::query()
            ->with('user')
            ->whereIn('id', $studentIds)
            ->get()
            ->keyBy('id');

        $response = $grouped->map(function (array $item) use ($students): array {
            return [
                'student' => $students->get($item['student_id']),
                'totals' => $item['totals'],
            ];
        });

        if ($perPage) {
            $studentIdsPage->setCollection($response->values());

            return response()->json($studentIdsPage);
        }

        return response()->json($response);
    }

    /**
     * Get Class Attendance by Date
     *
     * Retrieve attendance records for a specific class on a specific date.
     * Accessible by Homeroom Teacher and Admin.
     */
    public function classAttendanceByDate(Request $request, Classes $class): JsonResponse
    {
        $user = $request->user();
        if ($user->user_type !== 'teacher' && $user->user_type !== 'admin') {
            abort(403, 'Unauthorized');
        }

        if ($user->user_type === 'teacher' && optional($class->homeroomTeacher)->id !== $user->teacherProfile?->id) {
            abort(403, 'Hanya wali kelas yang boleh melihat data ini');
        }

        $request->validate([
            'date' => ['required', 'date'],
        ]);

        $date = Carbon::parse($request->string('date'));
        $day = $date->format('l');

        $schedules = Schedule::query()
            ->with(['teacher.user:id,name', 'class:id,name'])
            ->where('class_id', $class->id)
            ->where('day', $day)
            ->orderBy('start_time')
            ->get();

        $scheduleIds = $schedules->pluck('id')->all();

        $attendances = Attendance::query()
            ->with(['student.user', 'schedule'])
            ->whereIn('schedule_id', $scheduleIds)
            ->whereDate('date', $date->toDateString())
            ->get()
            ->groupBy('schedule_id');

        $items = $schedules->map(function (Schedule $schedule) use ($attendances): array {
            return [
                'schedule' => $schedule,
                'attendances' => $attendances->get($schedule->id, collect())->values(),
            ];
        });

        return response()->json([
            'class' => $class,
            'date' => $date->toDateString(),
            'day' => $day,
            'items' => $items,
        ]);
    }

    /**
     * Get Class Students Summary
     *
     * Retrieve attendance summary for all students in a class.
     * Accessible by Homeroom Teacher.
     */
    public function classStudentsSummary(Request $request, Classes $class): JsonResponse
    {
        if ($request->user()->user_type !== 'teacher' || ! $request->user()->teacherProfile) {
            abort(403, 'Hanya untuk guru');
        }

        if (optional($class->homeroomTeacher)->id !== $request->user()->teacherProfile->id) {
            abort(403, 'Hanya wali kelas yang boleh melihat data ini');
        }

        return $this->calculateClassSummary($request, $class);
    }

    /**
     * Get Class Summary (Waka)
     *
     * Retrieve attendance summary for a class.
     * Accessible by Waka Kesiswaan/Kurikulum.
     */
    public function wakaClassSummary(Request $request, Classes $class): JsonResponse
    {
        return $this->calculateClassSummary($request, $class);
    }

    private function calculateClassSummary(Request $request, Classes $class): JsonResponse
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'threshold' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = Attendance::query()
            ->where('attendee_type', 'student')
            ->whereHas('schedule', function ($q) use ($class): void {
                $q->where('class_id', $class->id);
            });

        if ($request->filled('from')) {
            $query->whereDate('date', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('date', '<=', $request->date('to'));
        }

        $perPage = $this->resolvePerPage($request);
        $studentIds = [];
        if ($perPage) {
            $studentIdsPage = (clone $query)
                ->select('student_id')
                ->distinct()
                ->orderBy('student_id')
                ->paginate($perPage);

            $studentIds = $studentIdsPage->getCollection()->pluck('student_id')->all();

            $raw = (clone $query)
                ->whereIn('student_id', $studentIds)
                ->selectRaw('student_id, status, count(*) as total')
                ->groupBy('student_id', 'status')
                ->get();
        } else {
            $raw = (clone $query)
                ->selectRaw('student_id, status, count(*) as total')
                ->groupBy('student_id', 'status')
                ->get();
        }

        $grouped = $raw->groupBy('student_id')->map(function ($rows): array {
            return [
                'student_id' => $rows->first()->student_id,
                'totals' => $rows->pluck('total', 'status')->all(),
            ];
        })->values();

        if ($request->filled('threshold')) {
            $threshold = $request->integer('threshold');
            $grouped = $grouped->filter(function (array $item) use ($threshold): bool {
                foreach ($item['totals'] as $count) {
                    if ($count >= $threshold) {
                        return true;
                    }
                }

                return false;
            })->values();
        }

        if (! $perPage) {
            $studentIds = $grouped->pluck('student_id')->all();
        }

        $students = $class->students()
            ->with('user')
            ->whereIn('id', $studentIds)
            ->get()
            ->keyBy('id');

        $response = $grouped->map(function (array $item) use ($students): array {
            return [
                'student' => $students->get($item['student_id']),
                'totals' => $item['totals'],
            ];
        });

        if ($perPage) {
            $studentIdsPage->setCollection($response->values());

            return response()->json($studentIdsPage);
        }

        return response()->json($response);
    }

    public function classStudentsAbsences(Request $request, Classes $class): JsonResponse
    {
        if ($request->user()->user_type !== 'teacher' || ! $request->user()->teacherProfile) {
            abort(403, 'Hanya untuk guru');
        }

        if (optional($class->homeroomTeacher)->id !== $request->user()->teacherProfile->id) {
            abort(403, 'Hanya wali kelas yang boleh melihat data ini');
        }

        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'status' => ['nullable', 'in:present,late,excused,sick,absent,dinas,izin,return'],
        ]);

        $query = Attendance::query()
            ->with(['student.user:id,name', 'schedule:id,title,subject_name', 'attachments'])
            ->where('attendee_type', 'student')
            ->whereHas('schedule', function ($q) use ($class): void {
                $q->where('class_id', $class->id);
            });

        if ($request->filled('from')) {
            $query->whereDate('date', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('date', '<=', $request->date('to'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        } else {
            $query->where('status', '!=', 'present');
        }

        $perPage = $this->resolvePerPage($request);
        if ($perPage) {
            $studentIdsPage = (clone $query)
                ->select('student_id')
                ->distinct()
                ->orderBy('student_id')
                ->paginate($perPage);

            $studentIds = $studentIdsPage->getCollection()->pluck('student_id')->all();

            $items = $query
                ->whereIn('student_id', $studentIds)
                ->orderBy('date')
                ->get()
                ->groupBy('student_id');

            $response = collect($studentIds)->map(function ($studentId) use ($items): array {
                $rows = $items->get($studentId, collect());
                $student = optional($rows->first())->student;

                return [
                    'student' => $student ? $student->loadMissing('user') : null,
                    'items' => $rows->values(),
                ];
            });

            $studentIdsPage->setCollection($response);

            return response()->json($studentIdsPage);
        }

        $perPage = $this->resolvePerPage($request);
        if ($perPage) {
            $studentIdsPage = (clone $query)
                ->select('student_id')
                ->distinct()
                ->orderBy('student_id')
                ->paginate($perPage);

            $studentIds = $studentIdsPage->getCollection()->pluck('student_id')->all();

            $items = $query
                ->whereIn('student_id', $studentIds)
                ->orderBy('date')
                ->get()
                ->groupBy('student_id');

            $response = collect($studentIds)->map(function ($studentId) use ($items): array {
                $rows = $items->get($studentId, collect());
                $student = optional($rows->first())->student;

                return [
                    'student' => $student ? $student->loadMissing('user') : null,
                    'items' => $rows->values(),
                ];
            });

            $studentIdsPage->setCollection($response);

            return response()->json($studentIdsPage);
        }

        $items = $query->orderBy('date')->get()->groupBy('student_id');

        $response = $items->map(function ($rows): array {
            $student = optional($rows->first())->student;

            return [
                'student' => $student ? $student->loadMissing('user') : null,
                'items' => $rows->values(),
            ];
        })->values();

        return response()->json($response);
    }

    public function teachersDailyAttendance(Request $request): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date'],
        ]);

        $date = Carbon::parse($request->string('date'))->toDateString();

        $perPage = $this->resolvePerPage($request);
        $teachersQuery = TeacherProfile::query()
            ->with('user')
            ->orderBy('id');

        // Enforce pagination if per_page is not set to prevent loading all teachers
        $perPage = $perPage ?: 100;

        $teachers = $teachersQuery->paginate($perPage);

        $teacherIds = $teachers->getCollection()->pluck('id')->all();

        $attendanceByTeacher = Attendance::query()
            ->where('attendee_type', 'teacher')
            ->whereDate('date', $date)
            ->whereIn('teacher_id', $teacherIds)
            ->orderByDesc('checked_in_at')
            ->get()
            ->groupBy('teacher_id');

        $items = $teachers->getCollection()->map(function (TeacherProfile $teacher) use ($attendanceByTeacher): array {
            $attendance = $attendanceByTeacher->get($teacher->id)?->first();

            return [
                'teacher' => $teacher,
                'attendance' => $attendance,
                'status' => $attendance?->status ?? 'absent',
            ];
        });

        $teachers->setCollection($items);

        return response()->json([
            'date' => $date,
            'items' => $teachers,
        ]);
    }

    public function manual(\App\Http\Requests\StoreManualAttendanceRequest $request): JsonResponse
    {
        // Data already validated and normalized in Form Request
        $dto = \App\Data\ManualAttendanceData::fromRequest($request);

        // Authorization Check
        $user = $request->user();
        if ($user->user_type === 'teacher') {
            $schedule = Schedule::find($dto->schedule_id);
            if (! $schedule || $schedule->teacher_id !== $user->teacherProfile->id) {
                // Allow if homeroom teacher?
                $student = StudentProfile::find($dto->student_id);
                $homeroomId = $user->teacherProfile->homeroom_class_id;
                if (! $student || $student->class_id !== $homeroomId) {
                    abort(403, 'Anda tidak memiliki akses untuk mengubah absensi ini.');
                }
            }
        }

        if ($dto->attendee_type === 'student' && empty($dto->student_id)) {
            abort(422, 'student_id wajib untuk attendee_type student');
        }

        if ($dto->attendee_type === 'teacher' && empty($dto->teacher_id)) {
            abort(422, 'teacher_id wajib untuk attendee_type teacher');
        }

        $attributes = [
            'attendee_type' => $dto->attendee_type,
            'schedule_id' => $dto->schedule_id,
            'student_id' => $dto->student_id ?? null,
            'teacher_id' => $dto->teacher_id ?? null,
        ];

        $existing = Attendance::where($attributes)->first();

        if ($existing) {
            abort(409, 'Presensi siswa ini sudah tercatat untuk sesi ini.');
        }

        $attendance = Attendance::create([
            ...$attributes,
            'date' => $dto->date,
            'status' => $dto->status,
            'reason' => $dto->reason ?? null,
            'checked_in_at' => $dto->date,
            'source' => 'manual',
        ]);

        return response()->json(new \App\Http\Resources\AttendanceResource($attendance->load(['student.user', 'teacher.user', 'schedule.class'])), 201);
    }

    public function teacherAttendanceHistory(Request $request, TeacherProfile $teacher): JsonResponse
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $query = Attendance::query()
            ->where('attendee_type', 'teacher')
            ->where('teacher_id', $teacher->id);

        if ($request->filled('from')) {
            $query->whereDate('date', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('date', '<=', $request->date('to'));
        }

        $history = $query->orderByDesc('date')->get();

        return response()->json([
            'teacher' => $teacher->load('user'),
            'history' => $history,
        ]);
    }

    public function wakaSummary(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $query = Attendance::query()->where('attendee_type', 'student');

        if ($request->filled('from')) {
            $query->whereDate('date', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('date', '<=', $request->date('to'));
        }

        $statusSummary = (clone $query)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->get();

        $classSummary = (clone $query)
            ->selectRaw('schedules.class_id as class_id, status, count(*) as total')
            ->join('schedules', 'attendances.schedule_id', '=', 'schedules.id')
            ->groupBy('schedules.class_id', 'status')
            ->get()
            ->groupBy('class_id')
            ->map(function ($rows) {
                return $rows->pluck('total', 'status')->all();
            });

        $studentSummary = (clone $query)
            ->selectRaw('student_id, status, count(*) as total')
            ->groupBy('student_id', 'status')
            ->get()
            ->groupBy('student_id')
            ->map(function ($rows) {
                return $rows->pluck('total', 'status')->all();
            });

        return response()->json([
            'status_summary' => $statusSummary,
            'class_summary' => $classSummary,
            'student_summary' => $studentSummary,
        ]);
    }

    public function studentsAbsences(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'status' => ['nullable', 'in:present,late,excused,sick,absent,dinas,izin,return'],
            'class_id' => ['nullable', 'exists:classes,id'],
        ]);

        // 1. Build Query for Students with aggregated absence count
        $studentQuery = StudentProfile::query()
            ->with(['user']);

        if ($request->filled('class_id')) {
            $studentQuery->where('class_id', $request->integer('class_id'));
        }

        // Apply filter logic to the count
        $studentQuery->withCount(['attendances' => function ($q) use ($request) {
            $q->where('attendee_type', 'student');

            if ($request->filled('from')) {
                $q->whereDate('date', '>=', $request->date('from'));
            }
            if ($request->filled('to')) {
                $q->whereDate('date', '<=', $request->date('to'));
            }
            if ($request->filled('status')) {
                $q->where('status', $request->string('status'));
            } else {
                $q->where('status', '!=', 'present');
            }

            if ($request->filled('class_id')) {
                $q->whereHas('schedule', function ($sq) use ($request) {
                    $sq->where('class_id', $request->integer('class_id'));
                });
            }
        }]);

        // Sort by absences count descending (using database index if possible)
        $studentQuery->orderBy('attendances_count', 'desc');

        // Paginate students
        $perPage = $this->resolvePerPage($request) ?? 15;
        $students = $studentQuery->paginate($perPage);
        $studentIds = $students->pluck('id')->all();

        // 2. Fetch detailed attendance records for these students only
        $attendanceQuery = Attendance::query()
            ->with(['schedule.class', 'student.user'])
            ->whereIn('student_id', $studentIds)
            ->where('attendee_type', 'student');

        if ($request->filled('from')) {
            $attendanceQuery->whereDate('date', '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $attendanceQuery->whereDate('date', '<=', $request->date('to'));
        }
        if ($request->filled('status')) {
            $attendanceQuery->where('status', $request->string('status'));
        } else {
            $attendanceQuery->where('status', '!=', 'present');
        }
        if ($request->filled('class_id')) {
            $attendanceQuery->whereHas('schedule', fn ($q) => $q->where('class_id', $request->integer('class_id')));
        }

        $attendances = $attendanceQuery->orderBy('date')->get()->groupBy('student_id');

        // 3. Map students to response format
        $items = $students->getCollection()->map(function ($student) use ($attendances) {
            return [
                'student' => $student->loadMissing('user'),
                'items' => $attendances->get($student->id, collect())->values(),
                'total_absences' => $student->attendances_count, // Bonus info
            ];
        });

        $students->setCollection($items);

        return response()->json($students);
    }

    public function recap(Request $request): JsonResponse
    {
        $request->validate([
            'month' => ['required', 'date_format:Y-m'],
        ]);

        $start = \Illuminate\Support\Carbon::createFromFormat('Y-m', $request->string('month'))->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $summary = Attendance::selectRaw('attendee_type, status, count(*) as total')
            ->whereBetween('date', [$start, $end])
            ->groupBy('attendee_type', 'status')
            ->get();

        return response()->json($summary);
    }

    public function summaryBySchedule(Request $request, Schedule $schedule): JsonResponse
    {
        $this->authorizeSchedule($request, $schedule);

        $data = Attendance::selectRaw('status, count(*) as total')
            ->where('schedule_id', $schedule->id)
            ->groupBy('status')
            ->get();

        return response()->json($data);
    }

    public function summaryByClass(Request $request, \App\Models\Classes $class): JsonResponse
    {
        if ($request->user()->user_type === 'teacher') {
            $teacherId = optional($request->user()->teacherProfile)->id;
            $ownsSchedules = $class->schedules()->where('teacher_id', $teacherId)->exists();
            $isHomeroom = optional($class->homeroomTeacher)->id === $teacherId;
            if (! $ownsSchedules && ! $isHomeroom) {
                abort(403, 'Tidak boleh melihat rekap kelas ini');
            }
        }

        $data = Attendance::selectRaw('status, count(*) as total')
            ->whereHas('schedule', fn ($q) => $q->where('class_id', $class->id))
            ->groupBy('status')
            ->get();

        return response()->json($data);
    }

    public function attach(Request $request, Attendance $attendance): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:5120'],
        ]);

        $file = $request->file('file');
        $path = $this->storeAttachment($file);

        $attachment = $attendance->attachments()->create([
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        return response()->json([
            'attachment' => $attachment,
            'url' => $this->signedUrl($attachment->path),
        ], 201);
    }

    public function getDocument(Request $request, Attendance $attendance): JsonResponse
    {
        $user = $request->user();

        // 🛡️ IDOR Protection
        $isAuthorized = false;

        if ($user->user_type === 'admin') {
            $isAuthorized = true;
        } elseif ($user->user_type === 'teacher') {
            $teacherProfile = $user->teacherProfile;
            if ($teacherProfile) {
                // Authorized if they are the teacher for the schedule OR if they are the homeroom teacher for the student
                $isAuthorized = ($attendance->schedule && $attendance->schedule->teacher_id == $teacherProfile->id) ||
                                ($attendance->student && $attendance->student->class_id == $teacherProfile->homeroom_class_id);

                // Also allow if it's the teacher's OWN attendance record
                if ($attendance->attendee_type === 'teacher' && $attendance->teacher_id == $teacherProfile->id) {
                    $isAuthorized = true;
                }
            }
        } elseif ($user->user_type === 'student') {
            // Authorized only if it's their own attendance
            $isAuthorized = ($attendance->student_id == $user->studentProfile?->id);
        }

        if (! $isAuthorized) {
            abort(403, 'Unauthorized access to document');
        }

        $attachment = $attendance->attachments()->latest()->first();

        if (! $attachment) {
            return response()->json(['message' => 'Document not found'], 404);
        }

        return response()->json([
            'id' => $attachment->id,
            'url' => $this->signedUrl($attachment->path),
            'mime_type' => $attachment->mime_type,
            'original_name' => $attachment->original_name,
        ]);
    }

    public function proxyDocument(Request $request, string $path): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $attachment = \App\Models\AttendanceAttachment::where('path', $path)->firstOrFail();
        $attendance = $attachment->attendance;
        $user = $request->user();

        // 🛡️ IDOR Protection (Same logic as getDocument)
        $isAuthorized = false;
        if ($user->user_type === 'admin') {
            $isAuthorized = true;
        } elseif ($user->user_type === 'teacher') {
            $teacherProfile = $user->teacherProfile;
            if ($teacherProfile) {
                // Authorized if they are the teacher for the schedule OR if they are the homeroom teacher for the student
                $isAuthorized = ($attendance->schedule && $attendance->schedule->teacher_id == $teacherProfile->id) ||
                                ($attendance->student && $attendance->student->class_id == $teacherProfile->homeroom_class_id);

                // Also allow if it's the teacher's OWN attendance record
                if ($attendance->attendee_type === 'teacher' && $attendance->teacher_id == $teacherProfile->id) {
                    $isAuthorized = true;
                }
            }
        } elseif ($user->user_type === 'student') {
            // Authorized only if it's their own attendance
            $isAuthorized = ($attendance->student_id == $user->studentProfile?->id);
        }

        if (! $isAuthorized) {
            abort(403, 'Unauthorized access to document');
        }

        if (! Storage::exists($path)) {
            abort(404);
        }

        return response()->file(Storage::path($path));
    }

    protected function storeAttachment(UploadedFile $file): string
    {
        return $file->store('attendance-attachments');
    }

    public function void(Request $request, Attendance $attendance): JsonResponse
    {
        $this->authorizeSchedule($request, $attendance->schedule);

        $attendance->delete();

        return response()->json(['message' => 'Scan dibatalkan']);
    }

    protected function signedUrl(string $path): string
    {
        try {
            // Check if disk supports temporary URLs (usually S3)
            return Storage::temporaryUrl($path, now()->addMinutes(10));
        } catch (\Throwable $e) {
            // Fallback to a secured API proxy route instead of a public URL
            // This ensures IDOR protection even if temporary URLs aren't supported
            return route('attendance.document.proxy', ['path' => $path]);
        }
    }

    protected function authorizeSchedule(Request $request, Schedule $schedule): void
    {
        if ($request->user()->user_type === 'teacher' && $schedule->teacher_id !== optional($request->user()->teacherProfile)->id) {
            abort(403, 'Tidak boleh mengakses jadwal ini');
        }
    }

    public function bySchedule(Request $request, Schedule $schedule): JsonResponse
    {
        if ($request->user()->user_type === 'teacher' && $schedule->teacher_id !== optional($request->user()->teacherProfile)->id) {
            abort(403, 'Tidak boleh melihat presensi jadwal ini');
        }

        $query = Attendance::query()
            ->with(['student.user:id,name', 'teacher.user:id,name', 'attachments'])
            ->where('schedule_id', $schedule->id)
            ->latest('checked_in_at');

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date('date'));
        }

        $perPage = $this->resolvePerPage($request);
        $attendances = $perPage ? $query->paginate($perPage) : $query->get();

        if ($perPage) {
            return \App\Http\Resources\AttendanceResource::collection($attendances)->response();
        }

        return response()->json(\App\Http\Resources\AttendanceResource::collection($attendances));
    }

    public function bulkManual(Request $request): JsonResponse
    {
        $data = $request->validate([
            'schedule_id' => ['required', 'exists:schedules,id'],
            'date' => ['required', 'date'],
            'items' => ['required', 'array'],
            'items.*.student_id' => ['required', 'exists:student_profiles,id'],
            'items.*.status' => ['required', 'string'],
            'items.*.reason' => ['nullable', 'string'],
        ]);

        $schedule = Schedule::findOrFail($data['schedule_id']);
        $this->authorizeSchedule($request, $schedule);

        $date = $data['date'];
        $results = [];

        DB::transaction(function () use ($data, $date, $schedule, &$results) {
            foreach ($data['items'] as $item) {
                // Normalize status
                $status = $item['status'];
                $map = [
                    'hadir' => 'present',
                    'sakit' => 'sick',
                    'izin' => 'excused',
                    'terlambat' => 'late',
                    'alpha' => 'absent',
                    'pulang' => 'return',
                ];
                $status = $map[$status] ?? $status;

                $attendance = Attendance::updateOrCreate(
                    [
                        'student_id' => $item['student_id'],
                        'schedule_id' => $schedule->id,
                        'date' => $date,
                    ],
                    [
                        'status' => $status,
                        'attendee_type' => 'student',
                        'checked_in_at' => now(),
                        'source' => 'manual',
                        'reason' => $item['reason'] ?? null,
                    ]
                );
                $results[] = $attendance;
            }
        });

        return response()->json([
            'message' => count($results).' data kehadiran berhasil disimpan',
            'data' => $results,
        ]);
    }

    public function markExcuse(Request $request, Attendance $attendance): JsonResponse
    {
        if ($request->user()->user_type === 'teacher' && $attendance->schedule->teacher_id !== optional($request->user()->teacherProfile)->id) {
            abort(403, 'Tidak boleh mengubah presensi jadwal ini');
        }

        // Input Normalization
        $status = $request->input('status');
        $map = [
            'alpha' => 'absent',
            'tanpa-keterangan' => 'absent',
            'pulang' => 'return',
            'hadir' => 'present',
            'sakit' => 'sick',
            'izin' => 'excused',
            'terlambat' => 'late',
        ];

        if (isset($map[$status])) {
            $request->merge(['status' => $map[$status]]);
        }

        $data = $request->validate([
            'status' => ['required', 'in:present,late,excused,sick,absent,dispensasi,dinas,izin,return'],
            'reason' => ['nullable', 'string'],
        ]);

        $attendance->update([
            'status' => $data['status'],
            'reason' => $data['reason'] ?? null,
            'source' => 'manual',
        ]);

        return response()->json($attendance);
    }

    public function export(Request $request): StreamedResponse
    {
        $request->validate([
            'schedule_id' => ['nullable', 'exists:schedules,id'],
            'class_id' => ['nullable', 'exists:classes,id'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $query = Attendance::with(['student.user:id,name', 'teacher.user:id,name', 'schedule.class:id,name']);

        if ($request->filled('schedule_id')) {
            $schedule = Schedule::findOrFail($request->integer('schedule_id'));
            if ($request->user()->user_type === 'teacher' && $schedule->teacher_id !== optional($request->user()->teacherProfile)->id) {
                abort(403, 'Tidak boleh mengekspor jadwal ini');
            }
            $query->where('schedule_id', $schedule->id);
        }

        if ($request->filled('class_id')) {
            $query->whereHas('schedule', fn ($q) => $q->where('class_id', $request->integer('class_id')));
        }

        if ($request->filled('from')) {
            $query->whereDate('date', '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('date', '<=', $request->date('to'));
        }

        $attendances = $query->orderBy('checked_in_at')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="attendance_export.csv"',
        ];

        $callback = static function () use ($attendances): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Type', 'Name', 'Status', 'Checked In At', 'Reason', 'Class', 'Schedule']);

            foreach ($attendances as $attendance) {
                $name = $attendance->attendee_type === 'student'
                    ? optional($attendance->student?->user)->name
                    : optional($attendance->teacher?->user)->name;

                fputcsv($handle, [
                    $attendance->attendee_type,
                    $name,
                    $attendance->status,
                    optional($attendance->checked_in_at)->toDateTimeString(),
                    $attendance->reason,
                    optional($attendance->schedule?->class)->label,
                    optional($attendance->schedule)->title,
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function downloadPdf(Request $request)
    {
        $request->validate([
            'class_id' => ['nullable', 'exists:classes,id'],
            'date' => ['nullable', 'date'],
        ]);

        $query = Attendance::with(['student.user', 'schedule.class'])
            ->where('attendee_type', 'student');

        if ($request->filled('class_id')) {
            $query->whereHas('schedule', fn ($q) => $q->where('class_id', $request->class_id));
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        } else {
            $query->whereDate('date', now());
        }

        $attendances = $query->get();
        $date = $request->date ?? now()->toDateString();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.attendance_report', compact('attendances', 'date'));

        return $pdf->download('attendance_report.pdf');
    }

    private function resolvePerPage(Request $request): ?int
    {
        if (! $request->filled('per_page') && ! $request->filled('page')) {
            return null;
        }

        $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $perPage = $request->integer('per_page', 15);

        return min(max($perPage, 1), 200);
    }
}
