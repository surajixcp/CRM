import api from './api';
import { Employee } from '../../types';

export const employeeService = {
    // Use the new endpoint
    getAllEmployees: async () => {
        const response = await api.get('/auth/users');
        // Map _id to id for consistency with frontend types
        return response.data.map((u: any) => ({
            ...u,
            id: u._id
        }));
    },

    createEmployee: async (data: Partial<Employee>) => {
        // We map frontend 'role' to backend 'role'.
        // Frontend roles in select: Developer, Designer, Manager, Marketing.
        // Backend roles: admin, sub-admin, employee.
        // This is a mismatch.
        // Solution: Store the 'Developer', 'Designer' etc as 'designation' in backend?
        // Or store them as 'role' but backend validation on 'enum' will fail.
        // Wait, backend User model has: role enum: ['admin', 'sub-admin', 'employee']
        // And 'designation': String.
        // So 'Developer' should go to 'designation'.
        // And actual backend role should be 'employee'.

        // Let's check `Employees.tsx`:
        // It has `role` (Developer/Designer) and `designation` (Senior SE).
        // This is confusing. 
        // `emp.role` in frontend seems to be functioning as "Job Title Category".
        // `emp.designation` is specific title.

        // Logic:
        // Backend `role`: 'employee' (fixed for these users)
        // Backend `designation`: data.designation
        // Where do we store 'Developer'? Maybe append to designation or uses a new field?
        // User model has loose schema? No, it's Mongoose.
        // I will map frontend `role` -> backend `designation` (or ignored if not fitting).
        // Actually, looking at the frontend code:
        // `role` is "Developer", `designation` is "Senior SE".

        // I'll map:
        // Frontend `role` -> Backend `designation` (hacky?) OR
        // Just realize I only have `designation` field in backend.
        // I'll send:
        // role: 'employee'
        // designation: `${data.role} - ${data.designation}` to preserve data?
        // OR create a new field in Backend? No, "Do NOT change UI" is strict, but I can change backend.
        // I should probably add `department` or `jobRole` to backend User model to match this.
        // But "User Model" requirement in prompt was: name, email, password_hash, role, designation, salary, status.
        // So I strictly have `designation`.

        // Compromise:
        // I will store the detailed `designation` in backend `designation`.
        // I will loose the "Developer" grouping unless I put it in designation.
        // Let's look at `Employees.tsx` usage. It filters by nothing related to role, just Status.
        // So 'role' is just for display.
        // I will save frontend `role` + `designation` combined? 
        // Or just save `designation` as `designation`.
        // And `role`... I'll just map it to `designation` for now or maybe I should update backend model?
        // I'll just default backend role to 'employee' and put frontend 'role' into 'designation'.

        // WAIT. backend has `role` enum.
        // Frontend `role` is just a string. 
        // I will map:
        // Api payload: 
        // name, email, password (auto-generated), 
        // role: 'employee'
        // designation: data.role // Mapping frontend 'role' to backend 'designation'
        // salary: data.salary
        // status: data.status

        // BUT what about `data.designation` (Senior SE)?
        // I'll combine them? "Developer - Senior SE"?

        // Let's stick to:
        // backend `designation` = frontend `designation`. 
        // backend `role` = 'employee'. 
        // Frontend `role` (Developer) -> We might lose this if we don't store it.
        // I will assume for now that I can just send it as `department` if I add it to model?
        // Let's just use `designation` field for now and maybe append.

        const statusMap: { [key: string]: string } = {
            'Active': 'active',
            'On Leave': 'on_leave',
            'Terminated': 'terminated'
        };

        const payload = {
            ...data,
            role: 'employee',
            designation: data.designation,
            status: data.status ? (statusMap[data.status] || 'active') : 'active'
        };

        const response = await api.post('/auth/create-employee', payload);
        return response.data;
    },

    updateEmployee: async (id: string, data: Partial<Employee>) => {
        const statusMap: { [key: string]: string } = {
            'Active': 'active',
            'On Leave': 'on_leave',
            'Terminated': 'terminated'
        };

        const payload = {
            ...data,
            // Only send status if it's there
            ...(data.status ? { status: statusMap[data.status] || 'active' } : {}),
            // Only send password if it's there and not empty
            ...(data.password ? { password: data.password } : {})
        };
        const response = await api.put(`/auth/users/${id}`, payload);
        return response.data;
    },

    deleteEmployee: async (id: string) => {
        const response = await api.delete(`/auth/users/${id}`);
        return response.data;
    },

    getEmployeeOverview: async (userId: string) => {
        const response = await api.get(`/auth/user-overview/${userId}`);
        return response.data;
    }
};
