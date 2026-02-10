<?php

namespace Database\Seeders;

use App\Models\Classes;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ExcelStudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $filePath = '/home/deva/ta/qr-absence/Data NISN RPL 24225.xlsx';

        if (! file_exists($filePath)) {
            $this->command->error("File not found: {$filePath}");

            return;
        }

        try {
            $spreadsheet = IOFactory::load($filePath);
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            // Structure observed:
            // index 0: NPSN...
            // index 1: empty
            // index 2: Headers (NO, NAMA SISWA, NISN, KELAS)
            // index 3+: Data

            $count = 0;
            foreach ($rows as $index => $row) {
                if ($index < 3) {
                    continue;
                } // Skip headers and metadata

                $name = $row[1];
                $nisn = $row[2];
                $classLabel = $row[3]; // e.g. "XI RPL 1"

                if (empty($name) || empty($nisn)) {
                    continue;
                }

                // Normalize NISN
                $nisn = (string) $nisn;

                // Parse class
                // "XI RPL 1" -> grade: XI, label: RPL 1
                $parts = explode(' ', $classLabel);
                $grade = $parts[0] ?? '';
                $label = isset($parts[1]) && isset($parts[2]) ? $parts[1].' '.$parts[2] : '';

                $class = Classes::where('grade', $grade)
                    ->where('label', $label)
                    ->first();

                if (! $class) {
                    $this->command->warn("Class not found for student {$name}: {$classLabel}");

                    continue;
                }

                // Check if student profile already exists by NISN
                $studentProfile = StudentProfile::where('nisn', $nisn)->first();

                if ($studentProfile) {
                    $user = $studentProfile->user;
                    $user->update([
                        'name' => $name,
                        'user_type' => 'student',
                        'active' => true,
                    ]);

                    $studentProfile->update([
                        'nis' => $nisn,
                        'class_id' => $class->id,
                    ]);
                } else {
                    // Create NEW User
                    $username = strtolower(str_replace(' ', '', $name)).substr($nisn, -4);

                    // Avoid username collision for genuinely new users
                    $i = 1;
                    $originalUsername = $username;
                    while (User::where('username', $username)->exists()) {
                        $username = $originalUsername.$i;
                        $i++;
                    }

                    $user = User::create([
                        'name' => $name,
                        'username' => $username,
                        'password' => Hash::make('password123'),
                        'user_type' => 'student',
                        'active' => true,
                    ]);

                    // Create Student Profile
                    $user->studentProfile()->create([
                        'nisn' => $nisn,
                        'nis' => $nisn,
                        'gender' => 'L',
                        'address' => 'Alamat belum diatur',
                        'class_id' => $class->id,
                        'is_class_officer' => false,
                    ]);
                }

                $count++;
            }

            $this->command->info("Successfully processed {$count} students from Excel.");
        } catch (\Exception $e) {
            $this->command->error('Error seeding from Excel: '.$e->getMessage());
        }
    }
}
