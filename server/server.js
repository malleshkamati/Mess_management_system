const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// app.use(cors());
app.use(express.json());

// Routes
// Route Imports
const authRoutes = require('./routes/auth');
const mealRoutes = require('./routes/meals');
const adminRoutes = require('./routes/admin');
const breakRoutes = require('./routes/longBreak');
const feedbackRoutes = require('./routes/feedback');
const pollRoutes = require('./routes/polls');

// Routes - Mount at both /api and root to handle misconfiguration
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/meals', mealRoutes);
app.use('/meals', mealRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

app.use('/api/breaks', breakRoutes);
app.use('/breaks', breakRoutes);

app.use('/api/feedback', feedbackRoutes);
app.use('/feedback', feedbackRoutes);

app.use('/api/polls', pollRoutes);
app.use('/polls', pollRoutes);

app.get('/', (req, res) => {
    res.send('Mess Management API is running');
});

// Initialize Database
const initializeDB = async () => {
    try {
        await db.initializeSchema();
        console.log('Database connected and schema initialized');
    } catch (err) {
        console.error('Database connection failed:', err);
    }
};

// Start Server if not running on Vercel
if (require.main === module) {
    initializeDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });
} else {
    // For Vercel, we need to initialize DB on first request ideally, 
    // or just assume the pool connection works. 
    // Vercel might kill the process, so lightweight connection is better.
    // We'll just run initialization asynchronously.
    initializeDB();
}

module.exports = app;
