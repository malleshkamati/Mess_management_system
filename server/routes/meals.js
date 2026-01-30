const express = require('express');
const router = express.Router();
const mealQueries = require('../queries/mealQueries');
const attendanceQueries = require('../queries/attendanceQueries');
const userQueries = require('../queries/userQueries');
const auth = require('../middleware/auth');

// Helper: Get meal end time in minutes from midnight
const getMealEndTime = (type) => {
    const endTimes = {
        breakfast: 9 * 60,    // 9:00 AM = 540 mins
        lunch: 14 * 60,       // 2:00 PM = 840 mins
        dinner: 21 * 60       // 9:00 PM = 1260 mins
    };
    return endTimes[type] || 12 * 60;
};

// Helper: Check if meal is expired (1 hour after end time)
const isMealExpired = (mealType, mealDate) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // If meal is from a past date, it's expired
    if (mealDate < today) return true;
    // If meal is from a future date, not expired
    if (mealDate > today) return false;

    // For today's meals, check time
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const mealEndTime = getMealEndTime(mealType);
    const expiryTime = mealEndTime + 60; // 1 hour after end

    return currentMinutes >= expiryTime;
};

// Get Today's Meals with User Status
router.get('/today', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const meals = await mealQueries.findAllByDate(today);

        // Fetch user's attendance for these meals
        const mealIds = meals.map(m => m.id);
        const attendance = await attendanceQueries.findByUserAndMeals(req.user.id, mealIds);

        const result = meals.map(meal => {
            const att = attendance.find(a => a.mealId === meal.id);
            return {
                ...meal,
                userStatus: att ? att.status : 'going', // Default to going
                isLateChange: att ? att.isLateChange : false,
                guestCount: att ? att.guestCount : 0,
                isKarmaClaimed: att ? att.isKarmaClaimed : false,
                isExpired: isMealExpired(meal.type, meal.date)
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Upcoming Meals (Next 7 days) with User Status
router.get('/upcoming', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];

        const meals = await mealQueries.findByDateRange(today, nextWeekStr);

        // Fetch user's attendance for these meals
        const mealIds = meals.map(m => m.id);
        const attendance = await attendanceQueries.findByUserAndMeals(req.user.id, mealIds);

        const result = meals.map(meal => {
            const att = attendance.find(a => a.mealId === meal.id);
            return {
                ...meal,
                userStatus: att ? att.status : 'going',
                isLateChange: att ? att.isLateChange : false,
                guestCount: att ? att.guestCount : 0,
                isKarmaClaimed: att ? att.isKarmaClaimed : false,
                isExpired: isMealExpired(meal.type, meal.date)
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle Status (Going / Not Eating)
router.post('/:id/intent', auth, async (req, res) => {
    const { status, skipReason } = req.body; // status: 'going' | 'not_eating'
    try {
        const meal = await mealQueries.findById(req.params.id);
        if (!meal) return res.status(404).json({ error: 'Meal not found' });

        // Check if meal is expired (1 hour after end time)
        if (isMealExpired(meal.type, meal.date)) {
            return res.status(400).json({ error: 'This meal has expired. You can no longer change your status.' });
        }

        // Find or create attendance record
        const { attendance: att } = await attendanceQueries.findOrCreate(
            req.user.id,
            meal.id,
            { status: 'going' }
        );

        // KARMA LOGIC:
        // Award points if the user declares 'going' OR 'not_eating' AND hasn't claimed karma for this meal yet
        // Incentivize ANY explicit communication to help planning
        let pointsAwarded = 0;
        if (!att.isKarmaClaimed) {
            await userQueries.incrementKarma(req.user.id, 1);
            pointsAwarded = 1;
            // Mark as claimed
            await attendanceQueries.update(att.id, { isKarmaClaimed: true });
        }

        // Update attendance
        const updatedAtt = await attendanceQueries.update(att.id, {
            status,
            skipReason: status === 'not_eating' ? skipReason : att.skipReason
        });

        // Return updated user karma
        const updatedUser = await userQueries.findById(req.user.id);
        res.json({
            success: true,
            status: updatedAtt.status,
            karma: updatedUser.karmaPoints,
            isKarmaClaimed: true,
            gained: pointsAwarded
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add/Update Guest
router.post('/:id/guest', auth, async (req, res) => {
    const { guestCount } = req.body; // Number (0-3)
    try {
        const meal = await mealQueries.findById(req.params.id);
        if (!meal) return res.status(404).json({ error: 'Meal not found' });

        // Check if meal is expired (1 hour after end time)
        if (isMealExpired(meal.type, meal.date)) {
            return res.status(400).json({ error: 'This meal has expired. You can no longer add guests.' });
        }

        const { attendance: att } = await attendanceQueries.findOrCreate(
            req.user.id,
            meal.id,
            { status: 'going' }
        );

        // Update Guest Count and set status to 'going' if adding guests
        const updateData = { guestCount };
        if (guestCount > 0) {
            updateData.status = 'going'; // implied
        }

        // KARMA LOGIC:
        // Award points if adding guest AND hasn't claimed karma for this meal yet
        let pointsAwarded = 0;
        if (guestCount > 0 && !att.isKarmaClaimed) {
            await userQueries.incrementKarma(req.user.id, 1);
            pointsAwarded = 1;
            updateData.isKarmaClaimed = true;
        }

        const updatedAtt = await attendanceQueries.update(att.id, updateData);

        // Return updated user karma
        const updatedUser = await userQueries.findById(req.user.id);
        res.json({
            success: true,
            guestCount: updatedAtt.guestCount,
            karma: updatedUser.karmaPoints,
            isKarmaClaimed: true,
            gained: pointsAwarded
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Student Impact (Food Saved)
router.get('/impact', auth, async (req, res) => {
    try {
        const skipCount = await attendanceQueries.getSkipsByUser(req.user.id);
        const foodSavedKg = (skipCount * 0.5).toFixed(1); // 0.5kg per meal estimate

        res.json({
            skipCount,
            foodSavedKg,
            mealsSaved: skipCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
