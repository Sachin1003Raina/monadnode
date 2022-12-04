class CustomError extends Error {
  constructor(code = "Generic", status = 500, ...params) {
    super(...params);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
    this.code = code;
    this.status = status;
    this.name = "ClientError";
  }
}
module.exports = CustomError;
