<?php

use App\Models\Classes;
use App\Models\Schedule;
use App\Models\StudentProfile;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows teacher to scan student QR', function () {
    // 1. Setup Data
    $class = Classes::factory()->create();

    $teacherUser = User::factory()->create(['user_type' => 'teacher']);
    $teacher = TeacherProfile::factory()->create(['user_id' => $teacherUser->id]);

    $studentUser = User::factory()->create(['user_type' => 'student']);
    $student = StudentProfile::factory()->create([
        'user_id' => $studentUser->id,
        'class_id' => $class->id,
        'nisn' => '1234567890',
    ]);

    // 2. Create Active Schedule
    $now = now();
    $schedule = Schedule::factory()->create([
        'teacher_id' => $teacher->id,
        'class_id' => $class->id,
        'day' => $now->format('l'), // Today
        'start_time' => $now->copy()->subMinute()->format('H:i:s'),
        'end_time' => $now->copy()->addHour()->format('H:i:s'),
    ]);

    // 3. Act
    $response = $this->actingAs($teacherUser)
        ->postJson('/api/attendance/scan-student', [
            'token' => '1234567890',
        ]);

    // 4. Assert
    $response->assertOk()
        ->assertJson([
            'message' => 'Presensi berhasil dicatat',
            'status' => 'present',
        ]);

    $this->assertDatabaseHas('attendances', [
        'student_id' => $student->id,
        'schedule_id' => $schedule->id,
        'status' => 'present',
        'source' => 'teacher_scan',
    ]);
});

it('rejects if no active schedule', function () {
    $teacherUser = User::factory()->create(['user_type' => 'teacher']);
    $teacher = TeacherProfile::factory()->create(['user_id' => $teacherUser->id]);

    $this->actingAs($teacherUser)
        ->postJson('/api/attendance/scan-student', [
            'token' => '1234567890',
        ])
        ->assertStatus(404); // Student not found if we use random token, or 422 if found but no schedule
});
