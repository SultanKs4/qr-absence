const baseURL = import.meta.env.VITE_API_URL;
const API_BASE_URL = baseURL ? baseURL : 'http://localhost:8000/api';

const apiService = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        throw new Error('Sesi telah berakhir, silakan login kembali');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Auth Methods
  getProfile() {
    return this.get('/me');
  },

  // Class & Schedule Methods
  getMyClassSchedules() {
    return this.get('/me/class/schedules');
  },

  getMyClassAttendance() {
    return this.get('/me/class/attendance');
  },

  getMyClassDashboard() {
    return this.get('/me/class/dashboard');
  },

  generateClassQr(data) {
    return this.post('/me/class/qr-token', data);
  },

  // Student Methods
  getStudentDashboard() {
    return this.get('/me/dashboard/summary');
  },

  getAttendanceHistory(params) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/me/attendance?${query}`);
  }
};

export default apiService;
