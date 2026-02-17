<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\StudentProfile;
use App\Models\Qrcode;
use App\Models\ScheduleItem;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Str;

class AttendanceScanTest extends TestCase
{
    use RefreshDatabase;

    protected $student;
    protected $schedule;
    protected $qr;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = User::factory()->create(['user_type' => 'student']);
        StudentProfile::factory()->create(['user_id' => $this->student->id]);

        $this->schedule = ScheduleItem::factory()->create([
            'start_time' => now()->subMinutes(5)->format('H:i:s'),
            'end_time' => now()->addHour()->format('H:i:s'),
        ]);

        $this->qr = Qrcode::create([
            'token' => Str::random(32),
            'type' => 'student',
            'schedule_id' => $this->schedule->id,
            'issued_by' => User::factory()->create(['user_type' => 'teacher'])->id,
            'status' => 'available',
            'expires_at' => now()->addMinutes(30),
            'is_active' => true,
        ]);
        
        // Clear settings for basic tests
        Setting::where('key', 'school_lat')->delete();
        Setting::where('key', 'school_long')->delete();
        Setting::where('key', 'attendance_radius_meters')->delete();
    }

    public function test_scan_success_basic()
    {
        $response = $this->actingAs($this->student)
            ->postJson('/api/attendance/scan', [
                'token' => $this->qr->token
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['id', 'status', 'date']);

        $this->assertDatabaseHas('attendances', [
            'student_id' => $this->student->studentProfile->id,
            'schedule_id' => $this->schedule->id,
            'status' => 'present' // default if on time
        ]);
    }

    public function test_scan_duplicate_returns_existing()
    {
        $this->actingAs($this->student)
            ->postJson('/api/attendance/scan', ['token' => $this->qr->token]);

        $response = $this->actingAs($this->student)
            ->postJson('/api/attendance/scan', ['token' => $this->qr->token]);

        $response->assertStatus(200)
            ->assertJsonFragment(['message' => 'Presensi sudah tercatat']);
    }

    public function test_scan_expired_qr()
    {
        $this->qr->update(['expires_at' => now()->subMinute(), 'status' => 'expired']);

        $response = $this->actingAs($this->student)
            ->postJson('/api/attendance/scan', ['token' => $this->qr->token]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'QR tidak aktif atau sudah kadaluarsa']);
    }

    public function test_scan_geolocation_success()
    {
        // Set geolocation settings
        Setting::create(['key' => 'school_lat', 'value' => '-7.900833']);
        Setting::create(['key' => 'school_long', 'value' => '112.636667']);
        Setting::create(['key' => 'attendance_radius_meters', 'value' => '100']);

        // Test with location INSIDE radius
        $response = $this->actingAs($this->student)
            ->postJson('/api/attendance/scan', [
                'token' => $this->qr->token,
                'lat' => -7.900833, 
                'long' => 112.636667
            ]);

        $response->assertStatus(200);
    }

    public function test_scan_geolocation_failure()
    {
        // Set geolocation settings
        Setting::create(['key' => 'school_lat', 'value' => '-7.900833']);
        Setting::create(['key' => 'school_long', 'value' => '112.636667']);
        Setting::create(['key' => 'attendance_radius_meters', 'value' => '100']);

        // Test with location FAR AWAY (e.g., Jakarta)
        $response = $this->actingAs($this->student)
            ->postJson('/api/attendance/scan', [
                'token' => $this->qr->token,
                'lat' => -6.2088, 
                'long' => 106.8456
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Anda berada di luar radius sekolah']);
    }

        public function test_scan_geolocation_missing_params()
    {
        // Set geolocation settings
        Setting::create(['key' => 'school_lat', 'value' => '-7.900833']);
        Setting::create(['key' => 'school_long', 'value' => '112.636667']);
        Setting::create(['key' => 'attendance_radius_meters', 'value' => '100']);

        // Test without lat/long
        $response = $this->actingAs($this->student)
            ->postJson('/api/attendance/scan', [
                'token' => $this->qr->token,
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Lokasi diperlukan untuk presensi']);
    }
}
