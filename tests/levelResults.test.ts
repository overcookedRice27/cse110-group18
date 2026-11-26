// Unit tests for the Level cleared submenu: opening, statistics, and navigation events.
import "./textCanvas";
import Konva from "konva";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createLevelResults, LEVEL_RESULTS_EVENTS } from "../src/konva/level-results";

// Keep the real popup, shapes, and shared buttons. Replace Stage and Layer with
// canvas-free containers; the stage type correctly accepts the popup's Layer type.
vi.mock("konva", async (importOriginal) => {
    const { default: actual } = await importOriginal<typeof import("konva")>();
    return { default: { ...actual, Stage: actual.Group, Layer: actual.Group } };
});
// Hit-color fingerprint detection requires pixel rendering, which these tests replace.
beforeAll(() => {
    vi.spyOn(Konva.Util, "isCanvasFarblingActive").mockReturnValue(false);
});
// Supply the document used by modal button locking even in canvas-free unit tests.
beforeEach(() => {
    vi.stubGlobal("document", {
        body: { style: { cursor: "default" } },
        querySelectorAll: () => [],
    });
});
// Remove the fake document between tests and restore canvas spies after the suite.
afterEach(() => vi.unstubAllGlobals());
afterAll(() => vi.restoreAllMocks());

describe("level results submenu", () => {
    // Sanity: construction leaves the popup hidden with the expected heading.
    // Sending the success event must make the popup visible.
    it("shows Level cleared only after receiving the success event", () => {
        const results = createLevelResults();
        expect(results.visible()).toBe(false);
        expect(results.findOne("Text")?.getAttr("text")).toBe("Level cleared!");
        results.fire(LEVEL_RESULTS_EVENTS.CLEARED);
        expect(results.visible()).toBe(true);
        // Release any modal locks before destroying the popup.
        results.hide();
        results.destroy();
    });

    // Success snapshots display milliseconds as seconds and preserve the failure count.
    // Reopening the popup must replace both numbers rather than retaining a prior level.
    it("shows clear time and incorrect validations below the heading", () => {
        const results = createLevelResults();
        results.fire(LEVEL_RESULTS_EVENTS.CLEARED, {
            summary: { timeSpentMs: 12345, incorrectValidations: 3 },
        });
        const summary = results.findOne(".resultsSummary")!;
        expect(summary.getAttr("text")).toBe("Time to clear: 12.3 s\nIncorrect validations: 3");
        results.fire(LEVEL_RESULTS_EVENTS.CLEARED, {
            summary: { timeSpentMs: 0, incorrectValidations: 0 },
        });
        expect(summary.getAttr("text")).toBe("Time to clear: 0.0 s\nIncorrect validations: 0");
        results.hide();
        results.destroy();
    });

    it("shows a light blue personal-best message only for an improved clear", () => {
        const results = createLevelResults();
        const badge = results.findOne(".resultsPersonalBest")!;
        const summary = { timeSpentMs: 1000, incorrectValidations: 0 };
        results.fire(LEVEL_RESULTS_EVENTS.CLEARED, { summary: { ...summary, newPersonalBest: true } });
        expect(badge.visible()).toBe(true);
        expect(badge.findOne("Text")?.getAttrs()).toMatchObject({
            text: "new personal best!",
            fill: "#ADD8E6",
        });
        results.fire(LEVEL_RESULTS_EVENTS.CLEARED, { summary });
        expect(badge.visible()).toBe(false);
        results.hide();
        results.destroy();
    });

    // Cover Exit and Continue with both mouse clicks and touch taps. Each action
    // must bubble its matching navigation event exactly once to the stage, hide
    // the popup, and restore the default cursor for the destination screen.
    it.each([
        ["resultsExit", LEVEL_RESULTS_EVENTS.EXIT, "click"],
        ["resultsContinue", LEVEL_RESULTS_EVENTS.CONTINUE, "click"],
        ["resultsExit", LEVEL_RESULTS_EVENTS.EXIT, "tap"],
        ["resultsContinue", LEVEL_RESULTS_EVENTS.CONTINUE, "tap"],
    ])("%s emits %s on %s", (name, event, activation) => {
        // Reuse the complete document fixture so modal button queries still work.
        document.body.style.cursor = "pointer";
        const parent = new Konva.Stage({ container: "test-stage" });
        const results = createLevelResults();
        parent.add(results);
        const transition = vi.fn();
        // Listen on the parent to verify event bubbling, not just local dispatch.
        parent.on(event, transition);
        results.fire(LEVEL_RESULTS_EVENTS.CLEARED);
        results.findOne(`.${name}`)!.fire(activation);
        expect(transition).toHaveBeenCalledOnce();
        expect(results.visible()).toBe(false);
        expect(document.body.style.cursor).toBe("default");
        parent.destroy();
    });
});
