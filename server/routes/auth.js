const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userQueries = require('../queries/userQueries');

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userQueries.findByEmail(email);
        if (!user) return res.status(400).json({ error: 'Invalid email or password' });

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).json({ error: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token, user: { id: user.id, name: user.name, role: user.role, karmaPoints: user.karmaPoints } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Register
router.post('/register', async (req, res) => {
    const { name, email, password, rollNo, department } = req.body;
    try {
        // Check if user already exists
        const existingUser = await userQueries.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await userQueries.create({
            name,
            email,
            password: hashedPassword,
            rollNo: rollNo || null,
            role: 'student',
            department: department || null
        });

        // Generate token
        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role, karmaPoints: user.karmaPoints || 0 } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
