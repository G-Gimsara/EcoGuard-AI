const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const FloodAlert = sequelize.define('FloodAlert', {
  device_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  recorded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'flood_alerts',
  timestamps: true,
});

module.exports = FloodAlert;