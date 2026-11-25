// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadSavedLevel } from "../src/konva/save";
import { archiveMetadata, getLevelMetadata, LEVEL_METADATA, signalLevelMetadata } from "../src/levels/level-metadata";

let now = 0;
beforeEach(() => {
    localStorage.clear();
    // Control elapsed time precisely without waiting for real timers.
    signalLevelMetadata({ type: "reset" });
    now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
});

describe("saved personal bests", () => {
    function clearLevel(timeMs: number, attempts: number, levelId = 1): boolean {
        signalLevelMetadata({ type: "start", levelId });
        const startedAt = now;
        for (let attempt = 1; attempt < attempts; attempt++) {
            now = startedAt + (timeMs * attempt) / attempts;
            signalLevelMetadata({ type: "validated", levelId, passed: false });
        }
        now = startedAt + timeMs;
        signalLevelMetadata({ type: "validated", levelId, passed: true });
        return archiveMetadata({ id: levelId, pieces: [] }, levelId);
    }

    it("saves a faster clear even when it takes more attempts", () => {
        expect(clearLevel(1000, 1)).toBe(false);
        signalLevelMetadata({ type: "reset" });
        expect(clearLevel(800, 2)).toBe(true);
        expect(clearLevel(800, 2)).toBe(false);
        expect(clearLevel(1200, 2)).toBe(false);
        expect(loadSavedLevel()?.archivedMetadata?.at(-1)).toMatchObject({
            bestTimeMs: 800,
            best_attempt_count: 1,
        });
    });

    it("saves fewer attempts even when the clear is slower and keeps records per level", () => {
        expect(clearLevel(500, 1, 2)).toBe(false);
        expect(clearLevel(1000, 3)).toBe(false);
        expect(clearLevel(1200, 2)).toBe(true);
        expect(clearLevel(1400, 2)).toBe(false);
        expect(loadSavedLevel()?.archivedMetadata?.at(-1)).toMatchObject({
            bestTimeMs: 1000,
            best_attempt_count: 2,
        });
    });
});
afterEach(() => {
    signalLevelMetadata({ type: "reset" });
    vi.restoreAllMocks();
});

describe("level metadata signals", () => {
    // The registry always has exactly one initially empty record for each level.
    it("holds ten fixed records with IDs 1 through 10", () => {
        expect(LEVEL_METADATA).toHaveLength(10);
        expect(Object.isFrozen(LEVEL_METADATA)).toBe(true);
        expect(LEVEL_METADATA.map((entry) => entry.levelId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        for (const entry of LEVEL_METADATA) {
            expect(entry.timeSpentMs).toBe(0);
            expect(entry.correctValidations).toBe(0);
            expect(entry.incorrectValidations).toBe(0);
        }
    });

    // Either validation result must end timing and increment only its own counter.
    it.each([true, false])("stops time and counts validation (passed: %s)", (passed) => {
        signalLevelMetadata({ type: "start", levelId: 2 });
        now = 1500;
        expect(getLevelMetadata(2).timeSpentMs).toBe(1500);
        signalLevelMetadata({ type: "validated", levelId: 2, passed });
        now = 5000;
        const entry = getLevelMetadata(2);
        expect(entry.timeSpentMs).toBe(1500);
        expect(entry.isTracking).toBe(false);
        expect(entry.correctValidations).toBe(passed ? 1 : 0);
        expect(entry.incorrectValidations).toBe(passed ? 0 : 1);
    });

    // Reopening discards the previous visit's time but preserves validation totals.
    // Revalidating while stopped counts another result without adding elapsed time.
    it("resets time on re-entry while preserving validation counts", () => {
        signalLevelMetadata({ type: "start", levelId: 1 });
        now = 100;
        signalLevelMetadata({ type: "validated", levelId: 1, passed: false });
        now = 200;
        signalLevelMetadata({ type: "validated", levelId: 1, passed: false });
        expect(getLevelMetadata(1).timeSpentMs).toBe(100);
        signalLevelMetadata({ type: "start", levelId: 1 });
        expect(getLevelMetadata(1).timeSpentMs).toBe(0);
        now = 250;
        signalLevelMetadata({ type: "validated", levelId: 1, passed: true });
        expect(getLevelMetadata(1).timeSpentMs).toBe(50);
        expect(getLevelMetadata(1).incorrectValidations).toBe(2);
        expect(getLevelMetadata(1).correctValidations).toBe(1);
    });

    // Returning from another level resets only the reopened level's time.
    it("starts a fresh visit after navigating away and back", () => {
        signalLevelMetadata({ type: "start", levelId: 1 });
        now = 100;
        signalLevelMetadata({ type: "start", levelId: 2 });
        now = 300;
        signalLevelMetadata({ type: "start", levelId: 1 });
        expect(getLevelMetadata(1).timeSpentMs).toBe(0);
        expect(getLevelMetadata(2).timeSpentMs).toBe(200);
        now = 350;
        signalLevelMetadata({ type: "stop" });
        expect(getLevelMetadata(1).timeSpentMs).toBe(50);
    });

    // Navigation stops the old level, and returning to the menu stops the current level.
    it("times only the active level and stops on navigation", () => {
        signalLevelMetadata({ type: "start", levelId: 1 });
        now = 100;
        signalLevelMetadata({ type: "start", levelId: 2 });
        now = 300;
        signalLevelMetadata({ type: "stop" });
        now = 900;
        expect(getLevelMetadata(1).timeSpentMs).toBe(100);
        expect(getLevelMetadata(2).timeSpentMs).toBe(200);
        expect(LEVEL_METADATA.every((entry) => !entry.isTracking)).toBe(true);
    });

    // Duplicate start signals must not discard time already spent on the same visit.
    it("does not restart an already active timer", () => {
        signalLevelMetadata({ type: "start", levelId: 1 });
        now = 100;
        signalLevelMetadata({ type: "start", levelId: 1 });
        now = 200;
        signalLevelMetadata({ type: "stop" });
        expect(getLevelMetadata(1).timeSpentMs).toBe(200);
    });

    // New Game clears accumulated records and any running timer without resizing the registry.
    it("resets all metadata for a fresh game", () => {
        signalLevelMetadata({ type: "start", levelId: 1 });
        now = 100;
        signalLevelMetadata({ type: "validated", levelId: 1, passed: true });
        signalLevelMetadata({ type: "start", levelId: 2 });
        signalLevelMetadata({ type: "reset" });
        expect(LEVEL_METADATA).toHaveLength(10);
        for (const entry of LEVEL_METADATA) {
            expect(entry.timeSpentMs).toBe(0);
            expect(entry.correctValidations + entry.incorrectValidations).toBe(0);
            expect(entry.isTracking).toBe(false);
        }
    });

    it.each([0, 11, -1, 1.5, NaN])("rejects invalid level ID %s", (levelId) => {
        expect(() => getLevelMetadata(levelId)).toThrow(RangeError);
        expect(() => signalLevelMetadata({ type: "start", levelId })).toThrow(RangeError);
    });
});
