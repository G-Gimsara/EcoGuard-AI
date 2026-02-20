const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const Water = sequelize.define('Water', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    station: {
        type: DataTypes.STRING,
        allowNull: false
    },

    waterLevel: {
        type: DataTypes.FLOAT,
        allowNull: false
    },

    rainfallLevel: {
        type: DataTypes.FLOAT,
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

    recordedAt: {   // timestamp of the report
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }

}, {
    tableName: 'Water',
    timestamps: true
});

module.exports = Water;
