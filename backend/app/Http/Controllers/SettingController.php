<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingRequest;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

// untuk update mascot baru
// setup untuk fitur mascot yang di implementasikan

class SettingController extends Controller
{
    /**
     * List Settings
     *
     * Retrieve all application settings, including school logo and mascot URLs.
     */
    public function index(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key');

        if (isset($settings['school_logo']) && $settings['school_logo']) {
            $settings['school_logo_url'] = asset('storage/'.$settings['school_logo']);
        }

        if (isset($settings['school_mascot']) && $settings['school_mascot']) {
            $settings['school_mascot_url'] = asset('storage/'.$settings['school_mascot']);
        }

        return response()->json([
            'status' => 'success',
            'data' => $settings,
        ]);
    }

    /**
     * Bulk Update Settings
     *
     * Update multiple settings at once.
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string|exists:settings,key',
            'settings.*.value' => 'nullable',
        ]);

        foreach ($request->settings as $setting) {
            Setting::where('key', $setting['key'])->update([
                'value' => $setting['value'],
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Settings updated successfully',
        ]);
    }

    /**
     * Update School Settings
     *
     * Update school profile settings, including logo and mascot uploads.
     */
    public function update(UpdateSettingRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('school_logo')) {
            $oldLogo = Setting::where('key', 'school_logo')->first()?->value;
            if ($oldLogo) {
                Storage::disk('public')->delete($oldLogo);
            }

            $path = $request->file('school_logo')->store('settings/logo', 'public');
            Setting::updateOrCreate(['key' => 'school_logo'], ['value' => $path]);
        }

        if ($request->hasFile('school_mascot')) {
            $oldMascot = Setting::where('key', 'school_mascot')->first()?->value;
            if ($oldMascot) {
                Storage::disk('public')->delete($oldMascot);
            }

            $path = $request->file('school_mascot')->store('settings/mascot', 'public');
            Setting::updateOrCreate(['key' => 'school_mascot'], ['value' => $path]);
        }

        // Handle other text fields
        $textFields = [
            'school_name', 'school_email', 'school_phone', 'school_address',
            'school_subdistrict', 'school_district', 'school_city', 'school_province',
            'school_postal_code', 'school_npsn', 'school_accreditation',
            'school_headmaster', 'school_headmaster_nip', 'school_type',
        ];

        foreach ($textFields as $field) {
            if (isset($data[$field])) {
                Setting::updateOrCreate(['key' => $field], ['value' => $data[$field]]);
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Settings updated successfully',
            'data' => $this->getSettingsWithUrls(),
        ]);
    }

    private function getSettingsWithUrls()
    {
        $settings = Setting::all()->pluck('value', 'key');

        if (isset($settings['school_logo']) && $settings['school_logo']) {
            $settings['school_logo_url'] = asset('storage/'.$settings['school_logo']);
        }

        if (isset($settings['school_mascot']) && $settings['school_mascot']) {
            $settings['school_mascot_url'] = asset('storage/'.$settings['school_mascot']);
        }

        return $settings;
    }

    /**
     * Sync App Context
     *
     * Retrieve essential application context like active school year, semester, and school settings.
     */
    public function sync(): JsonResponse
    {
        $settings = $this->getSettingsWithUrls();

        return response()->json([
            'school_year' => \App\Models\SchoolYear::where('active', true)->first(),
            'semester' => \App\Models\Semester::where('active', true)->first(),
            'settings' => $settings,
        ]);
    }

    /**
     * Public Settings
     *
     * Retrieve a subset of settings publicly available (e.g., for login page).
     */
    public function publicSettings(): JsonResponse
    {
        $keys = [
            'school_name',
            'school_logo',
            'school_mascot',
            'school_type',
            'school_address',
            'school_email',
            'school_phone',
            'school_npsn',
            'school_accreditation',
        ];

        $settings = \App\Models\Setting::whereIn('key', $keys)->get()->pluck('value', 'key');

        // Add logo and mascot URLs if they exist
        if ($settings->has('school_logo') && $settings['school_logo']) {
            $settings['school_logo_url'] = asset('storage/'.$settings['school_logo']);
        } else {
            $settings['school_logo_url'] = null;
        }

        if ($settings->has('school_mascot') && $settings['school_mascot']) {
            $settings['school_mascot_url'] = asset('storage/'.$settings['school_mascot']);
        } else {
            $settings['school_mascot_url'] = null;
        }

        return response()->json($settings);
    }
}
