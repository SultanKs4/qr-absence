import apiClient from './api';
import { API_ENDPOINTS } from '../utils/constants';
import type { AxiosRequestConfig } from 'axios';
import type {
    AdminSummary,
    AttendanceSummary,
    Schedule,
    ScheduleQueryParams,
    AttendanceQueryParams,
    Class,
    Student,
    Teacher,
    WakaSummary,
    ManualAttendanceRequest,
    QRCodeData,
    QrCode,
    AttendanceHistory,
} from '../types/api';

export const dashboardService = {
    /**
     * Get admin dashboard summary
     */
    async getAdminSummary(options?: AxiosRequestConfig): Promise<AdminSummary> {
        const response = await apiClient.get<AdminSummary>(API_ENDPOINTS.ADMIN_SUMMARY, options);
        return response.data;
    },

    /**
     * Get attendance summary (for admin/waka)
     */
    async getAttendanceSummary(params?: AttendanceQueryParams, options?: AxiosRequestConfig): Promise<AttendanceSummary> {
        const response = await apiClient.get<AttendanceSummary>(
            API_ENDPOINTS.ATTENDANCE_SUMMARY,
            { ...options, params }
        );
        return response.data;
    },

    /**
     * Get my schedules (for students/teachers)
     */
    async getMySchedules(params?: ScheduleQueryParams, options?: AxiosRequestConfig): Promise<Schedule[]> {
        const response = await apiClient.get<any>(
            API_ENDPOINTS.ME_SCHEDULES,
            { ...options, params }
        );
        // Backend returns { date, day, items: [] }
        return response.data.items || [];
    },

    /**
     * Get teacher schedules (for teachers)
     */
    async getTeacherSchedules(params?: ScheduleQueryParams, options?: AxiosRequestConfig): Promise<any> {
        // Teacher uses the index endpoint which filters by authenticated teacher
        const response = await apiClient.get<any>(
            API_ENDPOINTS.SCHEDULES,
            { ...options, params }
        );
        // The index endpoint returns a paginated response, so we need to return .data or .data.data
        // Based on ScheduleController::index, it returns paginate()
        return response.data.data ? response.data.data : response.data;
    },

    /**
     * Get my attendance history (for students)
     */
    async getMyAttendanceHistory(params?: AttendanceQueryParams, options?: AxiosRequestConfig): Promise<AttendanceHistory> {
        const response = await apiClient.get<AttendanceHistory>(
            API_ENDPOINTS.ME_ATTENDANCE_SUMMARY,
            { ...options, params }
        );

        // Backend returns { status_summary: [], daily_summary: [] }
        // We need to flatten status_summary into AttendanceSummary format
        const statusSummary = response.data.status_summary || [];
        const summary: any = {
            present: 0,
            absent: 0,
            sick: 0,
            excused: 0,
            dispensation: 0,
            total: 0
        };

        statusSummary.forEach((item: any) => {
            const status = item.status;
            const total = parseInt(item.total);
            if (status === 'present') summary.present = total;
            else if (status === 'absent') summary.absent = total;
            else if (status === 'sick') summary.sakit = total; // Backend uses 'sakit' or 'sick'? Let's check model
            else if (status === 'excused') summary.excused = total;
            else if (status === 'dispensation') summary.dispensation = total;

            summary.total += total;
        });

        // Special handling for mapping if backend uses different keys
        // Looking at Attendance model, status is 'present', 'absent', 'sick', 'excused'
        const sickItem = statusSummary.find((i: any) => i.status === 'sick');
        if (sickItem) summary.sick = parseInt(sickItem.total);

        return summary;
    },

    /**
     * Get homeroom class info (for wali kelas)
     */
    async getMyHomeroom(options?: AxiosRequestConfig): Promise<Class> {
        const response = await apiClient.get<Class>(API_ENDPOINTS.ME_HOMEROOM, options);
        return response.data;
    },

    /**
     * Get homeroom schedules (for wali kelas)
     */
    async getMyHomeroomSchedules(params?: ScheduleQueryParams, options?: AxiosRequestConfig): Promise<Schedule[]> {
        const response = await apiClient.get<Schedule[]>(
            API_ENDPOINTS.ME_HOMEROOM_SCHEDULES,
            { ...options, params }
        );
        return response.data;
    },

    /**
     * Get homeroom attendance summary (for wali kelas)
     */
    async getMyHomeroomAttendanceSummary(params?: AttendanceQueryParams, options?: AxiosRequestConfig): Promise<AttendanceSummary> {
        const response = await apiClient.get<AttendanceSummary>(
            API_ENDPOINTS.ME_HOMEROOM_ATTENDANCE_SUMMARY,
            { ...options, params }
        );
        return response.data;
    },

    /**
     * Get homeroom students (for wali kelas)
     */
    async getMyHomeroomStudents(options?: AxiosRequestConfig): Promise<Student[]> {
        const response = await apiClient.get<Student[]>(API_ENDPOINTS.ME_HOMEROOM_STUDENTS, options);
        return response.data;
    },

    /**
     * Get my class info (for pengurus kelas)
     */
    async getMyClass(options?: AxiosRequestConfig): Promise<Class> {
        const response = await apiClient.get<Class>(API_ENDPOINTS.ME_CLASS, options);
        return response.data;
    },

    /**
     * Get my class schedules (for pengurus kelas)
     */
    async getMyClassSchedules(params?: ScheduleQueryParams, options?: AxiosRequestConfig): Promise<Schedule[]> {
        const response = await apiClient.get<Schedule[]>(
            API_ENDPOINTS.ME_CLASS_SCHEDULES,
            { ...options, params }
        );
        return response.data;
    },

    /**
     * Get waka attendance summary
     */
    async getWakaAttendanceSummary(params?: AttendanceQueryParams, options?: AxiosRequestConfig): Promise<AttendanceSummary> {
        const response = await apiClient.get<AttendanceSummary>(
            API_ENDPOINTS.WAKA_ATTENDANCE_SUMMARY,
            { ...options, params }
        );
        return response.data;
    },

    /**
     * Get waka dashboard summary (stats & trend)
     */
    async getWakaDashboardSummary(options?: AxiosRequestConfig): Promise<WakaSummary> {
        const response = await apiClient.get<WakaSummary>(
            API_ENDPOINTS.WAKA_DASHBOARD_SUMMARY,
            options
        );
        return response.data;
    },

    /**
     * Alias for getWakaDashboardSummary
     */
    async getWakaSummary(options?: AxiosRequestConfig): Promise<WakaSummary> {
        return this.getWakaDashboardSummary(options);
    },

    /**
     * Get teachers daily attendance (for waka)
     */
    async getTeachersDailyAttendance(params?: { date?: string }, options?: AxiosRequestConfig): Promise<Teacher[]> {
        const response = await apiClient.get<Teacher[]>(
            API_ENDPOINTS.TEACHERS_DAILY_ATTENDANCE,
            { ...options, params }
        );
        return response.data;
    },

    /**
     * Get students absences (for waka)
     */
    async getStudentsAbsences(params?: { from?: string; to?: string }, options?: AxiosRequestConfig): Promise<any[]> {
        const response = await apiClient.get<any[]>(
            API_ENDPOINTS.STUDENTS_ABSENCES,
            { ...options, params }
        );
        return response.data;
    },

    /**
     * Get absence requests (for waka)
     */
    async getAbsenceRequests(options?: AxiosRequestConfig): Promise<any[]> {
        const response = await apiClient.get<any[]>(API_ENDPOINTS.ABSENCE_REQUESTS, options);
        return response.data;
    },

    /**
     * Get my class attendance (for pengurus kelas)
     */
    async getMyClassAttendance(params?: { date?: string }, options?: AxiosRequestConfig): Promise<any[]> {
        const response = await apiClient.get<any[]>(
            API_ENDPOINTS.ME_CLASS_ATTENDANCE,
            { ...options, params }
        );
        return response.data;
    },

    /**
     * Generate QR code
     */
    async generateQRCode(data: QRCodeData, options?: AxiosRequestConfig): Promise<QrCode> {
        const response = await apiClient.post<QrCode>(API_ENDPOINTS.QR_GENERATE, data, options);
        return response.data;
    },

    /**
     * Get active QR codes (for pengurus kelas)
     */
    async getActiveQRCodes(options?: AxiosRequestConfig): Promise<any[]> {
        const response = await apiClient.get<any[]>(API_ENDPOINTS.QR_ACTIVE, options);
        return response.data;
    },

    /**
     * Revoke QR code (for pengurus kelas)
     */
    async revokeQRCode(token: string, options?: AxiosRequestConfig): Promise<void> {
        await apiClient.post(`/qrcodes/${token}/revoke`, {}, options);
    },

    /**
     * Manual Attendance Input (for Teacher/Waka)
     */
    async submitManualAttendance(data: ManualAttendanceRequest, options?: AxiosRequestConfig): Promise<any> {
        return (await apiClient.post(API_ENDPOINTS.ATTENDANCE_MANUAL, data, options)).data;
    },

    /**
     * Scan Attendance
     */
    async scanAttendance(token: string, device_id?: number, options?: AxiosRequestConfig): Promise<any> {
        return (await apiClient.post('/attendance/scan', { token, device_id }, options)).data;
    },

    /**
     * Get Class Details (Students)
     */
    async getClassDetails(classId: string, options?: AxiosRequestConfig): Promise<Class> {
        return (await apiClient.get<Class>(`/api/classes/${classId}`, options)).data;
    },

    /**
     * Get Attendance by Schedule ID
     */
    async getAttendanceBySchedule(scheduleId: string, options?: AxiosRequestConfig): Promise<any[]> {
        const response = await apiClient.get<any>(API_ENDPOINTS.ATTENDANCE_BY_SCHEDULE(Number(scheduleId)), options);
        return response.data.data ? response.data.data : response.data;
    },

    /**
     * Get students attendance summary for a specific class (for waka)
     */
    async getClassStudentsSummary(classId: string, params?: AttendanceQueryParams, options?: AxiosRequestConfig): Promise<any[]> {
        const response = await apiClient.get<any[]>(
            `/api/classes/${classId}/students/attendance-summary`,
            { ...options, params }
        );
        return response.data;
    },
    /**
     * Scan Student QR (for Teacher)
     */
    async scanStudentQR(token: string, options?: AxiosRequestConfig): Promise<any> {
        return (await apiClient.post(API_ENDPOINTS.ATTENDANCE_SCAN_STUDENT, { token }, options)).data;
    },
};
