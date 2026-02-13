<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\Schedule;
use App\Models\StudentLeavePermission;
use App\Models\StudentProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * Controller for managing student leave permissions
 * Handles izin pulang, dispensasi, and full-day sick/permission
 */
class StudentLeavePermissionController extends Controller
{
    /**
     * List Leave Permissions
     *
     * Retrieve a list of student leave permissions with various filters.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'class_id' => ['nullable', 'exists:classes,id'],
            'student_id' => ['nullable', 'exists:student_profiles,id'],
            'date' => ['nullable', 'date'],
            'status' => ['nullable', 'in:active,returned,expired,cancelled'],
            'type' => ['nullable', 'in:izin_pulang,dispensasi,sakit,izin'],
        ]);

        $user = $request->user();
        $teacher = $user->teacherProfile;

        $query = StudentLeavePermission::with(['student.user', 'classRoom', 'granter', 'schedule']);

        // Filter by teacher's classes if not admin
        if ($user->user_type === 'teacher' && $teacher) {
            $classIds = Schedule::where('teacher_id', $teacher->id)
                ->pluck('class_id')
                ->unique();

            // Include homeroom class
            if ($teacher->homeroom_class_id) {
                $classIds->push($teacher->homeroom_class_id);
            }

            $query->whereIn('class_id', $classIds);
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->integer('class_id'));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->integer('student_id'));
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date('date'));
        } else {
            // Default to today
            $query->whereDate('date', now()->toDateString());
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        $permissions = $query->orderByDesc('created_at')->paginate();

        return response()->json($permissions);
    }

    /**
     * Create Leave Permission
     *
     * Create a new leave permission for a student (Sick, Permit, Leave Early, Dispensasi).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'student_id' => ['required', 'exists:student_profiles,id'],
            'schedule_id' => ['nullable', 'exists:schedules,id'],
            'type' => ['required', 'in:izin_pulang,dispensasi,sakit,izin'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i', 'after:start_time'],
            'reason' => ['nullable', 'string', 'max:500'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $user = $request->user();
        $teacher = $user->teacherProfile;

        if (! $teacher) {
            return response()->json(['message' => 'Teacher profile not found'], 404);
        }

        $student = StudentProfile::findOrFail($data['student_id']);

        // Validate teacher has access to this student's class
        $hasAccess = Schedule::where('teacher_id', $teacher->id)
            ->where('class_id', $student->class_id)
            ->exists();

        $isHomeroom = $teacher->homeroom_class_id === $student->class_id;

        if (! $hasAccess && ! $isHomeroom) {
            return response()->json(['message' => 'Unauthorized - You do not teach this class'], 403);
        }

        $today = now()->toDateString();

        // Check for existing active leave
        $existing = StudentLeavePermission::where('student_id', $student->id)
            ->where('date', $today)
            ->where('status', 'active')
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Student already has an active leave permission for today',
                'existing' => $existing,
            ], 422);
        }

        $isFullDay = in_array($data['type'], ['sakit', 'izin']);

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('leave-attachments', 'public');
        }

        $permission = StudentLeavePermission::create([
            'student_id' => $student->id,
            'class_id' => $student->class_id,
            'granted_by' => $user->id,
            'schedule_id' => $data['schedule_id'] ?? null,
            'type' => $data['type'],
            'date' => $today,
            'start_time' => $data['start_time'],
            'end_time' => $isFullDay ? null : ($data['end_time'] ?? null),
            'reason' => $data['reason'] ?? null,
            'attachment_path' => $attachmentPath,
            'status' => 'active',
            'is_full_day' => $isFullDay,
        ]);

        // If full day, create attendance records
        if ($isFullDay) {
            $this->createFullDayAttendance($student, $data['type'], $today, $data['reason'] ?? null);
        } elseif (empty($data['end_time'])) {
            // If izin_pulang/dispensasi without end time, mark remaining schedules
            $this->markRemainingAsIzin($student, $today, $data['start_time'], $data['reason'] ?? null);
        }

        return response()->json([
            'message' => 'Leave permission created successfully',
            'permission' => $permission->load(['student.user', 'granter', 'schedule']),
        ], 201);
    }

    /**
     * Show Leave Permission
     *
     * Retrieve details of a specific leave permission.
     */
    public function show(Request $request, StudentLeavePermission $permission): JsonResponse
    {
        $this->authorizeAccess($request, $permission);

        return response()->json($permission->load(['student.user', 'classRoom', 'granter', 'schedule', 'returner']));
    }

