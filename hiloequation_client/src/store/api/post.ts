import APP_CONFIG from '../../config/config.json';
import type { RequestData, RequestHeaders } from './types';

const BASE_URL = APP_CONFIG.API_BASE_URL;

export const post = async <T = unknown>(
    url: string,
    data: RequestData = {},
    headers: RequestHeaders = {},
): Promise<T> => {
    const response = await fetch(`${BASE_URL}${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || 'Request failed');
    }

    return response.json() as Promise<T>;
};
