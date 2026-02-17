import { API_BASE_URL, handleResponse } from './api';

export interface PublicSettings {
  school_name: string;
  school_logo: string | null;
  school_mascot: string | null;
  school_type: string | null;
  school_address: string | null;
  school_email: string | null;
  school_phone: string | null;
  school_npsn: string | null;
  school_accreditation: string | null;
  school_logo_url: string | null;
  school_mascot_url: string | null;
  school_principal_name: string | null;
  school_principal_nip: string | null;
  postal_code: string | null;
  village: string | null;
  district: string | null;
  city: string | null;
  province: string | null;
}

export const settingService = {
  getPublicSettings: async (): Promise<PublicSettings> => {
    const response = await fetch(`${API_BASE_URL}/settings/public`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
    });
    return handleResponse(response);
  },

  getSettings: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Accept': 'application/json'
      },
    });
    return handleResponse(response);
  },

  updateSettings: async (data: any): Promise<any> => {
    // If data contains files, we should use FormData
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });

    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Accept': 'application/json',
        // 'Content-Type': 'multipart/form-data' // Fetch will set this automatically with boundary
      },
      body: formData
    });
    return handleResponse(response);
  }
};
