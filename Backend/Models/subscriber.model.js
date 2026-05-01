const { DataTypes } = require("sequelize");
const sequelize = require("../Config/sequelize");

const Subscriber = sequelize.define(
  "Subscriber",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "full_name",
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: "phone_number",
    },
    isSubscribed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_subscribed",
    },
    otpCode: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: "otp_code",
    },
    otpExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "otp_expires_at",
    },
  },
  {
    tableName: "subscribers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = Subscriber;
