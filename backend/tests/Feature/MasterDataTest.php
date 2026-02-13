<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows admin to manage rooms', function () {
    $admin = User::factory()->admin()->create();

    // Create
    $response = $this->actingAs($admin)->postJson('/api/rooms', [
        'name' => 'Lab Komputer',
        'location' => 'Lantai 2',
        'capacity' => 40,
    ]);
    $response->assertStatus(201);
    $roomId = $response->json('id');

    // Show
    $this->getJson("/api/rooms/{$roomId}")->assertStatus(200);

    // Update
    $this->putJson("/api/rooms/{$roomId}", ['name' => 'Lab RPL'])->assertStatus(200);

    // List
    $this->getJson('/api/rooms')->assertStatus(200);

    // Delete
    $this->deleteJson("/api/rooms/{$roomId}")->assertStatus(200);
});

it('allows admin to manage subjects', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/subjects', [
        'code' => 'MTK',
        'name' => 'Matematika',
    ]);
    $response->assertStatus(201);
});

it('allows admin to manage time slots', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->postJson('/api/time-slots', [
        'name' => 'Jam ke-1',
        'start_time' => '07:00',
        'end_time' => '07:45',
    ]);
    $response->assertStatus(201);
});
