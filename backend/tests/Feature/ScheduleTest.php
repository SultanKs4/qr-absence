<?php

use App\Models\Classes;
use App\Models\ClassSchedule;
use App\Models\DailySchedule;
use App\Models\Major;
use App\Models\ScheduleItem;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['user_type' => 'admin', 'username' => 'admin']);
    // Waka needs AdminProfile
    \App\Models\AdminProfile::factory()->create([
        'user_id' => $this->admin->id,
        'type' => 'waka',
    ]);

    $this->teacher = User::factory()->create(['user_type' => 'teacher', 'username' => 'teacher']);
    $this->teacherProfile = TeacherProfile::factory()->create(['user_id' => $this->teacher->id]);

    $this->major = Major::factory()->create();
    $this->classRoom = Classes::create([
        'grade' => 'X',
        'label' => 'RPL 1',
        'major_id' => $this->major->id,
    ]);
});

test('waka can create class schedule', function () {
    $payload = [
        'class_id' => $this->classRoom->id,
        'semester' => 1,
        'year' => 2025,
        'is_active' => true,
        'days' => [
            [
                'day' => 'Monday',
                'items' => [
                    [
                        'teacher_id' => $this->teacherProfile->id,
                        'subject_id' => \App\Models\Subject::factory()->create()->id,
                        'start_time' => '07:00',
                        'end_time' => '08:00',
                        'type' => 'regular',
                        'room' => 'Lab 1',
                    ]
                ]
            ]
        ]
    ];

    $response = $this->actingAs($this->admin)
        ->postJson('/api/schedules', $payload);

    $response->assertStatus(201)
        ->assertJsonPath('semester', 1);

    $this->assertDatabaseHas('class_schedules', [
        'class_id' => $this->classRoom->id,
        'semester' => 1,
    ]);
});

test('waka can update class schedule', function () {
    // initial setup
    $schedule = ClassSchedule::create([
        'class_id' => $this->classRoom->id,
        'semester' => 1,
        'year' => 2025,
        'is_active' => true,
    ]);
    
    $payload = [
        'year' => 2026,
        'days' => [
            [
                'day' => 'Tuesday',
                'items' => []
            ]
        ]
    ];

    $response = $this->actingAs($this->admin)
        ->putJson("/api/schedules/{$schedule->id}", $payload);

    $response->assertStatus(200)
        ->assertJsonPath('year', 2026);

    $this->assertDatabaseHas('class_schedules', [
        'id' => $schedule->id,
        'year' => 2026,
    ]);
});

test('waka can delete class schedule', function () {
    $schedule = ClassSchedule::create([
        'class_id' => $this->classRoom->id,
        'semester' => 1,
        'year' => 2025,
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->admin)
        ->deleteJson("/api/schedules/{$schedule->id}");

    $response->assertStatus(200);

    $this->assertDatabaseMissing('class_schedules', ['id' => $schedule->id]);
});
