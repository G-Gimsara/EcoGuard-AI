const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequelize");

// Core water-level readings used by dashboard, alerts, and reports.
const FloodMeasurement = sequelize.define("FloodMeasurement", {
  riseLevel: {
    // Current river rise value from sensor pipeline.
    type: DataTypes.FLOAT,
    allowNull: false
  },
  severity: {
    // Derived level label (Normal, Alert, Minor, ...).
    type: DataTypes.STRING,
    allowNull: false
  },
  firstAffected: {
    // Primary impact zone text shown in UI cards/tables.
    type: DataTypes.TEXT,
    allowNull: true
  },
  nextAffected: {
    // Secondary/next zone text for escalation context.
    type: DataTypes.TEXT,
    allowNull: true
  },
  floodFeet: {
    // Approximate flood depth estimate in feet.
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, {
  // Persist createdAt for timeline/history ordering.
  tableName: "flood_measurements",
  timestamps: true
});

module.exports = FloodMeasurement;