const db = require('../db/db');

/**
 * Find meal by ID
 * @param {string} id - Meal UUID
 * @returns {Promise<Object|null>} - Meal object or null
 */
const findById = async (id) => {
    const result = await db.query(
        `SELECT id, date, type, menu_items as "menuItems", is_green_day as "isGreenDay",
                meal_time as "mealTime", cancel_cutoff as "cancelCutoff"
         FROM meals WHERE id = $1`,
        [id]
    );
    return result.rows[0] || null;
};

/**
 * Find all meals by date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} - Array of meals
 */
const findAllByDate = async (date) => {
    const result = await db.query(
        `SELECT id, date, type, menu_items as "menuItems", is_green_day as "isGreenDay",
                meal_time as "mealTime", cancel_cutoff as "cancelCutoff"
         FROM meals WHERE date = $1
         ORDER BY 
            CASE type 
                WHEN 'breakfast' THEN 1 
                WHEN 'lunch' THEN 2 
                WHEN 'dinner' THEN 3 
            END`,
        [date]
    );
    return result.rows;
};

/**
 * Find meals in date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} - Array of meals
 */
const findByDateRange = async (startDate, endDate) => {
    const result = await db.query(
        `SELECT id, date, type, menu_items as "menuItems", is_green_day as "isGreenDay",
                meal_time as "mealTime", cancel_cutoff as "cancelCutoff"
         FROM meals WHERE date BETWEEN $1 AND $2
         ORDER BY date, 
            CASE type 
                WHEN 'breakfast' THEN 1 
                WHEN 'lunch' THEN 2 
                WHEN 'dinner' THEN 3 
            END`,
        [startDate, endDate]
    );
    return result.rows;
};

/**
 * Create a new meal
 * @param {Object} mealData - Meal data
 * @returns {Promise<Object>} - Created meal
 */
const create = async ({ date, type, menuItems = 'Standard Menu', isGreenDay = false, mealTime, cancelCutoff }) => {
    const result = await db.query(
        `INSERT INTO meals (date, type, menu_items, is_green_day, meal_time, cancel_cutoff)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, date, type, menu_items as "menuItems", is_green_day as "isGreenDay",
                   meal_time as "mealTime", cancel_cutoff as "cancelCutoff"`,
        [date, type, menuItems, isGreenDay, mealTime || getDefaultMealTime(type), cancelCutoff || getDefaultCutoff(type)]
    );
    return result.rows[0];
};

/**
 * Update a meal
 * @param {string} id - Meal UUID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} - Updated meal
 */
const update = async (id, data) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.menuItems !== undefined) {
        fields.push(`menu_items = $${paramCount++}`);
        values.push(data.menuItems);
    }
    if (data.isGreenDay !== undefined) {
        fields.push(`is_green_day = $${paramCount++}`);
        values.push(data.isGreenDay);
    }
    if (data.mealTime !== undefined) {
        fields.push(`meal_time = $${paramCount++}`);
        values.push(data.mealTime);
    }
    if (data.cancelCutoff !== undefined) {
        fields.push(`cancel_cutoff = $${paramCount++}`);
        values.push(data.cancelCutoff);
    }

    if (fields.length === 0) return findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await db.query(
        `UPDATE meals SET ${fields.join(', ')}
         WHERE id = $${paramCount}
         RETURNING id, date, type, menu_items as "menuItems", is_green_day as "isGreenDay",
                   meal_time as "mealTime", cancel_cutoff as "cancelCutoff"`,
        values
    );

    return result.rows[0];
};

/**
 * Delete a meal
 * @param {string} id - Meal UUID
 * @returns {Promise<boolean>} - Success
 */
const deleteById = async (id) => {
    const result = await db.query('DELETE FROM meals WHERE id = $1', [id]);
    return result.rowCount > 0;
};

/**
 * Get all meals
 * @returns {Promise<Array>} - Array of meals
 */
const findAll = async () => {
    const result = await db.query(
        `SELECT id, date, type, menu_items as "menuItems", is_green_day as "isGreenDay",
                meal_time as "mealTime", cancel_cutoff as "cancelCutoff"
         FROM meals ORDER BY date DESC, 
            CASE type 
                WHEN 'breakfast' THEN 1 
                WHEN 'lunch' THEN 2 
                WHEN 'dinner' THEN 3 
            END`
    );
    return result.rows;
};

// Helper functions for default times
const getDefaultMealTime = (type) => {
    const times = { breakfast: '08:00', lunch: '12:30', dinner: '19:30' };
    return times[type] || '12:00';
};

const getDefaultCutoff = (type) => {
    const cutoffs = { breakfast: '07:00', lunch: '11:00', dinner: '18:00' };
    return cutoffs[type] || '10:00';
};

/**
 * Get paginated and filtered meals
 * @param {Object} params - Page, limit, search
 * @returns {Promise<Object>} - { meals, total }
 */
const findPaginated = async ({ page = 1, limit = 10, search = '' }) => {
    const offset = (page - 1) * limit;
    const searchPattern = `%${search}%`;

    const countResult = await db.query(
        `SELECT COUNT(*) FROM meals WHERE menu_items ILIKE $1`,
        [searchPattern]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const mealsResult = await db.query(
        `SELECT id, date, type, menu_items as "menuItems", is_green_day as "isGreenDay",
                meal_time as "mealTime", cancel_cutoff as "cancelCutoff"
         FROM meals 
         WHERE menu_items ILIKE $1
         ORDER BY date DESC, 
            CASE type 
                WHEN 'breakfast' THEN 1 
                WHEN 'lunch' THEN 2 
                WHEN 'dinner' THEN 3 
            END
         LIMIT $2 OFFSET $3`,
        [searchPattern, limit, offset]
    );

    return {
        meals: mealsResult.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

module.exports = {
    findById,
    findAllByDate,
    findByDateRange,
    create,
    update,
    deleteById,
    findAll,
    findPaginated
};
