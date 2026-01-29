module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: true },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        rollNo: {
            type: DataTypes.STRING,
            unique: true,
        },
        role: {
            type: DataTypes.ENUM('student', 'admin', 'manager'),
            defaultValue: 'student',
        },
        karmaPoints: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        department: {
            type: DataTypes.STRING,
        }
    });

    return User;
};
