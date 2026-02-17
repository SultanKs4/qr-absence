import { API_BASE_URL, handleResponse } from './api';

export interface AttendanceItem {
  schedule: {
    id: string;
    start_time: string;
    end_time: string;
    subject_name: string;
    teacher: {
      id: string;
      user: {
        name: string;
      }
    }
  };
  attendances: Array<{
    id: string;
    student: {
      id: string;
      user: {
        name: string;
      };
      nisn: string;
    };
    status: string;
    checked_in_at: string;
    date: string;
  }>;
}

export interface ClassAttendanceResponse {
  class: {
    id: string;
    name: string;
  };
  date: string;
  day: string;
  items: AttendanceItem[];
}

export const attendanceService = {
  getDailyClassAttendance: async (classId: string, date: string): Promise<ClassAttendanceResponse> => {
    const response = await fetch(`${API_BASE_URL}/waka/classes/${classId}/attendance?date=${date}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
      },
    });
    return handleResponse(response);
  },

  getStudentSummary: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/me/attendance/summary`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
      },
    });
    return handleResponse(response);
  },

  getTeachingSummary: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/me/attendance/teaching/summary`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
      },
    });
    return handleResponse(response);
  },

  getHistory: async (params?: any): Promise<any> => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/me/attendance?${query}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
      },
    });
    return handleResponse(response);
  },

  getScheduleStudents: async (scheduleId: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/me/schedules/${scheduleId}/students`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
      },
    });
    return handleResponse(response);
  },

  getTeachersDailyAttendance: async (date: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/waka/attendance/teachers/daily?date=${date}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
      },
    });
    return handleResponse(response);
  },

  getTeacherAttendanceHistory: async (teacherId: string, params?: any): Promise<any> => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/teachers/${teacherId}/attendance-history?${query}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
      },
    });
    return handleResponse(response);
  },

  getWakaClassAttendanceSummary: async (classId: string, params?: any): Promise<any> => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/waka/classes/${classId}/attendance-summary?${query}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
      },
    });
    return handleResponse(response);
  },

  getMyHomeroomAttendance: async (params?: any): Promise<any> => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/me/homeroom/attendance?${query}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
      },
    });
    return handleResponse(response);
  },

  generateQrCode: async (scheduleId: string, type: string = 'student'): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/me/class/qr-token`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        schedule_id: scheduleId,
        type: type,
        expires_in_minutes: 15
      })
    });
    return handleResponse(response);
  },
};
