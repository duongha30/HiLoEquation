export type BasicHeaders = {
    'Content-Type'?: string;
    'Accept-Language'?: string;
    'Cache-Control'?: string;
    Pragma?: 'no-cache';
    Expires?: '0';
    Accept?: 'application/json';
};
export type RequestData = Record<string, any>;

export type RequestHeaders = Record<string, string> & BasicHeaders;

export type RequestParams = Record<string, string | number | boolean>;

export type NumOfTries = 1 | 3;

export type RequestSpread = { initialDelayMS: number; maxDelayMS: number };

export type RetryConfig =
    | {
        enabled: false;
    }
    | {
        enabled: true;
        numOfTries?: NumOfTries;
    };


export type RequestOptions = GetEndpointOptions & {
    isFullEndpoint?: boolean;
    noCache?: boolean;
    noLanguageCode?: boolean;
    isContentTypeJson?: boolean;
    headerInResponse?: boolean;
    noQueryParams?: boolean;
    isFile?: boolean;
    useLanguageCode?: boolean;
    customContentType?: string;
    requestSpread?: RequestSpread;
    retryConfig?: RetryConfig;
    triggerOffline?: boolean;
    abortSignal?: AbortSignal;
};

export type GetEndpointOptions = {
    isFullEndpoint?: boolean;
    nodeIdxOverride?: number;
};
