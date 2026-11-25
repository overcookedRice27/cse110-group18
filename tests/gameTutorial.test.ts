// @vitest-environment jsdom
import Konva from "konva";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupGameTutorial } from "../src/konva/gameTutorial";

// These tests exercise the guide controls without rendering a canvas.
vi.mock("konva", async (importOriginal) => {
    const { default: actual } = await importOriginal<typeof import("konva")>();
    return { default: { ...actual, Layer: actual.Group, Rect: actual.Group } };
});

beforeEach(() => {
    document.body.innerHTML = `
        <button id="game-how-to-btn">How to Play</button>
        <button id="validate-circuit-btn">Validate Circuit</button>
        <section id="game-tutorial" hidden>
            <p id="game-tutorial-progress"></p>
            <h2 id="game-tutorial-title"></h2>
            <p id="game-tutorial-text"></p>
            <button id="tutorial-back">Back</button>
            <button id="tutorial-next">Next</button>
            <button id="tutorial-skip">Skip</button>
        </section>`;
    const stage = new Konva.Group();
    const grid = new Konva.Group();
    stage.add(grid);
    setupGameTutorial(stage as unknown as Konva.Stage, grid as unknown as Konva.Layer);
});

function click(id: string): void {
    (document.getElementById(id) as HTMLButtonElement).click();
}

describe("game walkthrough", () => {
    it("opens at the first step and can move forward and back", () => {
        click("game-how-to-btn");
        expect(document.getElementById("game-tutorial")!.hidden).toBe(false);
        expect(document.getElementById("game-tutorial-progress")!.textContent).toBe("Step 1 of 4");
        expect((document.getElementById("tutorial-back") as HTMLButtonElement).disabled).toBe(true);
        click("tutorial-next");
        expect(document.getElementById("game-tutorial-title")!.textContent).toBe("Turn on an input");
        click("tutorial-back");
        expect(document.getElementById("game-tutorial-title")!.textContent).toBe("Build your circuit");
    });

    it("highlights validation on the final step and clears it when finished", () => {
        click("game-how-to-btn");
        click("tutorial-next");
        click("tutorial-next");
        click("tutorial-next");
        expect(document.getElementById("validate-circuit-btn")!.classList.contains("tutorial-highlight")).toBe(true);
        expect(document.getElementById("tutorial-next")!.textContent).toBe("Finish");
        click("tutorial-next");
        expect(document.getElementById("game-tutorial")!.hidden).toBe(true);
        expect(document.getElementById("validate-circuit-btn")!.classList.contains("tutorial-highlight")).toBe(false);
    });

    it("can be skipped and reopened from the first step", () => {
        click("game-how-to-btn");
        click("tutorial-next");
        click("tutorial-skip");
        expect(document.getElementById("game-tutorial")!.hidden).toBe(true);
        click("game-how-to-btn");
        expect(document.getElementById("game-tutorial-progress")!.textContent).toBe("Step 1 of 4");
    });
});