    /**
     * Update Leave Permission
     *
     * Update an active leave permission (e.g., change end time).
     */
    public function update(Request $request, StudentLeavePermission $permission): JsonResponse
    {
        $this->authorizeAccess($request, $permission);

        if ($permission->status !== 'active') {
            return response()->json(['message' => 'Cannot update non-active permission'], 422);
        }

        $data = $request->validate([
            'end_time' => ['nullable', 'date_format:H:i'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $permission->update($data);

        return response()->json([
            'message' => 'Leave permission updated',
            'permission' => $permission->fresh()->load(['student.user', 'granter']),
        ]);
    }

    /**
     * Mark Student Returned
     *
     * Mark a student as returned from temporary leave.
     */
    public function markReturn(Request $request, StudentLeavePermission $permission): JsonResponse
    {
        $this->authorizeAccess($request, $permission);

        if ($permission->status !== 'active') {
            return response()->json(['message' => 'Permission is not active'], 422);
        }

        if ($permission->is_full_day) {
            return response()->json(['message' => 'Cannot mark return for full day permission'], 422);
        }

        $permission->markReturned($request->user()->id);

        return response()->json([
            'message' => 'Student marked as returned',
            'permission' => $permission->fresh()->load(['student.user', 'returner']),
        ]);
    }

    /**
     * Mark Student Absent (Alpha)
     *
     * Mark a student as absent (alpha) if they didn't return on time.
     */
    public function markAbsent(Request $request, StudentLeavePermission $permission): JsonResponse
    {
        $this->authorizeAccess($request, $permission);

        if ($permission->status !== 'active') {
            return response()->json(['message' => 'Permission is not active'], 422);
        }

        $permission->markExpired();

        // Update attendance records to absent
        $this->convertIzinToAbsent($permission);

        return response()->json([
            'message' => 'Student marked as absent for missed schedules',
            'permission' => $permission->fresh(),
        ]);
    }

    /**
     * Cancel Leave Permission
     *
     * Cancel an active leave permission and revert associated attendance records.
     */
    public function cancel(Request $request, StudentLeavePermission $permission): JsonResponse
    {
        $this->authorizeAccess($request, $permission);

        if ($permission->status !== 'active') {
            return response()->json(['message' => 'Permission is not active'], 422);
        }

        $permission->cancel();

        // Remove attendance records created for this leave
        $this->removeLeaveAttendanceRecords($permission);

        return response()->json([
            'message' => 'Leave permission cancelled',
            'permission' => $permission->fresh(),
        ]);
    }

    /**
     * List Students on Leave
     *
     * Retrieve a list of students currently on leave for a specific class.
     */
    public function studentsOnLeave(Request $request, Classes $class): JsonResponse
    {
        $user = $request->user();
        $teacher = $user->teacherProfile;

        if ($user->user_type === 'teacher' && $teacher) {
            $hasAccess = Schedule::where('teacher_id', $teacher->id)
                ->where('class_id', $class->id)
                ->exists();
            $isHomeroom = $teacher->homeroom_class_id === $class->id;

            if (! $hasAccess && ! $isHomeroom) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $today = now()->toDateString();
        $currentTime = now()->format('H:i');

        $permissions = StudentLeavePermission::where('class_id', $class->id)
            ->where('date', $today)
            ->where('status', 'active')
            ->with(['student.user', 'granter'])
            ->get()
            ->map(function ($p) use ($currentTime) {
                $isActive = $p->is_full_day ||
                    ($p->start_time <= $currentTime &&
                     ($p->end_time === null || $p->end_time >= $currentTime));

                return [
                    'id' => $p->id,
                    'student' => [
                        'id' => $p->student->id,
                        'name' => $p->student->user->name ?? 'N/A',
                        'nis' => $p->student->nis,
                    ],
                    'type' => $p->type,
                    'type_label' => $this->getTypeLabel($p->type),
                    'start_time' => Carbon::parse($p->start_time)->format('H:i'),
                    'end_time' => $p->end_time ? Carbon::parse($p->end_time)->format('H:i') : null,
                    'is_full_day' => $p->is_full_day,
                    'is_currently_active' => $isActive,
                    'reason' => $p->reason,
                    'granted_by' => $p->granter->name ?? 'N/A',
                    'attachment_url' => $p->attachment_url,
                ];
            });

        return response()->json([
            'class' => [
                'id' => $class->id,
                'name' => $class->name,
            ],
            'date' => $today,
            'students_on_leave' => $permissions,
            'total' => $permissions->count(),
        ]);
    }

    /**
     * Check Expired Permissions
     *
     * Check and expire leave permissions that have passed their end time.
     */
    public function checkExpired(): JsonResponse
    {
        $today = now()->toDateString();
        $currentTime = now()->format('H:i');

        $expiredCount = StudentLeavePermission::where('date', $today)
            ->where('status', 'active')
            ->where('is_full_day', false)
            ->whereNotNull('end_time')
            ->where('end_time', '<', $currentTime)
            ->update(['status' => 'expired']);

        return response()->json([
            'message' => "Checked and expired {$expiredCount} leave permissions",
            'expired_count' => $expiredCount,
        ]);
    }

    /**
     * Authorize access to a leave permission
     */
    private function authorizeAccess(Request $request, StudentLeavePermission $permission): void
    {
        $user = $request->user();
        $teacher = $user->teacherProfile;

        if ($user->user_type === 'admin') {
            return; // Admin has full access
        }

        if (! $teacher) {
            abort(403, 'Unauthorized');
        }

        $hasAccess = Schedule::where('teacher_id', $teacher->id)
            ->where('class_id', $permission->class_id)
            ->exists();

        $isHomeroom = $teacher->homeroom_class_id === $permission->class_id;
        $isGranter = $permission->granted_by === $user->id;

        if (! $hasAccess && ! $isHomeroom && ! $isGranter) {
            abort(403, 'Unauthorized');
        }
    }

    private function createFullDayAttendance(StudentProfile $student, string $status, string $date, ?string $reason): void
    {
        $dayName = Carbon::parse($date)->format('l');

        $schedules = Schedule::where('class_id', $student->class_id)
            ->where('day', $dayName)
            ->get();

        foreach ($schedules as $schedule) {
            \App\Models\Attendance::updateOrCreate(
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

    private function markRemainingAsIzin(StudentProfile $student, string $date, string $fromTime, string $reason): void
    {
        $dayName = Carbon::parse($date)->format('l');

        $schedules = Schedule::where('class_id', $student->class_id)
            ->where('day', $dayName)
            ->where('start_time', '>=', $fromTime)
            ->get();

        foreach ($schedules as $schedule) {
            \App\Models\Attendance::updateOrCreate(
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

    private function convertIzinToAbsent(StudentLeavePermission $permission): void
    {
        $student = $permission->student;
        $date = $permission->date->toDateString();
        $dayName = $permission->date->format('l');
        $startTime = Carbon::parse($permission->start_time)->format('H:i');

        $scheduleIds = Schedule::where('class_id', $student->class_id)
            ->where('day', $dayName)
            ->where('start_time', '>=', $startTime)
            ->pluck('id');

        \App\Models\Attendance::where('student_id', $student->id)
            ->whereIn('schedule_id', $scheduleIds)
            ->whereDate('date', $date)
            ->where('status', 'izin')
            ->where('source', 'manual')
            ->update([
                'status' => 'absent',
                'reason' => 'Tidak kembali setelah '.$this->getTypeLabel($permission->type),
            ]);
    }

    private function removeLeaveAttendanceRecords(StudentLeavePermission $permission): void
    {
        $student = $permission->student;
        $date = $permission->date->toDateString();
        $dayName = $permission->date->format('l');
        $startTime = Carbon::parse($permission->start_time)->format('H:i');

        $scheduleIds = Schedule::where('class_id', $student->class_id)
            ->where('day', $dayName)
            ->where('start_time', '>=', $startTime)
            ->pluck('id');

        // Only delete attendance records that were created for this leave
        \App\Models\Attendance::where('student_id', $student->id)
            ->whereIn('schedule_id', $scheduleIds)
            ->whereDate('date', $date)
            ->whereIn('status', ['izin', $permission->type])
            ->where('source', 'manual')
            ->delete();
    }

    private function getTypeLabel(string $type): string
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
