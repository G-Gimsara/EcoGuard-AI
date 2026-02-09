// models/StationReading.js
const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequelize");

const StationReading = sequelize.define(
  "StationReading",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    station_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    water_level_cm: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    rainfall_mm: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },

    battery: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    lat: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },

    lon: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },
  },
  {
    tableName: "station_readings",
    timestamps: true,
    indexes: [
      { fields: ["station_id"] },
      { fields: ["timestamp"] },
    ],
  }
);

module.exports = StationReading;
