import Konva from "konva";
import { afterEach, describe, expect, it } from "vitest";
import { findConnectedGates, missingRequiredGates } from "../src/konva/levels/checkRequiredGates";
import { clearGrid, placeElement } from "../src/konva/utils/circuitGrid";

function placeWire(x: number, y: number): void {
    placeElement(new Konva.Group({ elementType: "wire" }), x, y, 1, 1);
}

function placeGate(type: string, x: number, y: number): void {
    placeElement(new Konva.Group({ elementType: "gate", gateType: type }), x, y, 2, 3);
}

function placeExit(x: number, y: number): void {
    placeElement(new Konva.Group({ elementType: "exit" }), x, y, 1, 1);
}

afterEach(() => clearGrid());

describe("required gate connections", () => {
    it("traces from the exit through gate outputs and upstream inputs", () => {
        // AND -> wire -> NOT -> wire -> exit
        placeGate("AND", 0, 0);
        placeWire(2, 1);
        placeGate("NOT", 3, 1);
        placeWire(5, 2);
        placeExit(6, 2);
        expect(findConnectedGates()).toEqual({ NOT: 1, AND: 1 });
        expect(missingRequiredGates({ AND: 1, NOT: 1, XOR: 1 })).toEqual(["XOR (0/1)"]);
    });

    it("does not count an isolated gate or a wire touching the wrong side", () => {
        placeGate("AND", 1, 1);
        placeWire(1, 0); // Above the gate, not next to its output pin.
        placeExit(2, 0);
        expect(findConnectedGates().AND).toBeUndefined();
        expect(missingRequiredGates({ AND: 1 })).toEqual(["AND (0/1)"]);
    });

    it("does not trace from the unused bottom input of a NOT gate", () => {
        placeGate("AND", 0, 1);
        placeWire(2, 2);
        placeWire(2, 3);
        placeGate("NOT", 3, 1);
        placeWire(5, 2);
        placeExit(6, 2);
        expect(findConnectedGates()).toEqual({ NOT: 1 });
    });

    it("traces both inputs of a two-input gate", () => {
        placeGate("AND", 0, 1);
        placeWire(2, 2);
        placeWire(2, 3);
        placeGate("OR", 3, 1);
        placeWire(5, 2);
        placeExit(6, 2);
        expect(findConnectedGates()).toEqual({ OR: 1, AND: 1 });
    });

    it("terminates when wires loop and collects gates across exits", () => {
        placeGate("AND", 0, 0);
        placeWire(2, 1);
        placeWire(2, 0);
        placeWire(3, 0);
        placeWire(3, 1);
        placeExit(4, 1);
        placeGate("XOR", 5, 2);
        placeWire(7, 3);
        placeExit(8, 3);
        expect(findConnectedGates()).toEqual({ AND: 1, XOR: 1 });
    });

    it("terminates when a gate output loops back to its input", () => {
        placeGate("NOT", 2, 1);
        for (const [x, y] of [[4, 2], [4, 1], [4, 0], [3, 0], [2, 0], [1, 0], [1, 1]]) {
            placeWire(x, y);
        }
        placeExit(5, 2);
        expect(findConnectedGates()).toEqual({ NOT: 1 });
    });

    it("counts two distinct gates of the same type, not their occupied cells", () => {
        placeGate("AND", 0, 0);
        placeWire(2, 1);
        placeGate("AND", 3, 1);
        placeWire(5, 2);
        placeExit(6, 2);
        expect(findConnectedGates()).toEqual({ AND: 2 });
        expect(missingRequiredGates({ AND: 2 })).toEqual([]);
        expect(missingRequiredGates({ AND: 3 })).toEqual(["AND (2/3)"]);
    });

    it("leaves levels without requirements unchanged", () => {
        expect(missingRequiredGates({})).toEqual([]);
        expect(missingRequiredGates({ OR: 1 })).toEqual(["OR (0/1)"]);
    });
});
