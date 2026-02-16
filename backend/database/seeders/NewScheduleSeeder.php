<?php

namespace Database\Seeders;

use App\Models\Classes;
use App\Models\ClassSchedule;
use App\Models\Subject;
use App\Models\TeacherProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class NewScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find a class to seed
        $class = Classes::first();
        if (!$class) {
            $this->command->warn('No classes found. Skipping schedule seeding.');
            return;
        }

        // Create Header
        $schedule = ClassSchedule::create([
            'class_id' => $class->id,
            'semester' => 1,
            'year' => 2025,
            'is_active' => true,
        ]);

        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        $subjects = Subject::all();
        $teachers = TeacherProfile::all();

        if ($subjects->isEmpty() || $teachers->isEmpty()) {
            $this->command->warn('No subjects or teachers found. Skipping item seeding.');
            return;
        }

        foreach ($days as $day) {
            $daily = $schedule->dailySchedules()->create(['day' => $day]);

            // Add 3-4 items per day
            $startTime = Carbon::createFromTime(7, 0);
            
            for ($i = 0; $i < 4; $i++) {
                $endTime = $startTime->copy()->addMinutes(45);
                
                $daily->scheduleItems()->create([
                    'subject_id' => $subjects->random()->id,
                    'teacher_id' => $teachers->random()->id,
                    'start_time' => $startTime->format('H:i'),
                    'end_time' => $endTime->format('H:i'),
                    'room' => 'R. ' . $class->grade,
                    'keterangan' => 'Jam ke-' . ($i + 1),
                ]);

                $startTime = $endTime;
            }
        }

        $this->command->info("Created new schedule structure for class: {$class->grade} {$class->label}");
    }
}
