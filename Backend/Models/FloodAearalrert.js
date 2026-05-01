// Flood area impact snapshots by alert level and rise.
const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const FloodAlert = sequelize.define('FloodAear', {
    river_rise: {
        // Raw rise label from source (example: "+55mm").
        type: DataTypes.STRING,
        allowNull: false
    },
    alert_level: {
        // Severity label used by frontend and reporting.
        type: DataTypes.STRING,
        allowNull: false
    },
    first_affected: {
        // JSON list, e.g. [{ area: "...", depth: "..." }]
        type: DataTypes.JSONB,
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
    // Keep table naming aligned with existing DB schema.
    tableName: 'FloodAear',
    timestamps: true
});

module.exports = FloodAlert;