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

        if ($user->user_type === 'student') {
            if (! ($data['device_id'] ?? null)) {
                return response()->json(['message' => 'Device belum terdaftar'], 422);
            }

            $device = $user->devices()->where('id', $data['device_id'])->where('active', true)->first();
            if (! $device) {
                return response()->json(['message' => 'Device tidak valid'], 422);
            }

            $device->update(['last_used_at' => $now]);
        }

        if ($qr->type === 'student' && $qr->schedule && $user->studentProfile && $qr->schedule->class_id !== $user->studentProfile->class_id) {
            return response()->json(['message' => 'QR bukan untuk kelas kamu'], 403);
        }

        if ($qr->type === 'teacher' && $qr->schedule && $qr->schedule->teacher_id !== optional($user->teacherProfile)->id) {
            return response()->json(['message' => 'QR bukan untuk guru ini'], 403);
        }

        $attributes = [
            'attendee_type' => $user->user_type,
            'schedule_id' => $qr->schedule_id,
            'student_id' => $user->studentProfile->id ?? null,
            'teacher_id' => $user->teacherProfile->id ?? null,
        ];

        return DB::transaction(function () use ($attributes, $now, $qr, $user) {
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

        // Grace period: 15 minutes
        $lateThreshold = $scheduledDateTime->copy()->addMinutes(15);

        if ($checkInTime->gt($lateThreshold)) {
            return 'late';
        }

        return 'present';
    }

    /**
     * Close attendance for a schedule (Bulk Absent)
     * Marks all students who haven't scanned as 'absent' (Alpha)
     */
    public function close(Request $request, Schedule $schedule): JsonResponse
    {
        // 1. Validate User is the Teacher of this schedule
        $user = $request->user();
        if ($user->user_type !== 'teacher' || $schedule->teacher_id !== $user->teacherProfile->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // 2. Get all students in the class
        $students = StudentProfile::where('class_id', $schedule->class_id)->get();

        // 3. Get existing attendance for this schedule today
        $existingStudentIds = Attendance::where('schedule_id', $schedule->id)
            ->where('attendee_type', 'student')
            ->whereDate('date', now())
            ->pluck('student_id')
            ->toArray();

        $absentCount = 0;
        $now = now();

        foreach ($students as $student) {
            if (! in_array($student->id, $existingStudentIds)) {
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
            'message' => "Absensi ditutup. {$absentCount} siswa ditandai Alpha.",
            'absent_count' => $absentCount,
        ]);
    }

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
                'status' => ['in:present,late,excused,sick,absent,dinas,izin'],
            ]);
            $query->where('status', $request->string('status'));
        }

        $attendances = $query->latest('date')->paginate();

        return \App\Http\Resources\AttendanceResource::collection($attendances)->response();
    }

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

    public function meTeaching(Request $request): JsonResponse
    {
        if ($request->user()->user_type !== 'teacher' || ! $request->user()->teacherProfile) {
            abort(403, 'Hanya untuk guru');
        }

        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'status' => ['nullable', 'in:present,late,excused,sick,absent,dinas,izin'],
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

    public function classStudentsSummary(Request $request, Classes $class): JsonResponse
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
            'status' => ['nullable', 'in:present,late,excused,sick,absent,dinas,izin'],
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
            $existing->update([
                'status' => $dto->status,
                'reason' => $dto->reason ?? null,
                'date' => $dto->date,
                'checked_in_at' => $existing->checked_in_at ?? $dto->date,
                'source' => 'manual',
            ]);

            return response()->json(new \App\Http\Resources\AttendanceResource($existing->load(['student.user', 'teacher.user', 'schedule.class'])));
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
            'status' => ['nullable', 'in:present,late,excused,sick,absent,dinas,izin'],
            'class_id' => ['nullable', 'exists:classes,id'],
        ]);

        $query = Attendance::query()
            ->with(['student.user', 'schedule.class'])
            ->where('attendee_type', 'student');

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

        if ($request->filled('class_id')) {
            $classId = $request->integer('class_id');
            $query->whereHas('schedule', function ($q) use ($classId): void {
                $q->where('class_id', $classId);
            });
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
            ->with(['student.user:id,name', 'teacher.user:id,name'])
            ->where('schedule_id', $schedule->id)
            ->latest('checked_in_at');

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
                    ]
                );
                $results[] = $attendance;
            }
        });

        return response()->json([
            'message' => count($results).' data kehadiran berhasil disimpan',
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
            'pulang' => 'excused',
            'hadir' => 'present',
            'sakit' => 'sick',
            'izin' => 'excused',
            'terlambat' => 'late',
        ];

        if (isset($map[$status])) {
            $request->merge(['status' => $map[$status]]);
        }

        $data = $request->validate([
            'status' => ['required', 'in:present,late,excused,sick,absent,dinas,izin'],
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
