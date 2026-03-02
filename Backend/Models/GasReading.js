const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const GasReading = sequelize.define('GasReading', {
  device_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gas_ppm: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  voltage: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  raw_value: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  recorded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'gas_readings',
  timestamps: true,
});

module.exports = GasReading;