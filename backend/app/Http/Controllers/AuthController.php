<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use \App\Traits\IpMasker;

    /**
     * Login User
     *
     * Authenticate a user and return an access token.
     * Supports login via Username/Email, NISN (Students), or NIP/Kode Guru (Teachers).
     */
    public function login(LoginRequest $request): JsonResponse
    {
        Log::info('auth.login.attempt', [
            'ip' => $this->maskIp($request->ip()),
            'login' => $request->input('login'),
        ]);

        $data = $request->validated();

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

        // If still not found, try to find teacher by NIP or Kode Guru
        if (! $user) {
            $teacherProfile = \App\Models\TeacherProfile::where('nip', $data['login'])
                ->orWhere('kode_guru', $data['login'])
                ->first();

            if ($teacherProfile) {
                $user = $teacherProfile->user;
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

        // Determine precise role for Frontend/Deskta compatibility
        $actualRole = $user->user_type;
        if ($user->user_type === 'teacher') {
            $isHomeroom = $user->teacherProfile?->homeroom_class_id !== null;
            $actualRole = $isHomeroom ? 'wakel' : 'guru';
        } elseif ($user->user_type === 'student') {
            $actualRole = $user->studentProfile?->is_class_officer ? 'pengurus_kelas' : 'siswa';
        } elseif ($user->user_type === 'admin') {
            $actualRole = $user->adminProfile?->type ?? 'admin';
        }

        // Get token expiration in minutes from config
        $expiresInMinutes = config('sanctum.expiration', 60);

        return response()->json([
            'token' => $token,
            'expires_in' => $expiresInMinutes * 60, // Convert to seconds for compatibility
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'user_type' => $user->user_type, // Original DB type
                'role' => $actualRole, // Standardized role for UI
                'is_class_officer' => $isClassOfficer,
                'profile' => $profile,
            ],
        ]);
    }

    /**
     * Refresh Token
     *
     * Revoke the current token and issue a new one for extended session.
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();

        // Revoke current token
        $request->user()->currentAccessToken()?->delete();

        // Create new token
        $token = $user->createToken('api')->plainTextToken;

        $expiresInMinutes = config('sanctum.expiration', 60);

        Log::info('auth.token.refreshed', [
            'user_id' => $user->id,
            'user_type' => $user->user_type,
        ]);

        return response()->json([
            'token' => $token,
            'expires_in' => $expiresInMinutes * 60,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Get Current User
     *
     * Retrieve the currently authenticated user's profile information.
     */
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

        // Determine precise role for Frontend/Deskta compatibility
        $actualRole = $user->user_type;
        if ($user->user_type === 'teacher') {
            $isHomeroom = $user->teacherProfile?->homeroom_class_id !== null;
            $actualRole = $isHomeroom ? 'wakel' : 'guru';
        } elseif ($user->user_type === 'student') {
            $actualRole = $user->studentProfile?->is_class_officer ? 'pengurus_kelas' : 'siswa';
        } elseif ($user->user_type === 'admin') {
            $actualRole = $user->adminProfile?->type ?? 'admin';
        }

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'user_type' => $user->user_type,
            'role' => $actualRole,
            'is_class_officer' => $isClassOfficer,
            'profile' => $profile,
            'student_profile' => $user->studentProfile ? ['id' => $user->studentProfile->id] : null,
        ]);
    }

    /**
     * Logout User
     *
     * Revoke the current access token and log the user out.
     */
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
