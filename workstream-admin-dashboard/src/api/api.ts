import axios from 'axios';

const api = axios.create({
    baseURL: 'https://crm-1-ssit.onrender.com',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        console.log('API Request:', config.method?.toUpperCase(), config.baseURL, config.url);
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear all possible session data from both storage types
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('workstream_auth_session');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('workstream_auth_session');

            // Forcibly redirect to home (which will trigger LoginScreen)
            if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
