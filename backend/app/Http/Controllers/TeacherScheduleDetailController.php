<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\StudentLeavePermission;
use App\Models\StudentProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Controller for teacher schedule details and related attendance operations
 * This handles the "detail jadwal guru" functionality with schedule-specific attendance
 */
class TeacherScheduleDetailController extends Controller
{
    /**
     * Get Schedule Details
     *
     * Retrieve detailed attendance statistics for a specific schedule.
     * Accessible by the teacher who owns the schedule.
     */
    public function show(Request $request, Schedule $schedule): JsonResponse
    {
        $user = $request->user();
        $teacher = $user->teacherProfile;

        if (! $teacher) {
            return response()->json(['message' => 'Teacher profile not found'], 404);
        }

        // Validate teacher teaches this schedule
        if ($schedule->teacher_id !== $teacher->id) {
            return response()->json(['message' => 'Unauthorized - You do not teach this schedule'], 403);
        }

        $today = now()->toDateString();

        // Get class info
        $class = $schedule->class;
        if (! $class) {
            return response()->json(['message' => 'Class not found for this schedule'], 404);
        }

        // Get all students in the class
        $students = StudentProfile::where('class_id', $class->id)
            ->with('user:id,name')
            ->get();

        // Get active leave permissions for today in this class
        $activeLeavePermissions = StudentLeavePermission::where('class_id', $class->id)
            ->where('date', $today)
            ->where('status', 'active')
            ->get()
            ->keyBy('student_id');

        // Get today's attendance for this schedule
        $attendances = Attendance::where('schedule_id', $schedule->id)
            ->whereDate('date', $today)
            ->where('attendee_type', 'student')
            ->with('attachments')
            ->get()
            ->keyBy('student_id');

        // Calculate statistics
        $stats = [
            'present' => 0,
            'late' => 0,
            'sick' => 0,
            'izin' => 0,
            'absent' => 0,
            'on_leave' => 0, // Students currently on izin_pulang/dispensasi
            'total_students' => $students->count(),
        ];

        $studentList = [];
        $hiddenStudents = []; // Students hidden due to leave

        foreach ($students as $student) {
            $attendance = $attendances->get($student->id);
            $leavePermission = $activeLeavePermissions->get($student->id);

            // Determine if student should be hidden from attendance list
            $isHidden = false;
            $hideReason = null;

            if ($leavePermission) {
                if ($leavePermission->is_full_day) {
                    // Full day sick/izin - completely hidden
                    $isHidden = true;
                    $hideReason = $leavePermission->type === 'sakit' ? 'Sakit (Hari Penuh)' : 'Izin (Hari Penuh)';
                    $stats[$leavePermission->type === 'sakit' ? 'sick' : 'izin']++;
                } elseif ($leavePermission->shouldHideFromAttendance($schedule)) {
                    // Temporary leave - hidden during leave period
                    $isHidden = true;
                    $hideReason = $leavePermission->type === 'dispensasi' ? 'Dispensasi' : 'Izin Pulang';
                    $stats['on_leave']++;
                }
            }

            if ($isHidden) {
                $hiddenStudents[] = [
                    'id' => $student->id,
                    'name' => $student->user->name ?? 'N/A',
                    'nis' => $student->nis,
                    'hide_reason' => $hideReason,
                    'leave_permission' => $leavePermission ? [
                        'id' => $leavePermission->id,
                        'type' => $leavePermission->type,
                        'start_time' => Carbon::parse($leavePermission->start_time)->format('H:i'),
                        'end_time' => $leavePermission->end_time ? Carbon::parse($leavePermission->end_time)->format('H:i') : null,
                        'reason' => $leavePermission->reason,
                    ] : null,
                ];

                continue;
            }

            // Count stats for visible students
            if ($attendance) {
                $status = $attendance->status;
                if (isset($stats[$status])) {
                    $stats[$status]++;
                }
            }

            $studentList[] = [
                'id' => $student->id,
                'name' => $student->user->name ?? 'N/A',
                'nis' => $student->nis,
                'nisn' => $student->nisn,
                'attendance' => $attendance ? [
                    'id' => $attendance->id,
                    'status' => $attendance->status,
                    'status_label' => $this->getStatusLabel($attendance->status),
                    'checked_in_at' => $attendance->checked_in_at?->format('H:i'),
                    'reason' => $attendance->reason,
                ] : null,
            ];
        }

        return response()->json([
            'schedule' => [
                'id' => $schedule->id,
                'subject_name' => $schedule->subject_name,
                'title' => $schedule->title,
                'day' => $schedule->day,
                'start_time' => Carbon::parse($schedule->start_time)->format('H:i'),
                'end_time' => Carbon::parse($schedule->end_time)->format('H:i'),
                'room' => $schedule->room,
            ],
            'class' => [
                'id' => $class->id,
                'name' => $class->name,
            ],
            'date' => $today,
            'statistics' => $stats,
            'students' => $studentList,
            'hidden_students' => $hiddenStudents,
        ]);
    }

