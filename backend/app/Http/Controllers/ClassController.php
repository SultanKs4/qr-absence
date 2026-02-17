<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClassRequest;
use App\Http\Requests\UpdateClassRequest;
use App\Http\Requests\UploadScheduleImageRequest;
use App\Models\Classes;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ClassController extends Controller
{
    /**
     * List Classes
     *
     * Retrieve a list of all classes.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 15);

        $query = Classes::query()->with(['major', 'homeroomTeacher.user'])->latest();

        if ($perPage === -1) {
            return \App\Http\Resources\ClassResource::collection($query->get())->response();
        }

        return \App\Http\Resources\ClassResource::collection($query->paginate($perPage))->response();
    }

    /**
     * Create Class
     *
     * Create a new class.
     */
    public function store(StoreClassRequest $request): JsonResponse
    {
        $data = $request->validated();

        $class = \Illuminate\Support\Facades\DB::transaction(function () use ($data) {
            $class = Classes::create([
                'grade' => $data['grade'],
                'label' => $data['label'],
                'major_id' => $data['major_id'] ?? null,
            ]);

            if (isset($data['homeroom_teacher_id'])) {
                \App\Models\TeacherProfile::where('id', $data['homeroom_teacher_id'])
                    ->update(['homeroom_class_id' => $class->id]);
            }

            return $class;
        });

        return response()->json($class, 201);
    }

    /**
     * Show Class
     *
     * Retrieve a specific class by ID.
     */
    public function show(Classes $class): JsonResponse
    {
        return response()->json($class->load(['students.user', 'homeroomTeacher.user', 'major']));
    }

    /**
     * Update Class
     *
     * Update a specific class by ID.
     */
    public function update(UpdateClassRequest $request, Classes $class): JsonResponse
    {
        $data = $request->validated();

        \Illuminate\Support\Facades\DB::transaction(function () use ($class, $data) {
            $class->update($data);

            if (isset($data['homeroom_teacher_id'])) {
                // Clear old homeroom if exists
                \App\Models\TeacherProfile::where('homeroom_class_id', $class->id)
                    ->update(['homeroom_class_id' => null]);

                // Set new homeroom
                \App\Models\TeacherProfile::where('id', $data['homeroom_teacher_id'])
                    ->update(['homeroom_class_id' => $class->id]);
            }
        });

        return response()->json($class->load('homeroomTeacher.user'));
    }

    /**
     * Delete Class
     *
     * Delete a specific class by ID.
     */
    public function destroy(Classes $class): JsonResponse
    {
        $class->delete();

        return response()->json(['message' => 'Deleted']);
    }

    /**
     * Upload Schedule Image
     *
     * Upload a schedule image for a specific class.
     */
    public function uploadScheduleImage(UploadScheduleImageRequest $request, Classes $class): JsonResponse
    {

        if ($class->schedule_image_path) {
            Storage::disk('public')->delete($class->schedule_image_path);
        }

        $path = $request->file('file')->store('schedules/classes', 'public');
        $class->update(['schedule_image_path' => $path]);

        return response()->json(['url' => asset('storage/'.$path)]);
    }

    /**
     * Get Schedule Image
     *
     * Retrieve the schedule image for a specific class.
     */
    public function getScheduleImage(Classes $class)
    {
        if (! $class->schedule_image_path || ! Storage::disk('public')->exists($class->schedule_image_path)) {
            return response()->json(['message' => 'Image not found'], 404);
        }

        return response()->file(Storage::disk('public')->path($class->schedule_image_path));
    }

    /**
     * Delete Schedule Image
     *
     * Delete the schedule image for a specific class.
     */
    public function deleteScheduleImage(Classes $class): JsonResponse
    {
        if ($class->schedule_image_path) {
            Storage::disk('public')->delete($class->schedule_image_path);
            $class->update(['schedule_image_path' => null]);
        }

        return response()->json(['message' => 'Image deleted']);
    }

    /**
     * Get My Class
     *
     * Retrieve the class of the currently authenticated student.
     */
    public function myClass(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->studentProfile || ! $user->studentProfile->classRoom) {
            return response()->json(['message' => 'Class not found'], 404);
        }

        return response()->json($user->studentProfile->classRoom->load('major'));
    }

    /**
     * Get My Class Schedules
     *
     * Retrieve the schedules for the class of the currently authenticated student.
     */
    public function myClassSchedules(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->studentProfile || ! $user->studentProfile->class_id) {
            return response()->json(['message' => 'Class not found'], 404);
        }

        $query = $user->studentProfile->classRoom->schedules();

        if ($request->filled('date')) {
            // Assuming schedules have a day or date field, or we filter by day of week
            // But typical generic schedule is by day of week.
            // If date is provided, we map date to day of week.
            $day = date('l', strtotime($request->date));
            $query->where('day', $day);
        }

        return response()->json($query->with(['teacher.user'])->get());
    }

    /**
     * Get My Class Attendance
     *
     * Retrieve the attendance records for the class of the currently authenticated student.
     */
    public function myClassAttendance(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->studentProfile || ! $user->studentProfile->class_id) {
            return response()->json(['message' => 'Class not found'], 404);
        }

        // This usually means getting the attendance records for the class
        // We need Attendance model, which is linked to Student, which is linked to Class.
        // Or Attendance linked to Schedule which is linked to Class.
        // Assuming we want attendance of students IN this class.

        $classId = $user->studentProfile->class_id;

        $query = \App\Models\Attendance::whereHas('student.classRoom', function ($q) use ($classId) {
            $q->where('id', $classId);
        });

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->with(['student.user', 'schedule.teacher.user'])->latest()->get());
    }

    /**
     * Get My Class Students
     *
     * Retrieve a list of students in the class of the currently authenticated student.
     */
    public function myClassStudents(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->studentProfile || ! $user->studentProfile->class_id) {
            return response()->json(['message' => 'Class not found'], 404);
        }

        $students = $user->studentProfile->classRoom->students()
            ->with('user')
            ->get()
            ->sortBy('user.name')
            ->values();

        return response()->json($students);
    }
}
