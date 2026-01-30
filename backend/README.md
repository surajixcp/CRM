# WorkStream Backend API

The backend server for the WorkStream CRM ecosystem, built with Node.js, Express, and MongoDB.

## Features
- **Authentication**: JWT-based auth for Admins and Employees.
- **Attendance**: Geolocation-based check-in/out, status tracking.
- **Leave Management**: Request and approval workflow.
- **Reporting**: Daily SOD/EOD report submission.
- **Payroll**: Salary processing and history.

## Setup & Installation

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Create a `.env` file in this directory with the following:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    cloundinary_cloud_name=your_cloud_name
    cloundinary_api_key=your_api_key
    cloundinary_api_secret=your_api_secret
    ```

3.  **Run Locally**
    ```bash
    npm run dev
    ```

4.  **Seeding Data**
    To seed the initial admin account:
    ```bash
    npm run seed
    ```

## API Documentation
See the main project documentation or explore the `routes/` directory for endpoint details.
