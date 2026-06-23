const timers = new Map<string, NodeJS.Timeout>();

export const DECLARE_PHASE_DURATION_MS = 90_000;

function start(roomCode: string, onTimeout: () => void): void {
    cancel(roomCode);
    const handle = setTimeout(() => {
        timers.delete(roomCode);
        onTimeout();
    }, DECLARE_PHASE_DURATION_MS);
    timers.set(roomCode, handle);
}

function cancel(roomCode: string): void {
    const existing = timers.get(roomCode);
    if (existing) {
        clearTimeout(existing);
        timers.delete(roomCode);
    }
}

export const declarePhaseTimer = { start, cancel };
