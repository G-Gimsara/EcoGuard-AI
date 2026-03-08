const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequelize");

const FloodMeasurement = sequelize.define("FloodMeasurement", {
  riseLevel: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  severity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstAffected: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  nextAffected: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  floodFeet: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, {
  tableName: "flood_measurements",
  timestamps: true
});

module.exports = FloodMeasurement;