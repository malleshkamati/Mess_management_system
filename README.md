# Mess Management System

## Live Demo
Check out the live application here: [Mess Management System](https://mess-management-system-ashen.vercel.app/)

> **Tip:** To explore **Admin functionality**, use the demo credentials provided on the login page. Simply click the "Admin" text located below the login button to auto-fill the credentials.

## Project Overview
This is a PERN-stack  application designed to manage mess operations effectively. It includes features for meal intent tracking, admin analytics, and a karma-based incentive system.

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

1. What problem did you choose to solve?
The core problem is Food Wastage and Inefficiency in institutional messes (hostels/canteens).
Wastage: Cooks often prepare food for the total number of registered students, but many skip meals without notice, leading to significant food waste.
Uncertainty: Mess admins lack real-time data on how many students are actually coming, leading to either over-preparation (waste) or under-preparation (food run-outs).
Lack of Communication: There is no efficient channel for students to inform the mess about guests, long leaves, or meal feedback.
2. How your solution works
The solution is a User-Admin Web Application that bridges the gap between students and mess staff:
For Students (Incentivized Reporting):
Meal Intent: Students can mark themselves as "Skipping" or "Eating" for upcoming meals.
Gamification (Karma Points): To solve the issue of laziness, the system encourages students to update their status (including cancelling a meal) by awarding "Karma Points." These points unlock value (e.g., claiming rewards), transforming data entry into a rewarding activity.
Features: Students can also register guests, apply for long leaves (rebates), and vote on menu polls.
For Admins (Data-Driven Decisions):
Predictive Dashboard: Admins see a "Recommended Prep" count based on confirmed attendance + guests + a safety buffer.
Wastage Intelligence: A heatmap and analytics dashboard show trends in wastage, helping refine purchasing and cooking decisions over time.
Feedback Loop: A direct channel for students to rate meals ensures quality control.
3. Assumptions Made
Opt-Out Model: We assume the default status of a student is "Eating". This ensures that students who simply forget to use the app don't go hungry, but it places the onus on them to "Opt-Out" (cancel) to save food.
Tech Adoption: We assume students have access to smartphones/laptops and that the mess staff has a tablet/computer to view the dashboard in the kitchen.
Honesty & Trust: The system assumes students will report honestly (incentivized by Karma) and that cooks will trust the "Recommended Prep" numbers provided by the algorithm.
Buffer Sufficiency: We assumed a 10% safety buffer (plus guests) is sufficient to handle last-minute walk-ins without causing food shortages.

