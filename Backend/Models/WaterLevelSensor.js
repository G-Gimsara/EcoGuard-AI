const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const WaterLevel = sequelize.define('WaterLevel', {
  device_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  water_level_mm: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  recorded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'water_levels',
  timestamps: true,
});

module.exports = WaterLevel;