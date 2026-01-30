const express = require('express');
const router = express.Router();
const mealQueries = require('../queries/mealQueries');
const attendanceQueries = require('../queries/attendanceQueries');
const auth = require('../middleware/auth');

// Long Break (Bulk Update)
router.post('/long-break', auth, async (req, res) => {
    const { startDate, endDate, skipReason } = req.body;
    try {
        // Find meals in range
        const meals = await mealQueries.findByDateRange(startDate, endDate);

        if (meals.length === 0) return res.json({ message: 'No meals found in range', count: 0 });

        // Get meal IDs
        const mealIds = meals.map(m => m.id);

        // Bulk update to not_eating using efficient upsert
        const updatedCount = await attendanceQueries.bulkSetNotEating(
            req.user.id,
            mealIds,
            skipReason || 'Long Break'
        );

        res.json({ success: true, count: updatedCount, message: `Updated ${updatedCount} meals to Not Eating.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cancel Break (Set meals back to 'going')
router.post('/cancel-break', auth, async (req, res) => {
    const { startDate, endDate } = req.body;
    try {
        // Find meals in range
        const meals = await mealQueries.findByDateRange(startDate, endDate);

        if (meals.length === 0) return res.json({ message: 'No meals found in range', count: 0 });

        // Get meal IDs
        const mealIds = meals.map(m => m.id);

        // Bulk update to 'going'
        const updatedCount = await attendanceQueries.bulkSetStatus(
            req.user.id,
            mealIds,
            'going'
        );

        res.json({ success: true, count: updatedCount, message: `Restored ${updatedCount} meals to 'Going'.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get My Leaves (Dates where user is 'not_eating')
router.get('/my-leaves', auth, async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        // Find meals in range
        const meals = await mealQueries.findByDateRange(startDate, endDate);

        if (meals.length === 0) return res.json([]);

        // Get meal IDs
        const mealIds = meals.map(m => m.id);

        // Get user attendance
        const attendance = await attendanceQueries.findByUserAndMeals(req.user.id, mealIds);

        // Filter for 'not_eating' and return dates
        const leaveDates = attendance
            .filter(a => a.status === 'not_eating')
            .map(a => {
                const meal = meals.find(m => m.id === a.mealId);
                return meal ? meal.date : null;
            })
            .filter(date => date !== null); // Remove nulls

        // Deduplicate dates
        const uniqueDates = [...new Set(leaveDates)];

        res.json(uniqueDates);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
