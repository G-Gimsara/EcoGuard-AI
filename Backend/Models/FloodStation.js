const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequelize");

const Station = sequelize.define(
  "Station",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    station_code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },

    river_name: DataTypes.STRING,
    district: DataTypes.STRING,

    lat: DataTypes.DECIMAL(9, 6),
    lon: DataTypes.DECIMAL(9, 6),

    danger_level_cm: DataTypes.FLOAT,
    warning_level_cm: DataTypes.FLOAT,
  },
  {
    tableName: "stations",
    timestamps: true,
  }
);

module.exports = Station;
