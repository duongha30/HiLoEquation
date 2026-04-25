import { ReasonPhrases, StatusCodes } from '../utils/httpStatusCode';

interface ErrorOptions {
    message?: string;
    statusCode?: number;
}

class ErrorResponse extends Error {
    status: number;

    constructor({ message, statusCode }: ErrorOptions) {
        super(message);
        this.status = statusCode!;
    }
}

class ConflictRequestError extends ErrorResponse {
    constructor({ message = ReasonPhrases.CONFLICT, statusCode = StatusCodes.CONFLICT }: ErrorOptions = {}) {
        super({ message, statusCode });
    }
}

class BadRequestError extends ErrorResponse {
    constructor({ message = ReasonPhrases.BAD_REQUEST, statusCode = StatusCodes.BAD_REQUEST }: ErrorOptions = {}) {
        super({ message, statusCode });
    }
}

class UnauthorizedError extends ErrorResponse {
    constructor({ message = ReasonPhrases.UNAUTHORIZED, statusCode = StatusCodes.UNAUTHORIZED }: ErrorOptions = {}) {
        super({ message, statusCode });
    }
}

class NotFoundError extends ErrorResponse {
    constructor({ message = ReasonPhrases.NOT_FOUND, statusCode = StatusCodes.NOT_FOUND }: ErrorOptions = {}) {
        super({ message, statusCode });
    }
}

class ForbiddenError extends ErrorResponse {
    constructor({ message = ReasonPhrases.FORBIDDEN, statusCode = StatusCodes.FORBIDDEN }: ErrorOptions = {}) {
        super({ message, statusCode });
    }
}

export {
    ErrorResponse,
    ConflictRequestError,
    BadRequestError,
    UnauthorizedError,
    NotFoundError,
    ForbiddenError,
};
