import { StatusCodes, ReasonPhrases } from '../utils/httpStatusCode';
import type { Response } from 'express';

interface SuccessResponseOptions {
    statusCode?: number;
    reasonStatusCode?: string;
    message?: string;
    metadata?: unknown;
}

class SuccessResponse {
    status: number;
    message: string;
    metadata: unknown;

    constructor({ statusCode = StatusCodes.OK, reasonStatusCode = ReasonPhrases.OK, message, metadata }: SuccessResponseOptions) {
        this.status = statusCode;
        this.message = !message ? reasonStatusCode : message;
        this.metadata = metadata;
    }

    send(res: Response, _header: Record<string, string> = {}) {
        return res.status(this.status).json(this);
    }
}

class OK extends SuccessResponse {
    constructor({ message = ReasonPhrases.OK, statusCode = StatusCodes.OK, metadata }: Omit<SuccessResponseOptions, 'reasonStatusCode'>) {
        super({ statusCode, message, metadata });
    }
}

class Created extends SuccessResponse {
    options: Record<string, unknown>;

    constructor({ message = ReasonPhrases.CREATED, statusCode = StatusCodes.CREATED, metadata, options = {} }: Omit<SuccessResponseOptions, 'reasonStatusCode'> & { options?: Record<string, unknown> }) {
        super({ statusCode, message, metadata });
        this.options = options;
    }
}

export { OK, Created, SuccessResponse };
