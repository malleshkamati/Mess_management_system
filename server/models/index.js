const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false,
    }
);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./User')(sequelize, Sequelize);
db.Meal = require('./Meal')(sequelize, Sequelize);
db.Attendance = require('./Attendance')(sequelize, Sequelize);

// Associations
db.User.hasMany(db.Attendance, { foreignKey: 'userId' });
db.Attendance.belongsTo(db.User, { foreignKey: 'userId' });

db.Meal.hasMany(db.Attendance, { foreignKey: 'mealId' });
db.Attendance.belongsTo(db.Meal, { foreignKey: 'mealId' });

module.exports = db;
