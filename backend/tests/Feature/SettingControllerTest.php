<?php

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\SettingSeeder::class);
    $this->admin = User::factory()->create(['user_type' => 'admin']);
    $this->teacher = User::factory()->create(['user_type' => 'teacher']);
});

it('returns settings for admin', function () {
    $this->actingAs($this->admin)
        ->getJson('/api/settings')
        ->assertOk()
        ->assertJsonStructure([
            'status',
            'data' => [
                'school_name',
                'school_logo',
            ],
        ]);
});

it('updates school name', function () {
    $this->actingAs($this->admin)
        ->postJson('/api/settings', [
            'school_name' => 'New School Name',
        ])
        ->assertOk()
        ->assertJsonFragment(['school_name' => 'New School Name']);

    expect(Setting::where('key', 'school_name')->first()->value)->toBe('New School Name');
});

it('updates school logo', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->image('logo.png');

    $this->actingAs($this->admin)
        ->postJson('/api/settings', [
            'school_logo' => $file,
        ])
        ->assertOk();

    $logoPath = Setting::where('key', 'school_logo')->first()->value;
    expect($logoPath)->not->toBeNull();
    Storage::disk('public')->assertExists($logoPath);
});

it('deletes old logo when updating new logo', function () {
    Storage::fake('public');

    // Setup initial logo
    $oldFile = UploadedFile::fake()->image('old_logo.png');
    $oldPath = $oldFile->store('settings/logo', 'public');
    Setting::updateOrCreate(['key' => 'school_logo'], ['value' => $oldPath]);

    $newFile = UploadedFile::fake()->image('new_logo.png');

    $this->actingAs($this->admin)
        ->postJson('/api/settings', [
            'school_logo' => $newFile,
        ])
        ->assertOk();

    Storage::disk('public')->assertMissing($oldPath);
    $newPath = Setting::where('key', 'school_logo')->first()->value;
    Storage::disk('public')->assertExists($newPath);
});

it('forbids non-admin users from updating settings', function () {
    $this->actingAs($this->teacher)
        ->postJson('/api/settings', [
            'school_name' => 'Should Fail',
        ])
        ->assertForbidden();
});

it('updates extended school profile', function () {
    $this->actingAs($this->admin)
        ->postJson('/api/settings', [
            'school_name' => 'SMK Updated',
            'school_email' => 'updated@school.com',
            'school_phone' => '08123456789',
            'school_address' => 'Jl. Baru No. 1',
            'school_headmaster' => 'New Headmaster',
        ])
        ->assertOk()
        ->assertJsonFragment([
            'school_name' => 'SMK Updated',
            'school_email' => 'updated@school.com',
            'school_phone' => '08123456789',
            'school_address' => 'Jl. Baru No. 1',
            'school_headmaster' => 'New Headmaster',
        ]);

    expect(Setting::where('key', 'school_email')->first()->value)->toBe('updated@school.com');
});

it('updates school mascot', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->image('mascot.png');

    $this->actingAs($this->admin)
        ->postJson('/api/settings', [
            'school_mascot' => $file,
        ])
        ->assertOk();

    $mascotPath = Setting::where('key', 'school_mascot')->first()->value;
    expect($mascotPath)->not->toBeNull();
    Storage::disk('public')->assertExists($mascotPath);
});

it('deletes old mascot when updating new mascot', function () {
    Storage::fake('public');

    // Setup initial mascot
    $oldFile = UploadedFile::fake()->image('old_mascot.png');
    $oldPath = $oldFile->store('settings/mascot', 'public');
    Setting::updateOrCreate(['key' => 'school_mascot'], ['value' => $oldPath]);

    
    $newFile = UploadedFile::fake()->image('new_mascot.png');

    $this->actingAs($this->admin)
        ->postJson('/api/settings', [
            'school_mascot' => $newFile,
        ])
        ->assertOk();

    Storage::disk('public')->assertMissing($oldPath);
    $newPath = Setting::where('key', 'school_mascot')->first()->value;
    Storage::disk('public')->assertExists($newPath);
});

it('returns mascot URL in sync endpoint', function () {
    Setting::updateOrCreate(['key' => 'school_mascot'], ['value' => 'settings/mascot/test.png']);

    $this->actingAs($this->admin)
        ->getJson('/api/settings/sync')
        ->assertOk()
        ->assertJsonFragment(['school_mascot_url' => asset('storage/settings/mascot/test.png')]); // TEMPAT BUAT NARO MASCOT INO DAN RASI
});
