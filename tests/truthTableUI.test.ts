// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { initTruthTableGame } from "../src/html/truth-table-mini-game/truth-table-game";
import { TOTAL_ROUNDS, evaluateGate, type GateName } from "../src/minigames/truthTable";

// Minimal copy of the truth table screen from index.html (only the ids the game looks up).
const HTML = `
<main id="truth-table-screen" hidden>
  <button id="tt-back-btn"></button>
  <h1 id="tt-title"></h1>
  <span id="tt-progress"></span>
  <table><thead><tr><th id="tt-corner"></th></tr></thead><tbody id="tt-table-body"></tbody></table>
  <div class="tt-token" data-token="0">0</div>
  <div class="tt-token" data-token="1">1</div>
  <div id="tt-rule"></div>
  <div id="tt-feedback"></div>
  <button id="tt-next-btn" disabled></button>
</main>`;

const $ = (id: string) => document.getElementById(id) as HTMLElement;

// The 4 <td> cells in reading order: (0,0) (0,1) (1,0) (1,1).
const cells = () => Array.from(document.querySelectorAll<HTMLElement>("#tt-table-body td"));

// jsdom has no real drag and drop, so fake a drop event that carries the token.
function drop(cell: HTMLElement, token: string): void {
    const event = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", { value: { getData: () => token } });
    cell.dispatchEvent(event);
}

// Drops the correct token into every empty cell of the current round.
function solveRound(gate: GateName): void {
    cells().forEach((cell, i) => {
        if (!cell.classList.contains("tt-cell--empty")) return;
        const a = i < 2 ? 0 : 1;
        const b = i % 2 === 0 ? 0 : 1;
        // Re-query each time because render() rebuilds the cells after every drop.
        drop(cells()[i], String(evaluateGate(gate, a, b)));
    });
}

describe("truth table UI", () => {
    let onExit = vi.fn();
    let game: { open: () => void };

    beforeEach(() => {
        document.body.innerHTML = HTML;
        onExit = vi.fn();
        game = initTruthTableGame(onExit);
    });

    it("stays hidden until opened, then shows round 1", () => {
        expect($("truth-table-screen").hidden).toBe(true);
        game.open();
        expect($("truth-table-screen").hidden).toBe(false);
        expect($("tt-title").textContent).toBe("Truth table: AND");
        expect($("tt-progress").textContent).toBe(`Round 1/${TOTAL_ROUNDS}`);
    });

    it("starts round 1 with one empty cell and Next disabled", () => {
        game.open();
        expect(cells()).toHaveLength(4);
        expect(cells().filter((c) => c.classList.contains("tt-cell--empty"))).toHaveLength(1);
        expect(($("tt-next-btn") as HTMLButtonElement).disabled).toBe(true);
    });

    it("fills the cell and enables Next after a correct drop", () => {
        game.open();
        drop(cells()[3], "1"); // AND: 1 & 1 = 1
        expect(cells()[3].textContent).toBe("1");
        expect(cells()[3].classList.contains("tt-cell--correct")).toBe(true);
        expect($("tt-feedback").textContent).toBe("Correct!");
        expect(($("tt-next-btn") as HTMLButtonElement).disabled).toBe(false);
    });

    it("keeps the cell empty and shows a hint after a wrong drop", () => {
        game.open();
        drop(cells()[3], "0"); // wrong: AND of 1 and 1 is 1
        expect(cells()[3].classList.contains("tt-cell--empty")).toBe(true);
        expect($("tt-feedback").textContent).toContain("Not quite");
        expect(($("tt-next-btn") as HTMLButtonElement).disabled).toBe(true);
    });

    it("ignores a drop whose data is not 0 or 1", () => {
        game.open();
        drop(cells()[3], "banana");
        expect(cells()[3].classList.contains("tt-cell--empty")).toBe(true);
        expect($("tt-feedback").textContent).toBe("");
    });

    it("says the cell is filled when dropping on a given cell", () => {
        game.open();
        drop(cells()[0], "0");
        expect($("tt-feedback").textContent).toBe("That cell is already filled.");
    });

    it("clears old feedback when reopened", () => {
        game.open();
        drop(cells()[3], "0");
        game.open();
        expect($("tt-feedback").textContent).toBe("");
        expect($("tt-progress").textContent).toBe(`Round 1/${TOTAL_ROUNDS}`);
    });

    it("moves to round 2 on Next and clears feedback", () => {
        game.open();
        solveRound("AND");
        $("tt-next-btn").click();
        expect($("tt-progress").textContent).toBe(`Round 2/${TOTAL_ROUNDS}`);
        expect($("tt-feedback").textContent).toBe("");
        expect(($("tt-next-btn") as HTMLButtonElement).disabled).toBe(true);
    });

    it("shows a green Finish button on the last round and exits when clicked", () => {
        game.open();
        const gates: GateName[] = ["AND", "AND", "OR", "XOR"];
        for (let i = 0; i < gates.length - 1; i++) {
            solveRound(gates[i]);
            $("tt-next-btn").click();
        }
        expect($("tt-title").textContent).toBe("Truth table: XOR");
        solveRound("XOR");
        expect($("tt-next-btn").textContent).toBe("Finish!");
        expect($("tt-next-btn").classList.contains("btn-success")).toBe(true);

        $("tt-next-btn").click();
        expect(onExit).toHaveBeenCalledTimes(1);
        expect($("truth-table-screen").hidden).toBe(true);
    });

    it("hides the screen and calls onExit when Back is clicked", () => {
        game.open();
        $("tt-back-btn").click();
        expect($("truth-table-screen").hidden).toBe(true);
        expect(onExit).toHaveBeenCalledTimes(1);
    });
});
