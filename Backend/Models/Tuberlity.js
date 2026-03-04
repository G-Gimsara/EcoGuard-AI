const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const TurbidityReading = sequelize.define('TurbidityReading', {
  device_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  turbidity_ntu: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  turbidity_status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  threshold_alert: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  recorded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'turbidity_readings',
  timestamps: true,
});

module.exports = TurbidityReading;