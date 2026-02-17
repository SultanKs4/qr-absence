import { API_BASE_URL, getHeaders, handleResponse } from './api';

export const dashboardService = {
  getAdminSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/summary`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getWakaDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/waka/dashboard/summary`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getAttendanceSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/attendance/summary`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getStudentDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/me/dashboard/summary`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getClassDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/me/class/dashboard`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};
