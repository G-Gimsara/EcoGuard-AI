const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const WaterTempReading = sequelize.define('WaterTempReading', {
  device_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  temp_status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  recorded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'water_temp_readings',
  timestamps: true,
});

module.exports = WaterTempReading;