// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from "vitest";
import { saveLevel, loadSavedLevel, clearLocalSave } from "../src/konva/save";
import type { LevelData } from "../src/konva/levels/levelData";

describe("Special ability save persistence", () => {
    const level = { id: 1, pieces: [] } as LevelData;

    beforeEach(() => {
        localStorage.clear();
    });

    it("saves and loads 50 percent charge", () => {
        saveLevel(level, 1, 50);

        expect(loadSavedLevel()?.specialAbilityCharge).toBe(50);
    });

    it("saves and loads full charge", () => {
        saveLevel(level, 1, 100);

        expect(loadSavedLevel()?.specialAbilityCharge).toBe(100);
    });

    it("removes saved charge when clearing a save", () => {
        saveLevel(level, 1, 100);
        clearLocalSave();

        expect(loadSavedLevel()).toBeNull();
    });
});