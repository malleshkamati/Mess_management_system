# Mess Management System

## Project Overview
This is a MERN-stack-like application (PostgreSQL instead of MongoDB) designed to manage mess operations effectively. It includes features for meal intent tracking, admin analytics, and a karma-based incentive system.

## Prerequisites
-   **Node.js**: Ensure you have Node.js installed (v16+ recommended).
-   **PostgreSQL**: You need a running PostgreSQL instance (local or cloud-based like Aiven, Neon, or Supabase).

## Setup Instructions

### 1. Server Setup
The backend handles API requests, authentication, and database interactions.

1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `server` directory with your database credentials and secret keys. You can use the following template:
    ```env
    PORT=5000
    DB_HOST=your_db_host
    DB_PORT=your_db_port (default: 5432)
    DB_NAME=your_db_name
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    JWT_SECRET=your_secret_key
    ```
    > **Note**: The server will automatically initialize the necessary database tables on the first run.

### 2. Client Setup
The frontend is a React application built with Vite.

1.  Navigate to the client directory:
    ```bash
    cd ../client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

## How to Run
It is recommended to run the client and server in separate terminal windows.

### Start the Server
```bash
cd server
node server.js
# OR if you have nodemon installed for development:
# npx nodemon server.js
```
The server will start on port 5000 (or the port specified in your .env).

### Start the Client
```bash
cd client
npm run dev
```
The application will typically run on `http://localhost:5173`.

---

## Problem Statement
The core challenge addressed by this project is **balancing flexibility for residents with predictability for the mess staff**.
Residents need the freedom to decide whether to eat at the mess or not, while the mess staff requires accurate headcounts to minimize food wastage and prevent shortages.
This project focuses on designing a robust **Meal Intent & Tracking System** that incentivizes accurate reporting from residents, ensuring that the staff has reliable data for meal preparation.

## How it Works
1.  **Meal Intent Tracking**: The system allows residents to declare their meal status (Going/Not Going). This provides a baseline forecast for the mess staff.
2.  **Cut-off Times**: To ensure predictability, changes to meal status are locked a set time before each meal, giving staff a fixed window to prepare.
3.  **Karma/Incentive System**: To bridge the gap between "intent" and "action", the system implements a Karma score.
    -   Residents earn points for accurately reporting their status and following through.
    -   This gamification encourages residents to keep their status updated, directly improving the reliability of the data for the staff.
4.  **Admin Dashboard**: Mess admins have a real-time dashboard showing the expected absentee count and effective demand, allowing them to adjust cooking quantities dynamically.

## Assumptions
-   **Connectivity**: All residents and mess staff have consistent access to the web-based application.
-   **Incentives Work**: We assume that a social/gamified credit system (Karma) is sufficient motivation for students to accurately report their attendance.
-   **Honesty**: The system relies on physical verification (e.g., QR scan or manual check) to confirm attendance vs. intent, assuming that the check-in process is strictly enforced.
-   **Staff Digital Literacy**: The mess staff is capable of interpreting the digital dashboard to make cooking decisions.
