const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize'); // your sequelize config

const FloatSensor = sequelize.define('FloatSensor', {
  device_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {        // NORMAL or DANGER
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
  },
  recorded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'float_sensor',
  timestamps: false,
});

module.exports = FloatSensor;