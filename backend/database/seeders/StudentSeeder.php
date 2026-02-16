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
        // 1. Pastikan Jurusan RPL ada
        $major = Major::firstOrCreate(
            ['code' => 'RPL'],
            ['name' => 'Rekayasa Perangkat Lunak']
        );

        // 2. Pastikan Kelas XII RPL 1 dan XII RPL 2 ada
        $class1 = Classes::firstOrCreate(
            [
                'grade' => '12',
                'label' => 'XII RPL 1',

            ],
            [
                'major_id' => $major->id,
            ]
        );

        $class2 = Classes::firstOrCreate(
            [
                'grade' => '12',
                'label' => 'XII RPL 2',
            ],
            [
                'major_id' => $major->id,
            ]
        );

        // 3. Data Siswa, gabungan dari rpl 1 dan rpl 2
        $students = [
            ['no' => 1, 'nama' => 'ABRORY AKBAR AL BATAMI', 'nisn' => '3078207819', 'kelas' => 'XII RPL 1'],
            ['no' => 2, 'nama' => 'AFIF FIRMANSYAH', 'nisn' => '0086659776', 'kelas' => 'XII RPL 1'],
            ['no' => 3, 'nama' => 'AGIES WIDYAWATI', 'nisn' => '0087441890', 'kelas' => 'XII RPL 1'],
            ['no' => 4, 'nama' => 'AGIL RIFATUL HAQ', 'nisn' => '0071026334', 'kelas' => 'XII RPL 1'],
            ['no' => 5, 'nama' => 'AKH. SEPTIAN FIO RAMADHAN', 'nisn' => '0078492418', 'kelas' => 'XII RPL 1'],
            ['no' => 6, 'nama' => 'Alya Fitri Larasati', 'nisn' => '0077521428', 'kelas' => 'XII RPL 1'],
            ['no' => 7, 'nama' => 'ANASTASYA DYAH AYU PROBONINGRUM', 'nisn' => '0084302867', 'kelas' => 'XII RPL 1'],
            ['no' => 8, 'nama' => 'ANISA PUSPITASARI', 'nisn' => '0079564039', 'kelas' => 'XII RPL 1'],
            ['no' => 9, 'nama' => 'Anissa Prissilvia Tahara', 'nisn' => '0087599872', 'kelas' => 'XII RPL 1'],
            ['no' => 10, 'nama' => 'AQILLA MAULIDDYAH', 'nisn' => '0084701495', 'kelas' => 'XII RPL 1'],
            ['no' => 11, 'nama' => 'AQILNA FAILLA LILFARA AIZANI', 'nisn' => '0079518058', 'kelas' => 'XII RPL 1'],
            ['no' => 12, 'nama' => 'Aristia Faren Rafaela', 'nisn' => '0076823738', 'kelas' => 'XII RPL 1'],
            ['no' => 13, 'nama' => 'ASYHARIL KAHFI DEWANDA', 'nisn' => '0088840490', 'kelas' => 'XII RPL 1'],
            ['no' => 14, 'nama' => 'Athaar Putra Ruhenda', 'nisn' => '0086920055', 'kelas' => 'XII RPL 1'],
            ['no' => 15, 'nama' => 'AVRILIANA ANJANI', 'nisn' => '0088032174', 'kelas' => 'XII RPL 1'],
            ['no' => 16, 'nama' => 'AZHAR ANISATUL JANNAH', 'nisn' => '0089732684', 'kelas' => 'XII RPL 1'],
            ['no' => 17, 'nama' => 'BINTANG FIRMAN ARDANA', 'nisn' => '0086246127', 'kelas' => 'XII RPL 1'],
            ['no' => 18, 'nama' => 'CALLISTA SHAFA RAMADHANI', 'nisn' => '3079461424', 'kelas' => 'XII RPL 1'],
            ['no' => 19, 'nama' => 'CHEVY APRILIA HUTABARAT', 'nisn' => '0077372447', 'kelas' => 'XII RPL 1'],
            ['no' => 20, 'nama' => 'CINDI TRI PRASETYO', 'nisn' => '0073851099', 'kelas' => 'XII RPL 1'],
            ['no' => 21, 'nama' => 'CINTYA KARINA PUTRI', 'nisn' => '0082111423', 'kelas' => 'XII RPL 1'],
            ['no' => 22, 'nama' => 'DHIA MIRZA HANDHIONO', 'nisn' => '0078343685', 'kelas' => 'XII RPL 1'],
            ['no' => 23, 'nama' => 'DIANDHIKA DWI PRANATA', 'nisn' => '0081555900', 'kelas' => 'XII RPL 1'],
            ['no' => 24, 'nama' => 'FAIRUZ QUDS ZAHRAN FIRDAUS', 'nisn' => '0081936855', 'kelas' => 'XII RPL 1'],
            ['no' => 25, 'nama' => 'FARDAN RASYAH ISLAMI', 'nisn' => '0079300540', 'kelas' => 'XII RPL 1'],
            ['no' => 26, 'nama' => 'FATCHUR ROHMAN ROFIAN', 'nisn' => '0088713839', 'kelas' => 'XII RPL 1'],
            ['no' => 27, 'nama' => 'FIDATUL AVIVA', 'nisn' => '0087853322', 'kelas' => 'XII RPL 1'],
            ['no' => 28, 'nama' => 'FIRLI ZULFA AZZAHRA', 'nisn' => '0088560011', 'kelas' => 'XII RPL 1'],
            ['no' => 29, 'nama' => 'HAPSARI ISMARTOYO', 'nisn' => '0062756939', 'kelas' => 'XII RPL 1'],
            ['no' => 30, 'nama' => 'HAVID ABDILAH SURAHMAD', 'nisn' => '0087538918', 'kelas' => 'XII RPL 1'],
            ['no' => 31, 'nama' => 'IGNACIA ZANDRA', 'nisn' => '0072226999', 'kelas' => 'XII RPL 1'],
            ['no' => 32, 'nama' => 'IQBAL LAZUARDI', 'nisn' => '0074853632', 'kelas' => 'XII RPL 1'],
            ['no' => 33, 'nama' => 'IQLIMAHDA TANZILLA FINAN DIVA', 'nisn' => '0089462835', 'kelas' => 'XII RPL 1'],
            ['no' => 34, 'nama' => 'IRDINA MARSYA MAZARINA', 'nisn' => '0077181841', 'kelas' => 'XII RPL 1'],
            ['no' => 35, 'nama' => 'ISABEL CAHAYA HATI', 'nisn' => '0086237279', 'kelas' => 'XII RPL 1'],
            ['no' => 36, 'nama' => 'KHOIRUN NI\'MAH NURUL HIDAYAH', 'nisn' => '0074316703', 'kelas' => 'XII RPL 1'],
            ['no' => 37, 'nama' => 'LAURA LAVIDA LOCA', 'nisn' => '0074182519', 'kelas' => 'XII RPL 2'],
            ['no' => 38, 'nama' => 'LELY SAGITA', 'nisn' => '0074320819', 'kelas' => 'XII RPL 2'],
            ['no' => 39, 'nama' => 'MAYA MELINDA WIJAYANTI', 'nisn' => '0078658367', 'kelas' => 'XII RPL 2'],
            ['no' => 40, 'nama' => 'MOCH. ABYL GUSTIAN', 'nisn' => '0079292238', 'kelas' => 'XII RPL 2'],
            ['no' => 41, 'nama' => 'MUHAMMAD AMINULLAH', 'nisn' => '0084421457', 'kelas' => 'XII RPL 2'],
            ['no' => 42, 'nama' => 'Muhammad Azka Fadli Atthaya', 'nisn' => '0089104721', 'kelas' => 'XII RPL 2'],
            ['no' => 43, 'nama' => 'MUHAMMAD HADI FIRMANSYAH', 'nisn' => '0087917739', 'kelas' => 'XII RPL 2'],
            ['no' => 44, 'nama' => 'MUHAMMAD HARRIS MAULANA SAPUTRA', 'nisn' => '0074704843', 'kelas' => 'XII RPL 2'],
            ['no' => 45, 'nama' => 'MUHAMMAD IBNU RAFFI AHDAN', 'nisn' => '0077192596', 'kelas' => 'XII RPL 2'],
            ['no' => 46, 'nama' => 'MUHAMMAD REYHAN ATHADIANSYAH', 'nisn' => '0075024492', 'kelas' => 'XII RPL 2'],
            ['no' => 47, 'nama' => 'MUHAMMAD WISNU DEWANDARU', 'nisn' => '0141951182', 'kelas' => 'XII RPL 2'],
            ['no' => 48, 'nama' => 'NABILA RAMADHAN', 'nisn' => '0072504970', 'kelas' => 'XII RPL 2'],
            ['no' => 49, 'nama' => 'NADIA SINTA DEVI OKTAVIA', 'nisn' => '0061631562', 'kelas' => 'XII RPL 2'],
            ['no' => 50, 'nama' => 'NADJWA KIRANA FIRDAUS', 'nisn' => '0081112175', 'kelas' => 'XII RPL 2'],
            ['no' => 51, 'nama' => 'NINDI NARITA MAULIDYA', 'nisn' => '0089965810', 'kelas' => 'XII RPL 2'],
            ['no' => 52, 'nama' => 'NISWATUL KHOIRIYAH', 'nisn' => '0085834363', 'kelas' => 'XII RPL 2'],
            ['no' => 53, 'nama' => 'NOVERITA PASCALIA RAHMA', 'nisn' => '0087884391', 'kelas' => 'XII RPL 2'],
            ['no' => 54, 'nama' => 'NOVITA ANDRIANI', 'nisn' => '0078285764', 'kelas' => 'XII RPL 2'],
            ['no' => 55, 'nama' => 'NOVITA AZZAHRA', 'nisn' => '0078980482', 'kelas' => 'XII RPL 2'],
            ['no' => 56, 'nama' => 'NURUL KHASANAH', 'nisn' => '0078036100', 'kelas' => 'XII RPL 2'],
            ['no' => 57, 'nama' => 'RACHEL ALUNA MEIZHA', 'nisn' => '0081838771', 'kelas' => 'XII RPL 2'],
            ['no' => 58, 'nama' => 'RAENA WESTI DHEANOFA HERLIANI', 'nisn' => '0079312790', 'kelas' => 'XII RPL 2'],
            ['no' => 59, 'nama' => 'RAYHANUN', 'nisn' => '0084924963', 'kelas' => 'XII RPL 2'],
            ['no' => 60, 'nama' => 'RAYYAN DAFFA AL AFFANI', 'nisn' => '0077652198', 'kelas' => 'XII RPL 2'],
            ['no' => 61, 'nama' => 'RHAMEYZHA ALEA CHALILA PUTRI EDWARD', 'nisn' => '0087959211', 'kelas' => 'XII RPL 2'],
            ['no' => 62, 'nama' => 'RHEISYA MAULIDDIVA PUTRI', 'nisn' => '0089530132', 'kelas' => 'XII RPL 2'],
            ['no' => 63, 'nama' => 'RHEYVAN RAMADHAN I.P', 'nisn' => '0089479412', 'kelas' => 'XII RPL 2'],
            ['no' => 64, 'nama' => 'RISKY RAMADHANI', 'nisn' => '0073540571', 'kelas' => 'XII RPL 2'],
            ['no' => 65, 'nama' => 'RITA AURA AGUSTINA', 'nisn' => '0076610748', 'kelas' => 'XII RPL 2'],
            ['no' => 66, 'nama' => 'RIZKY RAMADHANI', 'nisn' => '0077493253', 'kelas' => 'XII RPL 2'],
            ['no' => 67, 'nama' => 'SA\'IDHATUL HASANA', 'nisn' => '0076376703', 'kelas' => 'XII RPL 2'],
            ['no' => 68, 'nama' => 'SHISILIA ISMU PUTRI', 'nisn' => '0072620559', 'kelas' => 'XII RPL 2'],
            ['no' => 69, 'nama' => 'SUCI RAMADANI INDRIANSYAH', 'nisn' => '0072336597', 'kelas' => 'XII RPL 2'],
            ['no' => 70, 'nama' => 'TALITHA NUDIA RISMATULLAH', 'nisn' => '0075802873', 'kelas' => 'XII RPL 2'],
        ];

        foreach ($students as $data) {
            $user = User::updateOrCreate(
                ['username' => $data['nisn']], // Username using NISN
                [
                    'name' => trim($data['nama']),
                    'email' => $data['nisn'].'@student.example.com',
                    'password' => Hash::make('password123'),
                    'user_type' => 'student',
                    'active' => true,
                ]
            );

            $classId = ($data['kelas'] === 'XII RPL 1') ? $class1->id : $class2->id;

            StudentProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'nisn' => $data['nisn'],
                    'nis' => $data['nisn'], // Assuming NIS is same as NISN for now if not provided
                    'gender' => 'L', // Default to L, can be updated later manually or inferred if name lookup available
                    'address' => 'Alamat Siswa',
                    'class_id' => $classId,
                ]
            );
        }
        // 4. Dummy Data Ketidakhadiran - REMOVED to avoid conflict with AttendanceSeeder
        // Attendance data is handled by AttendanceSeeder.php
    }
}
