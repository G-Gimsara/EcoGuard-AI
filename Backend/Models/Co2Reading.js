const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const Co2Reading = sequelize.define('Co2Reading', {
  device_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  aqi: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tvoc: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  eco2: {
    type: DataTypes.INTEGER,
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
  tableName: 'co2_readings',
  timestamps: true,
});

module.exports = Co2Reading;