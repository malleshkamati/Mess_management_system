module.exports = (sequelize, DataTypes) => {
    const Meal = sequelize.define('Meal', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        date: {
            type: DataTypes.DATEONLY, // YYYY-MM-DD
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('breakfast', 'lunch', 'dinner'),
            allowNull: false,
        },
        menuItems: {
            type: DataTypes.TEXT, // JSON string or simple text
            defaultValue: 'Standard Menu',
        },
        isGreenDay: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        }
    }, {
        indexes: [
            {
                unique: true,
                fields: ['date', 'type']
            }
        ]
    });

    return Meal;
};
