import { API_BASE_URL, getHeaders, handleResponse } from './api';

export interface Teacher {
  id: string;
  kodeGuru: string; // Maps to 'nip' or 'kode_guru'
  namaGuru: string; // Maps to user.name
  keterangan: string; // Maps to 'subject', 'waliKelasDari', or 'jabatan'
  role: string; // Maps to user.user_type (normalized) or 'jabatan'
  noTelp?: string; // Maps to user.phone
  waliKelasDari?: string; // Maps to homeroom_class.name
  jenisKelamin?: string; // Not in backend explicitly yet, maybe in profile?
  status?: string;
  nip?: string;
  username?: string;
  email?: string;
  password?: string;
  subject?: string;
  homeroom_class_id?: number | null;
}

export const teacherService = {
  getTeachers: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/teachers?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  getTeacherById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/teachers/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  createTeacher: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/teachers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  updateTeacher: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/teachers/${id}`, {
      method: 'PUT', // or PATCH
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  deleteTeacher: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/teachers/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(response);
  },

  importTeachers: async (items: any[]) => {
    const response = await fetch(`${API_BASE_URL}/teachers/import`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ items })
    });
    return handleResponse(response);
  },
  
  importTeachersFile: async (formData: FormData) => {
    // Note: If using FormData for file upload, don't set Content-Type header manually
    const headers = getHeaders();
    delete (headers as any)['Content-Type'];
    
    const response = await fetch(`${API_BASE_URL}/teachers/import`, {
      method: 'POST',
      headers: {
        ...headers,
      },
      body: formData
    });
    return handleResponse(response);
  },

  uploadScheduleImage: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers = getHeaders() as any;
    delete headers['Content-Type']; // Let browser set multipart boundary

    const response = await fetch(`${API_BASE_URL}/teachers/${id}/schedule-image`, {
      method: 'POST',
      headers: {
        ...headers,
      },
      body: formData
    });
    return handleResponse(response);
  }
};
