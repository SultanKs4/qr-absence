<?php

namespace Database\Seeders;

use App\Models\Classes;
use App\Models\Major;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ClassOfficerSeeder extends Seeder
{
    public function run(): void
    {
        // Pastikan ada kelas
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

        // Buat user pengurus kelas (ketua kelas)
        $user = User::updateOrCreate(
            ['username' => 'pengurus1'],
            [
                'name' => 'Abyl Gustian',
                'email' => 'pengurus1@example.com',
                'password' => Hash::make('password123'),
                'user_type' => 'student',
                'active' => true,
            ]
        );

        StudentProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'nisn' => '0079292238',
                'nis' => '2024999',
                'gender' => 'L',
                'address' => 'Jl. Ular Sakti',
                'class_id' => $class->id,
                'is_class_officer' => true, // Tandai sebagai pengurus kelas
            ]
        );
    }
}
