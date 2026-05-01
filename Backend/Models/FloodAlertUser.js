const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequelize");

// Subscribers who receive flood SMS alerts.
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
      // One active record per phone number.
      unique: true,
      validate: {
        // Local format: 947XXXXXXXX
        is: /^947\d{8}$/,
      },
    },
    isSubscribed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    unsubscribeOtp: {
      // Temporary OTP used for subscribe/unsubscribe verification.
      type: DataTypes.STRING(6),
      allowNull: true,
    },
    unsubscribeOtpExpiresAt: {
      // Expiration timestamp for the OTP above.
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    // Keep history via createdAt; updatedAt is not needed for this flow.
    tableName: "alert_users",
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = FloodAlertUser;
