'use strict';

const { ReasonPhrases, StatusCodes } = require('../utils/httpStatusCode');

const StatusCode = {
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
}

const ReasonStatusCode = {
    NO_CONTENT: 'No Content',
    BAD_REQUEST: 'Bad Request',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    NOT_FOUND: 'Not Found',
    CONFLICT: 'Conflict',
}

class ErrorResponse extends Error {
    constructor({ message, status }) {
        super(message);
        this.status = status;
    }
}

class ConflictRequestError extends ErrorResponse {
    constructor({ message = ReasonStatusCode.CONFLICT, statusCode = StatusCode.CONFLICT }) {
        super({ message, statusCode });
    }
}

class BadRequestError extends ErrorResponse {
    constructor({ message = ReasonStatusCode.BAD_REQUEST, statusCode = StatusCode.BAD_REQUEST }) {
        super({ message, statusCode });
    }
}

class UnauthorizedError extends ErrorResponse {
    constructor({ message = ReasonPhrases.UNAUTHORIZED, statusCode = StatusCodes.UNAUTHORIZED }) {
        super({ message, statusCode });
    }
}
class NotFoundError extends ErrorResponse {
    constructor({ message = ReasonStatusCode.NOT_FOUND, statusCode = StatusCode.NOT_FOUND }) {
        super({ message, statusCode });
    }
}
class ForbiddenError extends ErrorResponse {
    constructor({ message = ReasonStatusCode.FORBIDDEN, statusCode = StatusCode.FORBIDDEN }) {
        super({ message, statusCode });
    }
}

module.exports = {
    ConflictRequestError,
    BadRequestError,
    UnauthorizedError,
    NotFoundError,
    ForbiddenError
};