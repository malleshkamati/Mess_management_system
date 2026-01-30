const db = require('../db/db');

async function dropDuplicateTable() {
    try {
        // Drop the Sequelize-created "Users" table (with capital U)
        await db.query('DROP TABLE IF EXISTS "Users" CASCADE');
        console.log('✅ Dropped duplicate "Users" table');

        // Also drop other Sequelize tables if they exist
        await db.query('DROP TABLE IF EXISTS "Meals" CASCADE');
        await db.query('DROP TABLE IF EXISTS "Attendances" CASCADE');
        console.log('✅ Cleaned up all duplicate Sequelize tables');

        // Show remaining tables
        const result = await db.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        console.log('\n📋 Current tables in database:');
        result.rows.forEach(r => console.log('  -', r.table_name));

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        process.exit();
    }
}

dropDuplicateTable();
