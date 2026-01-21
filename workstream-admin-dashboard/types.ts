
export type ScreenType =
  | 'Dashboard'
  | 'Employees'
  | 'Attendance'
  | 'Leaves'
  | 'Projects'
  | 'Salary'
  | 'Holidays'
  | 'Meetings'
  | 'Settings'
  | 'Profile'
  | 'EmployeeOverview';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: string;
  status: 'Active' | 'On Leave' | 'Terminated';
  designation: string;
  salary: number;
  image: string;
  location?: string;
  workMode?: 'WFH' | 'WFO';
  joiningDate?: string;
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  type: string;
  dates: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface AttendanceRecord {
  id: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  status: 'Present' | 'Absent' | 'On Leave' | 'Half Day';
}

export interface Project {
  id: string;
  name: string;
  progress: number;
  members: string[];
  assignedToIds?: string[];
  deadline: string;
  status: 'In Progress' | 'Completed' | 'Pending';
}

export interface SalaryRecord {
  id: string;
  employeeName: string;
  month: string;
  baseSalary: number;
  deductions: number;
  netPay: number;
  status: 'Paid' | 'Unpaid';
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
}

export interface Meeting {
  id: string;
  _id?: string;
  title: string;
  description: string;
  date: string;
  rawDate?: string;
  time: string;
  attendees: string[];
  attendeeIds?: string[];
  meetingLink?: string;
  platform?: string;
  createdBy?: { name: string, _id: string } | string;
}
