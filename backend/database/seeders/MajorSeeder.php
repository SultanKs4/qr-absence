<?php

namespace Database\Seeders;

use App\Models\Major;
use Illuminate\Database\Seeder;

class MajorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $majors = [
            [
                'code' => 'RPL',
                'name' => 'Rekayasa Perangkat Lunak',
                'category' => 'Teknologi Informasi',
            ],
            [
                'code' => 'MT',
                'name' => 'Mekatronika',
                'category' => 'Teknik Mekatronika',
            ],
            [
                'code' => 'ANM',
                'name' => 'Animasi',
                'category' => 'Seni dan Industri Kreatif',
            ],
            [
                'code' => 'BC',
                'name' => 'Broadcasting',
                'category' => 'Seni dan Industri Kreatif',
            ],
            [
                'code' => 'TEI',
                'name' => 'Elektronika Industri',
                'category' => 'Teknik Elektro',
            ],
            [
                'code' => 'TKJ',
                'name' => 'Teknik Komputer dan Jaringan',
                'category' => 'Teknologi Informasi',
            ],
            [
                'code' => 'AV',
                'name' => 'Audio Video',
                'category' => 'Teknik Elektro',
            ],
            [
                'code' => 'DKV',
                'name' => 'Desain Komunikasi Visual',
                'category' => 'Seni dan Industri Kreatif',
            ],
        ];

        foreach ($majors as $major) {
            Major::updateOrCreate(
                ['code' => $major['code']],
                $major
            );
        }
    }
}
