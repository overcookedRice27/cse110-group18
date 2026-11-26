import "./textCanvas";
import Konva from "konva";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createExit } from "../src/konva/wire";

const openPieceMenu = vi.hoisted(() => vi.fn());
vi.mock("../src/konva/pieceMenu", () => ({ openPieceMenu, closePieceMenu: () => undefined }));
import { setCreatorView, TRASH } from "../src/konva/constants";
import { createGate } from "../src/konva/gate";
import { circuitGrid, clearGrid, placeElement } from "../src/konva/utils/circuitGrid";
import { isPointerOverTrash } from "../src/konva/utils/grid";
import { canRemovePiece, createInput, createWire, removePiece, updateWireElectricity } from "../src/konva/wire";

afterEach(() => {
    openPieceMenu.mockClear();
    clearGrid();
    setCreatorView(true);
});

describe("removing pieces", () => {
    it("removes a placed wire", () => {
        const wire = createWire();
        placeElement(wire, 2, 2, 1, 1);
        expect(removePiece(wire)).toBe(true);
        expect(circuitGrid[2][2]).toBeNull();
    });

    it("removes a gate from every cell it occupies", () => {
        const gate = createGate("AND");
        placeElement(gate, 4, 1, 2, 3);
        expect(removePiece(gate)).toBe(true);
        expect(circuitGrid[1][4]).toBeNull();
        expect(circuitGrid[3][5]).toBeNull();
    });

    it("refuses unplaced pieces", () => {
        expect(removePiece(createWire())).toBe(false);
    });

    it("protects fixed pieces and inputs in player view", () => {
        setCreatorView(false);
        const gate = createGate("OR", true);
        const input = createInput();
        placeElement(gate, 8, 1, 2, 3);
        placeElement(input, 0, 0, 1, 1);
        expect(canRemovePiece(gate)).toBe(false);
        expect(canRemovePiece(input)).toBe(false);
        expect(removePiece(gate)).toBe(false);
        expect(circuitGrid[1][8]).toBe(gate);
    });

    it("lets the creator remove fixed pieces", () => {
        const gate = createGate("OR", true);
        placeElement(gate, 8, 1, 2, 3);
        expect(removePiece(gate)).toBe(true);
    });
});

describe("trash zone", () => {
    it("detects pointers inside and outside", () => {
        expect(isPointerOverTrash({ x: TRASH.X + 5, y: TRASH.Y + 5 })).toBe(true);
        expect(isPointerOverTrash({ x: TRASH.X + TRASH.WIDTH + TRASH.HIT_MARGIN_X + 1, y: TRASH.Y })).toBe(false);
    });
});

describe("circuit updates after removal", () => {
    it("unpowers the exit when a connecting wire is removed", () => {
        const input = createInput(true);
        const first = createWire();
        const second = createWire();
        const exit = createExit();
        placeElement(input, 0, 0, 1, 1);
        placeElement(first, 1, 0, 1, 1);
        placeElement(second, 2, 0, 1, 1);
        placeElement(exit, 3, 0, 1, 1);
        updateWireElectricity();
        expect(exit.getAttr("powered")).toBe(true);

        removePiece(second);

        expect(exit.getAttr("powered")).toBe(false);
        expect(first.getAttr("powered")).toBe(true);
    });

    it("unpowers the exit when a gate is removed", () => {
        const top = createInput(true);
        const bottom = createInput(true);
        const gate = createGate("AND");
        const output = createWire();
        const exit = createExit();
        placeElement(top, 0, 0, 1, 1);
        placeElement(bottom, 0, 2, 1, 1);
        placeElement(gate, 1, 0, 2, 3);
        placeElement(output, 3, 1, 1, 1);
        placeElement(exit, 4, 1, 1, 1);
        updateWireElectricity();
        expect(exit.getAttr("powered")).toBe(true);

        removePiece(gate);

        expect(exit.getAttr("powered")).toBe(false);
    });
});

function rightClick(piece: Konva.Group) {
    const preventDefault = vi.fn();
    piece.fire("contextmenu", { evt: { preventDefault, clientX: 40, clientY: 60 } });
    return preventDefault;
}

describe("right-click on a piece", () => {
    it("offers Remove wire and removes the wire when chosen", () => {
        const wire = createWire();
        placeElement(wire, 3, 3, 1, 1);

        const preventDefault = rightClick(wire);

        expect(preventDefault).toHaveBeenCalled();
        expect(openPieceMenu).toHaveBeenCalledWith(40, 60, "Remove wire", expect.any(Function));
        openPieceMenu.mock.calls[0][3]();
        expect(circuitGrid[3][3]).toBeNull();
    });

    it("offers Remove gate for a gate", () => {
        const gate = createGate("XOR");
        placeElement(gate, 2, 1, 2, 3);
        rightClick(gate);
        expect(openPieceMenu).toHaveBeenCalledWith(40, 60, "Remove gate", expect.any(Function));
    });

    it("shows no menu for fixed pieces or inputs in player view", () => {
        setCreatorView(false);
        const gate = createGate("OR", true);
        const input = createInput();
        placeElement(gate, 8, 1, 2, 3);
        placeElement(input, 0, 0, 1, 1);
        const preventDefault = rightClick(gate);
        rightClick(input);
        expect(preventDefault).toHaveBeenCalled(); // browser menu still suppressed
        expect(openPieceMenu).not.toHaveBeenCalled();
    });

    it("shows no menu for a piece that is not on the grid", () => {
        rightClick(createWire());
        expect(openPieceMenu).not.toHaveBeenCalled();
    });

    it("offers removal of inputs in creator view", () => {
        const input = createInput();
        placeElement(input, 0, 0, 1, 1);
        rightClick(input);
        expect(openPieceMenu).toHaveBeenCalledWith(40, 60, "Remove input", expect.any(Function));
    });
});
