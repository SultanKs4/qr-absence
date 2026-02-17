<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SchoolYearSeeder::class,
            SemesterSeeder::class,
            SubjectSeeder::class,
            // MajorSeeder, ClassSeeder handled by Comprehensive
            ComprehensiveSeeder::class, 
            TeacherSeeder::class, // Run after to update with real names
            NewScheduleSeeder::class,
            AdminSeeder::class,
            WakaSeeder::class,
            HomeroomTeacherSeeder::class,
            StudentSeeder::class,
            ClassOfficerSeeder::class,
            AttendanceSeeder::class,
        ]);
    }
}
