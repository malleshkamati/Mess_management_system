const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Explicitly point to server/.env (one level up from scripts/)
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('Attempts to connect with:', {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    db: process.env.DB_NAME
});

const config = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to postgres system db
};

const createDb = async () => {
    const client = new Client(config);
    try {
        await client.connect();
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`);
        if (res.rowCount === 0) {
            console.log(`Creating database ${process.env.DB_NAME}...`);
            await client.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
            console.log('Database created successfully.');
        } else {
            console.log('Database already exists.');
        }
    } catch (err) {
        console.error('Error checking/creating database:', err.message);
    } finally {
        await client.end();
    }
};

createDb();
