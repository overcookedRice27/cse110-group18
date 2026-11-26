// @vitest-environment jsdom
// Exercise the finale through the real player validation and navigation handlers.
import Konva from "konva";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Keep the real validation, completion, and storage handlers. Replace rendering
// and board loading with exit fixtures; circuit solving is tested elsewhere.
vi.mock("konva", async (importOriginal) => {
    const { default: actual } = await importOriginal<typeof import("konva")>();
    return { default: { ...actual, Stage: actual.Group, Layer: actual.Group, Rect: actual.Group, Text: actual.Group } };
});
// Observe the actual popup instance to verify validation opens it only on success.
vi.mock("../src/konva/level-results", async (importOriginal) => {
    const actual = await importOriginal<typeof import("../src/konva/level-results")>();
    return { ...actual, createLevelResults: vi.fn(actual.createLevelResults) };
});
vi.mock("../src/konva/grid", () => ({ drawGridLayer: () => new Konva.Group() }));
vi.mock("../src/konva/button", () => ({ createButton: vi.fn(() => new Konva.Group()) }));
vi.mock("../src/konva/levels/creatorPanel", () => ({
    createCreatorPanel: () => new Konva.Group(),
    bindTrashHighlight: vi.fn(),
}));vi.mock("../src/konva/levels/loadLevel", () => ({
    loadLevel: vi.fn((grid: Konva.Group) => grid.add(new Konva.Group({ elementType: "exit", powered: true }))),
}));
// Saved-board geometry is outside these tests; only completion and level IDs matter.
vi.mock("../src/konva/levels/importLevel", () => ({ importLevel: vi.fn() }));
vi.mock("../src/konva/levels/exportLevel", () => ({
    // Supply a minimal board snapshot while preserving the active level's ID.
    getLevelData: (id: number, requiredGates?: Record<string, number>) => ({ id, pieces: [], requiredGates }),
    exportLevel: vi.fn(),
}));

// Isolate each test with fresh module state, empty storage, and the DOM controls
// required by main.ts so button clicks run the actual application handlers.
beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
    document.body.innerHTML = [
        "level-save-btn", "reset-level-btn", "validate-circuit-btn", "view-toggle-btn", "game-back-btn",
    ].map((id) => `<button id="${id}"></button>`).join("") +
        '<span id="level-save-status"></span><span id="circuit-status"></span>' +
        '<section id="player-gate-requirements" hidden><p id="player-gate-requirements-list"></p></section>' +
        '<details id="gate-requirements-menu"><span id="gate-requirements-error"></span>' +
        ["and", "or", "not", "xor"].map((name) => `<input id="require-${name}" type="number" value="0">`).join("") + '</details>';
});
afterEach(() => vi.restoreAllMocks());

async function getScreens() {
    const { createLevelResults } = await import("../src/konva/level-results");
    const results = vi.mocked(createLevelResults).mock.results.at(-1)!.value;
    return { results, finale: results.getParent()!.findOne(".finale")! };
}

describe("Level 10 finale", () => {
    it("starts hidden and contains the completion heading and one Menu button", async () => {
        await import("../src/konva/main");
        const { finale } = await getScreens();
        expect(finale.visible()).toBe(false);
        expect(finale.find((node) => node.getAttr("text") === "You Completed All Levels!")).toHaveLength(1);
        expect(finale.find(".finaleMenu")).toHaveLength(1);
    });

    it("shows the saved records, failed attempts, and total clear time", async () => {
        const { showPlayerLevel } = await import("../src/konva/main");
        const { restoreProgress } = await import("../src/html/levels");
        const { saveLevel } = await import("../src/konva/save");
        const requirements = await import("../src/konva/levels/checkRequiredGates");
        vi.spyOn(requirements, "missingRequiredGates").mockReturnValueOnce(["AND (1/2)"]).mockReturnValue([]);
        for (let id = 1; id < 10; id++) {
            saveLevel({ id, pieces: [] }, id, 0, {
                levelId: id, timeSpentMs: id * 1000, correctValidations: 1, incorrectValidations: 1,
                bestTimeMs: id * 1000, best_attempt_count: id === 2 ? 1 : 2, newFailedAttempts: 1,
            });
        }
        restoreProgress(9);
        const now = vi.spyOn(performance, "now").mockReturnValue(0);
        await showPlayerLevel({ id: 10, pieces: [] });
        const validate = document.getElementById("validate-circuit-btn")!;
        now.mockReturnValue(1000);
        validate.click();
        const { finale } = await getScreens();
        expect(finale.visible()).toBe(false);
        now.mockReturnValue(2500);
        validate.click();

        expect(finale.findOne(".finaleStats")?.getAttr("text")).toBe([
            "Best clear time: 1.00 s (Level 1)",
            "Fewest attempts: 1 (Level 2)",
            "Total failed attempts: 10",
            "Total clear time: 00:00:47",
        ].join("\n"));
    });

    it("opens on a successful Level 10 validation and sends Menu through the exit event", async () => {
        const { showPlayerLevel } = await import("../src/konva/main");
        const { restoreProgress } = await import("../src/html/levels");
        const requirements = await import("../src/konva/levels/checkRequiredGates");
        vi.spyOn(requirements, "missingRequiredGates").mockReturnValue([]);
        const gameView = document.createElement("section");
        gameView.id = "game-view";
        document.body.append(gameView);
        const exit = vi.fn();
        gameView.addEventListener("level-results-exit", exit);
        restoreProgress(9);

        await showPlayerLevel({ id: 10, pieces: [] });
        const { results, finale } = await getScreens();
        expect(finale.visible()).toBe(false);
        document.getElementById("validate-circuit-btn")!.click();

        expect(finale.visible()).toBe(true);
        expect(results.visible()).toBe(false);
        finale.findOne(".finaleMenu")!.fire("click");
        expect(finale.visible()).toBe(false);
        expect(exit).toHaveBeenCalledOnce();
    });

    it.each([
        { levelId: 9, powered: true, showsResults: true },
        { levelId: 10, powered: false, showsResults: false },
    ])("stays hidden for Level $levelId with powered exit $powered", async ({ levelId, powered, showsResults }) => {
        const { showPlayerLevel } = await import("../src/konva/main");
        const { restoreProgress } = await import("../src/html/levels");
        const { loadLevel } = await import("../src/konva/levels/loadLevel");
        const requirements = await import("../src/konva/levels/checkRequiredGates");
        vi.spyOn(requirements, "missingRequiredGates").mockReturnValue([]);
        vi.mocked(loadLevel).mockImplementationOnce((grid) => {
            grid.add(new Konva.Group({ elementType: "exit", powered }));
        });
        restoreProgress(levelId - 1);

        await showPlayerLevel({ id: levelId, pieces: [] });
        document.getElementById("validate-circuit-btn")!.click();

        const { results, finale } = await getScreens();
        expect(finale.visible()).toBe(false);
        expect(results.visible()).toBe(showsResults);
    });
});
