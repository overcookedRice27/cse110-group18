import "./textCanvas";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGate } from "../src/konva/gate";
import { clearGrid, placeElement } from "../src/konva/utils/circuitGrid";
import { createBlock, createExit, createInput, createWire, updateWireElectricity } from "../src/konva/wire";

afterEach(() => clearGrid());

describe("circuit electricity", () => {
    it("powers connected wires and an exit, then clears them when the input is switched off", () => {
        const input = createInput(true);
        const first = createWire();
        const second = createWire();
        const isolated = createWire();
        const exit = createExit();
        placeElement(input, 0, 0, 1, 1);
        placeElement(first, 1, 0, 1, 1);
        placeElement(second, 2, 0, 1, 1);
        placeElement(exit, 3, 0, 1, 1);
        placeElement(isolated, 6, 0, 1, 1);
        updateWireElectricity();
        expect(first.getAttr("powered")).toBe(true);
        expect(second.getAttr("powered")).toBe(true);
        expect(isolated.getAttr("powered")).toBe(false);
        expect(exit.getAttr("powered")).toBe(true);
        expect(exit.findOne(".exitLabel")?.getAttr("text")).toBe("EXIT\nON");
        input.fire("click");
        expect(input.getAttr("powerSource")).toBe(false);
        expect(second.getAttr("powered")).toBe(false);
        expect(exit.getAttr("powered")).toBe(false);
        expect(exit.findOne(".exitLabel")?.getAttr("text")).toBe("EXIT\nOFF");
    });

    it("uses both AND inputs to power the output wire and exit", () => {
        const top = createInput(true);
        const bottom = createInput(false);
        const gate = createGate("AND");
        const output = createWire();
        const exit = createExit();
        placeElement(top, 0, 0, 1, 1);
        placeElement(bottom, 0, 2, 1, 1);
        placeElement(gate, 1, 0, 2, 3);
        placeElement(output, 3, 1, 1, 1);
        placeElement(exit, 4, 1, 1, 1);
        updateWireElectricity();
        expect(output.getAttr("powered")).toBe(false);
        bottom.fire("click");
        expect(gate.getAttr("outputPowered")).toBe(true);
        expect(output.getAttr("powered")).toBe(true);
        expect(exit.getAttr("powered")).toBe(true);
    });

    it("does not spread electricity through blocks", () => {
        const input = createInput(true);
        const block = createBlock();
        const wire = createWire();
        placeElement(input, 0, 0, 1, 1);
        placeElement(block, 1, 0, 1, 1);
        placeElement(wire, 2, 0, 1, 1);
        updateWireElectricity();
        expect(wire.getAttr("powered")).toBe(false);
    });

    it("propagates a signal through more than one gate", () => {
        const input = createInput(true);
        const first = createGate("NOT");
        const middle = createWire();
        const second = createGate("NOT");
        const output = createWire();
        placeElement(input, 0, 0, 1, 1);
        placeElement(first, 1, 0, 2, 3);
        placeElement(middle, 3, 1, 1, 1);
        placeElement(second, 4, 1, 2, 3);
        placeElement(output, 6, 2, 1, 1);
        updateWireElectricity();
        expect(first.getAttr("outputPowered")).toBe(false);
        expect(second.getAttr("outputPowered")).toBe(true);
        expect(output.getAttr("powered")).toBe(true);
        input.fire("click");
        expect(first.getAttr("outputPowered")).toBe(true);
        expect(second.getAttr("outputPowered")).toBe(false);
        expect(output.getAttr("powered")).toBe(false);
    });

    it("falls back to input-powered wires when a feedback loop does not settle", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        try {
            const gate = createGate("NOT");
            placeElement(gate, 2, 1, 2, 3);
            for (const [x, y] of [[4, 2], [4, 1], [4, 0], [3, 0], [2, 0], [1, 0], [1, 1]]) {
                placeElement(createWire(), x, y, 1, 1);
            }
            updateWireElectricity();
            expect(warn).toHaveBeenCalledWith("Circuit did not settle. Feedback loops are not supported yet.");
            expect(gate.getAttr("outputPowered")).toBe(false);
        } finally {
            warn.mockRestore();
        }
    });
});
