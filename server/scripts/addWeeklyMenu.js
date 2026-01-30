const db = require('../db/db');
const mealQueries = require('../queries/mealQueries');

const seedWeeklyMenu = async () => {
    const meals = [];
    const startDate = new Date(); // Today

    const menuData = [
        {
            breakfast: 'Poha, Jalebi, Milk',
            lunch: 'Veg Pulao, Raita, Salad, Papad',
            dinner: 'Paneer Butter Masala, Butter Roti, Dal Fry'
        }, // Day 0 (Today)
        {
            breakfast: 'Aloo Paratha, Curd, Tea',
            lunch: 'Chole Bhature, Pickle, Lassi',
            dinner: 'Mixed Vegetable Curry, Chapati, Rice'
        }, // Day 1
        {
            breakfast: 'Idli, Sambhar, Coconut Chutney',
            lunch: 'Special Veg Biryani, Mirchi Ka Salan, Raita',
            dinner: 'Dal Makhani, Jeera Rice, Garlic Naan'
        }, // Day 2
        {
            breakfast: 'Bread Jam, Butter, Boiled Eggs/Sprouts',
            lunch: 'Rajma Chawal, Jeera Aloo, Curd',
            dinner: 'Aloo Gobhi Matar, Chapati, Dal Tadka'
        }, // Day 3
        {
            breakfast: 'Upma, Ginger Chutney, Coffee',
            lunch: 'Kadhi Pakoda, Steamed Rice, Salad',
            dinner: 'Bhindi Masala, Roti, Moong Dal'
        }, // Day 4
        {
            breakfast: 'Onion Uttapam, Tomato Chutney',
            lunch: 'Lemon Rice, Potato Fry, Curd',
            dinner: 'Malai Kofta, Lachha Paratha, Jeera Rice'
        }, // Day 5
        {
            breakfast: 'Puri, Aloo Bhaji, Halwa',
            lunch: 'Sambhar Rice, Beans Poriyal, Papad',
            dinner: 'Egg Curry / Masala Paneer, Roti, Rice'
        }  // Day 6
    ];

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        meals.push({
            date: dateStr,
            type: 'breakfast',
            menuItems: menuData[i].breakfast,
            isGreenDay: false
        });
        meals.push({
            date: dateStr,
            type: 'lunch',
            menuItems: menuData[i].lunch,
            isGreenDay: i === 2
        });
        meals.push({
            date: dateStr,
            type: 'dinner',
            menuItems: menuData[i].dinner,
            isGreenDay: false
        });
    }

    try {
        console.log(`Seeding ${meals.length} meals starting from ${meals[0].date}...`);
        const result = await mealQueries.upsertMany(meals);
        console.log(`Successfully seeded ${result.length} meals!`);
    } catch (err) {
        console.error('CRITICAL ERROR DURING SEEDING:');
        console.error(err.message);
        if (err.detail) console.error('Detail:', err.detail);
        if (err.where) console.error('Where:', err.where);
        console.error(err.stack);
    } finally {
        process.exit();
    }
};

seedWeeklyMenu();
