const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const PhReading = sequelize.define('PhReading', {
  device_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ph_value: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  ph_status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  recorded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'ph_readings',
  timestamps: true,
});

module.exports = PhReading;