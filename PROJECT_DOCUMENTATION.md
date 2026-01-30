# WorkStream & WorkSync Pro - Project Documentation

## 1. Project Overview
This project is a comprehensive **Employee Attendance & Activity Tracker System** designed to streamline HR and project management processes. It consists of three distinct components:
1.  **Backend API**: A robust Node.js/Express server that acts as the central hub for data management, authentication, and business logic.
2.  **WorkStream (Admin Dashboard)**: A feature-rich React application for administrators to manage employees, attendance records, leaves, payroll, holidays, and projects.
3.  **WorkSync Pro (Employee Dashboard)**: A mobile-responsive React application for employees to mark attendance, view their performance stats, apply for leaves, and submit daily reports.

---

## 2. Technology Stack

### Backend
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: MongoDB (via Mongoose)
-   **Authentication**: JWT (JSON Web Tokens)
-   **Security**: Helmet, CORS, Bcryptjs
-   **File Handling**: Multer (with Cloudinary storage)
-   **Validation**: Express Validator

### Frontend (Both Admin & Employee)
-   **Framework**: React (v19)
-   **Build Tool**: Vite
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React
-   **Charts**: Recharts
-   **HTTP Client**: Axios

---

## 3. Directory Structure

The project is organized into a monorepo-style structure within the `CRM` folder:

```
CRM/
├── backend/                            # Node.js API Server
│   ├── src/
│   │   ├── config/                     # DB and other configurations
│   │   ├── controllers/                # Request handlers
│   │   ├── middlewares/                # Auth and error handling params
│   │   ├── models/                     # Mongoose schemas
│   │   ├── routes/                     # API endpoint definitions
│   │   └── server.js                   # Entry point
│
├── workstream-admin-dashboard/         # Admin Frontend
│   ├── components/                     # Reusable UI components
│   ├── screens/                        # Page components (Dashboard, Employees, etc.)
│   ├── src/api/                        # API integration logic
│   ├── App.tsx                         # Main routing logic
│   └── index.html                      # Entry HTML
│
└── worksync-pro---employee-dashboard/  # Employee Frontend
    ├── components/                     # Reusable UI components
    ├── screens/                        # Page components
    ├── services/                       # API service modules
    ├── App.tsx                         # Main routing logic
    └── index.html                      # Entry HTML
```

---

## 4. Backend Architecture

### Key Models (Database Schema)
The database is built on MongoDB with the following core collections:

1.  **User**: Stores employee and admin details.
    -   *Fields*: `name`, `email`, `password`, `role` (admin/sub-admin/employee), `designation`, `salary`, `status`, `image`, `joiningDate`.
2.  **Attendance**: Tracks daily check-in/out and status.
    -   *Fields*: `user`, `date`, `checkIn`, `checkOut`, `status` (present/absent/leave), `workingHours`, `location` (lat/lng).
3.  **Leave**: Manages leave requests and approvals.
    -   *Fields*: `user`, `type`, `startDate`, `endDate`, `reason`, `status` (pending/approved/rejected).
4.  **Project**: Manages company projects.
    -   *Fields*: `name`, `description`, `deadline`, `assignedTo`.
5.  **Report**: Stores daily SOD (Start of Day) and EOD (End of Day) reports.
6.  **Holiday**: Stores upcoming public holidays.
7.  **Salary**: Manages payroll and salary processing.
8.  **Settings**: Stores global configurations like leave policies.

### API Routes
The API is exposed via a RESTful interface. Key route groups include:
-   `/auth`: Login, registration, and user management.
-   `/attendance`: Check-in, check-out, and attendance history.
-   `/leaves`: Leave application and approval workflow.
-   `/projects`: Project CRUD operations.
-   `/reports`: Submission and retrieval of daily work reports.
-   `/upload`: File upload endpoints (images/documents).

---

## 5. Frontend Architecture

### WorkStream (Admin Dashboard)
The admin dashboard is designed for desktop usage with a sidebar navigation layout.
-   **Routing**: Uses a custom state-based routing system in `App.tsx` (`activeScreen` state).
-   **Key Screens**:
    -   `Dashboard`: Overview of company stats (attendance, projects, etc.).
    -   `Employees`: List, add, edit, and manage employees.
    -   `Attendance`: View attendance logs and calendar.
    -   `Leaves`: Approve/Reject leave requests and manage policies.
    -   `Salary`: Process and view salary data.
    -   `Projects`: Assign and track projects.
    -   `Reports`: View employee daily reports.
-   **State Management**: React `useState` and `useEffect` for local state; data fetched via `axios`.

### WorkSync Pro (Employee Dashboard)
The employee dashboard is mobile-responsive and focused on daily tasks.
-   **Key Screens**:
    -   `Dashboard`: Quick stats, Check-in/out clock, and recent activity.
    -   `Attendance`: Personal attendance history.
    -   `Leaves`: Apply for leave and view status.
    -   `Reports`: Submit SOD and EOD reports.
    -   `Profile`: View and edit personal profile.
-   **Services**: API calls are encapsulated in `services/` (e.g., `authService`, `attendanceService`) for modularity.

---

## 6. Installation & Setup

### Prerequisites
-   Node.js (v16+ recommended)
-   MongoDB (Local or Atlas Connection URI)

### Step 1: Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file (or ensure `config` is set) with:
    -   `PORT`
    -   `MONGO_URI`
    -   `JWT_SECRET`
    -   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
4.  Start the server:
    ```bash
    npm run dev
    ```

### Step 2: Admin Dashboard Setup
1.  Navigate to the admin dashboard directory:
    ```bash
    cd workstream-admin-dashboard
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

### Step 3: Employee Dashboard Setup
1.  Navigate to the employee dashboard directory:
    ```bash
    cd worksync-pro---employee-dashboard
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

---

## 7. Key Features & Workflows

### Attendance System
-   **Employees** can check in and out. The system logs the time and calculates working hours.
-   **Admins** can view the attendance matrix, correct records, and see who is late or absent.

### Leave Management
-   **Employees** apply for leave with a reason and date range.
-   **Admins** receive the request and can Approve or Reject it. Status logic updates the attendance records automatically.

### Reporting
-   Employees submit **SOC (Start of Day)** reports to plan their day.
-   Employees submit **EOD (End of Day)** reports to summarize work done.
-   Admins review these reports to track productivity.
