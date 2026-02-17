<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\ClassSchedule;
use App\Models\DailySchedule;
use App\Models\ScheduleItem;
use App\Models\Subject;
use App\Models\TeacherProfile;
use App\Http\Requests\StoreClassScheduleRequest;
use App\Http\Requests\UpdateClassScheduleRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ScheduleController extends Controller
{
    /**
     * List Class Schedules
     */
    public function index(Request $request): JsonResponse
    {
        $query = ClassSchedule::query()->with(['class:id,grade,label']);

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        if ($request->filled('semester')) {
            $query->where('semester', $request->semester);
        }

        return response()->json($query->latest()->paginate());
    }

    /**
     * Store a new Class Schedule
     */
    public function store(StoreClassScheduleRequest $request): JsonResponse
    {
        $data = $request->validated();

        $schedule = DB::transaction(function () use ($data) {
            $classSchedule = ClassSchedule::create([
                'class_id' => $data['class_id'],
                'semester' => $data['semester'],
                'year' => $data['year'],
                'is_active' => $data['is_active'] ?? true,
            ]);

            foreach ($data['days'] as $dayData) {
                $dailySchedule = $classSchedule->dailySchedules()->create([
                    'day' => $dayData['day'],
                ]);

                if (isset($dayData['items'])) {
                    foreach ($dayData['items'] as $itemData) {
                        $dailySchedule->scheduleItems()->create($itemData);
                    }
                }
            }

            return $classSchedule;
        });

        return response()->json($schedule->load(['class', 'dailySchedules.scheduleItems.subject', 'dailySchedules.scheduleItems.teacher.user']), 201);
    }

    /**
     * Show a Class Schedule
     */
    public function show(ClassSchedule $schedule): JsonResponse
    {
        return response()->json($schedule->load([
            'class',
            'dailySchedules.scheduleItems.subject',
            'dailySchedules.scheduleItems.teacher.user'
        ]));
    }

    /**
     * Update a Class Schedule
     */
    public function update(UpdateClassScheduleRequest $request, ClassSchedule $schedule): JsonResponse
    {
        $data = $request->validated();

        $schedule = DB::transaction(function () use ($schedule, $data) {
            $schedule->update([
                'semester' => $data['semester'] ?? $schedule->semester,
                'year' => $data['year'] ?? $schedule->year,
                'is_active' => $data['is_active'] ?? $schedule->is_active,
            ]);

            if (isset($data['days'])) {
                // Full replacement of days strategy for simplicity and correctness
                $schedule->dailySchedules()->delete();

                foreach ($data['days'] as $dayData) {
                    $dailySchedule = $schedule->dailySchedules()->create([
                        'day' => $dayData['day'],
                    ]);

                    if (isset($dayData['items'])) {
                        foreach ($dayData['items'] as $itemData) {
                            $dailySchedule->scheduleItems()->create($itemData);
                        }
                    }
                }
            }

            return $schedule;
        });

        return response()->json($schedule->load(['class', 'dailySchedules.scheduleItems.subject', 'dailySchedules.scheduleItems.teacher.user']));
    }

    /**
     * Delete a Class Schedule
     */
    public function destroy(ClassSchedule $schedule): JsonResponse
    {
        $schedule->delete();
        return response()->json(['message' => 'Schedule deleted successfully']);
    }

    /**
     * Get Schedules by Teacher
     */
    public function byTeacher(Request $request, TeacherProfile $teacher): JsonResponse
    {
        // Return ScheduleItems for this teacher, grouped by ClassSchedule?
        // Or just a flat list of items with their day/class info?
        // Let's return flat list of items ordered by day/time
        
        $query = ScheduleItem::query()
            ->where('teacher_id', $teacher->id)
            ->with(['dailySchedule.classSchedule.class', 'subject'])
            ->whereHas('dailySchedule.classSchedule', function($q) {
                $q->where('is_active', true);
            });

        return response()->json($query->get());
    }

    /**
     * Get My Schedules (Student/Teacher)
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->user_type === 'teacher') {
            $teacher = $user->teacherProfile;
            if (!$teacher) {
                 return response()->json(['message' => 'Profile not found'], 404);
            }

            // Get all items for active schedules
            $items = ScheduleItem::query()
                ->where('teacher_id', $teacher->id)
                ->with(['dailySchedule.classSchedule.class', 'subject'])
                ->whereHas('dailySchedule.classSchedule', function($q) {
                    $q->where('is_active', true);
                })
                ->get()
                ->map(function ($item) {
                     return [
                        'day' => $item->dailySchedule->day,
                        'start_time' => $item->start_time,
                        'end_time' => $item->end_time,
                        'class' => $item->dailySchedule->classSchedule->class->name,
                        'subject' => $item->subject->name ?? 'N/A',
                        'room' => $item->room,
                     ];
                });

            return response()->json(['items' => $items]);
        }

        if ($user->user_type === 'student') {
            $student = $user->studentProfile;
            if (!$student) {
                return response()->json(['message' => 'Profile not found'], 404);
            }

            $schedule = ClassSchedule::query()
                ->where('class_id', $student->class_id)
                ->where('is_active', true)
                ->with(['dailySchedules.scheduleItems.subject', 'dailySchedules.scheduleItems.teacher.user'])
                ->first();

            if (!$schedule) {
                return response()->json(['message' => 'No active schedule found'], 404);
            }
            
            return response()->json($schedule);
        }
        
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    /**
     * Bulk Upsert Schedules for a Class
     */
    public function bulkUpsert(Request $request, Classes $class): JsonResponse
    {
        $data = $request->validate([
            'year' => 'required|string',
            'semester' => 'required|string',
            'is_active' => 'boolean',
            'days' => 'required|array',
            'days.*.day' => 'required|string',
            'days.*.items' => 'array',
            'days.*.items.*.subject_id' => 'required|exists:subjects,id',
            'days.*.items.*.teacher_id' => 'required|exists:teacher_profiles,id',
            'days.*.items.*.start_time' => 'required',
            'days.*.items.*.end_time' => 'required',
            'days.*.items.*.room' => 'nullable|string',
        ]);

        $schedule = DB::transaction(function () use ($class, $data) {
            $classSchedule = ClassSchedule::updateOrCreate(
                [
                    'class_id' => $class->id,
                    'year' => $data['year'],
                    'semester' => $data['semester'],
                ],
                [
                    'is_active' => $data['is_active'] ?? true,
                ]
            );

            if ($classSchedule->is_active) {
                ClassSchedule::where('class_id', $class->id)
                    ->where('id', '!=', $classSchedule->id)
                    ->update(['is_active' => false]);
            }

            $classSchedule->dailySchedules()->delete();

            foreach ($data['days'] as $dayData) {
                $dailySchedule = $classSchedule->dailySchedules()->create([
                    'day' => $dayData['day'],
                ]);

                if (isset($dayData['items'])) {
                    foreach ($dayData['items'] as $itemData) {
                        $dailySchedule->scheduleItems()->create($itemData);
                    }
                }
            }

            return $classSchedule;
        });

        return response()->json($schedule->load(['class', 'dailySchedules.scheduleItems.subject', 'dailySchedules.scheduleItems.teacher.user']));
    }
}
