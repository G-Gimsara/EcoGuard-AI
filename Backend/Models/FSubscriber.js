const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequelize");

const FloodSubscriber = sequelize.define(
  "FloodSubscriber",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    email: {
      type: DataTypes.STRING,
    },

    station: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    alertMethods: {
      type: DataTypes.JSON, // ["SMS","WhatsApp"]
      allowNull: false,
    },

    riskLevels: {
      type: DataTypes.JSON, // ["High","Critical"]
      allowNull: false,
    },

    language: {
      type: DataTypes.ENUM("en", "si", "ta"),
      defaultValue: "en",
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "flood_subscribers",
    timestamps: true,
  }
);

module.exports = FloodSubscriber;
