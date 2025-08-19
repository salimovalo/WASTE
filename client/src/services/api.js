// API service for making HTTP requests

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
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
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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

export default api;