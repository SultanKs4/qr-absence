<?php

use App\Models\Attendance;
use App\Models\Classes;
use App\Models\ClassSchedule;
use App\Models\DailySchedule;
use App\Models\ScheduleItem;
use App\Models\StudentProfile;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

it('allows teacher to submit manual attendance', function () {
    // 1. Setup Data
    $class = Classes::factory()->create();
    $teacherUser = User::factory()->create(['user_type' => 'teacher']);
    $teacherProfile = TeacherProfile::factory()->create(['user_id' => $teacherUser->id]);

    $studentUser = User::factory()->create(['user_type' => 'student']);
    $student = StudentProfile::factory()->create([
        'user_id' => $studentUser->id,
        'class_id' => $class->id,
        'nisn' => '1234567890',
    ]);

    $classSchedule = ClassSchedule::factory()->create([
        'class_id' => $class->id,
        'is_active' => true,
    ]);

    $dailySchedule = DailySchedule::factory()->create([
        'class_schedule_id' => $classSchedule->id,
        'day' => now()->format('l'),
    ]);

    $scheduleItem = ScheduleItem::factory()->create([
        'daily_schedule_id' => $dailySchedule->id,
        'teacher_id' => $teacherProfile->id,
        'start_time' => '07:00:00',
        'end_time' => '17:00:00',
    ]);

    // 2. Submit Manual Attendance
    $response = $this->actingAs($teacherUser)
        ->postJson('/api/attendance/manual', [
            'attendee_type' => 'student',
            'student_id' => $student->id,
            'schedule_id' => $scheduleItem->id,
            'status' => 'present',
            'date' => Carbon::now()->toDateString(),
            'reason' => 'Manual input',
        ]);

    $response->assertOk()
        ->assertJson([
            'message' => 'Kehadiran berhasil disimpan',
        ]);

    $this->assertDatabaseHas('attendances', [
        'student_id' => $student->id,
        'schedule_id' => $scheduleItem->id,
        'status' => 'present',
        'source' => 'manual',
        'reason' => 'Manual input',
    ]);
});

it('maps pulang status to return in database', function () {
    // 1. Setup Data
    $class = Classes::factory()->create();
    $teacherUser = User::factory()->create(['user_type' => 'teacher']);
    $teacherProfile = TeacherProfile::factory()->create(['user_id' => $teacherUser->id]);

    $studentUser = User::factory()->create(['user_type' => 'student']);
    $student = StudentProfile::factory()->create([
        'user_id' => $studentUser->id,
        'class_id' => $class->id,
        'nisn' => '1234567890',
    ]);

    $classSchedule = ClassSchedule::factory()->create([
        'class_id' => $class->id,
        'is_active' => true,
    ]);

    $dailySchedule = DailySchedule::factory()->create([
        'class_schedule_id' => $classSchedule->id,
        'day' => now()->format('l'),
    ]);

    $scheduleItem = ScheduleItem::factory()->create([
        'daily_schedule_id' => $dailySchedule->id,
        'teacher_id' => $teacherProfile->id,
        'start_time' => '07:00:00',
        'end_time' => '17:00:00',
    ]);

    // 2. Submit Manual Attendance with 'pulang' status
    $response = $this->actingAs($teacherUser)
        ->postJson('/api/attendance/manual', [
            'attendee_type' => 'student',
            'student_id' => $student->id,
            'schedule_id' => $scheduleItem->id,
            'status' => 'pulang', // Sending 'pulang'
            'date' => Carbon::now()->toDateString(),
            'reason' => 'Pulang cepat',
        ]);

    $response->assertOk();

    // 3. Verify Database has 'return' status
    $this->assertDatabaseHas('attendances', [
        'student_id' => $student->id,
        'schedule_id' => $scheduleItem->id,
        'status' => 'return', // Expecting 'return'
        'source' => 'manual',
    ]);
});

it('prevents unauthorized teacher from submitting attendance', function () {
    // 1. Setup Data - Schedule owned by OTHER teacher
    $class = Classes::factory()->create();
    $otherTeacherUser = User::factory()->create(['user_type' => 'teacher']);
    $otherTeacherProfile = TeacherProfile::factory()->create(['user_id' => $otherTeacherUser->id]);

    $classSchedule = ClassSchedule::factory()->create([
        'class_id' => $class->id,
        'is_active' => true,
    ]);

    $dailySchedule = DailySchedule::factory()->create([
        'class_schedule_id' => $classSchedule->id,
        'day' => now()->format('l'),
    ]);

    $scheduleItem = ScheduleItem::factory()->create([
        'daily_schedule_id' => $dailySchedule->id,
        'teacher_id' => $otherTeacherProfile->id,
    ]);

    $studentUser = User::factory()->create(['user_type' => 'student']);
    $student = StudentProfile::factory()->create([
        'user_id' => $studentUser->id,
        'class_id' => $class->id,
    ]);

    // 2. Unauthorized Teacher
    $unauthorizedTeacher = User::factory()->create(['user_type' => 'teacher']);
    TeacherProfile::factory()->create(['user_id' => $unauthorizedTeacher->id]);

    $response = $this->actingAs($unauthorizedTeacher)
        ->postJson('/api/attendance/manual', [
            'attendee_type' => 'student',
            'student_id' => $student->id,
            'schedule_id' => $scheduleItem->id,
            'status' => 'present',
            'date' => Carbon::now()->toDateString(),
        ]);

    $response->assertStatus(403);
});
