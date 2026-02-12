<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Classes;
use App\Models\Schedule;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DashboardMockSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Setup Classes if empty
        if (Classes::count() < 2) {
            $rpl = \App\Models\Major::where('code', 'RPL')->first();
            $tkj = \App\Models\Major::where('code', 'TKJ')->first();

            Classes::create(['grade' => 'XII', 'label' => 'RPL 1', 'major_id' => $rpl?->id]);
            Classes::create(['grade' => 'XII', 'label' => 'RPL 2', 'major_id' => $rpl?->id]);
        }

        $classes = Classes::all();
        $subjects = Subject::limit(5)->get();

        // 2. Setup Teachers
        if (TeacherProfile::count() < 3) {
            $teacherNames = ['ALIFAH DIANTEBES AINDRA, S.Pd', 'ZULKIFLI ABDILLAH, S.Kom', 'RR. HENNING GRATYANIS ANGGRAENI, S.Pd    '];
            foreach ($teacherNames as $i => $name) {
                $user = User::create([
                    'name' => $name,
                    'username' => 'teacher'.($i + 2),
                    'email' => 'teacher'.($i + 2).'@school.id',
                    'password' => Hash::make('password123'),
                    'user_type' => 'teacher',
                ]);
                $user->teacherProfile()->create([
                    'nip' => 'NIP-000'.($i + 2),
                    'subject' => $subjects->random()->name,
                ]);
            }
        }
        $teachers = TeacherProfile::all();

        // 3. Setup Students (at least 15 per class)
        foreach ($classes as $class) {
            $existingCount = StudentProfile::where('class_id', $class->id)->count();
            if ($existingCount < 15) {
                for ($i = $existingCount; $i < 15; $i++) {
                    $user = User::create([
                        'name' => fake()->name(),
                        'username' => strtolower(str_replace(' ', '', fake()->name())).rand(100, 999),
                        'email' => fake()->unique()->safeEmail(),
                        'password' => Hash::make('password123'),
                        'user_type' => 'student',
                    ]);
                    $user->studentProfile()->create([
                        'nisn' => fake()->unique()->numerify('##########'),
                        'nis' => fake()->unique()->numerify('#####'),
                        'gender' => rand(0, 1) ? 'L' : 'P',
                        'address' => fake()->address(),
                        'class_id' => $class->id,
                    ]);
                }
            }
        }

        // 4. Setup Schedules (Mon - Sat)
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        foreach ($classes as $class) {
            foreach ($days as $day) {
                // 2 sessions per day
                $teacher1 = $teachers->random();
                $sub1 = $subjects->random();
                Schedule::updateOrCreate(
                    ['class_id' => $class->id, 'day' => $day, 'start_time' => '07:00:00'],
                    [
                        'end_time' => '09:00:00',
                        'title' => $sub1->name,
                        'subject_name' => $sub1->name,
                        'teacher_id' => $teacher1->id,
                        'semester' => 2,
                        'year' => 2026,
                    ]
                );

                $teacher2 = $teachers->random();
                $sub2 = $subjects->random();
                Schedule::updateOrCreate(
                    ['class_id' => $class->id, 'day' => $day, 'start_time' => '09:30:00'],
                    [
                        'end_time' => '11:30:00',
                        'title' => $sub2->name,
                        'subject_name' => $sub2->name,
                        'teacher_id' => $teacher2->id,
                        'semester' => 2,
                        'year' => 2026,
                    ]
                );
            }
        }

        // 5. Setup Attendance History (Past 30 days)
        $this->command->info('Generating attendance history...');
        $schedules = Schedule::all();
        $startDate = now()->subDays(30);
        $endDate = now();

        $attendances = [];

        for ($date = clone $startDate; $date <= $endDate; $date->addDay()) {
            if ($date->isSunday()) {
                continue;
            }

            $dayName = $date->format('l');
            $daySchedules = $schedules->where('day', $dayName);

            foreach ($daySchedules as $schedule) {
                $students = StudentProfile::where('class_id', $schedule->class_id)->get();

                foreach ($students as $student) {
                    // Random status weighted towards 'present'
                    $rand = rand(1, 100);
                    if ($rand <= 85) {
                        $status = 'present';
                    } elseif ($rand <= 92) {
                        $status = 'late';
                    } elseif ($rand <= 95) {
                        $status = 'sick';
                    } elseif ($rand <= 98) {
                        $status = 'excused';
                    } else {
                        $status = 'absent';
                    }

                    $checkIn = null;
                    if ($status === 'present' || $status === 'late') {
                        $baseTime = Carbon::parse($schedule->start_time);
                        if ($status === 'present') {
                            $checkIn = $date->copy()->setTime($baseTime->hour, $baseTime->minute)->addMinutes(rand(0, 14));
                        } else {
                            $checkIn = $date->copy()->setTime($baseTime->hour, $baseTime->minute)->addMinutes(rand(16, 45));
                        }
                    }

                    $attendances[] = [
                        'attendee_type' => 'student',
                        'date' => $date->toDateString(),
                        'student_id' => $student->id,
                        'schedule_id' => $schedule->id,
                        'status' => $status,
                        'checked_in_at' => $checkIn,
                        'source' => 'mock',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    // Chunk insert to avoid memory issues
                    if (count($attendances) >= 500) {
                        Attendance::insert($attendances);
                        $attendances = [];
                    }
                }
            }
        }

        if (count($attendances) > 0) {
            Attendance::insert($attendances);
        }

        $this->command->info('Mock data seeded successfully!');
    }
}
