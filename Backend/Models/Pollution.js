// models/PollutionData.js
const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const PollutionData = sequelize.define('PollutionData', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    area_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false
    },
    pm25: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    pm10: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    co: {                 // NEW: Carbon monoxide (ppm)
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co2: {                // NEW: Carbon dioxide (ppm)
        type: DataTypes.FLOAT,
        allowNull: true
    },
    no2: {                // NEW: Nitrogen dioxide (ppb)
        type: DataTypes.FLOAT,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING(50),
        allowNull: false
    }
}, {
    tableName: 'pollution_data',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = PollutionData;