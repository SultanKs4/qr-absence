<?php

use App\Http\Controllers\AbsenceRequestController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\MajorController;
use App\Http\Controllers\MobileNotificationController;
use App\Http\Controllers\QrCodeController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\SchoolYearController;
use App\Http\Controllers\SemesterController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\TimeSlotController;
use App\Http\Controllers\WhatsAppController;
// use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::middleware(['auth:sanctum', 'activity', 'throttle:api'])->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Mobile-specific endpoints (backward compatible)
    Route::get('/mobile/notifications', [MobileNotificationController::class, 'index']);
    Route::post('/devices', [DeviceController::class, 'store']); // Match ApiService.kt @POST("devices")
    Route::get('/schedules', [ScheduleController::class, 'index']); // Match @GET("schedules")
    Route::get('/schedules/{schedule}', [ScheduleController::class, 'show']); // Match @GET("schedules/{schedule}")

    // Mobile dashboard endpoints
    Route::get('/me/dashboard/summary', [DashboardController::class, 'studentDashboard'])->middleware('role:student');
    Route::get('/me/dashboard/teacher-summary', [DashboardController::class, 'teacherDashboard'])->middleware('role:teacher');
    Route::get('/me/homeroom/dashboard', [DashboardController::class, 'homeroomDashboard'])->middleware('role:teacher');
    Route::get('/guru/dashboard', [DashboardController::class, 'teacherDashboard'])->middleware('role:teacher');

    // Mobile notifications alias
    Route::get('/me/notifications', [MobileNotificationController::class, 'index']);

    // Mobile follow-up endpoint
    // Route::get'/me/students/follow-up', [TeacherController::class, 'getStudentsFollowUp'])->middleware('role:teacher');
    Route::get('/me/students/follow-up', [TeacherController::class, 'getStudentsFollowUp'])->middleware('role:teacher');

    // Mobile specific teacher endpoints (attendance & stats)
    Route::middleware('role:teacher')->group(function () {
        Route::get('/me/attendance/history', [\App\Http\Controllers\Api\TeacherStatisticsController::class, 'attendanceHistory']); // Optional alias
        Route::get('/me/statistics/monthly', [\App\Http\Controllers\Api\TeacherStatisticsController::class, 'monthlySummary']);
    });

    // Public teachers list (read-only for mobile app)
    Route::get('/teachers', [TeacherController::class, 'index'])->middleware('role:admin,student,teacher');

    // Public classes list (read-only for mobile/web app)
    Route::get('/classes', [ClassController::class, 'index'])->middleware('role:admin,teacher,student');
    Route::get('/classes/{class}', [ClassController::class, 'show'])->middleware('role:admin,teacher,student');
    Route::get('/majors', [MajorController::class, 'index'])->middleware('role:admin,teacher,student');
    Route::get('/subjects', [SubjectController::class, 'index'])->middleware('role:admin,teacher,student');

    Route::middleware(['role:admin', 'admin-type:waka'])->group(function (): void {
        Route::post('/classes/{class}/schedules/bulk', [ScheduleController::class, 'bulkUpsert']);
        Route::get('/absence-requests', [AbsenceRequestController::class, 'index']);
        Route::post('/absence-requests/{absenceRequest}/approve', [AbsenceRequestController::class, 'approve']);
        Route::post('/absence-requests/{absenceRequest}/reject', [AbsenceRequestController::class, 'reject']);
        Route::get('/attendance/teachers/daily', [AttendanceController::class, 'teachersDailyAttendance']);
        Route::get('/waka/attendance/summary', [AttendanceController::class, 'wakaSummary']);
        Route::get('/waka/dashboard/summary', [DashboardController::class, 'wakaDashboard']);
        Route::get('/students/absences', [AttendanceController::class, 'studentsAbsences']);

        Route::post('/teachers/{teacher}/schedule-image', [TeacherController::class, 'uploadScheduleImage']);
        Route::delete('/teachers/{teacher}/schedule-image', [TeacherController::class, 'deleteScheduleImage']);
        Route::get('/teachers/{teacher}/attendance', [TeacherController::class, 'attendance']);

        Route::post('/classes/{class}/schedule-image', [ClassController::class, 'uploadScheduleImage']);
        Route::delete('/classes/{class}/schedule-image', [ClassController::class, 'deleteScheduleImage']);
    });

    Route::middleware('role:admin')->group(function (): void {
        Route::apiResource('majors', MajorController::class);
        Route::apiResource('classes', ClassController::class)->except(['index', 'show']); // show is public now
        Route::apiResource('teachers', TeacherController::class)->except(['index']); // index available publicly
        Route::post('/teachers/import', [TeacherController::class, 'import']);
        Route::apiResource('students', StudentController::class);
        Route::post('/students/import', [StudentController::class, 'import']);
        Route::get('/students/{student}/attendance', [StudentController::class, 'attendanceHistory']);
        Route::apiResource('schedules', ScheduleController::class)->except(['index', 'show']);
        Route::get('/teachers/{teacher}/schedules', [ScheduleController::class, 'byTeacher']);
        // Route::get('/classes/{class}/schedules', [ScheduleController::class, 'byClass']); // Moved to admin/teacher group
        Route::apiResource('school-years', SchoolYearController::class);
        Route::apiResource('semesters', SemesterController::class);
        Route::apiResource('rooms', RoomController::class);
        Route::apiResource('subjects', SubjectController::class)->except(['index']);
        Route::apiResource('time-slots', TimeSlotController::class);
        Route::post('/wa/send-text', [WhatsAppController::class, 'sendText']);
        Route::post('/wa/send-media', [WhatsAppController::class, 'sendMedia']);
        Route::get('/settings', [SettingController::class, 'index']);
        Route::post('/settings/bulk', [SettingController::class, 'bulkUpdate']);
        Route::post('/settings', [SettingController::class, 'update']);
        Route::get('/admin/summary', [DashboardController::class, 'adminSummary']);
        Route::get('/attendance/summary', [DashboardController::class, 'attendanceSummary']);
        Route::post('/admin/data/sync', [\App\Http\Controllers\AdminDataController::class, 'sync']);
    });

    Route::middleware('role:admin,teacher,student')->group(function (): void {
        Route::prefix('attendance')->group(function () {
            Route::post('/scan', [AttendanceController::class, 'scan'])->middleware('throttle:scan');
            Route::post('/manual', [AttendanceController::class, 'manual']);
            Route::post('/bulk-manual', [AttendanceController::class, 'bulkManual']);
        });
        Route::get('/qrcodes/active', [QrCodeController::class, 'active']);
        Route::post('/qrcodes/generate', [QrCodeController::class, 'generate']);
        Route::post('/me/class/qr-token', [QrCodeController::class, 'generate']); // Alias for Webta
        Route::get('/qrcodes/{token}', [QrCodeController::class, 'show']);
        Route::post('/qrcodes/{token}/revoke', [QrCodeController::class, 'revoke']);
        Route::get('/me/schedules', [ScheduleController::class, 'me']);
    });

    Route::middleware('role:admin,teacher')->group(function (): void {
        Route::get('/attendance/schedules/{schedule}', [AttendanceController::class, 'bySchedule']);
        Route::post('/attendance/{attendance}/excuse', [AttendanceController::class, 'markExcuse']);
        Route::patch('/attendance/{attendance}', [AttendanceController::class, 'markExcuse']); // Alias for Webta
        Route::get('/attendance/export', [AttendanceController::class, 'export']);
        Route::get('/attendance/export-pdf', [AttendanceController::class, 'downloadPdf']);
        Route::get('/attendance/recap', [AttendanceController::class, 'recap']);
        Route::get('/attendance/schedules/{schedule}/summary', [AttendanceController::class, 'summaryBySchedule']);
        Route::get('/attendance/classes/{class}/summary', [AttendanceController::class, 'summaryByClass']);
        Route::post('/attendance/{attendance}/attachments', [AttendanceController::class, 'attach']);
        Route::post('/attendance/{attendance}/document', [AttendanceController::class, 'attach']); // Alias for Webta
        Route::post('/attendance/{attendance}/void', [AttendanceController::class, 'void']);
    });

    Route::middleware('role:admin,teacher,student')->group(function (): void {
        Route::get('/attendance/{attendance}/document', [AttendanceController::class, 'getDocument']);
        Route::get('/attendance/document/proxy/{path}', [AttendanceController::class, 'proxyDocument'])
            ->where('path', '.*')
            ->name('attendance.document.proxy');
    });

    Route::middleware('role:teacher')->group(function (): void {
        Route::get('/me/attendance/teaching', [AttendanceController::class, 'meTeaching']);
        Route::get('/me/attendance/teaching/summary', [AttendanceController::class, 'summaryTeaching']);
        Route::get('/me/students/attendance-summary', [AttendanceController::class, 'studentsAttendanceSummary']);
        Route::get('/classes/{class}/attendance', [AttendanceController::class, 'classAttendanceByDate']);
        Route::get('/classes/{class}/students/attendance-summary', [AttendanceController::class, 'classStudentsSummary']);
        Route::get('/classes/{class}/students/absences', [AttendanceController::class, 'classStudentsAbsences']);
        Route::post('/me/schedule-image', [TeacherController::class, 'uploadMyScheduleImage']);
        Route::post('/me/schedules/{schedule}/close', [AttendanceController::class, 'close']);
        Route::post('/attendance/scan-student', [AttendanceController::class, 'scanStudent']);
        Route::post('/attendance/manual', [AttendanceController::class, 'storeManual']);

        // Teacher Schedule Detail - accessed from dashboard "Tampilkan" button
        Route::get('/me/schedules/{schedule}/detail', [\App\Http\Controllers\TeacherScheduleDetailController::class, 'show']);
        Route::get('/me/schedules/{schedule}/students', [\App\Http\Controllers\TeacherScheduleDetailController::class, 'getStudents']);

        // Teacher creates sick/izin for student (full day)
        Route::post('/me/schedules/{schedule}/students/{student}/leave', [\App\Http\Controllers\TeacherScheduleDetailController::class, 'createStudentLeave']);

        // Teacher creates izin pulang/dispensasi for student (temporary)
        Route::post('/me/schedules/{schedule}/students/{student}/leave-early', [\App\Http\Controllers\TeacherScheduleDetailController::class, 'createLeaveEarly']);

        // Teacher marks student as returned from leave
        Route::post('/me/leave-permissions/{leavePermission}/return', [\App\Http\Controllers\TeacherScheduleDetailController::class, 'markReturned']);

        // Teacher marks student as absent (didn't return on time)
        Route::post('/me/leave-permissions/{leavePermission}/mark-absent', [\App\Http\Controllers\TeacherScheduleDetailController::class, 'markAbsent']);

        // Get leave permissions for a class
        Route::get('/classes/{class}/leave-permissions', [\App\Http\Controllers\TeacherScheduleDetailController::class, 'getClassLeavePermissions']);

        // Get students currently on leave for a class
        Route::get('/classes/{class}/students-on-leave', [\App\Http\Controllers\StudentLeavePermissionController::class, 'studentsOnLeave']);

        Route::prefix('me/homeroom')->group(function () {
            Route::get('/', [TeacherController::class, 'myHomeroom']);
            Route::get('/schedules', [TeacherController::class, 'myHomeroomSchedules']);
            Route::get('/attendance', [TeacherController::class, 'myHomeroomAttendance']);
            Route::get('/attendance/summary', [TeacherController::class, 'myHomeroomAttendanceSummary']);
            Route::get('/students', [TeacherController::class, 'myHomeroomStudents']);
        });
    });

    // Leave Permissions management (accessible to admin and teachers)
    Route::middleware('role:admin,teacher')->group(function (): void {
        Route::get('/leave-permissions', [\App\Http\Controllers\StudentLeavePermissionController::class, 'index']);
        Route::post('/leave-permissions', [\App\Http\Controllers\StudentLeavePermissionController::class, 'store']);
        Route::get('/leave-permissions/{permission}', [\App\Http\Controllers\StudentLeavePermissionController::class, 'show']);
        Route::patch('/leave-permissions/{permission}', [\App\Http\Controllers\StudentLeavePermissionController::class, 'update']);
        Route::post('/leave-permissions/{permission}/return', [\App\Http\Controllers\StudentLeavePermissionController::class, 'markReturn']);
        Route::post('/leave-permissions/{permission}/mark-absent', [\App\Http\Controllers\StudentLeavePermissionController::class, 'markAbsent']);
        Route::post('/leave-permissions/{permission}/cancel', [\App\Http\Controllers\StudentLeavePermissionController::class, 'cancel']);
        Route::post('/leave-permissions/check-expired', [\App\Http\Controllers\StudentLeavePermissionController::class, 'checkExpired']);
    });

    Route::middleware('role:student')->group(function (): void {
        Route::get('/me/attendance', [AttendanceController::class, 'me']);
        Route::get('/me/attendance/summary', [AttendanceController::class, 'summaryMe']);
        Route::post('/me/devices', [DeviceController::class, 'store']);
        Route::post('/devices', [DeviceController::class, 'store']); // Consistent alias
        Route::delete('/me/devices/{device}', [DeviceController::class, 'destroy']);
    });

    Route::middleware('role:admin,teacher,student')->group(function (): void {
        Route::get('/settings/sync', [SettingController::class, 'sync']);
        Route::post('/absence-requests', [AbsenceRequestController::class, 'store']);
    });

    Route::middleware(['role:student', 'class-officer'])->group(function (): void {
        Route::prefix('me/class')->group(function () {
            Route::get('/', [ClassController::class, 'myClass']);
            Route::get('/dashboard', [DashboardController::class, 'classDashboard']);
            Route::get('/schedules', [ClassController::class, 'myClassSchedules']);
            Route::get('/attendance', [ClassController::class, 'myClassAttendance']);
        });
    });

    Route::middleware('role:admin,teacher,student')->group(function () {
        Route::get('/teachers/{teacher}/schedule-image', [TeacherController::class, 'getScheduleImage']);
        Route::get('/classes/{class}/schedule-image', [ClassController::class, 'getScheduleImage']);
    });
});
