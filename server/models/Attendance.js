module.exports = (sequelize, DataTypes) => {
    const Attendance = sequelize.define('Attendance', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        status: {
            type: DataTypes.ENUM('going', 'not_eating'),
            defaultValue: 'going',
        },
        guestCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isLateChange: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        skipReason: {
            type: DataTypes.STRING,
        }
    });

    return Attendance;
};
