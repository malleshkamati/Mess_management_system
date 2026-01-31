# Mess Management System

A full-stack web application for managing mess operations, including student meal tracking, karma points system, and admin dashboard.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [PostgreSQL](https://www.postgresql.org/) (running locally)

## Setup Instructions

### 1. Database Setup

1. Make sure PostgreSQL is installed and running.
2. The application will automatically create the necessary tables on the first run, but you need to ensure the database exists.
3. The default configuration expects a database named `mess_management`. You can create it using psql or pgAdmin:
   ```sql
   CREATE DATABASE mess_management;
   ```

### 2. Backend (Server)

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - A `.env` file should be present in the `server` directory.
   - Required variables: `PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `JWT_SECRET`.
   - Included defaults:
     ```env
     PORT=5000
     DB_NAME=mess_management
     DB_USER=postgres
     DB_PASSWORD=your_password
     DB_HOST=localhost
     DB_PORT=5432
     ```
4. Start the server:
   ```bash
   node server.js
   ```
   *Note: The server runs on http://localhost:5000*

### 3. Frontend (Client)

1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - A `.env` file should be present in the `client` directory.
   - Required variable:
     ```env
     VITE_API_URL=http://localhost:5000/api
     ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *Note: The client typically runs on http://localhost:5173*

## Running the Project

To run the full application, you need to run both the server and client in separate terminal windows.

**Terminal 1 (Server):**
```bash
cd server
node server.js
```

**Terminal 2 (Client):**
```bash
cd client
npm run dev
```

## Admin Access
To access the admin dashboard, you may need a user with the `admin` role in the database.
