const db = require('../db/db');

/**
 * Find or create attendance record
 * @param {string} userId - User UUID
 * @param {string} mealId - Meal UUID
 * @param {Object} defaults - Default values if creating
 * @returns {Promise<{attendance: Object, created: boolean}>}
 */
const findOrCreate = async (userId, mealId, defaults = {}) => {
    // First try to find existing
    const existing = await db.query(
        `SELECT id, user_id as "userId", meal_id as "mealId", status, 
                guest_count as "guestCount", is_late_change as "isLateChange", 
                skip_reason as "skipReason", is_karma_claimed as "isKarmaClaimed"
         FROM attendances WHERE user_id = $1 AND meal_id = $2`,
        [userId, mealId]
    );

    if (existing.rows[0]) {
        return { attendance: existing.rows[0], created: false };
    }

    // Create new record
    const status = defaults.status || 'going';
    const guestCount = defaults.guestCount || 0;
    const isLateChange = defaults.isLateChange || false;
    const skipReason = defaults.skipReason || null;

    const result = await db.query(
        `INSERT INTO attendances (user_id, meal_id, status, guest_count, is_late_change, skip_reason)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, user_id as "userId", meal_id as "mealId", status, 
                   guest_count as "guestCount", is_late_change as "isLateChange", 
                   skip_reason as "skipReason", is_karma_claimed as "isKarmaClaimed"`,
        [userId, mealId, status, guestCount, isLateChange, skipReason]
    );

    return { attendance: result.rows[0], created: true };
};

/**
 * Update attendance record
 * @param {string} id - Attendance UUID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} - Updated attendance
 */
const update = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.status !== undefined) {
        fields.push(`status = $${paramCount++}`);
        values.push(data.status);
    }
    if (data.guestCount !== undefined) {
        fields.push(`guest_count = $${paramCount++}`);
        values.push(data.guestCount);
    }
    if (data.isLateChange !== undefined) {
        fields.push(`is_late_change = $${paramCount++}`);
        values.push(data.isLateChange);
    }
    if (data.skipReason !== undefined) {
        fields.push(`skip_reason = $${paramCount++}`);
        values.push(data.skipReason);
    }
    if (data.isKarmaClaimed !== undefined) {
        fields.push(`is_karma_claimed = $${paramCount++}`);
        values.push(data.isKarmaClaimed);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query(
        `UPDATE attendances SET ${fields.join(', ')}
         WHERE id = $${paramCount}
         RETURNING id, user_id as "userId", meal_id as "mealId", status, 
                   guest_count as "guestCount", is_late_change as "isLateChange", 
                   skip_reason as "skipReason", is_karma_claimed as "isKarmaClaimed"`,
        values
    );

    return result.rows[0];
};

/**
 * Find attendances by user and meal IDs
 * @param {string} userId - User UUID
 * @param {Array<string>} mealIds - Array of meal UUIDs
 * @returns {Promise<Array>} - Array of attendances
 */
const findByUserAndMeals = async (userId, mealIds) => {
    if (!mealIds || mealIds.length === 0) return [];

    const result = await db.query(
        `SELECT id, user_id as "userId", meal_id as "mealId", status, 
                guest_count as "guestCount", is_late_change as "isLateChange", 
                skip_reason as "skipReason", is_karma_claimed as "isKarmaClaimed"
         FROM attendances WHERE user_id = $1 AND meal_id = ANY($2)`,
        [userId, mealIds]
    );
    return result.rows;
};

/**
 * Count attendances by meal and status
 * @param {string} mealId - Meal UUID
 * @param {string} status - Attendance status
 * @returns {Promise<number>} - Count
 */
const countByMealAndStatus = async (mealId, status) => {
    const result = await db.query(
        `SELECT COUNT(*) as count FROM attendances WHERE meal_id = $1 AND status = $2`,
        [mealId, status]
    );
    return parseInt(result.rows[0].count, 10);
};

/**
 * Sum guest counts by meal
 * @param {string} mealId - Meal UUID
 * @returns {Promise<number>} - Sum of guests
 */
const sumGuestsByMeal = async (mealId) => {
    const result = await db.query(
        `SELECT COALESCE(SUM(guest_count), 0) as total FROM attendances WHERE meal_id = $1`,
        [mealId]
    );
    return parseInt(result.rows[0].total, 10);
};

/**
 * Bulk update attendances to not_eating for long break
 * @param {string} userId - User UUID
 * @param {Array<string>} mealIds - Array of meal UUIDs
 * @param {string} skipReason - Reason for skipping
 * @returns {Promise<number>} - Number of updated records
 */
const bulkSetNotEating = async (userId, mealIds, skipReason = 'Long Break') => {
    if (!mealIds || mealIds.length === 0) return 0;

    // Use upsert (INSERT ON CONFLICT) for efficiency
    const result = await db.query(
        `INSERT INTO attendances (user_id, meal_id, status, skip_reason)
         SELECT $1, unnest($2::uuid[]), 'not_eating', $3
         ON CONFLICT (user_id, meal_id) 
         DO UPDATE SET status = 'not_eating', skip_reason = $3, updated_at = CURRENT_TIMESTAMP
         WHERE attendances.status != 'not_eating'`,
        [userId, mealIds, skipReason]
    );

    return result.rowCount;
};

/**
 * Get count of skipped meals for a user to calculate impact
 * @param {string} userId - User UUID
 * @returns {Promise<number>} - Count of 'not_eating' attendances
 */
const getSkipsByUser = async (userId) => {
    const result = await db.query(
        `SELECT COUNT(*) as count FROM attendances WHERE user_id = $1 AND status = 'not_eating'`,
        [userId]
    );
    return parseInt(result.rows[0].count, 10);
};

module.exports = {
    findOrCreate,
    update,
    findByUserAndMeals,
    countByMealAndStatus,
    sumGuestsByMeal,
    bulkSetNotEating,
    getSkipsByUser
};
