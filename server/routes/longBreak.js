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

module.exports = router;
