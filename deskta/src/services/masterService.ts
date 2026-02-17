import { API_BASE_URL, getHeaders, handleResponse } from './api';

export interface Major {
  id: number;
  code: string;
  name: string;
  category?: string;
}

export interface ClassRoom {
  id: number;
  name: string; // This is the displayed name (grade + label)
  label: string; // This is the suffix like 'A', '1', etc.
  grade: string;
  major_id: number;
  major_name?: string;
  homeroom_teacher_id?: number;
  homeroom_teacher_name?: string;
}

export const masterService = {
  getMajors: async () => {
    const response = await fetch(`${API_BASE_URL}/majors`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getClasses: async () => {
    const response = await fetch(`${API_BASE_URL}/classes`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getSubjects: async () => {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getTimeSlots: async () => {
    const response = await fetch(`${API_BASE_URL}/time-slots`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Majors CRUD
  addMajor: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/majors`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  updateMajor: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/majors/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  deleteMajor: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/majors/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  // Classes CRUD
  addClass: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/classes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  updateClass: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  deleteClass: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/classes/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  }
};

export interface Subject {
  id: number;
  name: string;
  code?: string;
}
