<?php

use App\Models\User;
use App\Models\Classes;
use App\Models\StudentProfile;
use App\Models\TeacherProfile;
use App\Models\AdminProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['user_type' => 'admin']);
    AdminProfile::factory()->create(['user_id' => $this->admin->id]);
    $this->classRoom = Classes::factory()->create();
});

test('admin can create student', function () {
    $payload = [
        'name' => 'User Testing',
        'username' => 'usertesting',
        'email' => 'usertesting@example.com',
        'password' => 'password123',
        'nisn' => '1234567890',
        'nis' => '12345',
        'gender' => 'L',
        'address' => 'Jl. Jalan',
        'class_id' => $this->classRoom->id,
        'phone' => '08123456789',
    ];

    $this->actingAs($this->admin)
        ->postJson('/api/students', $payload)
        ->assertStatus(201)
        ->assertJsonPath('name', 'User Testing')
        ->assertJsonPath('nisn', '1234567890');

    $this->assertDatabaseHas('users', ['username' => 'johndoe', 'user_type' => 'student']);
    $this->assertDatabaseHas('student_profiles', ['nisn' => '1234567890']);
});

test('admin can list students', function () {
    $student = User::factory()->create(['user_type' => 'student', 'name' => 'Alice']);
    StudentProfile::factory()->create(['user_id' => $student->id, 'class_id' => $this->classRoom->id, 'nisn' => '9876543210']);

    $this->actingAs($this->admin)
        ->getJson('/api/students')
        ->assertStatus(200)
        ->assertJsonFragment(['name' => 'Sabrina'])
        ->assertJsonFragment(['nisn' => '9876543210']);
});

test('admin can update student', function () {
    $student = User::factory()->create(['user_type' => 'student', 'name' => 'Bob']);
    $profile = StudentProfile::factory()->create(['user_id' => $student->id, 'class_id' => $this->classRoom->id]);

    $this->actingAs($this->admin)
        ->putJson("/api/students/{$profile->id}", ['name' => 'Robert', 'address' => 'New Address'])
        ->assertStatus(200);

    $this->assertDatabaseHas('users', ['id' => $student->id, 'name' => 'Robert']);
    $this->assertDatabaseHas('student_profiles', ['id' => $profile->id, 'address' => 'New Address']);
});

test('admin can delete student', function () {
    $student = User::factory()->create(['user_type' => 'student']);
    $profile = StudentProfile::factory()->create(['user_id' => $student->id, 'class_id' => $this->classRoom->id]);

    $this->actingAs($this->admin)
        ->deleteJson("/api/students/{$profile->id}")
        ->assertStatus(200);

    $this->assertDatabaseMissing('users', ['id' => $student->id]);
    $this->assertDatabaseMissing('student_profiles', ['id' => $profile->id]);
});

test('admin can create teacher', function () {
    $payload = [
        'name' => 'Guru Harris',
        'username' => 'haristeacher',
        'email' => 'harris@school.com',
        'password' => 'password123',
        'nip' => '19800101200001',
        'jabatan' => 'Guru', // Changed from 'Guru Matematika' to match in: rule
        'gender' => 'P', 
    ];

    $this->actingAs($this->admin)
        ->postJson('/api/teachers', $payload)
        ->assertStatus(201)
        ->assertJsonPath('user.name', 'Jane Teacher');

    $this->assertDatabaseHas('users', ['username' => 'janeteacher', 'user_type' => 'teacher']);
    $this->assertDatabaseHas('teacher_profiles', ['nip' => '19800101200001']);
});

test('admin can update teacher', function () {
    $teacher = User::factory()->create(['user_type' => 'teacher', 'name' => 'Old Name']);
    $profile = TeacherProfile::factory()->create(['user_id' => $teacher->id, 'nip' => '123456']);

    $this->actingAs($this->admin)
        ->putJson("/api/teachers/{$profile->id}", ['name' => 'New Name', 'nip' => '654321'])
        ->assertStatus(200);
        
    $this->assertDatabaseHas('users', ['id' => $teacher->id, 'name' => 'New Name']);
    $this->assertDatabaseHas('teacher_profiles', ['id' => $profile->id, 'nip' => '654321']);
});

test('admin can manage classes', function () {
    // Create
    // We need a Major first.
    $major = \App\Models\Major::factory()->create();
    
    $response = $this->actingAs($this->admin)->postJson('/api/classes', [
        'grade' => 'X',
        'label' => 'RPL 1',
        'major_id' => $major->id,
    ]);
    
    $response->assertStatus(201);
    $classId = $response->json('id');
    
    // Update
    $this->actingAs($this->admin)
        ->putJson("/api/classes/{$classId}", ['grade' => 'X', 'label' => 'RPL 2'])
        ->assertStatus(200);
        
    $this->assertDatabaseHas('classes', ['id' => $classId, 'label' => 'RPL 2']);
    
    // Delete
    $this->actingAs($this->admin)
        ->deleteJson("/api/classes/{$classId}")
        ->assertStatus(200);
        
    $this->assertDatabaseMissing('classes', ['id' => $classId]);
});

// Existing tests
test('admin can manage rooms', function () {
    $this->actingAs($this->admin)->postJson('/api/rooms', [
        'name' => 'Lab Komputer',
        'location' => 'Lantai 2',
        'capacity' => 40,
    ])->assertStatus(201);
});

test('admin can manage subjects', function () {
    $this->actingAs($this->admin)->postJson('/api/subjects', [
        'code' => 'MTK',
        'name' => 'Matematika',
    ])->assertStatus(201);
});

test('admin can manage time slots', function () {
    $this->actingAs($this->admin)->postJson('/api/time-slots', [
        'name' => 'Jam ke-1',
        'start_time' => '07:00',
        'end_time' => '07:45',
    ])->assertStatus(201);
});
