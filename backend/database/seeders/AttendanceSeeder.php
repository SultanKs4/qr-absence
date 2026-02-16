<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\ClassSchedule;
use App\Models\StudentProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class AttendanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all students
        $students = StudentProfile::all();

        if ($students->isEmpty()) {
            $this->command->info('No students found. Skipping AttendanceSeeder.');
            return;
        }

        // Get schedules for the last 30 days
        // We need to simulate attendance for past days based on schedules.
        // Assuming schedules are recurring weekly.
        
        $startDate = Carbon::now()->subDays(30);
        $endDate = Carbon::now();

        foreach ($students as $student) {
            // Find ACTIVE ClassSchedule for this student's class
            $classSchedule = ClassSchedule::where('class_id', $student->class_id)
                ->where('is_active', true)
                ->with('dailySchedules.scheduleItems')
                ->first();

            if (! $classSchedule) {
                continue;
            }

            // Iterate through each day from start to end date
            $currentDate = $startDate->copy();
            while ($currentDate <= $endDate) {
                // Skip weekends
                if ($currentDate->isWeekend()) {
                    $currentDate->addDay();
                    continue;
                }

                $dayEnglish = $currentDate->format('l'); // Monday, Tuesday, etc.
                
                // Find daily schedule for this day
                // USE strict comparison for day name
                $dailySchedule = $classSchedule->dailySchedules->filter(function ($ds) use ($dayEnglish) {
                    return strtolower($ds->day) === strtolower($dayEnglish);
                })->first();

                if (! $dailySchedule) {
                     $currentDate->addDay();
                     continue;
                }
                
                if ($dailySchedule->scheduleItems->isEmpty()) {
                    // No items for this day
                }

                foreach ($dailySchedule->scheduleItems as $item) {
                    // Randomly assign status
                    // 80% Present, 5% Late, 5% Sick, 5% Permission, 5% Absent
                    $rand = rand(1, 100);
                    $status = 'present';
                    $reason = null;

                    if ($rand > 80 && $rand <= 85) {
                        $status = 'late';
                    } elseif ($rand > 85 && $rand <= 90) {
                        $status = 'sick';
                        $reason = 'Sakit demam';
                    } elseif ($rand > 90 && $rand <= 95) {
                        $status = 'izin';
                        $reason = 'Acara keluarga';
                    } elseif ($rand > 95) {
                        $status = 'absent';
                    }

                    // Create attendance record, ignoring duplicates
                    try {
                        Attendance::create([
                            'attendee_type' => 'student',
                            'student_id' => $student->id,
                            'schedule_id' => $item->id, // References schedule_items.id
                            'date' => $currentDate->toDateString(),
                            'status' => $status,
                            'checked_in_at' => $status === 'present' || $status === 'late' 
                                ? $currentDate->copy()->setTimeFromTimeString($item->start_time)->addMinutes(rand(0, 30)) 
                                : null,
                            'source' => 'seeder',
                            'reason' => $reason,
                        ]);
                    } catch (\Illuminate\Database\QueryException $e) {
                         // Ignore duplicate entry errors
                        continue;
                    }
                }

                $currentDate->addDay();
            }
        }
    }
}
