const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./db/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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

// Initialize Database and Start Server
const startServer = async () => {
    try {
        // Initialize database schema
        await db.initializeSchema();
        console.log('Database connected and schema initialized');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
};

startServer();
