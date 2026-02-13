<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MobileNotificationController extends Controller
{
    /**
     * List Notifications
     *
     * Retrieve notifications for the mobile app, generated on-the-fly based on attendance data.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $date = $request->query('date', now()->format('Y-m-d'));

        $cacheKey = "notifications.{$user->id}.{$date}";

        $notifications = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($user, $date) {
            return $this->generateNotifications($user, $date);
        });

        return response()->json([
            'date' => $date,
            'notifications' => $notifications,
        ]);
    }

    /**
     * Generate notifications based on user role and attendance data
     */
    private function generateNotifications($user, $date): array
    {
        $notifications = [];

        if ($user->user_type === 'teacher') {
            $notifications = $this->generateTeacherNotifications($user, $date);
        } elseif ($user->user_type === 'student') {
            $notifications = $this->generateStudentNotifications($user, $date);
        }

        return $notifications;
    }

    /**
     * Generate notifications for teachers
     */
    private function generateTeacherNotifications($user, $date): array
    {
        $notifications = [];
        $teacherId = $user->teacherProfile?->id;

        if (! $teacherId) {
            return $notifications;
        }

        // Notifikasi kehadiran mengajar hari ini
        $teachingAttendances = Attendance::whereHas('schedule', function ($q) use ($teacherId) {
            $q->where('teacher_id', $teacherId);
        })
            ->where('attendee_type', 'teacher')
            ->whereDate('date', $date)
            ->with('schedule.subject:id,name', 'schedule.class:id,name')
            ->get();

        foreach ($teachingAttendances as $attendance) {
            $type = match ($attendance->status) {
                'present' => 'tepat_waktu',
                'late' => 'terlambat',
                'dinas' => 'dinas',
                default => 'other',
            };

            $message = match ($attendance->status) {
                'present' => 'Anda mengajar tepat waktu pada',
                'late' => 'Anda terlambat mengajar pada',
                'dinas' => 'Anda sedang dinas pada',
                default => 'Status kehadiran',
            };

            $notifications[] = [
                'id' => $attendance->id,
                'type' => $type,
                'message' => $message,
                'detail' => sprintf(
                    'Pelajaran %s - %s',
                    $attendance->schedule->subject->name ?? 'Unknown',
                    $attendance->schedule->class->name ?? 'Unknown'
                ),
                'time' => $attendance->date->format('H:i'),
                'created_at' => $attendance->created_at->toIso8601String(),
            ];
        }

        // Cek siswa yang alpha hari ini
        $alphaCount = Attendance::whereHas('schedule', function ($q) use ($teacherId) {
            $q->where('teacher_id', $teacherId);
        })
            ->where('attendee_type', 'student')
            ->where('status', 'absent')
            ->whereDate('date', $date)
            ->count();

        if ($alphaCount > 0) {
            $notifications[] = [
                'id' => 'alpha_'.now()->timestamp,
                'type' => 'alpha_siswa',
                'message' => "Ada {$alphaCount} siswa alpha hari ini",
                'detail' => 'Perlu tindak lanjut',
                'time' => now()->format('H:i'),
                'created_at' => now()->toIso8601String(),
            ];
        }

        // Cek siswa yang perlu tindak lanjut (alpha >= 3 dalam sebulan terakhir)
        $problematicStudents = Attendance::whereHas('schedule', function ($q) use ($teacherId) {
            $q->where('teacher_id', $teacherId);
        })
            ->where('attendee_type', 'student')
            ->where('status', 'absent')
            ->whereDate('date', '>=', now()->subMonth())
            ->selectRaw('student_id, count(*) as alpha_count')
            ->groupBy('student_id')
            ->having('alpha_count', '>=', 3)
            ->count();

        if ($problematicStudents > 0) {
            $notifications[] = [
                'id' => 'followup_'.now()->timestamp,
                'type' => 'tindak_lanjut',
                'message' => "{$problematicStudents} siswa perlu tindak lanjut",
                'detail' => 'Sering alpha dalam sebulan terakhir',
                'time' => now()->format('H:i'),
                'created_at' => now()->toIso8601String(),
            ];
        }

        return $notifications;
    }

    /**
     * Generate notifications for students
     */
    private function generateStudentNotifications($user, $date): array
    {
        $notifications = [];
        $studentId = $user->studentProfile?->id;

        if (! $studentId) {
            return $notifications;
        }

        // Notifikasi kehadiran hari ini
        $attendances = Attendance::where('student_id', $studentId)
            ->whereDate('date', $date)
            ->with('schedule.subject:id,name')
            ->get();

        foreach ($attendances as $attendance) {
            $type = match ($attendance->status) {
                'present' => 'hadir',
                'late' => 'terlambat',
                'sick' => 'sakit',
                'excused' => 'izin',
                'absent' => 'alpha',
                default => 'other',
            };

            $message = match ($attendance->status) {
                'present' => 'Anda hadir tepat waktu',
                'late' => 'Anda terlambat',
                'sick' => 'Anda sakit',
                'excused' => 'Anda izin',
                'absent' => 'Anda tidak hadir',
                default => 'Status kehadiran',
            };

            $notifications[] = [
                'id' => $attendance->id,
                'type' => $type,
                'message' => $message,
                'detail' => 'Mata pelajaran '.$attendance->schedule->subject->name ?? 'Unknown',
                'time' => $attendance->date->format('H:i'),
                'created_at' => $attendance->created_at->toIso8601String(),
            ];
        }

        return $notifications;
    }
}
