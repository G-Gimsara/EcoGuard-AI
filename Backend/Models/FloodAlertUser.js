const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequelize");

const FloodAlertUser = sequelize.define(
  "FloodAlertUser",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: true,
      validate: {
        is: /^947\d{8}$/,
      },
    },
    isSubscribed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "alert_users",
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = FloodAlertUser;
