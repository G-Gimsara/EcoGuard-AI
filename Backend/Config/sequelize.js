// sequelize.js
const { Sequelize } = require('sequelize');
require('dotenv').config();
const sequelize = new Sequelize("flood_alert_db", "postgres", "root", {
    host: "localhost",
    dialect: 'postgres',
     port: 5432,
  logging: false, 
});

sequelize.authenticate()
    .then(() => console.log('PostgreSQL connected via Sequelize'))
    .catch(err => console.log('Sequelize connection error: ' + err));

module.exports = sequelize;