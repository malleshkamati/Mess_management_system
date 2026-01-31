const db = require('./db/db');

async function checkDates() {
    try {
        const res = await db.query('SELECT date, date::text as date_text FROM meals LIMIT 5');
        console.log('Results:', JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDates();
