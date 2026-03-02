const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const SensorReading = sequelize.define('SensorReading', {
  device_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  humidity: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  voltage: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  raw_data: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'heat_risk_sensor_readings',
  timestamps: true,
});

module.exports = SensorReading;