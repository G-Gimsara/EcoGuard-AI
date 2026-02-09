/* import { DataTypes } from "sequelize";
import sequelize from "../Config/sequelize_heat.js";

const Prediction = sequelize.define("Prediction", {
  location: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true, // Used for the "ON CONFLICT" logic
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    primaryKey: true, // Composite primary key with location
  },
  tempmax: DataTypes.DECIMAL(5, 2),
  humidity: DataTypes.DECIMAL(5, 2),
  dew: DataTypes.DECIMAL(5, 2),
  solarradiation: DataTypes.DECIMAL(10, 2),
  heat_index: DataTypes.DECIMAL(5, 2),
  risk_level: DataTypes.STRING,
}, {
  tableName: "predictions",
  timestamps: true,
});

export default Prediction; */

const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequelize.js"); // Sequelize instance එක require කරන්න

const Prediction = sequelize.define("Prediction", {
  location: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true, // Used for the "ON CONFLICT" logic
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    primaryKey: true, // Composite primary key with location
  },
  tempmax: DataTypes.DECIMAL(5, 2),
  humidity: DataTypes.DECIMAL(5, 2),
  dew: DataTypes.DECIMAL(5, 2),
  solarradiation: DataTypes.DECIMAL(10, 2),
  heat_index: DataTypes.DECIMAL(5, 2),
  risk_level: DataTypes.STRING,
}, {
  tableName: "predictions",
  timestamps: false,
});


module.exports = Prediction;