import api from './api';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    registerAdmin: async (userData) => {
        const response = await api.post('/auth/register-admin', userData);
        return response.data;
    },

    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    updateProfile: async (data: any) => {
        const response = await api.put('/auth/profile', data);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('userInfo');
    }
};
