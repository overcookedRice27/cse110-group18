import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearLocalSave, hasLocalSave, hasProgress, loadSavedLevel, saveLevel } from "../src/konva/save";

describe("level saves", () => {
    beforeEach(() => {
        const entries = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => entries.get(key) ?? null,
            setItem: (key: string, value: string) => entries.set(key, value),
            removeItem: (key: string) => entries.delete(key),
        });
    });
    afterEach(() => vi.unstubAllGlobals());

    it("restores a saved board and progress, then clears the save", () => {
        expect(hasProgress()).toBe(false);
        const level = { id: 1, pieces: [] };
        saveLevel(level, 0);
        expect(loadSavedLevel()).toEqual({ version: 1, highestCompleted: 0, level });
        expect(hasProgress()).toBe(true);
        clearLocalSave();
        expect(loadSavedLevel()).toBeNull();
        expect(hasLocalSave()).toBe(false);
    });

    it.each([
        "broken json",
        "null",
        JSON.stringify({ version: 2, highestCompleted: 0, level: { id: 1, pieces: [] } }),
        JSON.stringify({ version: 1, highestCompleted: -1, level: { id: 1, pieces: [] } }),
        JSON.stringify({ version: 1, highestCompleted: 0, level: { id: 11, pieces: [] } }),
        JSON.stringify({ version: 1, highestCompleted: 0, level: { id: 1, pieces: "invalid" } }),
    ])("rejects invalid saves while still detecting stored work: %s", (raw) => {
        localStorage.setItem("logicGame.save", raw);
        expect(loadSavedLevel()).toBeNull();
        expect(hasProgress()).toBe(false);
        expect(hasLocalSave()).toBe(true);
    });

    it("recognizes legacy progress without a board", () => {
        localStorage.setItem("logicGame.save", JSON.stringify({ version: 1, highestCompleted: 1 }));
        expect(loadSavedLevel()).toBeNull();
        expect(hasProgress()).toBe(true);
    });

    it("handles unavailable storage on load and reports save failures to the caller", () => {
        vi.stubGlobal("localStorage", {
            getItem: () => { throw new Error("Storage unavailable"); },
            setItem: () => { throw new Error("Storage full"); },
        });
        expect(loadSavedLevel()).toBeNull();
        expect(() => saveLevel({ id: 1, pieces: [] }, 0)).toThrow("Storage full");
    });
});
