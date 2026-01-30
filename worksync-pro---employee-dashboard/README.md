# WorkSync Pro - Employee Dashboard

The employee-facing frontend for the WorkStream CRM, designed for mobile and desktop use.

## Features
- **Attendance**: Clock in/out with geolocation.
- **Daily Reports**: Submit Start of Day (SOD) and End of Day (EOD) reports.
- **Leaves**: Apply for leaves and check status.
- **Profile**: View personal details and stats.

## Setup & Installation

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Locally**
    ```bash
    npm run dev
    ```
    The app will start at `http://localhost:5173` (or similar).

## Configuration
This app expects the backend to be running. Ensure the backend URL is correctly configured in `services/api.ts` or `services/*.ts`.
