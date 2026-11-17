import "./textCanvas";
import Konva from "konva";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLevel } from "../src/levels/registry";
import { missingRequiredGates } from "../src/konva/levels/checkRequiredGates";
import { loadLevel } from "../src/konva/levels/loadLevel";
import { circuitGrid, clearGrid, placeElement, removeElement } from "../src/konva/utils/circuitGrid";
import { createWire, updateWireElectricity } from "../src/konva/wire";

type Position = [number, number];
type InputState = [number, number, boolean];

// Example layouts exercise the actual power and gate-requirement checks. Players
// can still find other solutions; these are not saved as the only valid answers.
const examples: { id: number; wires: Position[]; inputs: InputState[] }[] = [
    { id: 1, wires: [[1, 1], [2, 1], [3, 1], [4, 1], [4, 2], [5, 2], [6, 2]], inputs: [[1, 2, true]] },
    { id: 2, wires: [[2, 2], [3, 1], [3, 2], [4, 1], [5, 1], [6, 1], [6, 2], [6, 4], [7, 1], [8, 1], [8, 4], [9, 1], [9, 2], [9, 3]], inputs: [[1, 2, true]] },
    { id: 3, wires: [[2, 1], [3, 1], [6, 2], [7, 2]], inputs: [[1, 1, false]] },
    { id: 4, wires: [[2, 1], [2, 2], [2, 3], [5, 2], [6, 2]], inputs: [[1, 1, true]] },
    { id: 5, wires: [[0, 2], [0, 3], [0, 4], [1, 2], [2, 2], [3, 1], [3, 2], [3, 3], [6, 2], [7, 2], [8, 2]], inputs: [[1, 1, false]] },
    { id: 6, wires: [[2, 1], [2, 5], [3, 4], [3, 5], [4, 4], [5, 2], [5, 4], [8, 3]], inputs: [[1, 3, false], [1, 5, true]] },
    { id: 7, wires: [[2, 0], [2, 1], [2, 2], [5, 1], [5, 3], [5, 4], [8, 2]], inputs: [[1, 2, false]] },
    { id: 8, wires: [[5, 1], [5, 3], [5, 4], [6, 4], [8, 2]], inputs: [] },
    { id: 9, wires: [[0, 1], [1, 1], [1, 2], [4, 1], [4, 2], [4, 3], [4, 4], [7, 2]], inputs: [[0, 0, true], [0, 3, false], [0, 5, false]] },
    { id: 10, wires: [[0, 4], [1, 4], [2, 3], [2, 4], [3, 3], [4, 1], [4, 2], [4, 3], [7, 2], [7, 3], [7, 4], [7, 5], [8, 5]], inputs: [[0, 0, false]] },
];

afterEach(() => clearGrid());

describe("player level requirements", () => {
    it.each(examples)("has a valid example layout for level $id", ({ id, wires, inputs }) => {
        const level = getLevel(id);
        const layer = { add: vi.fn() } as unknown as Konva.Layer;
        loadLevel(layer, level);

        // Movable starting wires may be removed or repositioned by the player.
        for (const row of circuitGrid) {
            for (const piece of row) {
                if (piece?.getAttr("elementType") === "wire" && !piece.getAttr("fixed")) {
                    removeElement(piece);
                    piece.destroy();
                }
            }
        }
        for (const [x, y] of wires) {
            if (circuitGrid[y][x]?.getAttr("elementType") === "wire") continue;
            expect(placeElement(createWire(), x, y, 1, 1)).toBe(true);
        }
        for (const [x, y, on] of inputs) {
            const input = circuitGrid[y][x]!;
            if (input.getAttr("powerSource") !== on) input.fire("click");
        }
        updateWireElectricity();

        const exits = circuitGrid.flat().filter((piece) => piece?.getAttr("elementType") === "exit");
        expect(exits.length).toBeGreaterThan(0);
        expect(exits.every((exit) => exit!.getAttr("powered") === true)).toBe(true);
        expect(missingRequiredGates(level.requiredGates ?? {})).toEqual([]);
    });
});
