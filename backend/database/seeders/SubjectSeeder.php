<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $subjects = [
            ['code' => 'PAI', 'name' => 'Pendidikan Agama dan Budi Pekerti'],
            ['code' => 'PKN', 'name' => 'Pendidikan Pancasila dan Kewarganegaraan'],
            ['code' => 'BIN', 'name' => 'Bahasa Indonesia'],
            ['code' => 'BIG', 'name' => 'Bahasa Inggris'],
            ['code' => 'MTK', 'name' => 'Matematika'],
            ['code' => 'SI', 'name' => 'Sejarah Indonesia'],
            ['code' => 'OR', 'name' => 'Pendidikan Jasmani, Olahraga, dan Kesehatan'],
            ['code' => 'SB', 'name' => 'Seni Budaya'],
            ['code' => 'INF', 'name' => 'Informatika'],
            ['code' => 'IPAS', 'name' => 'Projek Ilmu Pengetahuan Alam dan Sosial'],
            ['code' => 'DPK', 'name' => 'Dasar-dasar Program Kejurusan'],
            ['code' => 'MPKK', 'name' => 'Projek Kreatif dan Kewirausahaan'],
            ['code' => 'B.JAWA', 'name' => 'Muatan Lokal / Bahasa Daerah'],
            ['code' => 'BK', 'name' => 'Bimbingan Konseling'],
            ['code' => 'MPP', 'name' => 'Projek Penguatan Profil Pelajar Pancasila'],
            ['code' => 'PKDK', 'name' => 'Projek Penguatan Profil Pelajar Pancasila'],
        ];

        foreach ($subjects as $subject) {
            Subject::updateOrCreate(
                ['code' => $subject['code']],
                $subject
            );
        }
    }
}
