<?php

namespace App\Http\Controllers;

use App\Models\StudentProfile;
use App\Models\TeacherProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDataController extends Controller
{
    /**
     * Check for duplicate data
     *
     * Check for duplicate username, NISN, NIP, or email across users, students, and teachers.
     * This helps avoid "Unique constraint" errors during bulk imports or master data sync.
     */
    public function validateDuplicates(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.username' => ['required', 'string'],
            'items.*.nisn' => ['nullable', 'string'],
            'items.*.nip' => ['nullable', 'string'],
            'items.*.email' => ['nullable', 'email'],
        ]);

        $duplicates = [];

        foreach ($data['items'] as $index => $item) {
            $itemDuplicates = [];

            // Check Username
            if (User::where('username', $item['username'])->exists()) {
                $itemDuplicates[] = "Username '{$item['username']}' sudah terdaftar.";
            }

            // Check NISN (Student)
            if (! empty($item['nisn']) && StudentProfile::where('nisn', $item['nisn'])->exists()) {
                $itemDuplicates[] = "NISN '{$item['nisn']}' sudah terdaftar.";
            }

            // Check NIP (Teacher)
            if (! empty($item['nip']) && TeacherProfile::where('nip', $item['nip'])->exists()) {
                $itemDuplicates[] = "NIP '{$item['nip']}' sudah terdaftar.";
            }

            // Check Email
            if (! empty($item['email']) && User::where('email', $item['email'])->exists()) {
                $itemDuplicates[] = "Email '{$item['email']}' sudah terdaftar.";
            }

            if (! empty($itemDuplicates)) {
                $duplicates[] = [
                    'index' => $index,
                    'username' => $item['username'],
                    'errors' => $itemDuplicates,
                ];
            }
        }

        return response()->json([
            'has_duplicates' => ! empty($duplicates),
            'duplicates' => $duplicates,
            'message' => ! empty($duplicates) ? 'Ditemukan data duplikat.' : 'Tidak ada data duplikat found.',
        ]);
    }

    /**
     * Bulk sync master data with duplication check.
     * This is a placeholder for the generic sync endpoint mentioned in Item #2.
     */
    public function sync(Request $request): JsonResponse
    {
        // Implementation for Item #2: Master data sync endpoint
        // For now, we provide the validation logic as requested to "Cegah Data Duplikat"
        return $this->validateDuplicates($request);
    }
}
