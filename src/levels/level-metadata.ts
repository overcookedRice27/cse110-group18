import { LEVEL_COUNT } from "./registry";

// One record per playable level. Time is measured in milliseconds with a monotonic clock.
export class LevelMetadata {
    correctValidations = 0;
    incorrectValidations = 0;
    private elapsedMs = 0;
    private startedAt: number | null = null;

    constructor(readonly levelId: number) {}

    // Include the running interval when metadata is read before validation finishes.
    get timeSpentMs(): number {
        return this.elapsedMs + (this.startedAt === null ? 0 : performance.now() - this.startedAt);
    }

    get isTracking(): boolean {
        return this.startedAt !== null;
    }

    start(): void {
        if (this.startedAt !== null) return;
        // Re-entering starts a fresh timed visit while retaining validation counts.
        this.elapsedMs = 0;
        this.startedAt = performance.now();
    }

    stop(): void {
        if (this.startedAt === null) return;
        this.elapsedMs += performance.now() - this.startedAt;
        this.startedAt = null;
    }

    reset(): void {
        this.elapsedMs = 0;
        this.startedAt = null;
        this.correctValidations = 0;
        this.incorrectValidations = 0;
    }
}

// Freeze the array's size/order while allowing each of its ten records to accumulate data.
export const LEVEL_METADATA: readonly LevelMetadata[] = Object.freeze(
    Array.from({ length: LEVEL_COUNT }, (_, index) => new LevelMetadata(index + 1)),
);

export function getLevelMetadata(levelId: number): LevelMetadata {
    if (!Number.isInteger(levelId) || levelId < 1 || levelId > LEVEL_METADATA.length) {
        throw new RangeError(`Invalid level ID: ${levelId}`);
    }
    return LEVEL_METADATA[levelId - 1];
}

// Player navigation and validation broadcast these signals to the metadata listener.
export type LevelMetadataSignal =
    | { type: "start"; levelId: number }
    | { type: "validated"; levelId: number; passed: boolean }
    | { type: "stop" }
    | { type: "reset" };

class MetadataEvent extends Event {
    constructor(readonly signal: LevelMetadataSignal) {
        super("level-metadata");
    }
}

const signals = new EventTarget();
let activeLevel: LevelMetadata | null = null;

signals.addEventListener("level-metadata", (event) => {
    const signal = (event as MetadataEvent).signal;
    // Resolve IDs before changing the current timer so invalid signals have no effect.
    const level = "levelId" in signal ? getLevelMetadata(signal.levelId) : null;
    if (signal.type === "start") {
        if (activeLevel === level) return;
        activeLevel?.stop();
        activeLevel = level!;
        activeLevel.start();
    } else if (signal.type === "validated") {
        // Count every player validation, including repeated clicks after timing stops.
        if (signal.passed) level!.correctValidations++;
        else level!.incorrectValidations++;
        level!.stop();
        if (activeLevel === level) activeLevel = null;
    } else {
        activeLevel?.stop();
        activeLevel = null;
        if (signal.type === "reset") LEVEL_METADATA.forEach((entry) => entry.reset());
    }
});

export function signalLevelMetadata(signal: LevelMetadataSignal): void {
    // Validate outside dispatchEvent so callers receive invalid-ID errors directly.
    if ("levelId" in signal) getLevelMetadata(signal.levelId);
    signals.dispatchEvent(new MetadataEvent(signal));
}
