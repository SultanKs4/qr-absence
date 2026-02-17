import { API_BASE_URL, getHeaders, handleResponse } from './api';

export interface Student {
  id: string;
  name: string;
  nisn: string;
  nis?: string;
  email?: string;
  major?: string; // Code like 'RPL'
  major_name?: string; // Full name
  class_id?: string;
  class_name?: string;
  grade?: string;
  gender: 'L' | 'P';
  phone?: string;
  address?: string;
  photo_url?: string;
}

export const studentService = {
  getStudents: async (params?: { search?: string, major?: string, grade?: string }) => {
    let url = `${API_BASE_URL}/students`;
    if (params) {
      const query = new URLSearchParams(params as any).toString();
      if (query) url += `?${query}`;
    }
    
    const response = await fetch(url, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getStudentById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  addStudent: async (studentData: any) => {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(studentData)
    });
    return handleResponse(response);
  },

  updateStudent: async (id: string, studentData: any) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(studentData)
    });
    return handleResponse(response);
  },

  deleteStudent: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  importStudents: async (items: any[]) => {
    const response = await fetch(`${API_BASE_URL}/students/import`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ items })
    });
    return handleResponse(response);
  }
};
