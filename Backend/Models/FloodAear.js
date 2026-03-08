// models/FloodAlert.js
const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const FloodAlert = sequelize.define('FloodAear', {
    river_rise: {
        type: DataTypes.STRING, // e.g., "+55mm", "+100mm"
        allowNull: false
    },
    alert_level: {
        type: DataTypes.STRING, // e.g., "Alert", "Minor", "Major"
        allowNull: false
    },
    first_affected: {
        type: DataTypes.JSONB, // Store as JSON: [{area: "Megoda Kolonnawa GND", depth: "1 ft"}]
        allowNull: true
    },
    next_affected: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    further_affected: {
        type: DataTypes.JSONB,
        allowNull: true
    },
    widespread_zones: {
        type: DataTypes.JSONB,
        allowNull: true
    }
}, {
    tableName: 'FloodAear',
    timestamps: true
});

module.exports = FloodAlert;