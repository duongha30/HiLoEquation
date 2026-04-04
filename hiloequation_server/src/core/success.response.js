'use strict';

const StatusCode = {
  OK: 200,
  CREATED: 201,
}

const ReasonStatusCode = {
  OK: 'Success',
  CREATED: 'Created',
}
class SuccessResponse {
  constructor({ statusCode = StatusCode.OK, reasonStatusCode = ReasonStatusCode.OK, message, metadata }) {
    this.status = statusCode;
    this.message = !message ? reasonStatusCode : message;
    this.metadata = metadata;
  }

  send(res, header = {}) {
    return res.status(this.status).json(this);
  }
}

class OK extends SuccessResponse {
  constructor({ message = ReasonStatusCode.OK, statusCode = StatusCode.OK, metadata }) {
    super({ statusCode, message, metadata });
  }
}
class Created extends SuccessResponse {
  constructor({ message = ReasonStatusCode.CREATED, statusCode = StatusCode.CREATED, metadata, options = {} }) {
    super({ statusCode, message, metadata });
    this.options = options;
  }
}

module.exports = { OK, Created, SuccessResponse };