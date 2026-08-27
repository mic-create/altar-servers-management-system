const validateString = (val) => typeof val === 'string' && val.trim().length > 0;

module.exports = {
  validateString
};