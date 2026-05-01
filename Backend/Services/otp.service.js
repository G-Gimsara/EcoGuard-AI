function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getOtpExpiry(minutes = 5) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

module.exports = {
  generateOTP,
  getOtpExpiry,
};
