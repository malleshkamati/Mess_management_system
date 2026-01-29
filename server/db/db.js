const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    max: 20, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

/**
 * Execute a SQL query
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} - Query result
 */
const query = async (text, params) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // Uncomment for debugging:
    // console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} - Pool client
 */
const getClient = async () => {
    return await pool.connect();
};

/**
 * Initialize database schema
 */
const initializeSchema = async () => {
    try {
        // Create extension for UUID generation
        await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create role enum type if not exists
        await query(`
            DO $$ BEGIN
                CREATE TYPE user_role AS ENUM ('student', 'admin', 'manager');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create meal type enum if not exists
        await query(`
            DO $$ BEGIN
                CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create attendance status enum if not exists
        await query(`
            DO $$ BEGIN
                CREATE TYPE attendance_status AS ENUM ('going', 'not_eating');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create Users table
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                roll_no VARCHAR(100) UNIQUE,
                role user_role DEFAULT 'student',
                karma_points INTEGER DEFAULT 0,
                department VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create Meals table
        await query(`
            CREATE TABLE IF NOT EXISTS meals (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                date DATE NOT NULL,
                type meal_type NOT NULL,
                menu_items TEXT DEFAULT 'Standard Menu',
                is_green_day BOOLEAN DEFAULT false,
                meal_time TIME DEFAULT '12:00:00',
                cancel_cutoff TIME DEFAULT '10:00:00',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(date, type)
            )
        `);

        // Create Attendances table
        await query(`
            CREATE TABLE IF NOT EXISTS attendances (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
                status attendance_status DEFAULT 'going',
                guest_count INTEGER DEFAULT 0,
                is_late_change BOOLEAN DEFAULT false,
                skip_reason VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, meal_id)
            )
        `);

        // Create Feedback table
        await query(`
            CREATE TABLE IF NOT EXISTS feedback (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                remarks TEXT,
                is_anonymous BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, meal_id)
            )
        `);

        // Create Polls table
        await query(`
            CREATE TABLE IF NOT EXISTS polls (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                question TEXT NOT NULL,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create Poll Options table
        await query(`
            CREATE TABLE IF NOT EXISTS poll_options (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
                option_text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create Poll Votes table
        await query(`
            CREATE TABLE IF NOT EXISTS poll_votes (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
                option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(poll_id, user_id)
            )
        `);

        console.log('Database schema initialized successfully');
    } catch (err) {
        console.error('Error initializing database schema:', err);
        throw err;
    }
};

module.exports = {
    query,
    getClient,
    pool,
    initializeSchema
};
