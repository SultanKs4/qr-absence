<?php

namespace App\Http\Controllers;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{
    /**
     * List Students
     *
     * Retrieve a list of all students with filtering options.
     */
    public function index(Request $request): JsonResponse
    {
        $query = StudentProfile::query()->with(['user', 'classRoom']);

        if ($request->filled('nisn')) {
            $query->where('nisn', $request->string('nisn'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('nisn', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($u) use ($search) {
                        $u->where('name', 'like', "%{$search}%")
                            ->orWhere('username', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = $request->integer('per_page', 15);

        if ($perPage === -1) {
            return response()->json(\App\Http\Resources\StudentResource::collection($query->latest()->get()));
        }

        return \App\Http\Resources\StudentResource::collection($query->latest()->paginate($perPage)->appends($request->all()))->response();
    }

    /**
     * Import Students
     *
     * Bulk import students from a data array.
     */
    public function import(Request $request): JsonResponse
    {
        $dto = \App\Data\StudentImportData::fromRequest($request);
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.name' => ['required', 'string', 'max:255'],
            'items.*.username' => ['required', 'string', 'max:50', 'distinct', 'unique:users,username'],
            'items.*.email' => ['nullable', 'email', 'distinct', 'unique:users,email'],
            'items.*.password' => ['nullable', 'string', 'min:6'],
            'items.*.nisn' => ['required', 'string', 'distinct', 'unique:student_profiles,nisn'],
            'items.*.nis' => ['required', 'string', 'distinct', 'unique:student_profiles,nis'],
            'items.*.gender' => ['required', 'in:L,P'],
            'items.*.address' => ['required', 'string'],
            'items.*.class_id' => ['required', 'exists:classes,id'],
            'items.*.is_class_officer' => ['nullable', 'boolean'],
            'items.*.phone' => ['nullable', 'string', 'max:30'],
            'items.*.contact' => ['nullable', 'string', 'max:50'],
        ], [
            'items.*.username.unique' => 'Username :input sudah digunakan.',
            'items.*.email.unique' => 'Email :input sudah digunakan.',
            'items.*.nisn.unique' => 'NISN :input sudah digunakan oleh siswa lain.',
            'items.*.nis.unique' => 'NIS :input sudah digunakan oleh siswa lain.',
            'items.*.username.distinct' => 'Username :input duplikat dalam daftar import.',
            'items.*.email.distinct' => 'Email :input duplikat dalam daftar import.',
            'items.*.nisn.distinct' => 'NISN :input duplikat dalam daftar import.',
            'items.*.nis.distinct' => 'NIS :input duplikat dalam daftar import.',
        ]);

        $count = 0;

        DB::transaction(function () use ($dto, &$count): void {
            foreach ($dto->items as $item) {
                $user = User::create([
                    'name' => $item['name'],
                    'username' => $item['username'],
                    'email' => $item['email'] ?? null,
                    'password' => Hash::make($item['password'] ?? 'password123'),
                    'phone' => $item['phone'] ?? null,
                    'contact' => $item['contact'] ?? null,
                    'user_type' => 'student',
                ]);

                $user->studentProfile()->create([
                    'nisn' => $item['nisn'],
                    'nis' => $item['nis'],
                    'gender' => $item['gender'],
                    'address' => $item['address'],
                    'class_id' => $item['class_id'],
                    'is_class_officer' => $item['is_class_officer'] ?? false,
                ]);
                $count++;
            }
        });

        return response()->json([
            'created' => $count,
            'message' => "Successfully imported {$count} students.",
        ], 201);
    }

    /**
     * Create Student
     *
     * Create a new student and their associated user account.
     */
    public function store(\App\Http\Requests\StoreStudentRequest $request): JsonResponse
    {
        $data = $request->validated();

        $student = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'username' => $data['username'],
                'email' => $data['email'] ?? null,
                'password' => Hash::make($data['password']),
                'phone' => $data['phone'] ?? null,
                'contact' => $data['contact'] ?? null,
                'user_type' => 'student',
            ]);

            return $user->studentProfile()->create([
                'nisn' => $data['nisn'],
                'nis' => $data['nis'],
                'gender' => $data['gender'],
                'address' => $data['address'],
                'class_id' => $data['class_id'],
                'is_class_officer' => $data['is_class_officer'] ?? false,
                'parent_phone' => $data['parent_phone'] ?? null,
            ]);
        });

        return response()->json(new \App\Http\Resources\StudentResource($student->load(['user', 'classRoom'])), 201);
    }

    /**
     * Show Student
     *
     * Retrieve a specific student profile by ID.
     */
    public function show(StudentProfile $student): JsonResponse
    {
        return response()->json(new \App\Http\Resources\StudentResource($student->load(['user', 'classRoom', 'attendances'])));
    }

    /**
     * Update Student
     *
     * Update a specific student profile and associated user account.
     */
    public function update(\App\Http\Requests\UpdateStudentRequest $request, StudentProfile $student): JsonResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $student): void {
            if (isset($data['name']) || isset($data['email']) || isset($data['password']) || isset($data['phone']) || isset($data['contact'])) {
                $student->user->update([
                    'name' => $data['name'] ?? $student->user->name,
                    'email' => $data['email'] ?? $student->user->email,
                    'password' => isset($data['password']) ? Hash::make($data['password']) : $student->user->password,
                    'phone' => $data['phone'] ?? $student->user->phone,
                    'contact' => $data['contact'] ?? $student->user->contact,
                ]);
            }

            $student->update([
                'gender' => $data['gender'] ?? $student->gender,
                'address' => $data['address'] ?? $student->address,
                'class_id' => $data['class_id'] ?? $student->class_id,
                'is_class_officer' => $data['is_class_officer'] ?? $student->is_class_officer,
                'parent_phone' => $data['parent_phone'] ?? $student->parent_phone,
            ]);
        });

        return response()->json(new \App\Http\Resources\StudentResource($student->fresh()->load(['user', 'classRoom'])));
    }

    /**
     * Delete Student
     *
     * Delete a specific student and their user account.
     */
    public function destroy(StudentProfile $student): JsonResponse
    {
        $student->user()->delete();

        return response()->json(['message' => 'Deleted']);
    }

    /**
     * Get Student Attendance History
     *
     * Retrieve the attendance history for a specific student.
     */
    public function attendanceHistory(Request $request, StudentProfile $student): JsonResponse
    {
        $query = $student->attendances()
            ->with(['schedule.class', 'schedule.teacher.user']) // Added relations for detail view
            ->latest('date');

        if ($request->filled('from')) {
            $query->whereDate('date', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('date', '<=', $request->date('to'));
        }

        if ($request->integer('per_page') === -1) {
            return response()->json($query->get());
        }

        return response()->json(
            $query->paginate($request->integer('per_page', 10))
        );
    }
}
