const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequelize");

const DustReading = sequelize.define("DustReading", {
  device_id: {
    type: DataTypes.STRING,
  },
  dust: {
    type: DataTypes.FLOAT,
  },
  air_status: {
    type: DataTypes.STRING,
  }
});

module.exports = DustReading;