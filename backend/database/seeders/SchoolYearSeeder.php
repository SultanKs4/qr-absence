<?php

namespace Database\Seeders;

use App\Models\SchoolYear;
use Illuminate\Database\Seeder;

class SchoolYearSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        SchoolYear::updateOrCreate(
            ['name' => '2024/2025'],
            [
                'start_year' => 2024,
                'end_year' => 2025,
                'active' => false,
            ]
        );

        SchoolYear::updateOrCreate(
            ['name' => '2025/2026'],
            [
                'start_year' => 2025,
                'end_year' => 2026,
                'active' => true,
            ]
        );
    }
}
