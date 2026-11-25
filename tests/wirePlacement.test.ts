// @vitest-environment jsdom
import Konva from "konva";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GRID } from "../src/konva/constants";
import { circuitGrid, clearGrid, placeElement } from "../src/konva/utils/circuitGrid";
import { setupWirePlacement } from "../src/konva/wirePlacement";
import { playSound } from "../src/html/options";

// Keep the real grid and placement checks while avoiding canvas rendering.
vi.mock("../src/konva/wire", () => ({
    createWire: () => new Konva.Group({ elementType: "wire" }),
    updateWireAndNeighbors: vi.fn(),
    updateWireElectricity: vi.fn(),
}));
vi.mock("../src/html/options", () => ({ playSound: vi.fn() }));

describe("click-to-place wires", () => {
    let stage: Konva.Group;
    let grid: Konva.Group;
    let button: HTMLButtonElement;

    beforeEach(() => {
        vi.clearAllMocks();
        stage = new Konva.Group();
        grid = new Konva.Group();
        stage.add(grid);
        button = document.createElement("button");
        setupWirePlacement(stage as unknown as Konva.Stage, grid as unknown as Konva.Layer, button);
    });

    afterEach(() => {
        clearGrid();
        vi.restoreAllMocks();
    });

    function clickCell(x: number, y: number): void {
        vi.spyOn(grid, "getRelativePointerPosition").mockReturnValue({
            x: (x + 0.5) * GRID.CELL_SIZE,
            y: (y + 0.5) * GRID.CELL_SIZE,
        });
        stage.fire("click", { target: stage });
    }

    it("places multiple wires after selection and stops when deselected", () => {
        clickCell(0, 0);
        expect(circuitGrid[0][0]).toBeNull();

        button.click();
        expect(button.getAttribute("aria-pressed")).toBe("true");
        clickCell(0, 0);
        clickCell(1, 0);
        expect(circuitGrid[0][0]?.getAttr("elementType")).toBe("wire");
        expect(circuitGrid[0][1]?.getAttr("elementType")).toBe("wire");
        expect(playSound).toHaveBeenCalledTimes(2);
        expect(playSound).toHaveBeenCalledWith("placeWire");

        button.click();
        expect(button.getAttribute("aria-pressed")).toBe("false");
        clickCell(2, 0);
        expect(circuitGrid[0][2]).toBeNull();
    });

    it("does not replace an occupied cell or place outside the grid", () => {
        const existing = new Konva.Group({ elementType: "block" });
        placeElement(existing, 1, 1, 1, 1);
        button.click();
        clickCell(1, 1);
        clickCell(-1, 0);
        expect(circuitGrid[1][1]).toBe(existing);
        expect(circuitGrid.flat().filter(Boolean)).toEqual([existing]);
        expect(playSound).not.toHaveBeenCalled();
    });

    it("ignores clicks on existing pieces so their own actions still work", () => {
        const input = new Konva.Group({ elementType: "input" });
        placeElement(input, 0, 0, 1, 1);
        button.click();
        stage.fire("click", { target: input });
        expect(circuitGrid[0][0]).toBe(input);
        expect(circuitGrid.flat().filter(Boolean)).toEqual([input]);
    });

    it("places a wire when clicking a grid line", () => {
        const line = new Konva.Group();
        vi.spyOn(line, "getClassName").mockReturnValue("Line");
        grid.add(line);
        vi.spyOn(grid, "getRelativePointerPosition").mockReturnValue({ x: 10, y: 10 });
        button.click();
        stage.fire("click", { target: line });
        expect(circuitGrid[0][0]?.getAttr("elementType")).toBe("wire");
    });
});
