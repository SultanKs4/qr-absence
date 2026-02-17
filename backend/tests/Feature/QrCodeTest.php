<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\TeacherProfile;
use App\Models\StudentProfile;
use App\Models\Classes;
use App\Models\ScheduleItem;
use App\Models\DailySchedule;
use App\Models\ClassSchedule;
use App\Models\Subject;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QrCodeTest extends TestCase
{
    use RefreshDatabase;

    protected $teacher;
    protected $studentOfficer;
    protected $schedule;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup common data
        $this->teacher = User::factory()->create(['user_type' => 'teacher']);
        TeacherProfile::factory()->create(['user_id' => $this->teacher->id]);

        $class = Classes::factory()->create();
        
        $this->studentOfficer = User::factory()->create(['user_type' => 'student']);
        StudentProfile::factory()->create([
            'user_id' => $this->studentOfficer->id,
            'class_id' => $class->id,
            'is_class_officer' => true
        ]);

        $subject = Subject::factory()->create();
        
        // Create Schedule Hierarchy
        $classSchedule = ClassSchedule::factory()->create(['class_id' => $class->id]);
        
        // Ensure day matches today for student test
        $today = now()->format('l'); 
        $dailySchedule = DailySchedule::factory()->create([
            'class_schedule_id' => $classSchedule->id, 
            'day' => $today
        ]);

        $this->schedule = ScheduleItem::factory()->create([
            'daily_schedule_id' => $dailySchedule->id,
            'teacher_id' => $this->teacher->teacherProfile->id,
            'subject_id' => $subject->id,
            'start_time' => '07:00:00',
            'end_time' => '08:00:00',
        ]);
    }

    public function test_teacher_can_generate_qr()
    {
        $response = $this->actingAs($this->teacher)
            ->postJson('/api/qrcodes/generate', [
                'schedule_id' => $this->schedule->id,
                'type' => 'student',
                'expires_in_minutes' => 30
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['qrcode', 'qr_svg', 'payload', 'mobile_format']);
            
        $this->assertDatabaseHas('qrcodes', [
            'schedule_id' => $this->schedule->id,
            'type' => 'student',
            'is_active' => 1
        ]);
    }

    public function test_student_officer_can_generate_qr_for_today()
    {
        $response = $this->actingAs($this->studentOfficer)
            ->postJson('/api/qrcodes/generate', [
                'schedule_id' => $this->schedule->id,
                'type' => 'student',
            ]);

        $response->assertStatus(201);
    }

    public function test_student_officer_cannot_generate_for_other_class()
    {
        $otherClass = Classes::factory()->create();
        $otherClassSchedule = ClassSchedule::factory()->create(['class_id' => $otherClass->id]);
        $otherDaily = DailySchedule::factory()->create(['class_schedule_id' => $otherClassSchedule->id, 'day' => now()->format('l')]);
        $otherSchedule = ScheduleItem::factory()->create(['daily_schedule_id' => $otherDaily->id]);

        $response = $this->actingAs($this->studentOfficer)
            ->postJson('/api/qrcodes/generate', [
                'schedule_id' => $otherSchedule->id,
                'type' => 'student',
            ]);

        $response->assertStatus(403);
    }

    public function test_regular_student_cannot_generate()
    {
        $regularStudent = User::factory()->create(['user_type' => 'student']);
        StudentProfile::factory()->create([
            'user_id' => $regularStudent->id,
            'class_id' => $this->schedule->dailySchedule->classSchedule->class_id,
            'is_class_officer' => false
        ]);

        $response = $this->actingAs($regularStudent)
            ->postJson('/api/qrcodes/generate', [
                'schedule_id' => $this->schedule->id,
                'type' => 'student',
            ]);

        $response->assertStatus(403);
    }
}
