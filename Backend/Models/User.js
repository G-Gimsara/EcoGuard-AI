const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('User', 'farmer', 'tourism_guide', 'marine_authority'),
        defaultValue: 'User'
    },

    // ✅ NEW FIELDS

    latitude: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },

    longitude: {
        type: DataTypes.DOUBLE,
        allowNull: true
    },

    city: {
        type: DataTypes.STRING,
        allowNull: true
    },

    risk_topic: {
        type: DataTypes.STRING,
        allowNull: true
    }

}, {
    tableName: 'users',
    timestamps: true
});

module.exports = User;