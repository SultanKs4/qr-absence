<?php

use App\Models\User;
use App\Models\AdminProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('determines waka role correctly for admin user with waka profile', function () {
    $user = User::factory()->create([
        'username' => 'waka_test',
        'password' => bcrypt('password123'),
        'user_type' => 'admin',
        'active' => true,
    ]);

    AdminProfile::create([
        'user_id' => $user->id,
        'type' => 'waka',
    ]);

    $response = $this->postJson('/api/auth/login', [
        'login' => 'waka_test',
        'password' => 'password123',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('user.role', 'waka');
});

it('determines admin role correctly for admin user with admin profile', function () {
    $user = User::factory()->create([
        'username' => 'admin_test',
        'password' => bcrypt('password123'),
        'user_type' => 'admin',
        'active' => true,
    ]);

    AdminProfile::create([
        'user_id' => $user->id,
        'type' => 'admin',
    ]);

    $response = $this->postJson('/api/auth/login', [
        'login' => 'admin_test',
        'password' => 'password123',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('user.role', 'admin');
});
