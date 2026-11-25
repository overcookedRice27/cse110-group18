import { LEVEL_COUNT } from "./registry";
import { loadSavedLevel, saveLevel } from "../konva/save";
import type { LevelData } from "../konva/levels/levelData";

export type ArchivedLevelMetadata = {
    levelId: number;
    timeSpentMs: number;
    correctValidations: number;
    incorrectValidations: number;
    bestTimeMs?: number;
    best_attempt_count?: number;
    newFailedAttempts?: number;
};

// One record per playable level. Time is measured in milliseconds with a monotonic clock.
export class LevelMetadata {
    correctValidations = 0;
    incorrectValidations = 0;
    clearAttempts = 0;
    clearTimeMs = 0;
    archivedIncorrectValidations = 0;
    private visitStartedAt: number | null = null;
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
        this.visitStartedAt = this.startedAt;
        this.clearAttempts = 0;
        this.clearTimeMs = 0;
    }

    stop(): void {
        if (this.startedAt === null) return;
        this.elapsedMs += performance.now() - this.startedAt;
        this.startedAt = null;
    }

    recordValidation(passed: boolean): void {
        this.clearAttempts++;
        if (passed) {
            this.correctValidations++;
            // A clear includes time spent correcting earlier failed validations.
            this.clearTimeMs = this.visitStartedAt === null ? 0 : performance.now() - this.visitStartedAt;
        } else {
            this.incorrectValidations++;
        }
        this.stop();
    }

    reset(): void {
        this.elapsedMs = 0;
        this.startedAt = null;
        this.correctValidations = 0;
        this.incorrectValidations = 0;
        this.archivedIncorrectValidations = 0;
        this.visitStartedAt = null;
        this.clearAttempts = 0;
        this.clearTimeMs = 0;
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

// Append a plain snapshot and save it together with the current board and progress.
export function archiveMetadata(
    level: LevelData,
    highestCompleted: number,
    specialAbilityCharge: number = 0,
): boolean {
    const metadata = getLevelMetadata(level.id);
    let previousBestTimeMs = Infinity;
    let previousBestAttempts = Infinity;
    const archive = loadSavedLevel()?.archivedMetadata;
    for (const entry of Array.isArray(archive) ? archive : []) {
        if (entry?.levelId !== level.id) continue;
        // Legacy snapshots timed only up to the first validation.
        const legacyFirstTry = entry.incorrectValidations === 0 && entry.correctValidations > 0;
        const savedTime = entry.bestTimeMs ?? (legacyFirstTry ? entry.timeSpentMs : undefined);
        const savedAttempts = entry.best_attempt_count ?? (legacyFirstTry ? 1 : undefined);
        if (typeof savedTime === "number" && Number.isFinite(savedTime) && savedTime >= 0) {
            previousBestTimeMs = Math.min(previousBestTimeMs, savedTime);
        }
        if (typeof savedAttempts === "number" && Number.isInteger(savedAttempts) && savedAttempts >= 1) {
            previousBestAttempts = Math.min(previousBestAttempts, savedAttempts);
        }
    }
    saveLevel(level, highestCompleted, specialAbilityCharge, {
        levelId: metadata.levelId,
        timeSpentMs: metadata.timeSpentMs,
        correctValidations: metadata.correctValidations,
        incorrectValidations: metadata.incorrectValidations,
        bestTimeMs: Math.min(metadata.clearTimeMs, previousBestTimeMs),
        best_attempt_count: Math.min(metadata.clearAttempts, previousBestAttempts),
        newFailedAttempts: metadata.incorrectValidations - metadata.archivedIncorrectValidations,
    });
    metadata.archivedIncorrectValidations = metadata.incorrectValidations;
    return (Number.isFinite(previousBestTimeMs) && metadata.clearTimeMs < previousBestTimeMs) ||
        (Number.isFinite(previousBestAttempts) && metadata.clearAttempts < previousBestAttempts);
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
        level!.recordValidation(signal.passed);
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
