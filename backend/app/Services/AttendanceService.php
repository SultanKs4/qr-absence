<?php

namespace App\Services;

use App\Models\StudentProfile;
use App\Models\StudentLeavePermission;
use Illuminate\Support\Carbon;

class AttendanceService
{
    public function createFullDayAttendance(StudentProfile $student, string $status, string $date, ?string $reason): void
    {
        $dayName = Carbon::parse($date)->format('l');

        $classSchedule = \App\Models\ClassSchedule::where('class_id', $student->class_id)
            ->where('is_active', true)
            ->first();

        if (! $classSchedule) {
            return;
        }

        $dailySchedule = \App\Models\DailySchedule::where('class_schedule_id', $classSchedule->id)
            ->where('day', $dayName)
            ->first();

        if (! $dailySchedule) {
            return;
        }

        $items = \App\Models\ScheduleItem::where('daily_schedule_id', $dailySchedule->id)->get();

        foreach ($items as $item) {
            \App\Models\Attendance::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'schedule_id' => $item->id, // Use schedule_item_id or just id? Attendance model usually links to ScheduleItem via schedule_id
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

    public function markRemainingAsIzin(StudentProfile $student, string $date, string $fromTime, string $reason): void
    {
        $dayName = Carbon::parse($date)->format('l');

        $classSchedule = \App\Models\ClassSchedule::where('class_id', $student->class_id)
            ->where('is_active', true)
            ->first();

        if (! $classSchedule) {
            return;
        }

        $dailySchedule = \App\Models\DailySchedule::where('class_schedule_id', $classSchedule->id)
            ->where('day', $dayName)
            ->first();

        if (! $dailySchedule) {
            return;
        }

        $items = \App\Models\ScheduleItem::where('daily_schedule_id', $dailySchedule->id)
            ->where('start_time', '>=', $fromTime)
            ->get();

        foreach ($items as $item) {
            \App\Models\Attendance::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'schedule_id' => $item->id,
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

    public function getTypeLabel(string $type): string
    {
        return match ($type) {
            'sakit' => 'Sakit',
            'izin' => 'Izin',
            'izin_pulang' => 'Izin Pulang',
            'dispensasi' => 'Dispensasi',
            'sick' => 'Sakit', // Map AbsenceRequest types
            'permit' => 'Izin',
            'dispensation' => 'Dispensasi',
            default => $type,
        };
    }
}
