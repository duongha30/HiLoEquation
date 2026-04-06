type RetryOptions = {
    retries?: number;       // max retry attempts (default: 3)
    delayMs?: number;       // base delay in ms between retries (default: 300)
    backoff?: boolean;      // exponential backoff (default: true)
    signal?: AbortSignal;   // abort signal to cancel in-flight retries
};

function delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
        }
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}

export async function retryRequest<T>(
    fn: (signal: AbortSignal) => Promise<T>,
    options: RetryOptions = {},
): Promise<T> {
    const {
        retries = 3,
        delayMs = 300,
        backoff = true,
        signal,
    } = options;

    const controller = new AbortController();

    // Forward external abort into the internal controller
    signal?.addEventListener('abort', () => controller.abort(signal.reason), { once: true });

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
        if (controller.signal.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }

        try {
            return await fn(controller.signal);
        } catch (err) {
            // Do not retry on abort
            if (err instanceof DOMException && err.name === 'AbortError') {
                throw err;
            }

            lastError = err;

            if (attempt < retries) {
                const wait = backoff ? delayMs * 2 ** attempt : delayMs;
                await delay(wait, controller.signal);
            }
        }
    }

    throw lastError;
}
