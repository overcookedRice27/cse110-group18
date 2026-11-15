// HIGH/LOW fixed input tests: values, player restrictions, and signal propagation.
import "./textCanvas";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { COLORS, isCreatorView, setCreatorView } from "../src/konva/constants";
import { clearGrid, placeElement } from "../src/konva/utils/circuitGrid";
import {
    createHigh,
    createLow,
    createWire,
    updateWireAndNeighbors,
    updateWireElectricity,
} from "../src/konva/wire";

// Construct sources in player mode and restore the prior mode after each test.
let previousCreatorView: boolean;
beforeEach(() => {
    previousCreatorView = isCreatorView;
    setCreatorView(false);
});

afterEach(() => {
    clearGrid();
    setCreatorView(previousCreatorView);
});

describe.each([
    { name: "HIGH", create: createHigh, value: 1, powered: true },
    { name: "LOW", create: createLow, value: 0, powered: false },
])("$name fixed input", ({ create, value, powered }) => {
    // Check that each block is an input with its expected constant value, output,
    // and HIGH/LOW sprite text: HIGH starts at 1/true and LOW starts at 0/false.
    it("starts with the correct fixed signal and HIGH/LOW sprite label", () => {
        const input = create();
        expect(placeElement(input, 0, 0, 1, 1)).toBe(true);
        expect(input.getAttr("elementType")).toBe("input");
        expect(input.getAttr("constantValue")).toBe(value);
        expect(input.getAttr("powerSource")).toBe(powered);
        expect(input.findOne(".inputLabel")?.getAttr("text")).toBe(value === 1 ? "HIGH" : "LOW");
    });

    // Create the block in player mode and verify Konva dragging is disabled
    // after placement, keeping players from moving this level-provided input.
    it("disables dragging so the player cannot move it", () => {
        const input = create();
        expect(placeElement(input, 0, 0, 1, 1)).toBe(true);
        // Konva uses this setting to prevent pointer interactions from starting a drag.
        expect(input.draggable()).toBe(false);
    });

    // Click a placed block three times and verify every click preserves its
    // output, constant value, and label instead of toggling like a normal input.
    it("cannot be toggled by player clicks", () => {
        const input = create();
        expect(placeElement(input, 0, 0, 1, 1)).toBe(true);
        // Repeat clicks to catch either a one-time or alternating state change.
        for (let click = 0; click < 3; click++) {
            input.fire("click");
            expect(input.getAttr("powerSource")).toBe(powered);
            expect(input.getAttr("constantValue")).toBe(value);
            expect(input.findOne(".inputLabel")?.getAttr("text")).toBe(value === 1 ? "HIGH" : "LOW");
        }
    });

    // Connect three wires around a corner and recalculate electricity. Check
    // their signal state, stroke color, and electricity visibility: HIGH lights
    // the chain and LOW leaves it dark. A separate wire must stay unpowered.
    it("propagates its fixed signal through connected wires", () => {
        const input = create();
        const wires = [createWire(), createWire(), createWire()];
        const isolated = createWire();
        expect(placeElement(input, 0, 0, 1, 1)).toBe(true);
        // Include a corner to check propagation beyond the directly adjacent wire.
        const positions = [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }];
        wires.forEach((wire, index) => {
            const { x, y } = positions[index];
            expect(placeElement(wire, x, y, 1, 1)).toBe(true);
        });
        expect(placeElement(isolated, 5, 0, 1, 1)).toBe(true);
        positions.forEach(({ x, y }) => updateWireAndNeighbors(x, y));
        updateWireElectricity();

        // HIGH lights every connected segment; LOW leaves every segment unlit.
        for (const wire of wires) {
            expect(wire.getAttr("powered")).toBe(powered);
            expect(wire.find(".bgLine").length).toBeGreaterThan(0);
            expect(wire.find(".elecLine").length).toBeGreaterThan(0);
            wire.find(".bgLine").forEach((line) => {
                expect(line.getAttr("stroke")).toBe(
                    powered ? COLORS.WIRE.POWERED : COLORS.WIRE.BACKGROUND,
                );
            });
            wire.find(".elecLine").forEach((line) => {
                expect(line.visible()).toBe(powered);
            });
        }
        expect(isolated.getAttr("powered")).toBe(false);
    });
});
