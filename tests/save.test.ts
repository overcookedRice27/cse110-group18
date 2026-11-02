import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearLocalSave, hasLocalSave, hasProgress, loadGame, saveGame } from "../src/konva/save";

describe("test level saves", () => {
    // Provide isolated browser storage for each persistence test.
    beforeEach(() => {
        const entries = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => entries.get(key) ?? null,
            setItem: (key: string, value: string) => entries.set(key, value),
            removeItem: (key: string) => entries.delete(key),
        });
    });
    afterEach(() => vi.unstubAllGlobals());

    it("restores saved actions and layout without requiring level completion", () => {
        expect(hasProgress()).toBe(false);
        const state = { clicks: 7, buttonX: 350, buttonY: 250 };
        saveGame(state);
        expect(loadGame()).toEqual({ version: 2, levelId: 1, state });
        expect(hasProgress()).toBe(true);
        clearLocalSave();
        expect(loadGame()).toBeNull();
        expect(hasLocalSave()).toBe(false);
    });

    it.each([
        "broken json", "null",
        JSON.stringify({ version: 1, highestCompleted: 1 }),
        JSON.stringify({ version: 2, levelId: 1, state: { clicks: -1, buttonX: 100, buttonY: 200 } }),
        JSON.stringify({ version: 2, levelId: 1, state: { clicks: 0, buttonX: 900, buttonY: 200 } }),
    ])("rejects invalid saves while still detecting stored work: %s", (raw) => {
        localStorage.setItem("logicGame.save", raw);
        expect(loadGame()).toBeNull();
        expect(hasProgress()).toBe(false);
        expect(hasLocalSave()).toBe(true);
    });

    it("handles unavailable storage on load and reports save failures to the caller", () => {
        vi.stubGlobal("localStorage", {
            getItem: () => { throw new Error("Storage unavailable"); },
            setItem: () => { throw new Error("Storage full"); },
        });
        expect(loadGame()).toBeNull();
        expect(() => saveGame({ clicks: 0, buttonX: 100, buttonY: 200 })).toThrow("Storage full");
    });
});
