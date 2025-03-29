const Logger = require("pizza-logger")
const config = require("../src/config")
const logger = new Logger(config)

class StatusCodeError extends Error {
  constructor(message, statusCode) {
    super(message);
    if (process.env.NODE_ENV !== "test") {
      logger.unhandledErrorLogger(this)
    }
    this.statusCode = statusCode;
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  asyncHandler,
  StatusCodeError,
};
