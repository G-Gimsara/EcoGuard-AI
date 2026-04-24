const { DataTypes } = require('sequelize');
const sequelize = require('../Config/sequelize');

const Employee = sequelize.define('Employee', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

 

  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true   
  },

  alert_frequency: {
    type: DataTypes.ENUM("daily", "weekly", "off"),
    defaultValue: "daily"
  },

  // 🔥 NEW: track last alert sent time
  last_alert_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // 🔥 NEW: next alert time
  next_alert_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  otp_code: {
  type: DataTypes.STRING,
  allowNull: true
},

otp_verified: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
},

otp_expires_at: {
  type: DataTypes.DATE,
  allowNull: true
},

}, {
  tableName: 'airuser',
  timestamps: false,
});

module.exports = Employee;