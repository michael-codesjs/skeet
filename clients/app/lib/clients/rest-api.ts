import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5445';

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token if needed
apiClient.interceptors.request.use(
  (config) => {
    // 1. Better Auth usually handles this via cookies with withCredentials: true

    // 2. But if a Bearer token is stored, we can add it here:
    // This looks for a token in localStorage or cookies
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default apiClient;
