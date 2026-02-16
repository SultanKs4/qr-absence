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
                'name' => 'ALIFAH DIANTEBES AINDRA, S.Pd',
                'subject' => 'Produktif RPL', // MPKK
            ],
            [
                'name' => 'SAMAODIN, SAP',
                'subject' => 'Normatif', // PKN
            ],
            [
                'name' => 'FAJAR NINGTYAS, S.Pd',
                'subject' => 'Adaptif/Produktif', // B.Inggris & PKDK
            ],
            [
                'name' => 'AANG NOERARIES WAHYUDIPASA, S.Si',
                'subject' => 'Produktif RPL', // MPP & MPKK
            ],
            [
                'name' => 'RR. HENNING GRATYANIS ANGGRAENI, S.Pd',
                'subject' => 'Produktif RPL', // MPKK
            ],
            [
                'name' => 'ZULKIFLI ABDILLAH, S.Kom',
                'subject' => 'Produktif RPL', // MPKK
            ],
            [
                'name' => 'WIWIN WINANGSIH, S.Pd',
                'subject' => 'Adaptif', // Matematika
            ],
            [
                'name' => 'MOCH. BACHRUDIN, S.Pd',
                'subject' => 'Muatan Lokal', // B. Jawa
            ],
            [
                'name' => 'EWIT IRNIYAH, S.Pd',
                'subject' => 'Produktif RPL', // MPP
            ],
            [
                'name' => 'ADHI BAGUS PERMANA, S.Pd',
                'subject' => 'Produktif RPL', // PKDK
            ],
            [
                'name' => 'ROUDHOTUL HUSNA YANIF, S.Psi',
                'subject' => 'Bimbingan Konseling', // BK
            ],
            [
                'name' => 'DEVI ARVENI, S.Pd., Gr.',
                'subject' => 'Normatif', // B. Indonesia
            ],
            [
                'name' => 'AMIN MACHMUDI, S.Pd',
                'subject' => 'Normatif', // B. Indonesia
            ],
            [
                'name' => 'TUTIK FARIDA, S.Pd',
                'subject' => 'Muatan Lokal', // B. Jawa
            ],
        ];

        foreach ($teachers as $index => $teacherData) {
            // Membuat Username otomatis (guru1, guru2, dst)
            $username = 'guru' . ($index + 1);
            $email = $username . '@sekolah.sch.id'; // Email dummy

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
                    // Generate NIP dummy: NIP-0001, NIP-0002, dst
                    'nip' => 'NIP-' . str_pad($index + 1, 4, '0', STR_PAD_LEFT),
                    // 'subject' => $teacherData['subject'],
                ]
            );
        }
    }
}