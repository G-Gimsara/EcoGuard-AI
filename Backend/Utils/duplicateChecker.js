// utils/duplicateChecker.js

const lastValues = {};

// 🔥 GAS (Ammonia)
const isGasDuplicate = (device_id, gas_ppm) => {
  const key = `gas_${device_id}`;
  if (lastValues[key] === gas_ppm) return true;
  lastValues[key] = gas_ppm;
  return false;
};

// 🌡️ AIR QUALITY (Temperature + Humidity)
const isAirDuplicate = (device_id, temperature, humidity) => {
  const key = `air_${device_id}`;
  const combined = `${temperature}_${humidity}`;
  if (lastValues[key] === combined) return true;
  lastValues[key] = combined;
  return false;
};

// 🌪️ DUST
const isDustDuplicate = (device_id, dust_density) => {
  const key = `dust_${device_id}`;
  if (lastValues[key] === dust_density) return true;
  lastValues[key] = dust_density;
  return false;
};

// 🟤 CO
const isCODuplicate = (device_id, co_value) => {
  const key = `co_${device_id}`;
  if (lastValues[key] === co_value) return true;
  lastValues[key] = co_value;
  return false;
};

// 🟣 CO2 / IAQ
const isCO2Duplicate = (device_id, eco2) => {
  const key = `co2_${device_id}`;
  if (lastValues[key] === eco2) return true;
  lastValues[key] = eco2;
  return false;
};

module.exports = {
  isGasDuplicate,
  isAirDuplicate,
  isDustDuplicate,
  isCODuplicate,
  isCO2Duplicate
};