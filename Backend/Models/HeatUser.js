/* import { DataTypes } from "sequelize";
import sequelize from "../Config/sequelize_heat.js";

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
  },
  location: {
    type: DataTypes.STRING,
  },
}, {
  tableName: "users",
  timestamps: true,
  underscored: true, // This maps "createdAt" in JS to "created_at" in Postgres
});

export default User; */

const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequelize.js");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
  },
  location: {
    type: DataTypes.STRING,
  },
}, {
  tableName: "Heatusers",
  timestamps: true,
  underscored: true, // "createdAt" -> "created_at" mapping  for  Postgres
});


module.exports = User;