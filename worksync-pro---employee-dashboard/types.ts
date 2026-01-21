
export type Screen = 'Dashboard' | 'Attendance' | 'Leaves' | 'Projects' | 'Meetings' | 'Profile' | 'Holidays';

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export enum ProjectStatus {
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold'
}

export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
  LEAVE = 'Leave',
  UNPAID_LEAVE = 'unpaid_leave'
}

export type NotificationType = 'meeting' | 'leave' | 'project';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: NotificationType;
  read: boolean;
}

export interface Project {
  id?: string;
  _id?: string;
  name: string;
  progress: number;
  deadline: string;
  assignedBy: string;
  status: string | ProjectStatus;
  description?: string;
  assignedTo?: any[]; // For populated team members
  members?: string[]; // Added for team display
}

export interface Meeting {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  date: string;
  time: string;
  createdBy: string | { name: string, _id: string }; // Populated or ID
  attendees?: string[] | any[];
}

export interface LeaveRequest {
  id?: string;
  _id?: string;
  leaveType?: string; // Backend field
  type?: string;
  startDate?: string;
  endDate?: string;
  from?: string;
  to?: string;
  reason: string;
  status: string | LeaveStatus;
  leaveDuration?: number;
}

export interface AttendanceLog {
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  status: string | AttendanceStatus;
  checkInLocation?: string;
  checkOutLocation?: string;
  leaveDuration?: number;
}

export interface UserProfile {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  createdAt?: string;
  salary?: string;
  avatar?: string;
  image?: string;
  phone?: string;
  location?: string;
  workMode?: 'WFH' | 'WFO';
}
