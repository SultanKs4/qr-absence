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
                'description' => 'Official start time of the school day',
            ],
            [
                'key' => 'school_end_time',
                'value' => '15:00:00',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Official end time of the school day',
            ],
            [
                'key' => 'school_name',
                'value' => 'SMK Muhammadiyah 1 Sukoharjo',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Name of the school',
            ],
        ];

        foreach ($settings as $setting) {
            \App\Models\Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
