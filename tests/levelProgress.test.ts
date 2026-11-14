// @vitest-environment jsdom
// Regression tests for automatic completion saving, restoration, and save failures.
import Konva from "konva";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Keep the real validation, completion, and storage handlers. Replace rendering
// and board loading with a solved-board fixture; circuit solving is tested elsewhere.
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
// Saved-board geometry is outside these tests; only completion and level IDs matter.
vi.mock("../src/konva/levels/importLevel", () => ({ importLevel: vi.fn() }));
vi.mock("../src/konva/levels/exportLevel", () => ({
    // Supply a minimal board snapshot while preserving the active level's ID.
    getLevelData: (id: number) => ({ id, pieces: [] }),
    exportLevel: vi.fn(),
}));

// Isolate each test with fresh module state, empty storage, and the DOM controls
// required by main.ts so button clicks run the actual application handlers.
beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    document.body.innerHTML = [
        "level-save-btn", "validate-circuit-btn", "view-toggle-btn",
    ].map((id) => `<button id="${id}"></button>`).join("") +
        '<span id="level-save-status"></span><span id="circuit-status"></span>';
});
// Restore storage spies so a simulated failure cannot affect another test.
afterEach(() => vi.restoreAllMocks());

describe("player completion persistence", () => {
    // Validate Level 1 followed by Level 2 without clicking Save. Verify that each
    // completion updates both session progress and the persisted level snapshot,
    // then verify that saved completion restores after session state is reset.
    it("saves Level 1 then Level 2 completion without pressing Save", async () => {
        const { showPlayerLevel } = await import("../src/konva/main");
        const { getHighestCompleted, resetLevels, restoreProgress } = await import("../src/html/levels");
        const { loadSavedLevel } = await import("../src/konva/save");
        // Completing the first level must unlock the second and allow it to finish.
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

    // Force localStorage writes to fail during successful validation. The level
    // must still count as completed in this session, and the UI must tell the
    // player that progress could not be saved instead of silently losing it.
    it("keeps completion in memory and reports a storage write failure", async () => {
        const { showPlayerLevel } = await import("../src/konva/main");
        const { getHighestCompleted } = await import("../src/html/levels");
        await showPlayerLevel({ id: 1, pieces: [] });
        // Simulate a full or unavailable storage area only after the board opens.
        vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage full"); });
        document.getElementById("validate-circuit-btn")!.click();
        expect(getHighestCompleted()).toBe(1);
        expect(document.getElementById("level-save-status")!.textContent).toContain("could not be saved");
    });
});
