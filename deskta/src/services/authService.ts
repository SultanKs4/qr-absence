import { API_BASE_URL, getHeaders, handleResponse } from './api';

export interface UserProfile {
  id: number;
  name: string;
  username: string;
  email: string | null;
  user_type: string;
  role: string;
  is_class_officer: boolean;
  phone: string | null;
  contact: string | null;
  profile?: {
    nis?: string;
    nip?: string;
    class_name?: string;
    photo_url?: string;
  };
}

export const authService = {
  me: async (): Promise<UserProfile> => {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  login: async (credentials: any): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  }
};
