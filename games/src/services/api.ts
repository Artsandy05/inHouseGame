// src/services/api.ts
import axios from 'axios';
import { getCookie } from '../utils/cookie'; // Function to get cookie

const api = axios.create({
  baseURL: process.env.LOCAL_BASE_URL || 'http://localhost:8001/api/v1', // Replace with your backend API URL
});

api.interceptors.request.use(
  (config) => {
    const token = getCookie('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);





export default api;
