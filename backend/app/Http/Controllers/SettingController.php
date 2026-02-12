<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingRequest;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;


// untuk update mascot baru 
 // setup untuk fitur mascot yang di implementasikan

class SettingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
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
     * Update bulk settings.
     */
    public function bulkUpdate(Request $request)
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
     * Update individual school settings including file upload. LGOO SEKOLAH
     */
    public function update(UpdateSettingRequest $request)
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
     * Sync settings and active context. TERMASUK LOGO SEKOLAH
     */
    public function sync()
    {
        $settings = $this->getSettingsWithUrls();

        return response()->json([
            'school_year' => \App\Models\SchoolYear::where('active', true)->first(),
            'semester' => \App\Models\Semester::where('active', true)->first(),
            'settings' => $settings,
        ]);
    }
}
