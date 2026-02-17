<?php

namespace Database\Seeders;

use App\Models\Classes;
use App\Models\Major;
use App\Models\Schedule;
use App\Models\StudentProfile;
use App\Models\TeacherProfile;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ManualAttendanceSeeder extends Seeder
{
    public function run()
    {
        // 1. Ensure Teacher exists
        $teacherUser = User::where('email', 'guru@sekolah.id')->first();
        if (! $teacherUser) {
            $teacherUser = User::factory()->create([
                'name' => 'Pak Harris',
                'email' => 'guru@sekolah.id',
                'password' => bcrypt('password'),
                'user_type' => 'teacher',
            ]);
            TeacherProfile::factory()->create(['user_id' => $teacherUser->id]);
        }
        $teacherProfile = $teacherUser->teacherProfile;
        if (! $teacherProfile) {
            $teacherProfile = TeacherProfile::factory()->create(['user_id' => $teacherUser->id]);
        }

        // 2. Ensure Major exists
        $major = Major::firstOrCreate(['code' => 'RPL'], ['name' => 'Rekayasa Perangkat Lunak', 'category' => 'Teknologi']);

        // 3. Ensure Class exists
        // Looking for existing class or creating new one
        $class = Classes::where('grade', '12')->where('label', 'Test Manual')->first();
        if (! $class) {
            $class = Classes::create([
                'grade' => '12',
                'label' => 'Test Manual, XI RPL 1',
                'major_id' => $major->id,
            ]);
        }

        // 4. Ensure Students exist
        if ($class->students()->count() < 5) {
            User::factory()->count(5)->create(['user_type' => 'student'])
                ->each(function ($user) use ($class) {
                    StudentProfile::factory()->create([
                        'user_id' => $user->id,
                        'class_id' => $class->id,
                    ]);
                });
        }

        // 5. Ensure Schedule exists for TODAY
        $dayName = strtolower(Carbon::now()->format('l'));

        $schedule = Schedule::where('teacher_id', $teacherProfile->id)
            ->where('class_id', $class->id)
            ->where('day', $dayName)
            ->first();

        if (! $schedule) {
            Schedule::create([
                'teacher_id' => $teacherProfile->id,
                'class_id' => $class->id,
                'subject_name' => 'Matematika',
                'title' => 'Pelajaran Hari Ini',
                'day' => $dayName,
                'start_time' => '07:00:00',
                'end_time' => '15:00:00',
                'year' => '2025/2026',
                'semester' => 'ganjil',
                'room' => 'Lab 1',
            ]);
        }

        $this->command->info('Seeding complete for Manual Attendance.');
        $this->command->info('Teacher Email: guru@sekolah.id');
        $this->command->info('Teacher Password: password');
        $this->command->info('Class: 12 Test Manual');
        $this->command->info("Day: $dayName");
    }
}
