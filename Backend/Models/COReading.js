const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const COReading = sequelize.define('COReading', {
  device_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  raw_value: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  voltage: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  co_value: {                // ✅ ADD THIS
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  recorded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'co_readings',
  timestamps: true,
});

module.exports = COReading;