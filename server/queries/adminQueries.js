const db = require('../db/db');

/**
 * Get weekly attendance stats (last 7 days)
 * @returns {Promise<Array>} - Daily stats with counts
 */
const getWeeklyStats = async () => {
    const result = await db.query(`
        SELECT 
            m.date::text as date,
            m.type,
            COUNT(CASE WHEN a.status = 'going' THEN 1 END) as going_count,
            COUNT(CASE WHEN a.status = 'not_eating' THEN 1 END) as not_eating_count,
            COALESCE(SUM(a.guest_count), 0) as guest_count
        FROM meals m
        LEFT JOIN attendances a ON m.id = a.meal_id
        WHERE m.date >= CURRENT_DATE - INTERVAL '7 days' AND m.date <= CURRENT_DATE
        GROUP BY m.date, m.type, m.id
        ORDER BY m.date DESC,
            CASE m.type 
                WHEN 'breakfast' THEN 1 
                WHEN 'lunch' THEN 2 
                WHEN 'dinner' THEN 3 
            END
    `);
    return result.rows;
};

/**
 * Get wastage estimates (buffer - actual unused)
 * Wastage = prepared - actual attendance
 * @returns {Promise<Array>} - Wastage data by meal
 */
const getWastageData = async () => {
    const result = await db.query(`
        SELECT 
            m.id,
            m.date::text as date,
            m.type,
            m.actual_wastage,
            m.wastage_kg,
            m.wastage_remarks,
            m.prepared_count,
            COUNT(CASE WHEN a.status = 'going' THEN 1 END) as actual_attendance,
            COALESCE(SUM(a.guest_count), 0) as guests,
            COUNT(CASE WHEN a.status = 'going' THEN 1 END) + COALESCE(SUM(a.guest_count), 0) as total_demand
        FROM meals m
        LEFT JOIN attendances a ON m.id = a.meal_id
        WHERE m.date >= CURRENT_DATE - INTERVAL '45 days' AND m.date <= CURRENT_DATE
        GROUP BY m.id, m.date, m.type, m.actual_wastage, m.wastage_kg, m.wastage_remarks, m.prepared_count
        ORDER BY m.date,
            CASE m.type 
                WHEN 'breakfast' THEN 1 
                WHEN 'lunch' THEN 2 
                WHEN 'dinner' THEN 3 
            END
    `);

    // Calculate estimated wastage (assuming 10% buffer was prepared)
    return result.rows.map(row => {
        const totalDemand = parseInt(row.total_demand) || 0;
        // Use manual prepared count if available, otherwise use 10% buffer estimate
        const prepared = row.prepared_count !== null ? parseInt(row.prepared_count) : (Math.ceil(totalDemand * 1.1) + 5);

        // Use actual wastage if entered, otherwise calculate: prepared - totalDemand
        const hasActualWastage = row.actual_wastage !== null;
        const wastage = hasActualWastage ? parseInt(row.actual_wastage) : Math.max(0, prepared - totalDemand);
        const wastagePercent = prepared > 0 ? Math.round((wastage / prepared) * 100) : 0;

        return {
            id: row.id,
            date: row.date,
            type: row.type,
            actualAttendance: parseInt(row.actual_attendance) || 0,
            guests: parseInt(row.guests) || 0,
            totalDemand,
            estimatedPrepared: prepared,
            estimatedWastage: wastage,
            preparedCount: row.prepared_count,
            wastageKg: row.wastage_kg ? parseFloat(row.wastage_kg) : null,
            remarks: row.wastage_remarks,
            wastagePercent,
            hasActualWastage,
            actualWastage: row.actual_wastage
        };
    });
};

/**
 * Update actual wastage for a meal
 * @param {string} mealId - Meal ID
 * @param {number} actualWastage - Actual wastage count
 * @returns {Promise<Object>} - Updated meal
 */
const updateWastage = async (mealId, actualWastage, wastageKg, remarks, preparedCount) => {
    const result = await db.query(
        `UPDATE meals 
         SET actual_wastage = $1, 
             wastage_kg = $2, 
             wastage_remarks = $3, 
             prepared_count = $4,
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $5 
         RETURNING *`,
        [actualWastage, wastageKg, remarks, preparedCount, mealId]
    );
    return result.rows[0];
};

const getAllUsers = async (page = 1, limit = 10, search = '') => {
    let whereClause = '';
    const params = [];

    if (search) {
        whereClause = ` WHERE name ILIKE $1 OR email ILIKE $1 OR roll_no ILIKE $1 `;
        params.push(`%${search}%`);
    }

    const countResult = await db.query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const offset = (page - 1) * limit;
    const queryParams = [...params, limit, offset];

    let query = `
        SELECT id, name, email, roll_no as "rollNo", role, karma_points as "karmaPoints", 
               department, created_at as "createdAt"
        FROM users 
        ${whereClause}
        ORDER BY 
            CASE role WHEN 'admin' THEN 1 WHEN 'manager' THEN 2 ELSE 3 END,
            karma_points DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const result = await db.query(query, queryParams);

    return {
        users: result.rows,
        total
    };
};

/**
 * Get meal settings (default timings per type)
 * @returns {Promise<Object>} - Settings object
 */
const getMealSettings = async () => {
    // Get the most recent meal of each type to determine current settings
    const result = await db.query(`
        SELECT DISTINCT ON (type) 
            type, meal_time as "mealTime", cancel_cutoff as "cancelCutoff"
        FROM meals
        ORDER BY type, date DESC
    `);

    // Default settings if no meals exist
    const defaults = {
        breakfast: { mealTime: '08:00', cancelCutoff: '07:00' },
        lunch: { mealTime: '12:30', cancelCutoff: '11:00' },
        dinner: { mealTime: '19:30', cancelCutoff: '18:00' }
    };

    const settings = { ...defaults };
    result.rows.forEach(row => {
        settings[row.type] = {
            mealTime: row.mealTime,
            cancelCutoff: row.cancelCutoff
        };
    });

    return settings;
};

module.exports = {
    getWeeklyStats,
    getWastageData,
    getAllUsers,
    getMealSettings,
    updateWastage
};
