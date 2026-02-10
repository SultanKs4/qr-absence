<?php

namespace Database\Seeders;

use App\Models\Classes;
use App\Models\Major;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        // Pastikan ada kelas dan jurusan
        $major = Major::firstOrCreate(
            ['code' => 'RPL'],
            ['name' => 'Rekayasa Perangkat Lunak']
        );

        $class = Classes::firstOrCreate(
            [
                'grade' => '12',
                'label' => 'RPL 1',
            ],
            [
                'major_id' => $major->id,
            ]
        );

        // Siswa 1
        $user1 = User::updateOrCreate(
            ['username' => 'siswa1'],
            [
                'name' => 'Ahmad Rizki',
                'email' => 'siswa1@example.com',
                'password' => Hash::make('password123'),
                'user_type' => 'student',
                'active' => true,
            ]
        );

        StudentProfile::updateOrCreate(
            ['user_id' => $user1->id],
            [
                'nisn' => '0024001',
                'nis' => '2024001',
                'gender' => 'L',
                'address' => 'Jl. Contoh No. 1',
                'class_id' => $class->id,
            ]
        );

        // Siswa 2
        $user2 = User::updateOrCreate(
            ['username' => 'siswa2'],
            [
                'name' => 'Siti Nurhaliza',
                'email' => 'siswa2@example.com',
                'password' => Hash::make('password123'),
                'user_type' => 'student',
                'active' => true,
            ]
        );

        StudentProfile::updateOrCreate(
            ['user_id' => $user2->id],
            [
                'nisn' => '0024002',
                'nis' => '2024002',
                'gender' => 'P',
                'address' => 'Jl. Contoh No. 2',
                'class_id' => $class->id,
            ]
        );

        // Siswa 3
        $user3 = User::updateOrCreate(
            ['username' => 'siswa3'],
            [
                'name' => 'Budi Santoso',
                'email' => 'siswa3@example.com',
                'password' => Hash::make('password123'),
                'user_type' => 'student',
                'active' => true,
            ]
        );

        StudentProfile::updateOrCreate(
            ['user_id' => $user3->id],
            [
                'nisn' => '0024003',
                'nis' => '2024003',
                'gender' => 'L',
                'address' => 'Jl. Contoh No. 3',
                'class_id' => $class->id,
            ]
        );
    }
}
