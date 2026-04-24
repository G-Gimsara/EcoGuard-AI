const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequelize");

const GasReading = sequelize.define("GasReading", {
  device_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gas_ppm: {
    type: DataTypes.FLOAT,
  },
  voltage: {
    type: DataTypes.FLOAT,
  },
  raw_value: {
    type: DataTypes.INTEGER,
  },
  air_status: {
    type: DataTypes.STRING,
  }
}, {
  tableName: "gas_readings",
  timestamps: true   // ✅ creates createdAt & updatedAt automatically
});

module.exports = GasReading;