<?php

namespace App\Http\Controllers;

use App\Models\AbsenceRequest;
use App\Models\StudentLeavePermission;
use App\Models\StudentProfile;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AbsenceRequestController extends Controller
{
    public function __construct(protected AttendanceService $attendanceService)
    {
    }

    /**
     * List my requests (Student) or class requests (Teacher)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->user_type === 'student') {
            $student = $user->studentProfile;
            if (! $student) {
                return response()->json(['message' => 'Student profile not found'], 404);
            }

            $requests = AbsenceRequest::where('student_id', $student->id)
                ->orderByDesc('created_at')
                ->paginate();

        } elseif ($user->user_type === 'teacher') {
            $teacher = $user->teacherProfile;
            if (! $teacher) {
                return response()->json(['message' => 'Teacher profile not found'], 404);
            }

            $query = AbsenceRequest::with(['student.user', 'classRoom']);

            if ($teacher->homeroom_class_id) {
                $query->where('class_id', $teacher->homeroom_class_id);
            } else {
                return response()->json(['message' => 'Only homeroom teachers can view requests'], 403);
            }

            if ($request->filled('status')) {
                $query->where('status', $request->string('status'));
            }

            $requests = $query->orderByDesc('created_at')->paginate();

        } else {
            // Admin
            $requests = AbsenceRequest::with(['student.user', 'classRoom'])
                ->orderByDesc('created_at')
                ->paginate();
        }

        return response()->json($requests);
    }

    /**
     * Create a new absence request
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', 'in:sick,permit,dispensation'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['required', 'string', 'max:500'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $user = $request->user();
        $student = null;

        if ($user->user_type === 'student') {
            $student = $user->studentProfile;
        } elseif ($user->user_type === 'teacher') {
             return response()->json(['message' => 'Only students can create requests currently'], 403);
        }

        if (! $student) {
            return response()->json(['message' => 'Student profile not found'], 404);
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('absence-attachments', 'public');
        }

        $absenceRequest = AbsenceRequest::create([
            'student_id' => $student->id,
            'class_id' => $student->class_id,
            'requested_by' => $user->id,
            'type' => $data['type'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'reason' => $data['reason'],
            'attachment_path' => $attachmentPath,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Absence request created successfully',
            'request' => $absenceRequest,
        ], 201);
    }

    /**
     * Show details
     */
    public function show(Request $request, AbsenceRequest $absenceRequest): JsonResponse
    {
        $this->authorizeView($request, $absenceRequest);
        return response()->json($absenceRequest->load(['student.user', 'classRoom', 'approver']));
    }

    /**
     * Approve Request
     */
    public function approve(Request $request, AbsenceRequest $absenceRequest): JsonResponse
    {
        $this->authorizeApprove($request, $absenceRequest);

        if ($absenceRequest->status !== 'pending') {
            return response()->json(['message' => 'Request already processed'], 422);
        }

        DB::transaction(function () use ($request, $absenceRequest) {
            $absenceRequest->update([
                'status' => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            $startDate = Carbon::parse($absenceRequest->start_date);
            $endDate = Carbon::parse($absenceRequest->end_date);
            $period = \Carbon\CarbonPeriod::create($startDate, $endDate);

            $permissionType = match($absenceRequest->type) {
                'sick' => 'sakit',
                'permit' => 'izin',
                'dispensation' => 'dispensasi',
                default => 'izin',
            };

            foreach ($period as $date) {
                StudentLeavePermission::create([
                    'student_id' => $absenceRequest->student_id,
                    'class_id' => $absenceRequest->class_id,
                    'granted_by' => $request->user()->id,
                    'type' => $permissionType,
                    'date' => $date->toDateString(),
                    'start_time' => '07:00',
                    'end_time' => null,
                    'reason' => $absenceRequest->reason,
                    'attachment_path' => $absenceRequest->attachment_path,
                    'status' => 'active',
                    'is_full_day' => true,
                ]);

                $this->attendanceService->createFullDayAttendance(
                    $absenceRequest->student,
                    $permissionType,
                    $date->toDateString(),
                    $absenceRequest->reason
                );
            }
        });

        return response()->json([
            'message' => 'Request approved',
            'request' => $absenceRequest->fresh(),
        ]);
    }

    /**
     * Reject Request
     */
    public function reject(Request $request, AbsenceRequest $absenceRequest): JsonResponse
    {
        $this->authorizeApprove($request, $absenceRequest);

        if ($absenceRequest->status !== 'pending') {
            return response()->json(['message' => 'Request already processed'], 422);
        }

        $absenceRequest->update([
            'status' => 'rejected',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return response()->json([
            'message' => 'Request rejected',
            'request' => $absenceRequest->fresh(),
        ]);
    }

    private function authorizeView(Request $request, AbsenceRequest $absenceRequest): void
    {
        $user = $request->user();
        if ($user->user_type === 'admin') return;
        if ($user->user_type === 'student' && $absenceRequest->student_id === $user->studentProfile?->id) return;
        if ($user->user_type === 'teacher' && $user->teacherProfile?->homeroom_class_id === $absenceRequest->class_id) return;

        abort(403, 'Unauthorized');
    }

    private function authorizeApprove(Request $request, AbsenceRequest $absenceRequest): void
    {
        $user = $request->user();
        if ($user->user_type === 'admin') return;
        
        // dd([
        //     'user_id' => $user->id,
        //     'user_type' => $user->user_type,
        //     'homeroom_class_id' => $user->teacherProfile?->homeroom_class_id,
        //     'request_class_id' => $absenceRequest->class_id,
        // ]);

        if ($user->user_type === 'teacher' && 
            (int)$user->teacherProfile?->homeroom_class_id === (int)$absenceRequest->class_id) 
            return;

        abort(403, 'Unauthorized');
    }
}
