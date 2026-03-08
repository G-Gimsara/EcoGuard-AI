// sequelize.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance with fallback env vars
const sequelize = new Sequelize(
  process.env.PG_DATABASE || process.env.DB_NAME,
  process.env.PG_USER || process.env.DB_USER,
  process.env.PG_PASSWORD || process.env.DB_PASSWORD,
  {
    host: process.env.PG_HOST || process.env.DB_HOST,
    port: Number(process.env.PG_PORT || process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false, // change to console.log if you want SQL logs
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Test DB connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected via Sequelize');
  } catch (error) {
    console.error('❌ Sequelize connection error:', error.message);
  }
})();

module.exports = sequelize;