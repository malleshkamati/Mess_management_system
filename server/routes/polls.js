const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pollQueries = require('../queries/pollQueries');
const userQueries = require('../queries/userQueries');

// Get active polls for users
router.get('/active', auth, async (req, res) => {
    try {
        const polls = await pollQueries.findActive();

        // Check if user has voted on each poll
        for (const poll of polls) {
            const userVote = await pollQueries.getUserVote(poll.id, req.user.id);
            poll.userVote = userVote ? userVote.optionId : null;
        }

        res.json(polls);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit vote
router.post('/:id/vote', auth, async (req, res) => {
    try {
        const { optionId } = req.body;
        const pollId = req.params.id;

        if (!optionId) {
            return res.status(400).json({ error: 'Option ID is required' });
        }

        // Check if user already voted
        const existingVote = await pollQueries.getUserVote(pollId, req.user.id);
        if (existingVote) {
            return res.status(400).json({ error: 'You have already voted on this poll' });
        }

        const vote = await pollQueries.vote(pollId, optionId, req.user.id);

        // Award 1 Karma Point
        const updatedUser = await userQueries.incrementKarma(req.user.id, 1);

        res.status(201).json({
            ...vote,
            karma: updatedUser.karmaPoints,
            gained: 1
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
