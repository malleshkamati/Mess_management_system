const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const feedbackQueries = require('../queries/feedbackQueries');
const mealQueries = require('../queries/mealQueries');

// Submit feedback for a meal
router.post('/', auth, async (req, res) => {
    try {
        const { mealId, rating, remarks, isAnonymous } = req.body;

        if (!mealId || !rating) {
            return res.status(400).json({ error: 'Meal ID and rating are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Verify meal exists
        const meal = await mealQueries.findById(mealId);
        if (!meal) {
            return res.status(404).json({ error: 'Meal not found' });
        }

        const feedback = await feedbackQueries.create(req.user.id, mealId, rating, remarks, isAnonymous || false);
        res.status(201).json(feedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get current user's feedback history
router.get('/my', auth, async (req, res) => {
    try {
        const feedback = await feedbackQueries.findByUserId(req.user.id);
        res.json(feedback);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get meals by date (for the feedback form)
router.get('/meals/:date', auth, async (req, res) => {
    try {
        const meals = await mealQueries.findAllByDate(req.params.date);
        res.json(meals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
