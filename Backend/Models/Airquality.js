const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const AirQuality = sequelize.define('AirQuality', {
  device_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  humidity: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  recorded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'air_quality',
  timestamps: true,
});

module.exports = AirQuality;
