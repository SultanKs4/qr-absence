import { API_BASE_URL, handleResponse } from './api';

export interface ScheduleItem {
  id: number;
  subject: string;
  class: string;
  room: string;
  day: string;
  start_time: string;
  end_time: string;
  teacher?: {
    id: number;
    name: string;
  };
}

export interface ScheduleResponse {
  status: string;
  items: ScheduleItem[];
}

export const scheduleService = {
  getMySchedule: async (): Promise<ScheduleResponse> => {
    const response = await fetch(`${API_BASE_URL}/me/schedules`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
      },
    });
    return handleResponse(response);
  },

  getMyHomeroomSchedules: async (): Promise<ScheduleResponse> => {
    const response = await fetch(`${API_BASE_URL}/me/homeroom/schedules`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
      },
    });
    return handleResponse(response);
  },

  getSchedule: async (id: string | number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
      },
    });
    return handleResponse(response);
  },

  createSchedule: async (data: any): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/schedules`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateSchedule: async (id: string | number, data: any): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  bulkUpsert: async (classId: string | number, data: any): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/schedules/bulk`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteSchedule: async (id: string | number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/schedules/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
      },
    });
    return handleResponse(response);
  },
};