    /**
     * Get Eligible Students
     *
     * Retrieve a list of students eligible for attendance (excluding those on full-day leave).
     */
    public function getStudents(Request $request, Schedule $schedule): JsonResponse
    {
        $user = $request->user();
        $teacher = $user->teacherProfile;

        if (! $teacher || $schedule->teacher_id !== $teacher->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $today = now()->toDateString();
        $class = $schedule->class;

        // Get all students
        $students = StudentProfile::where('class_id', $class->id)
            ->with('user:id,name')
            ->get();

        // Get full-day leave permissions
        $fullDayLeaves = StudentLeavePermission::where('class_id', $class->id)
            ->where('date', $today)
            ->where('status', 'active')
            ->where('is_full_day', true)
            ->pluck('student_id')
            ->all();

        // Get temporary leaves that overlap with this schedule
        $temporaryLeaves = StudentLeavePermission::where('class_id', $class->id)
            ->where('date', $today)
            ->where('status', 'active')
            ->where('is_full_day', false)
            ->get();

        $eligibleStudents = [];
        $onLeaveStudents = [];

        foreach ($students as $student) {
            // Check full-day leave
            if (in_array($student->id, $fullDayLeaves)) {
                continue;
            }

            // Check temporary leave overlap
            $tempLeave = $temporaryLeaves->firstWhere('student_id', $student->id);
            if ($tempLeave && $tempLeave->shouldHideFromAttendance($schedule)) {
                $onLeaveStudents[] = [
                    'id' => $student->id,
                    'name' => $student->user->name ?? 'N/A',
                    'nis' => $student->nis,
                    'leave_type' => $tempLeave->type,
                    'return_time' => $tempLeave->end_time ? Carbon::parse($tempLeave->end_time)->format('H:i') : null,
                ];

                continue;
            }

            $eligibleStudents[] = [
                'id' => $student->id,
                'name' => $student->user->name ?? 'N/A',
                'nis' => $student->nis,
                'nisn' => $student->nisn,
            ];
        }

        return response()->json([
            'schedule_id' => $schedule->id,
            'date' => $today,
            'eligible_students' => $eligibleStudents,
            'on_leave_students' => $onLeaveStudents,
            'total_eligible' => count($eligibleStudents),
            'total_on_leave' => count($onLeaveStudents),
        ]);
    }

    /**
     * Create Student Leave (Full Day)
     *
     * Mark a student as sick or having permission for the full day.
     * This affects all subjects for the day.
     */
    public function createStudentLeave(Request $request, Schedule $schedule, StudentProfile $student): JsonResponse
    {
        $user = $request->user();
        $teacher = $user->teacherProfile;

        if (! $teacher || $schedule->teacher_id !== $teacher->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate student is in the class
        if ($student->class_id !== $schedule->class_id) {
            return response()->json(['message' => 'Student is not in this class'], 422);
        }

        $data = $request->validate([
            'type' => ['required', 'in:sakit,izin'],
            'reason' => ['nullable', 'string', 'max:500'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $today = now()->toDateString();

        // Check for existing leave today
        $existingLeave = StudentLeavePermission::where('student_id', $student->id)
            ->where('date', $today)
            ->where('status', 'active')
            ->first();

        if ($existingLeave) {
            return response()->json([
                'message' => 'Student already has an active leave permission for today',
                'existing_leave' => $existingLeave,
            ], 422);
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('leave-attachments', 'public');
        }

        $leavePermission = StudentLeavePermission::create([
            'student_id' => $student->id,
            'class_id' => $schedule->class_id,
            'granted_by' => $user->id,
            'schedule_id' => $schedule->id,
            'type' => $data['type'],
            'date' => $today,
            'start_time' => $schedule->start_time,
            'end_time' => null, // Full day
            'reason' => $data['reason'] ?? null,
            'attachment_path' => $attachmentPath,
            'status' => 'active',
            'is_full_day' => true,
        ]);

        // Create attendance records for ALL schedules today with status sick/izin
        $this->createFullDayAttendanceRecords($student, $data['type'], $today, $data['reason'] ?? null);

        return response()->json([
            'message' => 'Student marked as '.($data['type'] === 'sakit' ? 'sick' : 'permission').' for full day',
            'leave_permission' => $leavePermission->load(['student.user', 'granter']),
        ], 201);
    }

    /**
     * Create Leave Early Permission
     *
     * Grant permission for a student to leave early (izin pulang) or dispensasi.
     * Student will be hidden from attendance until return or end of school.
     */
    public function createLeaveEarly(Request $request, Schedule $schedule, StudentProfile $student): JsonResponse
    {
        $user = $request->user();
        $teacher = $user->teacherProfile;

        if (! $teacher || $schedule->teacher_id !== $teacher->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($student->class_id !== $schedule->class_id) {
            return response()->json(['message' => 'Student is not in this class'], 422);
        }

        $data = $request->validate([
            'type' => ['required', 'in:izin_pulang,dispensasi'],
            'end_time' => ['nullable', 'date_format:H:i'], // When student should return
            'reason' => ['nullable', 'string', 'max:500'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $today = now()->toDateString();
        $currentTime = now()->format('H:i');

        // Check for existing active leave today
        $existingLeave = StudentLeavePermission::where('student_id', $student->id)
            ->where('date', $today)
            ->where('status', 'active')
            ->first();

        if ($existingLeave) {
            return response()->json([
                'message' => 'Student already has an active leave permission',
                'existing_leave' => $existingLeave,
            ], 422);
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('leave-attachments', 'public');
        }

        $leavePermission = StudentLeavePermission::create([
            'student_id' => $student->id,
            'class_id' => $schedule->class_id,
            'granted_by' => $user->id,
            'schedule_id' => $schedule->id,
            'type' => $data['type'],
            'date' => $today,
            'start_time' => $currentTime,
            'end_time' => $data['end_time'] ?? null,
            'reason' => $data['reason'] ?? null,
            'attachment_path' => $attachmentPath,
            'status' => 'active',
            'is_full_day' => false,
        ]);

        // If end_time is null (until end of school), mark all remaining schedules
        if (empty($data['end_time'])) {
            $this->markRemainingSchedulesAsIzin($student, $today, $currentTime, $data['reason'] ?? 'Izin pulang');
        }

        return response()->json([
            'message' => 'Leave permission granted',
            'leave_permission' => $leavePermission->load(['student.user', 'granter']),
            'info' => empty($data['end_time'])
                ? 'Student will be marked as izin for all remaining subjects today'
                : 'Student should return by '.$data['end_time'],
        ], 201);
    }

    /**
     * Mark Student Returned
     *
     * Mark a student as returned from early leave or dispensasi.
     */
    public function markReturned(Request $request, StudentLeavePermission $leavePermission): JsonResponse
    {
        $user = $request->user();
        $teacher = $user->teacherProfile;

        if (! $teacher) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate teacher teaches this class or is homeroom
        $class = $leavePermission->classRoom;
        $isTeachingClass = $class->schedules()->where('teacher_id', $teacher->id)->exists();
        $isHomeroom = $teacher->homeroom_class_id === $class->id;

        if (! $isTeachingClass && ! $isHomeroom) {
            return response()->json(['message' => 'Unauthorized - You do not teach this class'], 403);
        }

        if ($leavePermission->status !== 'active') {
            return response()->json(['message' => 'Leave permission is not active'], 422);
        }

        $leavePermission->markReturned($user->id);

        return response()->json([
            'message' => 'Student marked as returned',
            'leave_permission' => $leavePermission->fresh()->load(['student.user', 'granter', 'returner']),
        ]);
    }

    /**
     * Mark Student Absent (Alpha)
     *
     * Mark a student as absent (alpha) if they did not return from leave on time.
     */
    public function markAbsent(Request $request, StudentLeavePermission $leavePermission): JsonResponse
    {
        $user = $request->user();
        $teacher = $user->teacherProfile;

        if (! $teacher) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $class = $leavePermission->classRoom;
        $isTeachingClass = $class->schedules()->where('teacher_id', $teacher->id)->exists();
        $isHomeroom = $teacher->homeroom_class_id === $class->id;

        if (! $isTeachingClass && ! $isHomeroom) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($leavePermission->status !== 'active') {
            return response()->json(['message' => 'Leave permission is not active'], 422);
        }

        $leavePermission->markExpired();

        // Create absent attendance for remaining schedules that were missed
        $this->markMissedSchedulesAsAbsent($leavePermission);

        return response()->json([
            'message' => 'Student marked as absent (alpha) for missed schedules',
            'leave_permission' => $leavePermission->fresh(),
        ]);
    }

    /**
     * Get Class Leave Permissions
     *
     * Retrieve active leave permissions for a specific class today.
     */
    public function getClassLeavePermissions(Request $request, \App\Models\Classes $class): JsonResponse
    {
        $user = $request->user();
        $teacher = $user->teacherProfile;

        if (! $teacher) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $isTeachingClass = $class->schedules()->where('teacher_id', $teacher->id)->exists();
        $isHomeroom = $teacher->homeroom_class_id === $class->id;

        if (! $isTeachingClass && ! $isHomeroom) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $today = now()->toDateString();

        $permissions = StudentLeavePermission::where('class_id', $class->id)
            ->where('date', $today)
            ->with(['student.user', 'granter', 'schedule'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'student' => [
                        'id' => $permission->student->id,
                        'name' => $permission->student->user->name ?? 'N/A',
                        'nis' => $permission->student->nis,
                    ],
                    'type' => $permission->type,
                    'type_label' => $this->getLeaveTypeLabel($permission->type),
                    'start_time' => Carbon::parse($permission->start_time)->format('H:i'),
                    'end_time' => $permission->end_time ? Carbon::parse($permission->end_time)->format('H:i') : null,
                    'reason' => $permission->reason,
                    'status' => $permission->status,
                    'is_full_day' => $permission->is_full_day,
                    'granted_by' => $permission->granter->name ?? 'N/A',
                    'granted_at' => $permission->created_at->format('H:i'),
                    'returned_at' => $permission->returned_at?->format('H:i'),
                ];
            });

        return response()->json([
            'class_id' => $class->id,
            'class_name' => $class->name,
            'date' => $today,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Helper: Create attendance records for all today's schedules (full day sick/izin)
     */
    private function createFullDayAttendanceRecords(StudentProfile $student, string $status, string $date, ?string $reason): void
    {
        $dayName = Carbon::parse($date)->format('l');

        $schedules = Schedule::where('class_id', $student->class_id)
            ->where('day', $dayName)
            ->get();

        foreach ($schedules as $schedule) {
            Attendance::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'schedule_id' => $schedule->id,
                    'attendee_type' => 'student',
                ],
                [
                    'date' => $date,
                    'status' => $status,
                    'reason' => $reason,
                    'source' => 'manual',
                ]
            );
        }
    }

    /**
     * Helper: Mark remaining schedules as izin (for izin pulang until end of school)
     */
    private function markRemainingSchedulesAsIzin(StudentProfile $student, string $date, string $fromTime, string $reason): void
    {
        $dayName = Carbon::parse($date)->format('l');

        $schedules = Schedule::where('class_id', $student->class_id)
            ->where('day', $dayName)
            ->where('start_time', '>=', $fromTime)
            ->get();

        foreach ($schedules as $schedule) {
            Attendance::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'schedule_id' => $schedule->id,
                    'attendee_type' => 'student',
                ],
                [
                    'date' => $date,
                    'status' => 'izin',
                    'reason' => $reason,
                    'source' => 'manual',
                ]
            );
        }
    }

    /**
     * Helper: Mark missed schedules as absent when leave expired
     */
    private function markMissedSchedulesAsAbsent(StudentLeavePermission $leavePermission): void
    {
        $student = $leavePermission->student;
        $date = $leavePermission->date->toDateString();
        $dayName = $leavePermission->date->format('l');
        $startTime = Carbon::parse($leavePermission->start_time)->format('H:i');
        $endTime = $leavePermission->end_time
            ? Carbon::parse($leavePermission->end_time)->format('H:i')
            : '23:59';

        $schedules = Schedule::where('class_id', $student->class_id)
            ->where('day', $dayName)
            ->where('start_time', '>=', $startTime)
            ->where('start_time', '<=', $endTime)
            ->get();

        foreach ($schedules as $schedule) {
            // Only update if currently marked as izin (from leave)
            Attendance::where('student_id', $student->id)
                ->where('schedule_id', $schedule->id)
                ->whereDate('date', $date)
                ->where('status', 'izin')
                ->update([
                    'status' => 'absent',
                    'reason' => 'Tidak kembali setelah izin pulang',
                ]);
        }
    }

    private function getStatusLabel(?string $status): string
    {
        return match ($status) {
            'present' => 'Hadir',
            'late' => 'Terlambat',
            'sick' => 'Sakit',
            'excused', 'izin' => 'Izin',
            'absent' => 'Alpha',
            'dinas' => 'Dinas',
            default => 'Belum Absen',
        };
    }

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
}
