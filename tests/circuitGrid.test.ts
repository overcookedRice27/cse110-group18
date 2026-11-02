import Konva from "konva";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GRID } from "../src/konva/constants";
import { circuitGrid, clearGrid, placeElement, removeElement } from "../src/konva/utils/circuitGrid";

afterEach(() => clearGrid());

describe("circuit grid", () => {
    it("places a multi-cell element and moves it without leaving old cells", () => {
        const gate = new Konva.Group();
        expect(placeElement(gate, 1, 1, 2, 3)).toBe(true);
        expect(circuitGrid[1][1]).toBe(gate);
        expect(circuitGrid[3][2]).toBe(gate);
        expect(gate.position()).toEqual({ x: GRID.CELL_SIZE, y: GRID.CELL_SIZE });
        expect(placeElement(gate, 2, 2, 2, 3)).toBe(true);
        expect(circuitGrid[1][1]).toBeNull();
        expect(circuitGrid[2][2]).toBe(gate);
        expect(gate.getAttr("gridWidth")).toBe(2);
        expect(gate.getAttr("gridHeight")).toBe(3);
    });

    it("rejects out-of-bounds and occupied placements without moving the element", () => {
        const first = new Konva.Group();
        const second = new Konva.Group();
        placeElement(first, 0, 0, 2, 3);
        placeElement(second, 4, 0, 1, 1);
        expect(placeElement(second, -1, 0, 1, 1)).toBe(false);
        expect(placeElement(second, GRID.X_COUNT, 0, 1, 1)).toBe(false);
        expect(placeElement(second, 0, GRID.Y_COUNT - 2, 2, 3)).toBe(false);
        expect(placeElement(second, 1, 2, 1, 1)).toBe(false);
        expect(circuitGrid[0][4]).toBe(second);
        expect(circuitGrid[2][1]).toBe(first);
    });

    it("removes every occupied cell and destroys each piece once when cleared", () => {
        const gate = new Konva.Group();
        const wire = new Konva.Group();
        const destroyGate = vi.spyOn(gate, "destroy");
        const destroyWire = vi.spyOn(wire, "destroy");
        placeElement(gate, 0, 0, 2, 3);
        placeElement(wire, 4, 0, 1, 1);
        removeElement(wire);
        expect(circuitGrid[0][4]).toBeNull();
        placeElement(wire, 4, 0, 1, 1);
        clearGrid();
        expect(circuitGrid.flat().every((cell) => cell === null)).toBe(true);
        expect(destroyGate).toHaveBeenCalledTimes(1);
        expect(destroyWire).toHaveBeenCalledTimes(1);
    });
});
