const db = require('../db/db');
const bcrypt = require('bcryptjs');

const seedWithHistory = async () => {
    try {
        await db.initializeSchema();

        // Clear existing data
        await db.query('DELETE FROM attendances');
        await db.query('DELETE FROM meals');
        await db.query('DELETE FROM users');

        const hashedPassword = await bcrypt.hash('123456', 10);

        // Create Users
        const studentResult = await db.query(
            `INSERT INTO users (name, email, password, roll_no, role, karma_points)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            ['Student User', 'student@test.com', hashedPassword, '21CS001', 'student', 10]
        );
        const studentId = studentResult.rows[0].id;

        await db.query(
            `INSERT INTO users (name, email, password, role)
             VALUES ($1, $2, $3, $4)`,
            ['Mess Manager', 'admin@test.com', hashedPassword, 'admin']
        );

        // Add more sample students
        const sampleStudents = [
            ['Alice Johnson', 'alice@test.com', '21CS002', 15],
            ['Bob Smith', 'bob@test.com', '21CS003', 8],
            ['Charlie Brown', 'charlie@test.com', '21CS004', 22],
            ['Diana Lee', 'diana@test.com', '21CS005', 5],
            ['Eva Wilson', 'eva@test.com', '21CS006', 18]
        ];

        for (const [name, email, rollNo, karma] of sampleStudents) {
            await db.query(
                `INSERT INTO users (name, email, password, roll_no, role, karma_points)
                 VALUES ($1, $2, $3, $4, 'student', $5)`,
                [name, email, hashedPassword, rollNo, karma]
            );
        }

        // Create meals for the last 7 days + today
        const mealTypes = ['breakfast', 'lunch', 'dinner'];
        const mealTimes = { breakfast: '08:00', lunch: '12:30', dinner: '19:30' };
        const cancelCutoffs = { breakfast: '07:00', lunch: '11:00', dinner: '18:00' };
        const menus = {
            breakfast: ['Aloo Paratha, Curd, Tea', 'Poha, Jalebi, Milk', 'Idli Sambar, Coconut Chutney'],
            lunch: ['Rice, Dal Fry, Jeera Aloo, Chapati', 'Rajma Rice, Salad, Papad', 'Chole Bhature, Pickle'],
            dinner: ['Paneer Butter Masala, Roti, Rice', 'Dal Makhani, Naan, Pulao', 'Veg Biryani, Raita']
        };

        const mealIds = [];

        for (let i = 7; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            for (const type of mealTypes) {
                const menuIndex = Math.floor(Math.random() * menus[type].length);
                const result = await db.query(
                    `INSERT INTO meals (date, type, menu_items, meal_time, cancel_cutoff)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id`,
                    [dateStr, type, menus[type][menuIndex], mealTimes[type], cancelCutoffs[type]]
                );
                mealIds.push({ id: result.rows[0].id, date: dateStr, type });
            }
        }

        // Create random attendance data for history
        const allUsers = await db.query('SELECT id FROM users WHERE role = $1', ['student']);
        const userIds = allUsers.rows.map(u => u.id);

        for (const meal of mealIds) {
            // Random number of students attend (60-90%)
            const attendanceRate = 0.6 + Math.random() * 0.3;

            for (const userId of userIds) {
                if (Math.random() < attendanceRate) {
                    const guestCount = Math.random() < 0.2 ? Math.floor(Math.random() * 3) + 1 : 0;
                    await db.query(
                        `INSERT INTO attendances (user_id, meal_id, status, guest_count)
                         VALUES ($1, $2, 'going', $3)
                         ON CONFLICT (user_id, meal_id) DO NOTHING`,
                        [userId, meal.id, guestCount]
                    );
                } else if (Math.random() < 0.5) {
                    await db.query(
                        `INSERT INTO attendances (user_id, meal_id, status, skip_reason)
                         VALUES ($1, $2, 'not_eating', 'Not hungry')
                         ON CONFLICT (user_id, meal_id) DO NOTHING`,
                        [userId, meal.id]
                    );
                }
            }
        }

        console.log('Database seeded with historical data successfully!');
        console.log(`- Created ${userIds.length + 1} users (1 admin + ${userIds.length} students)`);
        console.log(`- Created ${mealIds.length} meals (8 days × 3 meals)`);
        console.log('- Generated random attendance data for heatmap');
    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        await db.pool.end();
        process.exit();
    }
};

seedWithHistory();
