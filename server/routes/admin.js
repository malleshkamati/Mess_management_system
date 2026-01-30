const express = require('express');
const router = express.Router();
const mealQueries = require('../queries/mealQueries');
const attendanceQueries = require('../queries/attendanceQueries');
const adminQueries = require('../queries/adminQueries');
const feedbackQueries = require('../queries/feedbackQueries');
const pollQueries = require('../queries/pollQueries');
const auth = require('../middleware/auth');
const db = require('../db/db');

// Middleware to check if admin
const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
        return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
};

// Get Demand Stats for Today
router.get('/demand', auth, adminAuth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const meals = await mealQueries.findAllByDate(today);

        const studentCountResult = await db.query("SELECT COUNT(*) FROM users WHERE role = 'student'");
        const totalStudents = parseInt(studentCountResult.rows[0].count);

        const stats = await Promise.all(meals.map(async (meal) => {
            const studentCount = await attendanceQueries.countByMealAndStatus(meal.id, 'going');
            const guestSum = await attendanceQueries.sumGuestsByMeal(meal.id);
            const buffer = Math.ceil((studentCount + guestSum) * 0.1) + 1;
            const confidence = 'High';

            return {
                id: meal.id,
                type: meal.type,
                date: meal.date,
                mealTime: meal.mealTime,
                cancelCutoff: meal.cancelCutoff,
                studentCount,
                guestCount: guestSum,
                totalDemand: studentCount + guestSum,
                buffer,
                totalStudents,
                absentCount: totalStudents - studentCount,
                recommendedPrep: studentCount + guestSum + buffer,
                confidence
            };
        }));

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Weekly Stats for Charts
router.get('/weekly-stats', auth, adminAuth, async (req, res) => {
    try {
        const stats = await adminQueries.getWeeklyStats();
        const studentCountResult = await db.query("SELECT COUNT(*) FROM users WHERE role = 'student'");
        const totalStudents = parseInt(studentCountResult.rows[0].count);

        res.json({ weeklyData: stats, totalStudents });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Wastage Data for Heatmap
router.get('/wastage', auth, adminAuth, async (req, res) => {
    try {
        const wastage = await adminQueries.getWastageData();
        res.json(wastage);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Actual Wastage for a meal
router.put('/wastage/:mealId', auth, adminAuth, async (req, res) => {
    try {
        const { mealId } = req.params;
        const { actualWastage, wastageKg, remarks, preparedCount } = req.body;

        const meal = await adminQueries.updateWastage(mealId, actualWastage, wastageKg, remarks, preparedCount);
        if (!meal) {
            return res.status(404).json({ error: 'Meal not found' });
        }
        res.json({ success: true, meal });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Users
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const result = await adminQueries.getAllUsers(
            parseInt(page),
            parseInt(limit),
            search
        );
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Meal Settings
router.get('/settings', auth, adminAuth, async (req, res) => {
    try {
        const settings = await adminQueries.getMealSettings();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create New Meal
router.post('/meals', auth, adminAuth, async (req, res) => {
    try {
        const { date, type, menuItems, isGreenDay, mealTime, cancelCutoff } = req.body;
        const meal = await mealQueries.create({ date, type, menuItems, isGreenDay, mealTime, cancelCutoff });
        res.json(meal);
    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation
            res.status(400).json({ error: 'Meal already exists for this date and type' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Update Meal
router.put('/meals/:id', auth, adminAuth, async (req, res) => {
    try {
        const { menuItems, isGreenDay, mealTime, cancelCutoff } = req.body;
        const meal = await mealQueries.update(req.params.id, { menuItems, isGreenDay, mealTime, cancelCutoff });
        if (!meal) return res.status(404).json({ error: 'Meal not found' });
        res.json(meal);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Meal
router.delete('/meals/:id', auth, adminAuth, async (req, res) => {
    try {
        const success = await mealQueries.deleteById(req.params.id);
        if (!success) return res.status(404).json({ error: 'Meal not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All Meals (for management)
router.get('/meals', auth, adminAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const result = await mealQueries.findPaginated({
            page: parseInt(page),
            limit: parseInt(limit),
            search
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Bulk Upsert Meals (Weekly Menu)
router.post('/meals/bulk', auth, adminAuth, async (req, res) => {
    try {
        const { meals } = req.body;
        if (!meals || !Array.isArray(meals)) {
            return res.status(400).json({ error: 'Meals array is required' });
        }
        const result = await mealQueries.upsertMany(meals);
        res.json({ success: true, count: result.length, meals: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export Data as CSV
router.get('/export', auth, adminAuth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];

        const wastage = await adminQueries.getWastageData();

        // Generate CSV
        const headers = ['Date', 'Meal Type', 'Attendance', 'Guests', 'Total Demand', 'Est. Prepared', 'Est. Wastage', 'Wastage %'];
        const rows = wastage.map(w =>
            [w.date, w.type, w.actualAttendance, w.guests, w.totalDemand, w.estimatedPrepared, w.estimatedWastage, w.wastagePercent + '%'].join(',')
        );

        const csv = [headers.join(','), ...rows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=mess-report-${start}-to-${end}.csv`);
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all feedback (admin view)
router.get('/feedback', auth, adminAuth, async (req, res) => {
    try {
        const feedback = await feedbackQueries.findAll();
        res.json(feedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==================== POLL MANAGEMENT ====================

// Get all polls
router.get('/polls', auth, adminAuth, async (req, res) => {
    try {
        const polls = await pollQueries.findAll();
        res.json(polls);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new poll
router.post('/polls', auth, adminAuth, async (req, res) => {
    try {
        const { question, startTime, endTime, options } = req.body;

        if (!question || !startTime || !endTime || !options || options.length < 2) {
            return res.status(400).json({ error: 'Question, start/end time, and at least 2 options are required' });
        }

        const poll = await pollQueries.create(question, startTime, endTime, options);
        res.status(201).json(poll);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete poll
router.delete('/polls/:id', auth, adminAuth, async (req, res) => {
    try {
        await pollQueries.deletePoll(req.params.id);
        res.json({ message: 'Poll deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle poll active status
router.patch('/polls/:id/toggle', auth, adminAuth, async (req, res) => {
    try {
        const { isActive } = req.body;
        const poll = await pollQueries.toggleActive(req.params.id, isActive);
        res.json(poll);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
