const db = require('../db/db');

/**
 * Create a new poll with options
 * @param {string} question - Poll question
 * @param {string} startTime - Start time (ISO string)
 * @param {string} endTime - End time (ISO string)
 * @param {Array<string>} options - Array of option texts
 * @returns {Promise<Object>} - Created poll with options
 */
const create = async (question, startTime, endTime, options) => {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // Create poll
        const pollResult = await client.query(
            `INSERT INTO polls (question, start_time, end_time)
             VALUES ($1, $2, $3)
             RETURNING id, question, start_time as "startTime", end_time as "endTime", is_active as "isActive", created_at as "createdAt"`,
            [question, startTime, endTime]
        );
        const poll = pollResult.rows[0];

        // Create options
        const optionPromises = options.map(optionText =>
            client.query(
                `INSERT INTO poll_options (poll_id, option_text)
                 VALUES ($1, $2)
                 RETURNING id, option_text as "optionText"`,
                [poll.id, optionText]
            )
        );
        const optionResults = await Promise.all(optionPromises);
        poll.options = optionResults.map(r => r.rows[0]);

        await client.query('COMMIT');
        return poll;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

/**
 * Get all polls with options and vote counts (for admin)
 * @returns {Promise<Array>} - Array of polls
 */
const findAll = async () => {
    const result = await db.query(
        `SELECT p.id, p.question, p.start_time as "startTime", p.end_time as "endTime", 
                p.is_active as "isActive", p.created_at as "createdAt",
                (SELECT COUNT(*) FROM poll_votes WHERE poll_id = p.id) as "totalVotes"
         FROM polls p
         ORDER BY p.created_at DESC`
    );

    // Get options for each poll
    for (const poll of result.rows) {
        const optionsResult = await db.query(
            `SELECT o.id, o.option_text as "optionText",
                    (SELECT COUNT(*) FROM poll_votes WHERE option_id = o.id) as "voteCount"
             FROM poll_options o
             WHERE o.poll_id = $1
             ORDER BY o.created_at`,
            [poll.id]
        );
        poll.options = optionsResult.rows;
    }

    return result.rows;
};

/**
 * Get active polls for users
 * @returns {Promise<Array>} - Array of active polls
 */
const findActive = async () => {
    // Use database NOW() for consistent timezone handling
    const result = await db.query(
        `SELECT p.id, p.question, p.start_time as "startTime", p.end_time as "endTime"
         FROM polls p
         WHERE p.is_active = true 
           AND p.start_time <= NOW()
           AND p.end_time >= NOW()
         ORDER BY p.created_at DESC`
    );

    // Get options for each poll
    for (const poll of result.rows) {
        const optionsResult = await db.query(
            `SELECT o.id, o.option_text as "optionText",
                    (SELECT COUNT(*) FROM poll_votes WHERE option_id = o.id) as "voteCount"
             FROM poll_options o
             WHERE o.poll_id = $1
             ORDER BY o.created_at`,
            [poll.id]
        );
        poll.options = optionsResult.rows;
    }

    return result.rows;
};

/**
 * Submit a vote
 * @param {string} pollId - Poll UUID
 * @param {string} optionId - Option UUID
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} - Created vote
 */
const vote = async (pollId, optionId, userId) => {
    const result = await db.query(
        `INSERT INTO poll_votes (poll_id, option_id, user_id)
         VALUES ($1, $2, $3)
         RETURNING id, poll_id as "pollId", option_id as "optionId", created_at as "createdAt"`,
        [pollId, optionId, userId]
    );
    return result.rows[0];
};

/**
 * Check if user has voted on a poll
 * @param {string} pollId - Poll UUID
 * @param {string} userId - User UUID
 * @returns {Promise<Object|null>} - Vote if exists
 */
const getUserVote = async (pollId, userId) => {
    const result = await db.query(
        `SELECT id, option_id as "optionId"
         FROM poll_votes
         WHERE poll_id = $1 AND user_id = $2`,
        [pollId, userId]
    );
    return result.rows[0] || null;
};

/**
 * Delete a poll
 * @param {string} pollId - Poll UUID
 */
const deletePoll = async (pollId) => {
    await db.query('DELETE FROM polls WHERE id = $1', [pollId]);
};

/**
 * Toggle poll active status
 * @param {string} pollId - Poll UUID
 * @param {boolean} isActive - New active status
 */
const toggleActive = async (pollId, isActive) => {
    const result = await db.query(
        `UPDATE polls SET is_active = $1 WHERE id = $2
         RETURNING id, is_active as "isActive"`,
        [isActive, pollId]
    );
    return result.rows[0];
};

module.exports = {
    create,
    findAll,
    findActive,
    vote,
    getUserVote,
    deletePoll,
    toggleActive
};
