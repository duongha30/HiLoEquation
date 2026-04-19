'use strict';

const { StatusCodes, ReasonPhrases } = require('../utils/httpStatusCode');

class SuccessResponse {
  constructor({ statusCode = StatusCodes.OK, reasonStatusCode = ReasonPhrases.OK, message, metadata }) {
    this.status = statusCode;
    this.message = !message ? reasonStatusCode : message;
    this.metadata = metadata;
  }

  send(res, header = {}) {
    return res.status(this.status).json(this);
  }
}

class OK extends SuccessResponse {
  constructor({ message = ReasonPhrases.OK, statusCode = StatusCodes.OK, metadata }) {
    super({ statusCode, message, metadata });
  }
}
class Created extends SuccessResponse {
  constructor({ message = ReasonPhrases.CREATED, statusCode = StatusCodes.CREATED, metadata, options = {} }) {
    super({ statusCode, message, metadata });
    this.options = options;
  }
}

module.exports = { OK, Created, SuccessResponse };