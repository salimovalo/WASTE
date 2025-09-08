// API service for making HTTP requests

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: 30000, // Increased timeout for large operations
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // CORS uchun
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Network error handling
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        message: 'Tarmoq xatoligi. Internetga ulanishni tekshiring.',
        type: 'network_error'
      });
    }

    // Handle different error codes
    switch (error.response?.status) {
      case 401:
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        break;
      case 403:
        console.error('Access forbidden:', error.response.data);
        break;
      case 404:
        console.error('Resource not found:', error.response.data);
        break;
      case 429:
        console.error('Too many requests:', error.response.data);
        break;
      case 500:
        console.error('Server error:', error.response.data);
        break;
      default:
        console.error('API error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Companies API
export const companiesAPI = {
  getAll: (params = {}) => api.get('/companies', { params }),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
};

// Districts API
export const districtsAPI = {
  getAll: (params = {}) => api.get('/districts', { params }),
  getById: (id) => api.get(`/districts/${id}`),
  create: (data) => api.post('/districts', data),
  update: (id, data) => api.put(`/districts/${id}`, data),
  delete: (id) => api.delete(`/districts/${id}`),
};

// Neighborhoods API
export const neighborhoodsAPI = {
  getAll: (params = {}) => api.get('/neighborhoods', { params }),
  getById: (id) => api.get(`/neighborhoods/${id}`),
  create: (data) => api.post('/neighborhoods', data),
  update: (id, data) => api.put(`/neighborhoods/${id}`, data),
  delete: (id) => api.delete(`/neighborhoods/${id}`),
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/neighborhoods/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Users API
export const usersAPI = {
  getAll: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
  updatePermissions: (id, data) => api.put(`/users/${id}/permissions`, data),
};

// Employees API
export const employeesAPI = {
  getAll: (params = {}) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  getStats: (params = {}) => api.get('/employees/stats', { params }),
  getTodaySchedule: (params = {}) => api.get('/employees/today-schedule', { params }),
  getRecentActivity: (params = {}) => api.get('/employees/recent-activity', { params }),
};

// Roles API
export const rolesAPI = {
  getAll: (params = {}) => api.get('/roles', { params }),
  getById: (id) => api.get(`/roles/${id}`),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
};

// Reports API (temporary - will be expanded later)
export const reportsAPI = {
  getDashboardStats: (params = {}) => api.get('/reports/dashboard', { params }),
  getAll: (params = {}) => api.get('/reports', { params }),
  create: (data) => api.post('/reports', data),
  export: (type, params = {}) => api.get(`/reports/export/${type}`, { params }),
};

// Work Status Reasons API
export const workStatusReasonsAPI = {
  getAll: (params = {}) => api.get('/work-status-reasons', { params }),
  getCategories: () => api.get('/work-status-reasons/categories'),
  create: (data) => api.post('/work-status-reasons', data),
  update: (id, data) => api.put(`/work-status-reasons/${id}`, data),
  delete: (id) => api.delete(`/work-status-reasons/${id}`),
  activate: (id) => api.put(`/work-status-reasons/${id}/activate`),
};

// Vehicles API (for work status)  
export const vehiclesAPI = {
  getAll: (params = {}) => api.get('/technics', { params }),
  getById: (id) => api.get(`/technics/${id}`),
  create: (data) => api.post('/technics', data),
  update: (id, data) => api.put(`/technics/${id}`, data),
  delete: (id) => api.delete(`/technics/${id}`),
  getDailyWorkStatus: (params = {}) => api.get('/daily-work-status', { params }),
  getVehiclesForEntry: (params = {}) => api.get('/daily-work-status/vehicles-for-entry', { params }),
  saveDailyWorkStatus: (data) => api.post('/daily-work-status', data),
  confirmWorkStatus: (id, data) => api.put(`/daily-work-status/${id}/confirm`, data),
  getStatistics: (params = {}) => api.get('/daily-work-status/statistics', { params }),
  getDistrictSummary: (params = {}) => api.get('/daily-work-status/district-summary', { params }),
};

export default api;