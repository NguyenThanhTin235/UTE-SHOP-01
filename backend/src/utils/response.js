const { toCamelCase } = require('./formatter');

const success = (res, options) => {
  const { message, data, meta, statusCode = 200 } = options;
  const payload = {
    success: true,
    code: statusCode,
    message,
    data: toCamelCase(data),
    timestamp: Math.floor(Date.now() / 1000)
  };
  if (meta) {
    payload.meta = meta;
  }
  return res.status(statusCode).json(payload);
};

const error = (res, options) => {
  const { message, statusCode = 400, errors = null } = options;
  return res.status(statusCode).json({
    success: false,
    code: statusCode,
    message,
    data: null,
    errors,
    timestamp: Math.floor(Date.now() / 1000)
  });
};

module.exports = {
  success,
  error
};
