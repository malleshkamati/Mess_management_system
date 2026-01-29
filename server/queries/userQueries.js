const db = require('../db/db');

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} - User object or null
 */
const findByEmail = async (email) => {
    const result = await db.query(
        `SELECT id, name, email, password, roll_no as "rollNo", role, karma_points as "karmaPoints", department
         FROM users WHERE email = $1`,
        [email]
    );
    return result.rows[0] || null;
};

/**
 * Find user by ID
 * @param {string} id - User UUID
 * @returns {Promise<Object|null>} - User object or null
 */
const findById = async (id) => {
    const result = await db.query(
        `SELECT id, name, email, password, roll_no as "rollNo", role, karma_points as "karmaPoints", department
         FROM users WHERE id = $1`,
        [id]
    );
    return result.rows[0] || null;
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} - Created user
 */
const create = async ({ name, email, password, rollNo, role = 'student', department }) => {
    const result = await db.query(
        `INSERT INTO users (name, email, password, roll_no, role, department)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, email, roll_no as "rollNo", role, karma_points as "karmaPoints", department`,
        [name, email, password, rollNo, role, department]
    );
    return result.rows[0];
};

/**
 * Increment user's karma points
 * @param {string} userId - User UUID
 * @param {number} amount - Amount to increment
 * @returns {Promise<Object>} - Updated user
 */
const incrementKarma = async (userId, amount) => {
    const result = await db.query(
        `UPDATE users SET karma_points = karma_points + $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, name, email, role, karma_points as "karmaPoints"`,
        [amount, userId]
    );
    return result.rows[0];
};

/**
 * Get all users
 * @returns {Promise<Array>} - Array of users
 */
const findAll = async () => {
    const result = await db.query(
        `SELECT id, name, email, roll_no as "rollNo", role, karma_points as "karmaPoints", department
         FROM users ORDER BY created_at DESC`
    );
    return result.rows;
};

module.exports = {
    findByEmail,
    findById,
    create,
    incrementKarma,
    findAll
};
