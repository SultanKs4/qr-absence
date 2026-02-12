<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Classes;
use App\Models\Major;
use App\Models\Schedule;
use App\Models\StudentProfile;
use App\Models\TeacherProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    public function adminSummary(Request $request): JsonResponse
    {
        $today = now()->format('Y-m-d');

        $stats = Cache::remember("dashboard.admin.{$today}", 600, function () use ($today) {
            $todayStats = Attendance::whereDate('date', $today)
                ->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status');

            return [
                'students_count' => StudentProfile::count(),
                'teachers_count' => TeacherProfile::count(),
                'classes_count' => Classes::count(),
                'majors_count' => Major::count(),
                'rooms_count' => \App\Models\Room::count(),
                'attendance_today' => [
                    'hadir' => $todayStats->get('present', 0),
                    'izin' => $todayStats->get('izin', 0) + $todayStats->get('excused', 0),
                    'sakit' => $todayStats->get('sick', 0),
                    'alpha' => $todayStats->get('absent', 0),
                    'terlambat' => $todayStats->get('late', 0),
                    'pulang' => $todayStats->get('return', 0),
                ],
            ];
        });

        return response()->json($stats);
    }

    public function attendanceSummary(Request $request): JsonResponse
    {
        $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $query = Attendance::query();

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $summary = $query->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        return response()->json($summary);
    }

    /**
     * Get student dashboard summary (Mobile App)
     * Returns today's schedule with attendance status
     */
    public function studentDashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = $user->studentProfile()->with('classRoom')->first();

        if (! $student) {
            return response()->json(['message' => 'Student profile not found'], 404);
        }

        $today = now()->format('Y-m-d');
        $dayName = now()->locale('id')->translatedFormat('l');

        // Get today's schedules for student's class
        $schedules = Schedule::where('class_id', $student->class_id)
            ->where('day', now()->format('l'))
            ->with(['teacher.user'])
            ->orderBy('start_time')
            ->get();

        $scheduleIds = $schedules->pluck('id');

        // Fetch all attendances for these schedules today in one query
        $attendances = Attendance::where('student_id', $student->id)
            ->whereIn('schedule_id', $scheduleIds)
            ->whereDate('date', $today)
            ->get()
            ->keyBy('schedule_id');

        $scheduleToday = $schedules->map(function ($schedule) use ($attendances) {
            $attendance = $attendances->get($schedule->id);

            return [
                'id' => $schedule->id,
                'class_id' => $schedule->class_id,
                'time_slot' => $schedule->title ?? 'Jam Ke '.$schedule->id,
                'subject' => $schedule->subject_name,
                'teacher' => $schedule->teacher?->user?->name ?? 'N/A',
                'start_time' => substr($schedule->start_time, 0, 5),
                'end_time' => substr($schedule->end_time, 0, 5),
                'status' => $attendance?->status ?? 'none',
                'status_label' => $this->getStatusLabel($attendance?->status),
                'check_in_time' => $attendance?->checked_in_at?->format('H:i'),
            ];
        });

        return response()->json([
            'date' => $today,
            'day_name' => $dayName,
            'student' => [
                'name' => $user->name,
                'class_name' => $student->classRoom?->name ?? 'N/A',
                'nis' => $student->nis,
                'photo_url' => null,
                'is_class_officer' => $student->is_class_officer,
            ],
            'school_hours' => [
                'start_time' => substr(\App\Models\Setting::where('key', 'school_start_time')->value('value') ?? '07:00', 0, 5),
                'end_time' => substr(\App\Models\Setting::where('key', 'school_end_time')->value('value') ?? '15:00', 0, 5),
            ],
            'schedule_today' => $scheduleToday,
        ]);
    }

    /**
     * Get teacher dashboard summary (Mobile App)
     * Returns today's teaching schedule and attendance summary
     */
    public function teacherDashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $teacher = $user->teacherProfile;

        if (! $teacher) {
            return response()->json(['message' => 'Teacher profile not found'], 404);
        }

        $today = now()->format('Y-m-d');
        $dayName = now()->locale('id')->translatedFormat('l');
        $dayEnglish = now()->format('l');

        // Get today's teaching schedules
        $schedules = Schedule::where('teacher_id', $teacher->id)
            ->where('day', $dayEnglish)
            ->with(['class'])
            ->orderBy('start_time')
            ->get();

        $scheduleIds = $schedules->pluck('id');

        // Get attendance for all schedules today
        $attendances = Attendance::whereIn('schedule_id', $scheduleIds)
            ->whereDate('date', $today)
            ->where('attendee_type', 'student')
            ->get();

        // Get students on leave today for classes this teacher teaches
        $classIds = $schedules->pluck('class_id')->unique();
        $studentsOnLeave = \App\Models\StudentLeavePermission::whereIn('class_id', $classIds)
            ->where('date', $today)
            ->where('status', 'active')
            ->get();

        // Calculate per-schedule statistics
        $scheduleToday = $schedules->map(function ($schedule) use ($attendances, $studentsOnLeave) {
            $scheduleAttendances = $attendances->where('schedule_id', $schedule->id);

            // Count by status
            $stats = [
                'present' => $scheduleAttendances->whereIn('status', ['present', 'late'])->count(),
                'late' => $scheduleAttendances->where('status', 'late')->count(),
                'sick' => $scheduleAttendances->where('status', 'sick')->count(),
                'izin' => $scheduleAttendances->whereIn('status', ['izin', 'excused'])->count(),
                'absent' => $scheduleAttendances->where('status', 'absent')->count(),
            ];

            // Count students on leave for this class
            $classLeaves = $studentsOnLeave->where('class_id', $schedule->class_id);
            $onLeaveCount = $classLeaves->filter(function ($leave) use ($schedule) {
                return $leave->shouldHideFromAttendance($schedule);
            })->count();

            // Get total students in class
            $totalStudents = \App\Models\StudentProfile::where('class_id', $schedule->class_id)->count();

            return [
                'id' => $schedule->id,
                'class_id' => $schedule->class_id,
                'subject' => $schedule->subject_name,
                'class_name' => $schedule->class?->name ?? 'N/A',
                'time_slot' => $schedule->title ?? 'Jam Ke '.$schedule->id,
                'start_time' => substr($schedule->start_time, 0, 5),
                'end_time' => substr($schedule->end_time, 0, 5),
                'room' => $schedule->room,
                'statistics' => $stats,
                'students_on_leave' => $onLeaveCount,
                'total_students' => $totalStudents,
            ];
        });

        // Aggregate attendance summary across all schedules today
        $attendanceSummary = [
            'present' => $attendances->whereIn('status', ['present', 'late'])->count(),
            'late' => $attendances->where('status', 'late')->count(),
            'sick' => $attendances->where('status', 'sick')->count(),
            'izin' => $attendances->whereIn('status', ['izin', 'excused'])->count(),
            'absent' => $attendances->where('status', 'absent')->count(),
        ];

        // Count total students on leave across all classes
        $totalOnLeave = $studentsOnLeave->count();

        return response()->json([
            'date' => $today,
            'day_name' => $dayName,
            'teacher' => [
                'name' => $user->name,
                'nip' => $teacher->nip,
                'code' => $teacher->nip,
                'photo_url' => null,
                'is_homeroom' => $teacher->homeroom_class_id !== null,
                'homeroom_class' => $teacher->homeroomClass?->name,
            ],
            'school_hours' => [
                'start_time' => substr(\App\Models\Setting::where('key', 'school_start_time')->value('value') ?? '07:00', 0, 5),
                'end_time' => substr(\App\Models\Setting::where('key', 'school_end_time')->value('value') ?? '15:00', 0, 5),
            ],
            'attendance_summary' => [
                'present' => $attendanceSummary['present'],
                'sick' => $attendanceSummary['sick'],
                'excused' => $attendanceSummary['izin'],
                'izin' => $attendanceSummary['izin'],
                'absent' => $attendanceSummary['absent'],
                'late' => $attendanceSummary['late'],
                'on_leave' => $totalOnLeave,
            ],
            'schedule_today' => $scheduleToday,
        ]);
    }

    /**
     * Get homeroom teacher dashboard (Mobile App)
     * Returns homeroom class info, attendance summary, and today's schedule
     */
    public function homeroomDashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $teacher = $user->teacherProfile()->with('homeroomClass')->first();

        if (! $teacher || ! $teacher->homeroom_class_id) {
            return response()->json(['message' => 'Homeroom class not found'], 404);
        }

        $today = now()->format('Y-m-d');
        $homeroomClass = $teacher->homeroomClass;

        // Get today's schedules for homeroom class
        $schedules = Schedule::where('class_id', $homeroomClass->id)
            ->where('day', now()->format('l'))
            ->with(['teacher.user'])
            ->orderBy('start_time')
            ->get();

        $scheduleToday = $schedules->map(function ($schedule) {
            return [
                'id' => $schedule->id,
                'subject' => $schedule->subject_name,
                'teacher' => $schedule->teacher?->user?->name ?? 'N/A',
                'time_slot' => $schedule->title ?? 'Jam Ke '.$schedule->id,
                'start_time' => substr($schedule->start_time, 0, 5),
                'end_time' => substr($schedule->end_time, 0, 5),
            ];
        });

        // Get attendance summary for homeroom class today
        $scheduleIds = $schedules->pluck('id');
        $attendanceSummary = Attendance::whereIn('schedule_id', $scheduleIds)
            ->whereDate('date', $today)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        $totalStudents = StudentProfile::where('class_id', $homeroomClass->id)->count();

        return response()->json([
            'date' => $today,
            'homeroom_class' => [
                'id' => $homeroomClass->id,
                'name' => $homeroomClass->name,
                'total_students' => $totalStudents,
            ],
            'attendance_summary' => [
                'present' => $attendanceSummary->get('present', 0),
                'late' => $attendanceSummary->get('late', 0),
                'sick' => $attendanceSummary->get('sick', 0),
                'excused' => $attendanceSummary->get('excused', 0) + $attendanceSummary->get('izin', 0),
                'absent' => $attendanceSummary->get('absent', 0),
            ],
            'schedule_today' => $scheduleToday,
        ]);
    }

    /**
     * Get Waka (Vice Principal) dashboard summary
     * Returns today's stats and monthly trend
     */
    public function wakaDashboard(Request $request): JsonResponse
    {
        $today = now()->format('Y-m-d');

        $data = Cache::remember("dashboard.waka.{$today}", 600, function () use ($today) {
            $startOfMonth = now()->startOfMonth()->format('Y-m-d');
            $endOfMonth = now()->endOfMonth()->format('Y-m-d');

            // 1. Stats Hari Ini (Today's Stats)
            $todayStats = Attendance::whereDate('date', $today)
                ->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status');

            $statistik = [
                'hadir' => $todayStats->get('present', 0),
                'izin' => $todayStats->get('izin', 0) + $todayStats->get('excused', 0),
                'sakit' => $todayStats->get('sick', 0),
                'alpha' => $todayStats->get('absent', 0),
                'terlambat' => $todayStats->get('late', 0),
                'pulang' => $todayStats->get('return', 0),
            ];

            // 2. Tren Bulanan (Last 6 Months Trend)
            $sixMonthsAgo = now()->subMonths(5)->startOfMonth()->format('Y-m-d');

            $monthlyData = Attendance::whereBetween('date', [$sixMonthsAgo, $today])
                ->selectRaw('DATE(date) as date_only, status, count(*) as count')
                ->groupBy('date_only', 'status')
                ->get();

            $trend = [];
            // We'll group by month for the 6-month chart
            $dataByMonth = $monthlyData->groupBy(function ($item) {
                return \Carbon\Carbon::parse($item->date_only)->format('Y-m');
            });

            for ($i = 5; $i >= 0; $i--) {
                $monthDate = now()->subMonths($i);
                $monthKey = $monthDate->format('Y-m');
                $monthRecords = $dataByMonth->get($monthKey, collect([]));

                $total = $monthRecords->sum('count');
                $present = $monthRecords->whereIn('status', ['present', 'late'])->sum('count');

                $trend[] = [
                    'month' => $monthDate->locale('id')->translatedFormat('M'),
                    'full_month' => $monthDate->locale('id')->translatedFormat('F Y'),
                    'percentage' => $total > 0 ? round(($present / $total) * 100) : 0,
                    'total_logs' => $total,
                    'present' => $present,
                    'absent' => $monthRecords->where('status', 'absent')->sum('count'),
                    'sick_excused' => $monthRecords->whereIn('status', ['sick', 'excused', 'izin'])->sum('count'),
                    'return' => $monthRecords->where('status', 'return')->sum('count'),
                ];
            }

            return [
                'date' => $today,
                'statistik' => $statistik,
                'trend' => $trend,
            ];
        });

        return response()->json($data);
    }

    /**
     * Get class dashboard summary for class officers (Pengurus Kelas)
     * Returns today's class stats and monthly trend for their class
     */
    public function classDashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = $user->studentProfile()->with('classRoom.major')->first();

        if (! $student || ! $student->class_id) {
            return response()->json(['message' => 'Class not found'], 404);
        }

        $classId = $student->class_id;
        $today = now()->format('Y-m-d');

        $data = Cache::remember("dashboard.class.{$classId}.{$today}", 600, function () use ($today, $classId) {
            // 1. Stats Hari Ini (Today's Stats for the Class)
            $todayStats = Attendance::whereDate('date', $today)
                ->whereHas('student', function ($query) use ($classId) {
                    $query->where('class_id', $classId);
                })
                ->selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status');

            $statistik = [
                'hadir' => $todayStats->get('present', 0),
                'izin' => $todayStats->get('izin', 0) + $todayStats->get('excused', 0),
                'sakit' => $todayStats->get('sick', 0),
                'alpha' => $todayStats->get('absent', 0),
                'terlambat' => $todayStats->get('late', 0),
                'pulang' => $todayStats->get('return', 0),
            ];

            // 2. Tren Bulanan (Last 6 Months Trend for the Class)
            $sixMonthsAgo = now()->subMonths(5)->startOfMonth()->format('Y-m-d');

            $monthlyData = Attendance::whereBetween('date', [$sixMonthsAgo, $today])
                ->whereHas('student', function ($query) use ($classId) {
                    $query->where('class_id', $classId);
                })
                ->selectRaw('DATE(date) as date_only, status, count(*) as count')
                ->groupBy('date_only', 'status')
                ->get();

            $trend = [];
            $dataByMonth = $monthlyData->groupBy(function ($item) {
                return \Carbon\Carbon::parse($item->date_only)->format('Y-m');
            });

            for ($i = 5; $i >= 0; $i--) {
                $monthDate = now()->subMonths($i);
                $monthKey = $monthDate->format('Y-m');
                $monthRecords = $dataByMonth->get($monthKey, collect([]));

                $trend[] = [
                    'month' => $monthDate->locale('id')->translatedFormat('M'),
                    'hadir' => $monthRecords->whereIn('status', ['present', 'late'])->sum('count'),
                    'sakit' => $monthRecords->where('status', 'sick')->sum('count'),
                    'izin' => $monthRecords->whereIn('status', ['izin', 'excused'])->sum('count'),
                    'alpha' => $monthRecords->where('status', 'absent')->sum('count'),
                    'terlambat' => $monthRecords->where('status', 'late')->sum('count'),
                    'pulang' => $monthRecords->where('status', 'return')->sum('count'),
                ];
            }

            return [
                'statistik' => $statistik,
                'trend' => $trend,
            ];
        });

        return response()->json([
            'date' => $today,
            'profile' => [
                'name' => $user->name,
                'kelas' => $student->classRoom?->name,
                'id' => $student->nis,
                'gender' => $student->gender == 'L' ? 'laki-laki' : 'perempuan',
                'class_id' => $student->class_id,
            ],
            'dailyStats' => $data['statistik'],
            'monthlyTrend' => $data['trend'],
        ]);
    }

    /**
     * Helper method to get status label in Indonesian
     */
    private function getStatusLabel(?string $status): string
    {
        return match ($status) {
            'present' => 'Hadir Tepat Waktu',
            'late' => 'Hadir Terlambat',
            'sick' => 'Sakit',
            'excused', 'izin' => 'Izin',
            'absent' => 'Alpha',
            'dinas' => 'Dinas',
            'return' => 'Pulang',
            default => 'Belum Absen',
        };
    }
}
