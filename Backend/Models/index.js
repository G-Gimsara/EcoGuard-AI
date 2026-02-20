const User = require('./User');

const Device = require('./Device');
const WaterLevel = require('./WaterLevel');
const Notification = require('./Notification');

// Relationships

Device.hasMany(WaterLevel, { foreignKey: 'deviceId' });
WaterLevel.belongsTo(Device, { foreignKey: 'deviceId' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
    User,
    Device,
    WaterLevel,
    Notification
};
