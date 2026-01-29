const db = require('../db/db');

/**
 * Create feedback for a meal
 * @param {string} userId - User UUID
 * @param {string} mealId - Meal UUID
 * @param {number} rating - Rating 1-5
 * @param {string} remarks - Optional remarks
 * @param {boolean} isAnonymous - Whether feedback is anonymous
 * @returns {Promise<Object>} - Created feedback
 */
const create = async (userId, mealId, rating, remarks = null, isAnonymous = false) => {
    const result = await db.query(
        `INSERT INTO feedback (user_id, meal_id, rating, remarks, is_anonymous)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, meal_id) 
         DO UPDATE SET rating = $3, remarks = $4, is_anonymous = $5
         RETURNING id, user_id as "userId", meal_id as "mealId", rating, remarks, is_anonymous as "isAnonymous", created_at as "createdAt"`,
        [userId, mealId, rating, remarks, isAnonymous]
    );
    return result.rows[0];
};

/**
 * Get all feedback for a specific meal
 * @param {string} mealId - Meal UUID
 * @returns {Promise<Array>} - Array of feedback with user info
 */
const findByMealId = async (mealId) => {
    const result = await db.query(
        `SELECT f.id, f.rating, f.remarks, f.created_at as "createdAt",
                u.name as "userName", u.email as "userEmail"
         FROM feedback f
         JOIN users u ON f.user_id = u.id
         WHERE f.meal_id = $1
         ORDER BY f.created_at DESC`,
        [mealId]
    );
    return result.rows;
};

/**
 * Get all feedback submitted by a user
 * @param {string} userId - User UUID
 * @returns {Promise<Array>} - Array of feedback with meal info
 */
const findByUserId = async (userId) => {
    const result = await db.query(
        `SELECT f.id, f.rating, f.remarks, f.created_at as "createdAt",
                m.date, m.type, m.menu_items as "menuItems"
         FROM feedback f
         JOIN meals m ON f.meal_id = m.id
         WHERE f.user_id = $1
         ORDER BY f.created_at DESC`,
        [userId]
    );
    return result.rows;
};

/**
 * Get all feedback with meal and user info (for admin)
 * @returns {Promise<Array>} - Array of all feedback
 */
const findAll = async () => {
    const result = await db.query(
        `SELECT f.id, f.rating, f.remarks, f.is_anonymous as "isAnonymous", f.created_at as "createdAt",
                m.date, m.type, m.menu_items as "menuItems",
                u.name as "userName", u.email as "userEmail"
         FROM feedback f
         JOIN meals m ON f.meal_id = m.id
         JOIN users u ON f.user_id = u.id
         ORDER BY f.created_at DESC
         LIMIT 100`
    );
    return result.rows;
};

/**
 * Get average rating for a meal
 * @param {string} mealId - Meal UUID
 * @returns {Promise<Object>} - Average rating and count
 */
const getAverageRating = async (mealId) => {
    const result = await db.query(
        `SELECT AVG(rating)::numeric(10,1) as "avgRating", COUNT(*) as "count"
         FROM feedback WHERE meal_id = $1`,
        [mealId]
    );
    return result.rows[0];
};

module.exports = {
    create,
    findByMealId,
    findByUserId,
    findAll,
    getAverageRating
};
