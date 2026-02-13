<?php

namespace App\Http\Controllers;

use App\Models\Device;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceController extends Controller
{
    /**
     * Register Device
     *
     * Register a new device for the user (Mobile App).
     * For students, this will deactivate other devices as they are allowed only one active device.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string'],
            'name' => ['nullable', 'string', 'max:255'],
            'platform' => ['nullable', 'string', 'max:100'],
        ]);

        $user = $request->user();

        if ($user->user_type === 'student') {
            $user->devices()->update(['active' => false]);
        }

        $device = $user->devices()->updateOrCreate(
            ['identifier' => $data['identifier']],
            [
                'name' => $data['name'] ?? $request->userAgent(),
                'platform' => $data['platform'] ?? null,
                'active' => true,
                'last_used_at' => now(),
            ]
        );

        return response()->json($device, 201);
    }

    /**
     * Remove Device
     *
     * Unregister/delete a device.
     */
    public function destroy(Request $request, Device $device): JsonResponse
    {
        if ($device->user_id !== $request->user()->id) {
            abort(403, 'Tidak boleh menghapus device ini');
        }

        $device->delete();

        return response()->json(['message' => 'Device removed']);
    }
}
