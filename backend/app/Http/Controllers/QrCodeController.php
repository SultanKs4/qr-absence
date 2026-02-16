<?php

namespace App\Http\Controllers;

use App\Events\QrSessionCreated;
use App\Models\Qrcode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode as QrCodeFacade;

class QrCodeController extends Controller
{
    /**
     * List Active QR Codes
     *
     * Retrieve a list of currently active QR codes.
     */
    public function active(Request $request): JsonResponse
    {
        $items = Qrcode::query()
            ->with(['schedule.dailySchedule.classSchedule.class', 'issuer'])
            ->where('is_active', true)
            ->latest()
            ->paginate();

        return response()->json($items);
    }

    /**
     * Generate QR Code
     *
     * Generate a new QR code for a specific schedule item.
     */
    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'schedule_id' => ['required', 'exists:schedule_items,id'],
            'type' => ['required', 'in:student,teacher'],
            'expires_in_minutes' => ['nullable', 'integer', 'min:1', 'max:240'],
        ]);

        $schedule = \App\Models\ScheduleItem::with(['dailySchedule', 'dailySchedule.classSchedule.class.homeroomTeacher', 'teacher.user', 'subject'])->findOrFail($data['schedule_id']);
        $user = $request->user();

        if ($user->user_type === 'teacher') {
            $teacherId = optional($user->teacherProfile)->id;
            $isOwner = $schedule->teacher_id === $teacherId;
            $class = $schedule->dailySchedule->classSchedule->class;
            $isHomeroom = optional($class?->homeroomTeacher)->id === $teacherId;

            if (! $isOwner && ! $isHomeroom) {
                abort(403, 'Guru tidak boleh membuat QR untuk jadwal lain');
            }
        }

        if ($user->user_type === 'student') {
            $studentProfile = $user->studentProfile;

            if (! $studentProfile || ! $studentProfile->is_class_officer) {
                abort(403, 'Pengurus kelas saja yang boleh membuat QR');
            }

            $classId = $schedule->dailySchedule->classSchedule->class_id;
            if ($classId !== $studentProfile->class_id) {
                abort(403, 'Pengurus kelas hanya boleh membuat QR untuk kelasnya');
            }

            if ($data['type'] !== 'student') {
                abort(422, 'Pengurus kelas hanya boleh membuat QR siswa');
            }

            // Limit period: Officer can only generate for TODAY
            $today = now()->format('l'); // Monday, Tuesday...
            $scheduleDay = $schedule->dailySchedule->day;
            if (strcasecmp($scheduleDay, $today) !== 0) {
                abort(422, 'Pengurus kelas hanya boleh membuat QR untuk jadwal hari ini ('.$today.')');
            }
        }

        $expiresAt = now()->addMinutes($data['expires_in_minutes'] ?? 15);

        // Prevent concurrent active QR generation
        $qr = \Illuminate\Support\Facades\DB::transaction(function () use ($schedule, $data, $request, $expiresAt) {
            // Check for existing active QR for this schedule with lock
            $existing = Qrcode::where('schedule_id', $schedule->id)
                ->where('type', $data['type'])
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                if (! $existing->isExpired()) {
                    return $existing;
                }
                $existing->update(['is_active' => false, 'status' => 'expired']);
            }

            return Qrcode::create([
                'token' => Str::uuid()->toString(),
                'type' => $data['type'],
                'schedule_id' => $schedule->id,
                'issued_by' => $request->user()->id,
                'status' => 'available',
                'expires_at' => $expiresAt,
                'is_active' => true,
            ]);
        });

        $payload = [
            'token' => $qr->token,
            'type' => $qr->type,
            'schedule_id' => $qr->schedule_id,
            'expires_at' => $qr->expires_at->toIso8601String(),
        ];

        Log::info('qrcode.generated', [
            'schedule_id' => $qr->schedule_id,
            'type' => $qr->type,
            'issued_by' => $qr->issued_by,
            'expires_at' => $expiresAt->toIso8601String(),
        ]);

        $className = $schedule->dailySchedule->classSchedule->class->name ?? 'Unknown';
        $subjectName = $schedule->subject?->name ?? 'Unknown';
        $teacherName = $schedule->teacher->user->name ?? 'Unknown';

        // Generate mobile-friendly format
        $mobileFormat = sprintf(
            'ABSENSI|%s|%s|%s|%s',
            $className,
            $subjectName,
            now()->format('d-m-Y'),
            now()->format('H:i')
        );

        $svg = QrCodeFacade::format('svg')
            ->size(240)
            ->generate(json_encode($payload));

        QrSessionCreated::dispatch($qr);

        return response()->json([
            'qrcode' => $qr->load('schedule.dailySchedule.classSchedule.class'),
            'qr_svg' => base64_encode($svg),
            'payload' => $payload,
            'mobile_format' => $mobileFormat,
            'metadata' => [
                'class_name' => $className,
                'subject_name' => $subjectName,
                'teacher_name' => $teacherName,
                'start_time' => $schedule->start_time,
                'end_time' => $schedule->end_time,
            ],
        ], 201);
    }

    /**
     * Show QR Code Details
     *
     * Retrieve details of a specific QR code by token.
     */
    public function show(string $token): JsonResponse
    {
        $qr = Qrcode::with(['schedule.dailySchedule.classSchedule.class', 'schedule.teacher.user', 'issuer'])->where('token', $token)->firstOrFail();

        // Auto-expire if time passed
        if ($qr->is_active && $qr->isExpired()) {
            $qr->update(['is_active' => false, 'status' => 'expired']);
        }

        return response()->json($qr);
    }

    /**
     * Revoke QR Code
     *
     * Revoke (deactivate) an existing QR code.
     */
    public function revoke(Request $request, string $token): JsonResponse
    {
        $qr = Qrcode::with('schedule.dailySchedule.classSchedule.class.homeroomTeacher')->where('token', $token)->firstOrFail();

        if ($request->user()->user_type === 'teacher') {
            $teacherId = optional($request->user()->teacherProfile)->id;
            $isOwner = $qr->schedule?->teacher_id === $teacherId;
            $class = $qr->schedule?->dailySchedule?->classSchedule?->class;
            $isHomeroom = optional($class?->homeroomTeacher)->id === $teacherId;

            if (! $isOwner && ! $isHomeroom) {
                abort(403, 'Guru tidak boleh mencabut QR ini');
            }
        }

        if ($request->user()->user_type === 'student') {
            $studentProfile = $request->user()->studentProfile;

            if (! $studentProfile || ! $studentProfile->is_class_officer) {
                abort(403, 'Pengurus kelas saja yang boleh mencabut QR');
            }

            $classId = $qr->schedule?->dailySchedule?->classSchedule?->class_id;
            if ($classId !== $studentProfile->class_id) {
                abort(403, 'Pengurus kelas hanya boleh mencabut QR kelasnya');
            }
        }

        $qr->update(['is_active' => false, 'status' => 'expired']);

        Log::info('qrcode.revoked', [
            'token' => $qr->token,
            'schedule_id' => $qr->schedule_id,
            'revoked_by' => $request->user()->id,
        ]);

        return response()->json(['message' => 'QR revoked']);
    }
}
