<?php

namespace App\Http\Controllers;

use App\Events\SchedulesBulkUpdated;
use App\Models\Classes;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\TeacherProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Schedule::query()->with(['teacher.user:id,name', 'class:id,grade,label']);

        if ($request->user()->user_type === 'teacher') {
            $query->where('teacher_id', optional($request->user()->teacherProfile)->id);
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->integer('class_id'));
        }

        if ($request->filled('date')) {
            $day = Carbon::parse($request->string('date'))->format('l');
            $query->where('day', $day);
        }

        return response()->json($query->latest()->paginate());
    }

    public function byTeacher(Request $request, TeacherProfile $teacher): JsonResponse
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $query = Schedule::query()
            ->with(['teacher.user', 'class'])
            ->where('teacher_id', $teacher->id);

        if ($request->filled('from')) {
            $from = Carbon::parse($request->string('from'))->format('l');
            $query->where('day', $from);
        }

        if ($request->filled('to')) {
            $to = Carbon::parse($request->string('to'))->format('l');
            $query->where('day', $to);
        }

        $perPage = $this->resolvePerPage($request);
        $query->orderBy('day')->orderBy('start_time');

        return response()->json($perPage ? $query->paginate($perPage) : $query->get());
    }

    public function byClass(Request $request, Classes $class): JsonResponse
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $query = Schedule::query()
            ->with(['teacher.user', 'class'])
            ->where('class_id', $class->id);

        if ($request->filled('from')) {
            $from = Carbon::parse($request->string('from'))->format('l');
            $query->where('day', $from);
        }

        if ($request->filled('to')) {
            $to = Carbon::parse($request->string('to'))->format('l');
            $query->where('day', $to);
        }

        $perPage = $this->resolvePerPage($request);
        $query->orderBy('day')->orderBy('start_time');

        return response()->json($perPage ? $query->paginate($perPage) : $query->get());
    }

    public function me(Request $request): JsonResponse
    {
        if ($request->user()->user_type === 'teacher') {
            $date = $request->filled('date')
                ? Carbon::parse($request->string('date'))
                : now();
            $day = $date->format('l');

            $schedules = Schedule::query()
                ->with(['teacher.user:id,name', 'class:id,grade,label'])
                ->where('teacher_id', $request->user()->teacherProfile?->id)
                ->where('day', $day)
                ->orderBy('start_time')
                ->get();

            return response()->json([
                'date' => $date->toDateString(),
                'day' => $day,
                'status' => $schedules->isEmpty() ? 'no_schedule' : 'has_schedule',
                'message' => $schedules->isEmpty() ? 'Tidak ada jam mengajar hari ini' : 'Jadwal ditemukan',
                'items' => $schedules,
            ]);
        }

        if ($request->user()->user_type !== 'student' || ! $request->user()->studentProfile) {
            abort(403, 'Hanya untuk siswa');
        }

        $date = $request->filled('date')
            ? Carbon::parse($request->string('date'))
            : now();

        $day = $date->format('l');

        $schedules = Schedule::query()
            ->with(['teacher.user:id,name', 'class:id,grade,label'])
            ->where('class_id', $request->user()->studentProfile->class_id)
            ->where('day', $day)
            ->orderBy('start_time')
            ->get();

        return response()->json([
            'date' => $date->toDateString(),
            'day' => $day,
            'items' => $schedules,
        ]);
    }

    public function store(\App\Http\Requests\StoreScheduleRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['subject_id']) && ! isset($data['subject_name'])) {
            $subject = Subject::find($data['subject_id']);
            $data['subject_name'] = $subject?->name;
        }

        if (! isset($data['title'])) {
            $data['title'] = $data['subject_name'] ?? 'Mata Pelajaran';
        }

        // Validate Teacher Subject
        if (isset($data['teacher_id']) && isset($data['subject_name'])) {
            $teacher = TeacherProfile::find($data['teacher_id']);
            if ($teacher && $teacher->subject && stripos($data['subject_name'], $teacher->subject) === false) {
                throw ValidationException::withMessages([
                    'teacher_id' => ["Guru {$teacher->user->name} mengajar {$teacher->subject}, bukan {$data['subject_name']}"],
                ]);
            }
        }

        $schedule = Schedule::create($data);

        return response()->json($schedule->load(['teacher.user:id,name', 'class:id,grade,label']), 201);
    }

    public function show(Request $request, Schedule $schedule): JsonResponse
    {
        if ($request->user()->user_type === 'teacher' && $schedule->teacher_id !== optional($request->user()->teacherProfile)->id) {
            abort(403, 'Tidak boleh melihat jadwal guru lain');
        }

        return response()->json($schedule->load(['teacher.user:id,name', 'class:id,grade,label', 'qrcodes', 'attendances']));
    }

    public function update(\App\Http\Requests\UpdateScheduleRequest $request, Schedule $schedule): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['subject_id']) && ! isset($data['subject_name'])) {
            $subject = Subject::find($data['subject_id']);
            $data['subject_name'] = $subject?->name;
        }

        if (array_key_exists('subject_name', $data) && ! isset($data['title'])) {
            $data['title'] = $data['subject_name'];
        }

        // Validate Teacher Subject on Update
        if (isset($data['teacher_id']) || isset($data['subject_name'])) {
            $teacherId = $data['teacher_id'] ?? $schedule->teacher_id;
            $subjectName = $data['subject_name'] ?? $schedule->subject_name;

            $teacher = TeacherProfile::find($teacherId);
            if ($teacher && $teacher->subject && $subjectName && stripos($subjectName, $teacher->subject) === false) {
                throw ValidationException::withMessages([
                    'teacher_id' => ["Guru {$teacher->user->name} mengajar {$teacher->subject}, bukan {$subjectName}"],
                ]);
            }
        }

        $schedule->update($data);

        return response()->json($schedule->load(['teacher.user:id,name', 'class:id,grade,label']));
    }

    public function bulkUpsert(Request $request, Classes $class): JsonResponse
    {
        $dto = \App\Data\BulkScheduleData::fromRequest($request);
        $request->validate([
            'day' => ['required', 'string'],
            'semester' => ['required', 'integer'],
            'year' => ['required', 'integer'],
            'items' => ['required', 'array'],
            'items.*.subject_name' => ['nullable', 'string', 'max:255'],
            'items.*.subject_id' => ['nullable', 'exists:subjects,id'],
            'items.*.teacher_id' => ['required', 'exists:teacher_profiles,id'],
            'items.*.start_time' => ['required', 'date_format:H:i'],
            'items.*.end_time' => ['required', 'date_format:H:i'],
            'items.*.room' => ['nullable', 'string', 'max:50'],
        ]);

        $day = $this->normalizeDay($dto->day);

        // Pre-validate input
        foreach ($dto->items as $index => $item) {
            $start = Carbon::createFromFormat('H:i', $item['start_time']);
            $end = Carbon::createFromFormat('H:i', $item['end_time']);

            if ($end->lessThanOrEqualTo($start)) {
                throw ValidationException::withMessages([
                    'items.'.$index.'.end_time' => ['End time must be after start time.'],
                ]);
            }

            // Validate Teacher Subject
            $teacher = TeacherProfile::find($item['teacher_id']);
            $subjectName = $item['subject_name'] ?? null;

            if (isset($item['subject_id']) && ! $subjectName) {
                $subject = Subject::find($item['subject_id']);
                $subjectName = $subject?->name;
            }

            if ($teacher && $teacher->subject && $subjectName) {
                if (stripos($subjectName, $teacher->subject) === false) {
                    throw ValidationException::withMessages([
                        "items.$index.teacher_id" => ["Guru {$teacher->user->name} mengajar {$teacher->subject}, bukan {$subjectName}"],
                    ]);
                }
            }
        }

        $created = collect();

        DB::transaction(function () use ($class, $day, $dto, $created): void {
            $class->schedules()
                ->where('day', $day)
                ->where('semester', $dto->semester)
                ->where('year', $dto->year)
                ->delete();

            foreach ($dto->items as $item) {
                $subjectName = $item['subject_name'] ?? null;

                if (isset($item['subject_id']) && ! $subjectName) {
                    $subject = Subject::find($item['subject_id']);
                    $subjectName = $subject?->name;
                }

                $created->push(Schedule::create([
                    'day' => $day,
                    'start_time' => $item['start_time'],
                    'end_time' => $item['end_time'],
                    'title' => $subjectName ?? 'Mata Pelajaran',
                    'subject_name' => $subjectName,
                    'teacher_id' => $item['teacher_id'],
                    'class_id' => $class->id,
                    'room' => $item['room'] ?? null,
                    'semester' => $dto->semester,
                    'year' => $dto->year,
                ]));
            }
        });

        $createdIds = $created->pluck('id')->all();
        $schedules = Schedule::with(['teacher.user:id,name', 'class:id,grade,label'])
            ->whereIn('id', $createdIds)
            ->get();

        Log::info('schedules.bulk.updated', [
            'class_id' => $class->id,
            'day' => $day,
            'semester' => $dto->semester,
            'year' => $dto->year,
            'count' => $created->count(),
            'user_id' => $request->user()->id,
        ]);

        SchedulesBulkUpdated::dispatch($class->id, $day, $dto->semester, $dto->year, $created->count());

        return response()->json([
            'class_id' => $class->id,
            'day' => $day,
            'semester' => $dto->semester,
            'year' => $dto->year,
            'count' => $created->count(),
            'schedules' => $schedules,
        ]);
    }

    public function destroy(Schedule $schedule): JsonResponse
    {
        $schedule->delete();

        return response()->json(['message' => 'Deleted']);
    }

    private function normalizeDay(string $day): string
    {
        $map = [
            'senin' => 'Monday',
            'selasa' => 'Tuesday',
            'rabu' => 'Wednesday',
            'kamis' => 'Thursday',
            'jumat' => 'Friday',
            'jum\'at' => 'Friday',
        ];

        $lower = strtolower($day);

        return $map[$lower] ?? $day;
    }

    private function resolvePerPage(Request $request): ?int
    {
        if (! $request->filled('per_page') && ! $request->filled('page')) {
            return null;
        }

        $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $perPage = $request->integer('per_page', 15);

        return min(max($perPage, 1), 200);
    }
}
