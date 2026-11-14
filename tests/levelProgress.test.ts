// @vitest-environment jsdom
import Konva from "konva";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Keep the actual validation/save handlers while replacing canvas rendering only.
vi.mock("konva", async (importOriginal) => {
    const { default: actual } = await importOriginal<typeof import("konva")>();
    return { default: { ...actual, Stage: actual.Group, Layer: actual.Group } };
});
vi.mock("../src/konva/grid", () => ({ drawGridLayer: () => new Konva.Group() }));
vi.mock("../src/konva/button", () => ({ createButton: () => new Konva.Group() }));
vi.mock("../src/konva/levels/creatorPanel", () => ({ createCreatorPanel: () => new Konva.Group() }));
vi.mock("../src/konva/levels/loadLevel", () => ({
    // A powered exit represents a correctly solved board for validation.
    loadLevel: (grid: Konva.Group) => grid.add(new Konva.Group({ elementType: "exit", powered: true })),
}));
vi.mock("../src/konva/levels/importLevel", () => ({ importLevel: vi.fn() }));
vi.mock("../src/konva/levels/exportLevel", () => ({
    getLevelData: (id: number) => ({ id, pieces: [] }),
    exportLevel: vi.fn(),
}));

beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    document.body.innerHTML = [
        "level-save-btn", "validate-circuit-btn", "view-toggle-btn",
    ].map((id) => `<button id="${id}"></button>`).join("") +
        '<span id="level-save-status"></span><span id="circuit-status"></span>';
});
afterEach(() => vi.restoreAllMocks());

describe("player completion persistence", () => {
    it("saves Level 1 then Level 2 completion without pressing Save", async () => {
        const { showPlayerLevel } = await import("../src/konva/main");
        const { getHighestCompleted, resetLevels, restoreProgress } = await import("../src/html/levels");
        const { loadSavedLevel } = await import("../src/konva/save");
        for (const id of [1, 2]) {
            await showPlayerLevel({ id, pieces: [] });
            document.getElementById("validate-circuit-btn")!.click();
            expect(getHighestCompleted()).toBe(id);
            expect(loadSavedLevel()).toMatchObject({ highestCompleted: id, level: { id } });
        }
        // Simulate losing in-memory state and rebuilding it from the persisted save.
        resetLevels();
        restoreProgress(loadSavedLevel()!.highestCompleted);
        expect(getHighestCompleted()).toBe(2);
    });

    it("keeps completion in memory and reports a storage write failure", async () => {
        const { showPlayerLevel } = await import("../src/konva/main");
        const { getHighestCompleted } = await import("../src/html/levels");
        await showPlayerLevel({ id: 1, pieces: [] });
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage full"); });
        document.getElementById("validate-circuit-btn")!.click();
        expect(getHighestCompleted()).toBe(1);
        expect(document.getElementById("level-save-status")!.textContent).toContain("could not be saved");
    });
});
