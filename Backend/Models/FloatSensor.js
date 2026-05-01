const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

// Stores float switch readings coming from field devices.
const FloatSensor = sequelize.define('FloatSensor', {
  device_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Device state used by alert logic (typically NORMAL or DANGER).
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
  },
  recorded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  // Existing table is managed manually, so disable Sequelize timestamps.
  tableName: 'float_sensor',
  timestamps: false,
});

module.exports = FloatSensor;