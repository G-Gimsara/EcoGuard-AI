/* import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Replaces the "new Pool" logic
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres', // Tells Sequelize to use the 'pg' library internally
    logging: false,      // Set to console.log to see SQL queries in terminal
    pool: {
      max: 5,            // Equivalent to pool settings in pg
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Replaces pool.on("connect")
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected via Sequelize");
  } catch (err) {
    console.error("❌ PostgreSQL connection error:", err.message);
  }
};

testConnection();

export default sequelize; */

const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Replaces the "new Pool" logic
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres', // Tells Sequelize to use the 'pg' library internally
    logging: false,      // Set to console.log to see SQL queries in terminal
    pool: {
      max: 5,            // Equivalent to pool settings in pg
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Replaces pool.on("connect")
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected via Sequelize (CommonJS)");
  } catch (err) {
    console.error("❌ PostgreSQL connection error:", err.message);
  }
};

testConnection();


module.exports = sequelize;