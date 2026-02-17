

const API_BASE_URL = 'http://localhost:8000/api';

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Unauthorized");
        }
        const errorData = await response.json();
        throw new Error(errorData.message || "Api Error");
    }
    return response.json();
};

const classService = {
  getMyClass: async () => {
    const response = await fetch(`${API_BASE_URL}/me/class`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Accept": "application/json",
        }
    });
    return handleResponse(response);
  },

  uploadScheduleImage: async (classId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/classes/${classId}/schedule-image`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
      },
      body: formData,
    });
    return handleResponse(response);
  },

  getScheduleImage: async (classId: string) => {
    // Return the URL directly since it's an image resource
    // But we might need auth token? Use fetch to get blob and create object URL
    const response = await fetch(`${API_BASE_URL}/classes/${classId}/schedule-image`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            // "Accept": "image/*", // Or application/json if it returns json error
        }
    });

    if (!response.ok) {
        throw new Error("Failed to load image");
    }
    
    // For images, we return the blob
    return response.blob(); 
  },
  
  deleteScheduleImage: async (classId: string) => {
        const response = await fetch(`${API_BASE_URL}/classes/${classId}/schedule-image`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`,
                "Accept": "application/json",
            }
        });
        return handleResponse(response);
  },

  getMyClassSchedules: async () => {
    const response = await fetch(`${API_BASE_URL}/me/class/schedules`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Accept": "application/json",
        }
    });
    return handleResponse(response);
  },

  getMyClassAttendance: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/me/class/attendance?${query}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Accept": "application/json",
        }
    });
    return handleResponse(response);
  },

  getMyClassStudents: async () => {
    const response = await fetch(`${API_BASE_URL}/me/class/students`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "Accept": "application/json",
        }
    });
    return handleResponse(response);
  }
};

export default classService;
