<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\StudentProfile;
use App\Models\TeacherProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_success_with_email()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'user_type' => 'admin',
            'active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login' => 'test@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_login_success_with_username()
    {
        $user = User::factory()->create([
            'username' => 'testuser',
            'password' => bcrypt('password'),
            'user_type' => 'admin',
            'active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login' => 'testuser',
            'password' => 'password',
        ]);

        $response->assertStatus(200);
    }

    public function test_login_success_student_nisn()
    {
        $user = User::factory()->create(['user_type' => 'student', 'active' => true]);
        StudentProfile::factory()->create([
            'user_id' => $user->id,
            'nisn' => '1234567890',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login' => '1234567890',
            // No password provided, simulating card scan or similar if allowed by logic
            // The logic: $isStudentNisnLogin = ... && empty($data['password']) ...
        ]);

        // If the logic requires NO password for students using NISN, this should pass.
        // Let's verify if logic allows empty password.
        // Logic: $isStudentNisnLogin = $user->user_type === 'student' && empty($data['password']) ...
        // If so, it skips password check.
        
        $response->assertStatus(200);
    }

    public function test_login_success_teacher_nip()
    {
        $user = User::factory()->create([
            'user_type' => 'teacher', 
            'password' => bcrypt('password'),
            'active' => true
        ]);
        TeacherProfile::factory()->create([
            'user_id' => $user->id,
            'nip' => '1987654321',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login' => '1987654321',
            'password' => 'password',
        ]);

        $response->assertStatus(200);
    }

    public function test_login_failure()
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
             'active' => true
        ]);

        $response = $this->postJson('/api/auth/login', [
            'login' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422);
    }

    public function test_me_endpoint()
    {
        $user = User::factory()->create(['user_type' => 'admin', 'active' => true]);
        
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/me');

        $response->assertStatus(200)
            ->assertJsonPath('username', $user->username);
    }
}
