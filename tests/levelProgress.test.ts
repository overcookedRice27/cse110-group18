// @vitest-environment jsdom
// Regression tests for automatic completion saving, restoration, and save failures.
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
vi.mock("../src/konva/levels/creatorPanel", () => ({ createCreatorPanel: () => new Konva.Group() }));
vi.mock("../src/konva/levels/loadLevel", () => ({
    // A powered exit represents a correctly solved board for validation.
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
    localStorage.clear();
    document.body.innerHTML = [
        "level-save-btn", "reset-level-btn", "validate-circuit-btn", "view-toggle-btn", "game-back-btn",
    ].map((id) => `<button id="${id}"></button>`).join("") +
        '<span id="level-save-status"></span><span id="circuit-status"></span>' +
        '<section id="player-gate-requirements" hidden><p id="player-gate-requirements-list"></p></section>' +
        '<details id="gate-requirements-menu"><span id="gate-requirements-error"></span>' +
        ["and", "or", "not", "xor"].map((name) => `<input id="require-${name}" type="number" value="0">`).join("") + '</details>';
});
// Restore storage spies so a simulated failure cannot affect another test.
afterEach(() => vi.restoreAllMocks());

describe("player completion persistence", () => {
    it("shows the current level requirements before validation and clears them for other levels", async () => {
        const { showPlayerLevel, showLevelCreator } = await import("../src/konva/main");
        const panel = document.getElementById("player-gate-requirements")!;
        const list = document.getElementById("player-gate-requirements-list")!;
        await showPlayerLevel({ id: 4, pieces: [] });
        expect(panel.hidden).toBe(false);
        expect(list.textContent).toBe("AND: 1");

        await showPlayerLevel({ id: 1, pieces: [] });
        expect(list.textContent).toBe("No gates required.");
        showLevelCreator();
        expect(panel.hidden).toBe(true);
    });
    it("resets the current board to its original layout without overwriting saved progress", async () => {
        const { showPlayerLevel } = await import("../src/konva/main");
        const { loadLevel } = await import("../src/konva/levels/loadLevel");
        const { circuitGrid, placeElement } = await import("../src/konva/utils/circuitGrid");
        const { getLevel } = await import("../src/levels/registry");
        const { saveLevel } = await import("../src/konva/save");
        const { restoreProgress, getHighestCompleted } = await import("../src/html/levels");
        vi.spyOn(window, "confirm").mockReturnValue(true);
        restoreProgress(1);
        saveLevel({ id: 1, pieces: [] }, 1);
        const previousSave = localStorage.getItem("logicGame.save");
        await showPlayerLevel({ id: 2, pieces: [] });
        const extraPiece = new Konva.Group();
        placeElement(extraPiece, 0, 0, 1, 1);
        document.getElementById("circuit-status")!.textContent = "Old result";

        document.getElementById("reset-level-btn")!.click();

        expect(circuitGrid[0][0]).toBeNull();
        expect(loadLevel).toHaveBeenLastCalledWith(expect.anything(), getLevel(2));
        expect(getHighestCompleted()).toBe(1);
        expect(localStorage.getItem("logicGame.save")).toBe(previousSave);
        expect(document.getElementById("circuit-status")!.textContent).toBe("");
        expect(document.getElementById("level-save-status")!.textContent).toContain("Select Save");
    });

    it.each([
        { savedProgress: 1, sessionProgress: 0, wasCleared: true },
        { savedProgress: 0, sessionProgress: 1, wasCleared: true },
        { savedProgress: 0, sessionProgress: 0, wasCleared: false },
    ])("restores a saved board only if the level is unfinished ($savedProgress saved, $sessionProgress in session)", async ({
        savedProgress, sessionProgress, wasCleared,
    }) => {
        const { showPlayerLevel } = await import("../src/konva/main");
        const { getLevel } = await import("../src/levels/registry");
        const { loadLevel } = await import("../src/konva/levels/loadLevel");
        const { importLevel } = await import("../src/konva/levels/importLevel");
        const { restoreProgress } = await import("../src/html/levels");
        const { saveLevel } = await import("../src/konva/save");
        const savedBoard = { id: 1, pieces: [] };
        restoreProgress(sessionProgress);
        saveLevel(savedBoard, savedProgress);
        const previousSave = localStorage.getItem("logicGame.save");
        vi.mocked(importLevel).mockClear();

        await showPlayerLevel(savedBoard);

        expect(loadLevel).toHaveBeenLastCalledWith(expect.anything(), wasCleared ? getLevel(1) : savedBoard);
        expect(importLevel).toHaveBeenCalledTimes(wasCleared ? 0 : 1);
        expect(localStorage.getItem("logicGame.save")).toBe(previousSave);
    });

    it("keeps the board when the player cancels reset", async () => {
        const { showPlayerLevel, showLevelCreator } = await import("../src/konva/main");
        const { loadLevel } = await import("../src/konva/levels/loadLevel");
        const { circuitGrid, placeElement } = await import("../src/konva/utils/circuitGrid");
        vi.spyOn(window, "confirm").mockReturnValue(false);
        await showPlayerLevel({ id: 1, pieces: [] });
        const piece = new Konva.Group();
        placeElement(piece, 0, 0, 1, 1);
        vi.mocked(loadLevel).mockClear();
        document.getElementById("reset-level-btn")!.click();
        expect(circuitGrid[0][0]).toBe(piece);
        expect(loadLevel).not.toHaveBeenCalled();
        showLevelCreator();
        expect(document.getElementById("reset-level-btn")!.hidden).toBe(true);
    });
    it("clears validation feedback when leaving and opening levels", async () => {
        const { showPlayerLevel, showLevelCreator } = await import("../src/konva/main");
        const status = document.getElementById("circuit-status")!;
        await showPlayerLevel({ id: 1, pieces: [] });
        document.getElementById("validate-circuit-btn")!.click();
        expect(status.textContent).not.toBe("");
        document.getElementById("game-back-btn")!.click();
        expect(status.textContent).toBe("");
        expect(status.style.color).toBe("");

        status.textContent = "Old level result";
        await showPlayerLevel({ id: 2, pieces: [] });
        expect(status.textContent).toBe("");

        status.textContent = "Old level result";
        showLevelCreator();
        expect(status.textContent).toBe("");
    });
    it("does not complete or save when a required gate is missing", async () => {
        const { showPlayerLevel } = await import("../src/konva/main");
        const requirements = await import("../src/konva/levels/checkRequiredGates");
        const check = vi.spyOn(requirements, "missingRequiredGates").mockReturnValue(["AND (1/2)"]);
        const { getHighestCompleted } = await import("../src/html/levels");
        const { getLevelMetadata } = await import("../src/levels/level-metadata");
        await showPlayerLevel({ id: 1, pieces: [], requiredGates: { AND: 2 } });
        document.getElementById("validate-circuit-btn")!.click();
        expect(check).toHaveBeenCalledWith({ AND: 2 });
        expect(document.getElementById("circuit-status")!.textContent).toContain("AND");
        expect(getHighestCompleted()).toBe(0);
        expect(getLevelMetadata(1).incorrectValidations).toBe(1);
        expect(localStorage.getItem("logicGame.save")).toBeNull();
    });

    it("reports missing gates even when the exit is not powered", async () => {
        const { showPlayerLevel } = await import("../src/konva/main");
        const { loadLevel } = await import("../src/konva/levels/loadLevel");
        const requirements = await import("../src/konva/levels/checkRequiredGates");
        vi.spyOn(requirements, "missingRequiredGates").mockReturnValue(["AND (1/2)"]);
        vi.mocked(loadLevel).mockImplementationOnce((grid) => {
            grid.add(new Konva.Group({ elementType: "exit", powered: false }));
        });
        await showPlayerLevel({ id: 1, pieces: [], requiredGates: { AND: 2 } });
        document.getElementById("validate-circuit-btn")!.click();
        const message = document.getElementById("circuit-status")!.textContent;
        expect(message).toContain("Level Failed");
        expect(message).toContain("AND (1/2)");
        expect(localStorage.getItem("logicGame.save")).toBeNull();
    });

    it("uses the current level requirements when an older save has none", async () => {
        const { showPlayerLevel } = await import("../src/konva/main");
        const requirements = await import("../src/konva/levels/checkRequiredGates");
        const check = vi.spyOn(requirements, "missingRequiredGates").mockReturnValue(["NOT (0/1)"]);
        await showPlayerLevel({ id: 3, pieces: [] });
        document.getElementById("validate-circuit-btn")!.click();
        expect(check).toHaveBeenCalledWith({ NOT: 1 });
        expect(document.getElementById("circuit-status")!.textContent).toContain("NOT");
    });

    it("completes and preserves requirements in the save when the check passes", async () => {
        const { showPlayerLevel } = await import("../src/konva/main");
        const requirements = await import("../src/konva/levels/checkRequiredGates");
        vi.spyOn(requirements, "missingRequiredGates").mockReturnValue([]);
        const { getHighestCompleted } = await import("../src/html/levels");
        await showPlayerLevel({ id: 1, pieces: [], requiredGates: { AND: 2 } });
        document.getElementById("validate-circuit-btn")!.click();
        expect(getHighestCompleted()).toBe(1);
        expect(JSON.parse(localStorage.getItem("logicGame.save")!)).toMatchObject({
            level: { id: 1, requiredGates: { AND: 2 } },
        });
    });
    it("appends completion snapshots to an older save and preserves them on manual save", async () => {
        const level = { id: 1, pieces: [] };
        localStorage.setItem("logicGame.save", JSON.stringify({ version: 1, highestCompleted: 0, level }));
        const { showPlayerLevel } = await import("../src/konva/main");
        const { loadSavedLevel } = await import("../src/konva/save");
        const requirements = await import("../src/konva/levels/checkRequiredGates");
        vi.spyOn(requirements, "missingRequiredGates").mockReturnValueOnce(["AND (1/2)"]);
        const now = vi.spyOn(performance, "now").mockReturnValue(100);
        await showPlayerLevel(level);

        const validate = document.getElementById("validate-circuit-btn")!;
        now.mockReturnValue(200);
        validate.click();
        now.mockReturnValue(350);
        validate.click();
        await showPlayerLevel(level);
        now.mockReturnValue(650);
        validate.click();
        await showPlayerLevel(level);
        document.getElementById("level-save-btn")!.click();
        expect(document.getElementById("level-save-status")!.textContent).toBe("Level saved.");

        expect(loadSavedLevel()?.archivedMetadata).toEqual([
            { levelId: 1, timeSpentMs: 100, correctValidations: 1, incorrectValidations: 1,
                bestTimeMs: 250, best_attempt_count: 2 },
            { levelId: 1, timeSpentMs: 300, correctValidations: 2, incorrectValidations: 1,
                bestTimeMs: 250, best_attempt_count: 1 },
        ]);
    });

    // An unpowered exit must fail validation without writing to storage or marking
    // the level complete. Check both a fresh game and preservation of an older save.
    // false: fail Level 1 with no save; true: fail Level 2 after saving Level 1.
    it.each([false, true])("does not save failed validation (existing save: %s)", async (existingSave) => {
        const { showPlayerLevel } = await import("../src/konva/main");
        const { loadLevel } = await import("../src/konva/levels/loadLevel");
        const { createLevelResults } = await import("../src/konva/level-results");
        const results = vi.mocked(createLevelResults).mock.results.at(-1)!.value as Konva.Layer;
        const { getHighestCompleted, restoreProgress } = await import("../src/html/levels");
        const { saveLevel } = await import("../src/konva/save");
        // Seed completed progress only for the existing-save case, leaving Level 2 unlocked.
        if (existingSave) {
            restoreProgress(1);
            saveLevel({ id: 1, pieces: [] }, 1);
        }
        // Retain the exact saved text (or null) to detect overwrites or new saves.
        const { getLevelMetadata } = await import("../src/levels/level-metadata");
        const levelId = existingSave ? 2 : 1;
        const previousSave = localStorage.getItem("logicGame.save");
        // Override only this board so the real validation handler sees a failed circuit.
        vi.mocked(loadLevel).mockImplementationOnce((grid) => {
            grid.add(new Konva.Group({ elementType: "exit", powered: false }));
        });
        await showPlayerLevel({ id: levelId, pieces: [] });
        // Entering through the shared loader starts tracking; failed validation ends it.
        expect(getLevelMetadata(levelId).isTracking).toBe(true);
        // Observe writes after setup so seeding the older save does not count.
        const write = vi.spyOn(Storage.prototype, "setItem");
        // Click the real Validate control rather than calling a test-only handler.
        document.getElementById("validate-circuit-btn")!.click();

        // Confirm validation actually failed, then verify it neither wrote storage
        // nor replaced the older board nor advanced completion in this session.
        expect(document.getElementById("circuit-status")!.textContent).toContain("Level Failed");
        expect(getLevelMetadata(levelId).isTracking).toBe(false);
        expect(getLevelMetadata(levelId).incorrectValidations).toBe(1);
        expect(getLevelMetadata(levelId).correctValidations).toBe(0);
        expect(results.visible()).toBe(false);
        expect(write).not.toHaveBeenCalled();
        expect(localStorage.getItem("logicGame.save")).toBe(previousSave);
        expect(getHighestCompleted()).toBe(existingSave ? 1 : 0);
    });

    // Validate Level 1 followed by Level 2 without clicking Save. Verify that each
    // completion updates both session progress and the persisted level snapshot,
    // then verify that saved completion restores after session state is reset.
    it("saves Level 1 then Level 2 completion without pressing Save", async () => {
        const { showPlayerLevel } = await import("../src/konva/main");
        const { getHighestCompleted, resetLevels, restoreProgress } = await import("../src/html/levels");
        const { loadSavedLevel } = await import("../src/konva/save");
        const { createLevelResults } = await import("../src/konva/level-results");
        const results = vi.mocked(createLevelResults).mock.results.at(-1)!.value as Konva.Layer;
        const { getLevelMetadata } = await import("../src/levels/level-metadata");
        // Completing the first level must unlock the second and allow it to finish.
        for (const id of [1, 2]) {
            await showPlayerLevel({ id, pieces: [] });
            // Opening a level dismisses any earlier result; success opens it again.
            expect(results.visible()).toBe(false);
            expect(getLevelMetadata(id).isTracking).toBe(true);
            document.getElementById("validate-circuit-btn")!.click();
            // Successful validation records a correct attempt and stops timing, too.
            expect(getLevelMetadata(id).isTracking).toBe(false);
            expect(getLevelMetadata(id).correctValidations).toBe(1);
            expect(results.visible()).toBe(true);
            // The validation event passes the active level's stopped metadata to the popup.
            const metadata = getLevelMetadata(id);
            expect(results.findOne(".resultsSummary")!.getAttr("text")).toBe(
                `Time to clear: ${(metadata.timeSpentMs / 1000).toFixed(1)} s\nIncorrect validations: ${metadata.incorrectValidations}`,
            );
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

describe("creator gate requirements", () => {
    it("keeps counts through player preview and exports them", async () => {
        const { showLevelCreator } = await import("../src/konva/main");
        const { createButton } = await import("../src/konva/button");
        const { exportLevel } = await import("../src/konva/levels/exportLevel");
        vi.spyOn(window, "prompt").mockReturnValue("4");
        showLevelCreator();
        const menu = document.getElementById("gate-requirements-menu")!;
        const and = document.getElementById("require-and") as HTMLInputElement;
        const not = document.getElementById("require-not") as HTMLInputElement;
        expect(menu.hidden).toBe(false);
        and.value = "2";
        not.value = "1";
        const status = document.getElementById("circuit-status")!;
        status.textContent = "Old creator result";
        document.getElementById("view-toggle-btn")!.click();
        expect(status.textContent).toBe("");
        expect(menu.hidden).toBe(true);
        expect(document.getElementById("player-gate-requirements")!.hidden).toBe(false);
        expect(document.getElementById("player-gate-requirements-list")!.textContent).toBe("AND: 2, NOT: 1");
        status.textContent = "Old preview result";
        document.getElementById("view-toggle-btn")!.click();
        expect(status.textContent).toBe("");
        expect(menu.hidden).toBe(false);
        expect(document.getElementById("player-gate-requirements")!.hidden).toBe(true);
        expect(and.value).toBe("2");
        expect(not.value).toBe("1");
        const exportIndex = vi.mocked(createButton).mock.calls.findIndex(([label]) => label === "Export Level");
        expect(exportIndex).toBeGreaterThanOrEqual(0);
        const exportButton = vi.mocked(createButton).mock.results[exportIndex].value;
        exportButton.fire("click");
        expect(exportLevel).toHaveBeenCalledWith(4, { AND: 2, NOT: 1 });
    });

    it("rejects invalid counts before switching to preview", async () => {
        const { showLevelCreator } = await import("../src/konva/main");
        showLevelCreator();
        const and = document.getElementById("require-and") as HTMLInputElement;
        and.value = "-1";
        document.getElementById("view-toggle-btn")!.click();
        expect(document.getElementById("gate-requirements-menu")!.hidden).toBe(false);
        expect(document.getElementById("gate-requirements-error")!.textContent).toContain("whole number");
    });

    it("shows imported counts in the creator menu", async () => {
        const createElement = vi.spyOn(document, "createElement");
        vi.spyOn(window, "confirm").mockReturnValue(true);
        const { showLevelCreator } = await import("../src/konva/main");
        const { importLevel } = await import("../src/konva/levels/importLevel");
        vi.mocked(importLevel).mockResolvedValue({ id: 4, pieces: [], requiredGates: { AND: 2, XOR: 1 } });
        showLevelCreator();
        const fileInput = createElement.mock.results
            .map((result) => result.value)
            .find((element) => element instanceof HTMLInputElement && element.type === "file") as HTMLInputElement;
        Object.defineProperty(fileInput, "files", { value: [new File(["{}"], "level.json")] });
        fileInput.dispatchEvent(new Event("change"));
        await vi.waitFor(() => {
            expect((document.getElementById("require-and") as HTMLInputElement).value).toBe("2");
            expect((document.getElementById("require-xor") as HTMLInputElement).value).toBe("1");
        });
    });
});
