const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

// Float device danger/normal status history.
const FloodAlert = sequelize.define('FloodAlert', {
  device_id: {
    // Device identifier from sensor payload.
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    // Current state label (e.g., NORMAL / DANGER).
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    // Optional context sent by device/processor for this status.
    type: DataTypes.STRING,
    allowNull: false,
  },
  recorded_at: {
    // Event timestamp at persistence time.
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  // Keep table naming aligned with existing schema.
  tableName: 'flood_alerts',
  timestamps: true,
});

module.exports = FloodAlert;