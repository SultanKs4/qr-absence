<?php

namespace Database\Seeders;

use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TeacherSeeder extends Seeder
{
    public function run(): void
    {
        // Daftar Guru diambil dari Jadwal XII RPL 1 & 2
        $teachers = [
            [
                'name' => 'DEVI ARVENI, S.Pd., Gr.',
                'jabatan' => 'Wali Kelas',
                'subject' => 'Bahasa Indonesia',
                'grade' => 'XII',
                'major' => 'RPL',
            ],
            [
                'name' => 'ZULKIFLI ABDILLAH, S.Kom',
                'jabatan' => 'Kapro',
                'konsentrasi_keahlian' => 'Rekayasa Perangkat Lunak',
                'subject' => 'Produktif RPL',
            ],
            [
                'name' => 'ALIFAH DIANTEBES AINDRA, S.Pd',
                'jabatan' => 'Guru',
                'subject' => 'MPKK',
            ],
            [
                'name' => 'SAMAODIN, SAP',
                'jabatan' => 'Guru',
                'subject' => 'PPKN',
            ],
            [
                'name' => 'FAJAR NINGTYAS, S.Pd',
                'jabatan' => 'Guru',
                'subject' => 'Bahasa Inggris',
            ],
            [
                'name' => 'WIWIN WINANGSIH, S.Pd',
                'jabatan' => 'Waka',
                'bidang' => 'Waka Kurikulum',
                'subject' => 'Matematika',
            ],
            [
                'name' => 'MOCH. BACHRUDIN, S.Pd',
                'jabatan' => 'Guru',
                'subject' => 'Bahasa Jawa',
            ],
            [
                'name' => 'EWIT IRNIYAH, S.Pd',
                'jabatan' => 'Guru',
                'subject' => 'MPP',
            ],
            [
                'name' => 'ADHI BAGUS PERMANA, S.Pd',
                'jabatan' => 'Guru',
                'subject' => 'PKDK',
            ],
            [
                'name' => 'ROUDHOTUL HUSNA YANIF, S.Psi',
                'jabatan' => 'Guru',
                'subject' => 'BK',
            ],
        ];

        foreach ($teachers as $index => $teacherData) {
            $username = 'guru' . ($index + 1);
            $email = $username . '@sekolah.sch.id';

            $user = User::updateOrCreate(
                ['username' => $username],
                [
                    'name' => $teacherData['name'],
                    'email' => $email,
                    'password' => Hash::make('password123'),
                    'user_type' => 'teacher',
                    'active' => true,
                ]
            );

            TeacherProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'nip' => 'NIP-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT),
                    'jabatan' => $teacherData['jabatan'] ?? 'Guru',
                    'bidang' => $teacherData['bidang'] ?? null,
                    'konsentrasi_keahlian' => $teacherData['konsentrasi_keahlian'] ?? null,
                    'subject' => $teacherData['subject'] ?? null,
                ]
            );
        }
    }
}