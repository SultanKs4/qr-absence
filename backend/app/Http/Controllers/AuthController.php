<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use \App\Traits\IpMasker;

    public function login(Request $request): JsonResponse
    {
        Log::info('auth.login.attempt', [
            'ip' => $this->maskIp($request->ip()),
            'login' => $request->input('login'),
        ]);

        $data = $request->validate([
            'login' => ['required', 'string'],
            'password' => ['nullable', 'string'], // Password optional for NISN login
        ]);

        // Try to find user by username or email first
        $user = User::query()
            ->where('username', $data['login'])
            ->orWhere('email', $data['login'])
            ->first();

        // If not found, try to find student by NISN
        if (! $user) {
            $studentProfile = \App\Models\StudentProfile::where('nisn', $data['login'])
                ->orWhere('nis', $data['login'])
                ->first();

            if ($studentProfile) {
                $user = $studentProfile->user;
            }
        }

        // If user not found at all
        if (! $user) {
            throw ValidationException::withMessages([
                'login' => ['Invalid credentials'],
            ]);
        }

        // Check if this is a student trying to login with NISN/NIS only (no password)
        $isStudentNisnLogin = $user->user_type === 'student' &&
                               empty($data['password']) &&
                               ($studentProfile = \App\Models\StudentProfile::where('nisn', $data['login'])
                                   ->orWhere('nis', $data['login'])
                                   ->first()) !== null;

        // Check password for non-students OR students with password
        if (! $isStudentNisnLogin && ! Hash::check($data['password'] ?? '', $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Invalid credentials'],
            ]);
        }

        if (! $user->active) {
            throw ValidationException::withMessages([
                'login' => ['Account inactive'],
            ]);
        }

        if ($user->user_type === 'admin' && ! $user->adminProfile) {
            $user->adminProfile()->create(['type' => 'admin']);
        }

        $token = $user->createToken('api')->plainTextToken;

        Log::info('auth.login.success', [
            'user_id' => $user->id,
            'user_type' => $user->user_type,
        ]);

        // Determine base role for mobile navigation compatibility
        $role = $user->user_type;

        $isClassOfficer = $user->studentProfile?->is_class_officer ?? false;

        // Build Profile for Mobile app
        $profile = null;
        if ($user->user_type === 'student' && $user->studentProfile) {
            $profile = [
                'nis' => $user->studentProfile->nis,
                'class_name' => $user->studentProfile->classRoom?->name,
                'photo_url' => $user->photo_url ?? null,
            ];
        } elseif ($user->user_type === 'teacher' && $user->teacherProfile) {
            $profile = [
                'nip' => $user->teacherProfile->nip,
                'photo_url' => $user->photo_url ?? null,
            ];
        }

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $role, // Map precise role to user_type for Kotlin @SerializedName
                'is_class_officer' => $isClassOfficer,
                'profile' => $profile,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['adminProfile', 'teacherProfile', 'studentProfile', 'studentProfile.classRoom']);

        // Determine base role
        $role = $user->user_type;

        $isClassOfficer = $user->studentProfile?->is_class_officer ?? false;

        $profile = null;
        if ($user->user_type === 'student' && $user->studentProfile) {
            $profile = [
                'nis' => $user->studentProfile->nis,
                'class_name' => $user->studentProfile->classRoom?->name,
                'photo_url' => $user->photo_url ?? null,
            ];
        } elseif ($user->user_type === 'teacher' && $user->teacherProfile) {
            $profile = [
                'nip' => $user->teacherProfile->nip,
                'photo_url' => $user->photo_url ?? null,
            ];
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'user_type' => $role,
            'is_class_officer' => $isClassOfficer,
            'profile' => $profile,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        Log::info('auth.logout', [
            'user_id' => $request->user()->id,
            'user_type' => $request->user()->user_type,
        ]);

        return response()->json(['message' => 'Logged out']);
    }
}
