import api from './api';

export interface CompanySettings {
    _id?: string;
    companyName: string;
    adminEmail: string;
    companyLogo?: string;
    workingHours: {
        checkIn: string;
        gracePeriod: number;
        checkOut: string;
    };
    weekendPolicy: string[];
    leavePolicy: {
        casualLeave: number;
        sickLeave: number;
        annualLeave: number;
        maternityLeave: number;
        requireApproval: boolean;
        notifyStaff: boolean;
        enableHalfDay: boolean;
    };
    payroll: {
        monthlyBudget: number;
        salaryDate: number;
    };
}

export const settingService = {
    getSettings: async (): Promise<CompanySettings> => {
        const response = await api.get('/settings');
        return response.data;
    },

    updateSettings: async (data: Partial<CompanySettings>): Promise<CompanySettings> => {
        const response = await api.put('/settings', data);
        return response.data;
    }
};
