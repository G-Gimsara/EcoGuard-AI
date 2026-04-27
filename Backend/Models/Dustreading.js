const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const DustReading = sequelize.define('DustReading', {
  device_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dust_density: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
   air_status: {               
    type: DataTypes.STRING,
    allowNull: false,
  },
  recorded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'PM2_5_readings',
  timestamps: true,
});

module.exports = DustReading;