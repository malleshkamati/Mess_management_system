const db = require('../db/db');

async function migrate() {
    try {
        console.log('Adding meal_time and cancel_cutoff columns...');

        await db.query(`
            ALTER TABLE meals 
            ADD COLUMN IF NOT EXISTS meal_time TIME DEFAULT '12:00:00'
        `);

        await db.query(`
            ALTER TABLE meals 
            ADD COLUMN IF NOT EXISTS cancel_cutoff TIME DEFAULT '10:00:00'
        `);

        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        await db.pool.end();
        process.exit();
    }
}

migrate();
