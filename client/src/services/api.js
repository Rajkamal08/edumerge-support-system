import axios from 'axios';

// ----------------------------------------------------------------------
// AXIOS INSTANCE CONFIGURATION
// Create a base instance pointing to our Express backend
// ----------------------------------------------------------------------
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// ----------------------------------------------------------------------
// REQUEST INTERCEPTOR
// Automatically attach the JWT token to every request if the user is logged in
// ----------------------------------------------------------------------
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
