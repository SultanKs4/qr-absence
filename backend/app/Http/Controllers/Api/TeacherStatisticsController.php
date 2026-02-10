<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Schedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class TeacherStatisticsController extends Controller
{
    /**
     * Get monthly attendance statistics for the authenticated teacher.
     */
    public function monthlySummary(Request $request): JsonResponse
    {
        $user = $request->user();
        $teacher = $user->teacherProfile;

        if (! $teacher) {
            return response()->json(['message' => 'Teacher profile not found'], 404);
        }

        $month = $request->input('month', now()->month);
        $year = $request->input('year', now()->year);

        // Calculate statistics based on Attendance model
        // Assuming 'attendee_type' = 'teacher' implies teaching attendance
        $stats = Attendance::where('teacher_id', $teacher->id)
            ->where('attendee_type', 'teacher')
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status');

        $present = $stats['present'] ?? 0;
        $late = $stats['late'] ?? 0;
        $sick = $stats['sick'] ?? 0;
        $permit = $stats['permit'] ?? 0; // or 'excused'
        $absent = $stats['absent'] ?? 0;

        // Calculate total teaching hours (based on schedules attended)
        // This is an approximation. For exact hours, we'd need duration from Schedule.
        // Let's assume 1 JP = 45 mins, or just count sessions for now.
        $totalSessions = $present + $late + $sick + $permit + $absent;

        return response()->json([
            'month' => $month,
            'year' => $year,
            'summary' => [
                'hadir' => $present,
                'terlambat' => $late,
                'sakit' => $sick,
                'izin' => $permit,
                'alpha' => $absent,
                'total_sessions' => $totalSessions,
            ],
            // Mock chart data for now, real data would require daily aggregation
            'chart_data' => $this->getDailyChartData($teacher->id, $month, $year),
        ]);
    }

    private function getDailyChartData($teacherId, $month, $year): array
    {
        $daysInMonth = Carbon::createFromDate($year, $month, 1)->daysInMonth;
        $data = [];

        // Get actual attendance counts per day
        $dailyCounts = Attendance::where('teacher_id', $teacherId)
            ->where('attendee_type', 'teacher')
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->selectRaw('DAY(date) as day, status')
            ->get()
            ->groupBy('day');

        for ($day = 1; $day <= $daysInMonth; $day++) {
            $dayData = $dailyCounts->get($day);
            $status = 'libur'; // Default

            if ($dayData) {
                // Determine dominant status for the day (simplification)
                // If any session is present, mark as present? Or show detailed?
                // Mobile app likely expects a single status code or count.
                // Let's return just 'hadir' count for the line chart usually.
                $status = 'hadir';
            }

            // For simple line chart (e.g. 1=Hadir, 0=Absen)
            $value = $dayData ? 1 : 0;

            $data[] = [
                'day' => $day,
                'status' => $dayData ? 'hadir' : 'alpha', // Simplified for the chart
            ];
        }

        return $data;
    }
}
