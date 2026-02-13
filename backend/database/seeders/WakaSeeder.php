<?php

namespace Database\Seeders;

use App\Models\AdminProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class WakaSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['username' => 'waka1'],
            [
                'name' => 'ZULKIFLI ABDILLAH, S.Kom',
                'email' => 'waka@example.com',
                'password' => Hash::make('password123'),
                'user_type' => 'admin',
                'active' => true,
            ]
        );

        AdminProfile::updateOrCreate(
            ['user_id' => $user->id],
            ['type' => 'waka']
        );
    }
}
