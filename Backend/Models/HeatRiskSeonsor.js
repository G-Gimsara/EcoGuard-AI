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

  heat_index: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  risk_level: {
    type: DataTypes.STRING,
    allowNull: true,
  }

}, {
  tableName: 'heat_risk_sensor_readings',
  timestamps: true,
});

module.exports = SensorReading;