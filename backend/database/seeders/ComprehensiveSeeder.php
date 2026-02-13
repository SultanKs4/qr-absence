<?php

namespace Database\Seeders;

use App\Models\Classes;
use App\Models\Major;
use App\Models\StudentProfile;
use App\Models\TeacherProfile;
use App\Models\User;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ComprehensiveSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('id_ID');

        // 1. Create Majors
        $this->call(MajorSeeder::class);
        $majors = Major::all();

        // 2. Create Teachers (Pool of 50 teachers)
        $teachers = [];
        for ($i = 1; $i <= 50; $i++) {
            $user = User::firstOrCreate(
                ['username' => "guru{$i}"],
                [
                    'name' => $faker->name,
                    'email' => "guru{$i}@example.com",
                    'password' => Hash::make('password123'),
                    'user_type' => 'teacher',
                    'active' => true,
                ]
            );

            // Assign a subject randomly from categories
            $subjects = ['Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Sejarah', 'PKN', 'Agama', 'PJOK', 'MPKK', 'DPK', 'PKDK', '.'];

            $teacher = TeacherProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'nip' => $faker->unique()->numerify('19##########'),
                    'subject' => $faker->randomElement($subjects),
                ]
            );
            $teachers[] = $teacher;
        }

        // 3. Create Classes & students for each Major
        $grades = ['10', '11', '12'];
        $labels = ['1', '2']; // 2 classes per grade per major

        $teacherIndex = 0;

        foreach ($majors as $major) {
            foreach ($grades as $grade) {
                foreach ($labels as $label) {

                    // Format class name like "X RPL 1"
                    $gradeRoman = match ($grade) {
                        '10' => 'X',
                        '11' => 'XI',
                        '12' => 'XII',
                        default => $grade
                    };
                    $className = "{$gradeRoman} {$major->code} {$label}";

                    // Create Class
                    $class = Classes::firstOrCreate(
                        [
                            'grade' => $grade,
                            'label' => $className,
                        ],
                        [
                            'major_id' => $major->id,
                        ]
                    );

                    // Assign Homeroom Teacher (if available)
                    if ($teacherIndex < count($teachers)) {
                        $teacher = $teachers[$teacherIndex];
                        $teacher->update(['homeroom_class_id' => $class->id]);
                        $teacherIndex++;
                    }

                    // 4. Create Students for this Class (5 students per class)
                    for ($s = 1; $s <= 5; $s++) {
                        $nisn = $faker->unique()->numerify('00#######');
                        $gender = $faker->randomElement(['L', 'P']);
                        $name = $faker->firstName($gender == 'L' ? 'male' : 'female').' '.$faker->lastName;

                        $studentUser = User::create([
                            'username' => $nisn,
                            'name' => strtoupper($name),
                            'email' => "{$nisn}@student.example.com", // Unique email based on NISN
                            'password' => Hash::make('password123'),
                            'user_type' => 'student',
                            'active' => true,
                        ]);

                        StudentProfile::create([
                            'user_id' => $studentUser->id,
                            'nisn' => $nisn,
                            'nis' => '20'.$nisn,
                            'gender' => $gender,
                            'address' => $faker->address,
                            'class_id' => $class->id,
                        ]);
                    }
                }
            }
        }

        $this->command->info('Comprehensive Seeder finished: Majors, Teachers, Classes, and Students created.');
    }
}
