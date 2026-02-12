<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'school_start_time',
                'value' => '07:00:00',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Jam masuk sekolah',
            ],
            [
                'key' => 'school_end_time',
                'value' => '15:00:00',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Jam pulang sekolah',
            ],
            [
                'key' => 'school_name',
                'value' => 'SMK NEGERI 2 SINGOSARI',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Nama sekolah',
            ],
            [
                'key' => 'school_logo',
                'value' => null,
                'type' => 'string',
                'group' => 'general',
                'description' => 'Logo sekolah',
            ],
            [
                'key' => 'school_mascot',
                'value' => null,
                'type' => 'string',
                'group' => 'general',
                'description' => 'Maskot sekolah',
            ],
            [
                'key' => 'school_email',
                'value' => 'smkn2.singosari@yahoo.co.id',
                'type' => 'string',
                'group' => 'contact',
                'description' => 'Email sekolah',
            ],
            [
                'key' => 'school_phone',
                'value' => '(0341) 458823',
                'type' => 'string',
                'group' => 'contact',
                'description' => 'Nomor telepon sekolah',
            ],
            [
                'key' => 'school_address',
                'value' => 'Jl. Perusahaan No.20, Tunjungtirto',
                'type' => 'string',
                'group' => 'address',
                'description' => 'Alamat jalan sekolah',
            ],
            [
                'key' => 'school_subdistrict',
                'value' => 'Tunjungtirto',
                'type' => 'string',
                'group' => 'address',
                'description' => 'Kelurahan/Desa',
            ],
            [
                'key' => 'school_district',
                'value' => 'Singosari',
                'type' => 'string',
                'group' => 'address',
                'description' => 'Kecamatan',
            ],
            [
                'key' => 'school_city',
                'value' => 'Kab. Malang',
                'type' => 'string',
                'group' => 'address',
                'description' => 'Kabupaten/Kota',
            ],
            [
                'key' => 'school_province',
                'value' => 'Jawa Timur',
                'type' => 'string',
                'group' => 'address',
                'description' => 'Provinsi',
            ],
            [
                'key' => 'school_postal_code',
                'value' => '65153',
                'type' => 'string',
                'group' => 'address',
                'description' => 'Kode Pos',
            ],
            [
                'key' => 'school_npsn',
                'value' => '20517748',
                'type' => 'string',
                'group' => 'profile',
                'description' => 'Nomor Pokok Sekolah Nasional',
            ],
            [
                'key' => 'school_accreditation',
                'value' => 'A',
                'type' => 'string',
                'group' => 'profile',
                'description' => 'Akreditasi Sekolah',
            ],
            [
                'key' => 'school_headmaster',
                'value' => 'SUMIJAH, S.Pd., M.Si',
                'type' => 'string',
                'group' => 'profile',
                'description' => 'Nama Kepala Sekolah',
            ],
            [
                'key' => 'school_headmaster_nip',
                'value' => '97002101998022009',
                'type' => 'string',
                'group' => 'profile',
                'description' => 'NIP Kepala Sekolah',
            ],
            [
                'key' => 'school_type',
                'value' => 'SMK',
                'type' => 'string',
                'group' => 'profile',
                'description' => 'Jenis Sekolah (SMK/SMA)',
            ],
            // GRACE PERIOD INI BUAT ABSENSI 15 MENIT AWAL
            [
                'key' => 'grace_period',
                'value' => '15',
                'type' => 'integer',
                'group' => 'attendance',
                'description' => 'Grace period for attendance in minutes',
            ],
        ];

        foreach ($settings as $setting) {
            \App\Models\Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
