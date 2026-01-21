import api from './api';
import { AttendanceRecord } from '../../types';

export const attendanceService = {
    getAllAttendance: async (params?: { startDate?: string; endDate?: string; status?: string }) => {
        const response = await api.get('/attendance/logs', { params });
        return response.data;
    },

    checkIn: async () => {
        const response = await api.post('/attendance/checkin');
        return response.data;
    },

    checkOut: async () => {
        const response = await api.post('/attendance/checkout');
        return response.data;
    },

    getDailyAttendance: async (userId: string) => {
        const response = await api.get(`/attendance/daily/${userId}`);
        return response.data;
    },

    getMonthlyAttendance: async (userId: string, month: number, year: number) => {
        const response = await api.get(`/attendance/monthly/${userId}`, {
            params: { month, year }
        });
        return response.data;
    },

    getSummary: async () => {
        const response = await api.get('/attendance/summary');
        return response.data;
    },

    exportAttendance: async (params: { startDate: string; endDate: string }) => {
        const response = await api.get('/attendance/export', {
            params,
            responseType: 'blob'
        });
        return response.data;
    }
};
