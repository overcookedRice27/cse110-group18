// @vitest-environment jsdom
// Clear-screen regressions: basic rendering, modal controls, and per-entry statistics.
import Konva from "konva";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLevelResults, LEVEL_RESULTS_EVENTS } from "../src/konva/level-results";
import { getLevelMetadata, signalLevelMetadata } from "../src/levels/level-metadata";

// Use the actual popup and shared button handlers without requiring canvas rendering.
vi.mock("konva", async (importOriginal) => {
    const { default: actual } = await importOriginal<typeof import("konva")>();
    return { default: { ...actual, Layer: actual.Group, Rect: actual.Group, Text: actual.Group } };
});

let now = 0;
beforeEach(() => {
    signalLevelMetadata({ type: "reset" });
    now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    document.body.innerHTML = `<main id="game-view">
        <button id="game-back-btn">Back</button>
        <button id="level-save-btn">Save</button>
        <button id="validate-circuit-btn">Validate</button>
        <button id="view-toggle-btn" disabled>Player View</button>
    </main>`;
});
afterEach(() => {
    signalLevelMetadata({ type: "reset" });
    vi.restoreAllMocks();
});

// Send the same stopped metadata snapshot that main.ts sends after successful validation.
function showSummary(results: Konva.Layer, levelId: number): void {
    const metadata = getLevelMetadata(levelId);
    results.fire(LEVEL_RESULTS_EVENTS.CLEARED, {
        summary: { clearTimeMs: metadata.clearTimeMs, incorrectValidations: metadata.incorrectValidations },
    });
}

describe("Level cleared! screen", () => {
    // Sanity: hidden initially, then shows the heading, subtext, and both navigation buttons.
    it("opens a complete result screen when validation succeeds", () => {
        const results = createLevelResults();
        expect(results.visible()).toBe(false);
        showSummary(results, 1);
        expect(results.visible()).toBe(true);
        expect(results.find((node) => node.getAttr("text") === "Level cleared!")).toHaveLength(1);
        expect(results.findOne(".resultsSummary")!.getAttr("text")).toBe(
            "Time to clear: 0.0 s\nIncorrect validations: 0",
        );
        expect(results.findOne(".resultsExit")!.isListening()).toBe(true);
        expect(results.findOne(".resultsContinue")!.isListening()).toBe(true);
        results.hide();
        results.destroy();
    });

    // While the popup is visible, every HTML game button is disabled and every
    // background Konva layer ignores pointer events. Only result buttons stay active.
    it("blocks all background buttons until the clear screen closes", () => {
        const parent = new Konva.Group();
        const board = new Konva.Group();
        const palette = new Konva.Group();
        const alreadyDisabled = new Konva.Group({ listening: false });
        const boardButton = new Konva.Group();
        board.add(boardButton);
        const results = createLevelResults();
        parent.add(board, palette, alreadyDisabled, results);
        const clicks = vi.fn();
        const buttons = document.querySelectorAll<HTMLButtonElement>("#game-view button");
        buttons.forEach((button) => button.addEventListener("click", clicks));
        showSummary(results, 1);
        buttons.forEach((button) => {
            expect(button.disabled).toBe(true);
            button.click();
        });
        expect(clicks).not.toHaveBeenCalled();
        expect(boardButton.isListening()).toBe(false);
        expect(palette.isListening()).toBe(false);
        expect(results.findOne(".resultsExit")!.isListening()).toBe(true);
        expect(results.findOne(".resultsContinue")!.isListening()).toBe(true);

        // Closing restores original states, including a button/layer already disabled.
        results.findOne(".resultsContinue")!.fire("click");
        expect(results.visible()).toBe(false);
        expect(boardButton.isListening()).toBe(true);
        expect(palette.isListening()).toBe(true);
        expect(alreadyDisabled.isListening()).toBe(false);
        expect((document.getElementById("view-toggle-btn") as HTMLButtonElement).disabled).toBe(true);
        const save = document.getElementById("level-save-btn") as HTMLButtonElement;
        expect(save.disabled).toBe(false);
        save.click();
        expect(clicks).toHaveBeenCalledOnce();
        parent.destroy();
    });

    // Re-enter the same level with different timing and another failed validation.
    // The second result must show the new visit's time and updated failure total.
    it("refreshes displayed metadata on each new entry into a level", () => {
        const results = createLevelResults();
        signalLevelMetadata({ type: "start", levelId: 1 });
        now = 1000;
        signalLevelMetadata({ type: "validated", levelId: 1, passed: false });
        signalLevelMetadata({ type: "validated", levelId: 1, passed: true });
        showSummary(results, 1);
        const first = results.findOne(".resultsSummary")!.getAttr("text");
        expect(first).toBe("Time to clear: 1.0 s\nIncorrect validations: 1");
        results.hide();

        now = 2400;
        signalLevelMetadata({ type: "start", levelId: 1 });
        now = 2700;
        signalLevelMetadata({ type: "validated", levelId: 1, passed: false });
        signalLevelMetadata({ type: "validated", levelId: 1, passed: true });
        showSummary(results, 1);
        const second = results.findOne(".resultsSummary")!.getAttr("text");
        expect(second).toBe("Time to clear: 0.3 s\nIncorrect validations: 2");
        expect(second).not.toBe(first);
        results.hide();
        results.destroy();
    });
});
