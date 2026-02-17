<?php

use App\Models\Attendance;
use App\Models\Classes;
use App\Models\ClassSchedule;
use App\Models\DailySchedule;
use App\Models\ScheduleItem;
use App\Models\StudentProfile;
use App\Models\Subject;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['user_type' => 'admin', 'username' => 'admin']);
    // Create AdminProfile for Waka access
    \App\Models\AdminProfile::factory()->create([
        'user_id' => $this->admin->id,
        'type' => 'waka',
    ]);
    
    $this->teacher = User::factory()->create(['user_type' => 'teacher', 'username' => 'teacher']);
    $this->teacherProfile = TeacherProfile::factory()->create(['user_id' => $this->teacher->id]);
    
    $this->student = User::factory()->create(['user_type' => 'student', 'username' => 'student']);
    $this->major = \App\Models\Major::factory()->create();
    $this->classRoom = Classes::create([
        'grade' => 'X', 
        'label' => 'RPL 1', 
        'major_id' => $this->major->id
    ]);
    $this->studentProfile = StudentProfile::factory()->create([
        'user_id' => $this->student->id,
        'class_id' => $this->classRoom->id,
    ]);

    // Setup Schedule
    $this->subject = Subject::factory()->create(['name' => 'Matematika']);
    $this->classSchedule = ClassSchedule::create([
        'class_id' => $this->classRoom->id,
        'semester' => '1',
        'year' => '2025/2026',
        'is_active' => true,
    ]);
    
    $this->dailySchedule = DailySchedule::create([
        'class_schedule_id' => $this->classSchedule->id,
        'day' => now()->format('l'), // Today
    ]);

    $this->scheduleItem = ScheduleItem::create([
        'daily_schedule_id' => $this->dailySchedule->id,
        'teacher_id' => $this->teacherProfile->id,
        'subject_id' => $this->subject->id,
        'start_time' => '07:00:00',
        'end_time' => '08:30:00',
    ]);
});

test('waka can view teachers daily attendance', function () {
    // Create attendance for teacher
    Attendance::create([
        'attendee_type' => 'teacher',
        'teacher_id' => $this->teacherProfile->id,
        'date' => now()->toDateString(),
        'status' => 'present',
        'checked_in_at' => now(),
        'source' => 'qrcode',
    ]);

    // Assuming 'admin' query scope or middleware allows this. 
    // Route says: middleware(['role:admin', 'admin-type:waka'])
    // But 'admin' role check usually passes for any admin user if not strict on type in role middleware, 
    // OR we need to specific 'admin_type' column if it exists.
    // Checking AuthController/User model for admin_type... 
    // For now, testing with basic admin.
    
    $response = $this->actingAs($this->admin)
        ->getJson('/api/attendance/teachers/daily?date=' . now()->toDateString());

    $response->assertStatus(200)
        ->assertJsonFragment(['name' => $this->teacher->name])
        ->assertJsonFragment(['status' => 'present']);
});

test('admin can void attendance', function () {
    $attendance = Attendance::create([
        'attendee_type' => 'student',
        'student_id' => $this->studentProfile->id,
        'schedule_id' => $this->scheduleItem->id,
        'date' => now()->toDateString(),
        'status' => 'present',
        'checked_in_at' => now(),
        'source' => 'qrcode',
    ]);

    $response = $this->actingAs($this->admin)
        ->postJson("/api/attendance/{$attendance->id}/void");

    $response->assertStatus(200)
        ->assertJson(['message' => 'Scan dibatalkan']);

    $this->assertDatabaseMissing('attendances', ['id' => $attendance->id]);
});

test('teacher can view their own schedule', function () {
    $response = $this->actingAs($this->teacher)
        ->getJson('/api/me/schedules');

    $response->assertStatus(200)
        ->assertJsonFragment(['subject' => 'Matematika']);
});

test('student can view their own schedule', function () {
    $response = $this->actingAs($this->student)
        ->getJson('/api/me/schedules');

    $response->assertStatus(200)
       // Structure for student is different (nested)
       ->assertJsonFragment(['name' => 'Matematika']);
});
