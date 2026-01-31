const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/breaks', require('./routes/longBreak'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/polls', require('./routes/polls'));

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
