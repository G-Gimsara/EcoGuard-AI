const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequelize");

const TemQuality = sequelize.define("TemQuality", {
  device_id: {
    type: DataTypes.STRING,
  },
  temperature: {
    type: DataTypes.FLOAT,
  },
  humidity: {
    type: DataTypes.FLOAT,
  },
  temp_status: {
    type: DataTypes.STRING,
  },
  humidity_status: {
    type: DataTypes.STRING,
  }
});

module.exports = TemQuality;