import "./textCanvas";
import Konva from "konva";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GRID } from "../src/konva/constants";
import { exportLevel, getLevelData } from "../src/konva/levels/exportLevel";
import { importLevel } from "../src/konva/levels/importLevel";
import { loadLevel } from "../src/konva/levels/loadLevel";
import type { LevelData } from "../src/konva/levels/levelData";
import { circuitGrid, clearGrid, placeElement } from "../src/konva/utils/circuitGrid";

// Loading only needs a layer to receive the new groups; no canvas is needed.
function makeLayer(): Konva.Layer {
    return { add: vi.fn() } as unknown as Konva.Layer;
}

function makeFile(data: unknown): File {
    return { text: async () => JSON.stringify(data) } as File;
}

afterEach(() => clearGrid());

describe("level loading and export", () => {
    it("loads and exports all piece types, including a multi-cell gate only once", () => {
        const level: LevelData = {
            id: 7,
            pieces: [
                { type: "gate", gateType: "AND", fixed: true, x: 2, y: 1 },
                { type: "wire", fixed: true, x: 1, y: 1 },
                { type: "input", on: true, x: 0, y: 1 },
                { type: "exit", x: 5, y: 1 },
                { type: "block", x: 6, y: 1 },
            ],
        };
        const layer = makeLayer();
        loadLevel(layer, level);
        expect(layer.add).toHaveBeenCalledTimes(5);
        expect(circuitGrid[1][2]).toBe(circuitGrid[3][3]);
        expect(getLevelData(7).pieces).toHaveLength(5);
        expect(getLevelData(7).pieces).toEqual(expect.arrayContaining(level.pieces));
        expect(getLevelData(7).id).toBe(7);
    });

    it("imports a valid layout and replaces the old board", async () => {
        const old = new Konva.Group();
        placeElement(old, 0, 0, 1, 1);
        const destroy = vi.spyOn(old, "destroy");
        const level: LevelData = { id: 2, pieces: [{ type: "input", on: false, x: 2, y: 0 }] };
        await expect(importLevel(makeLayer(), makeFile(level))).resolves.toEqual(level);
        expect(destroy).toHaveBeenCalledOnce();
        expect(circuitGrid[0][0]).toBeNull();
        expect(circuitGrid[0][2]?.getAttr("elementType")).toBe("input");
    });

    it("downloads the exported level as JSON with the level ID in its filename", async () => {
        const link = { href: "", download: "", click: vi.fn() };
        const createUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
        const revokeUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
        vi.stubGlobal("document", { createElement: vi.fn().mockReturnValue(link) });
        try {
            exportLevel(12);
            const blob = createUrl.mock.calls[0][0] as Blob;
            expect(JSON.parse(await blob.text())).toEqual({ id: 12, pieces: [] });
            expect(link.href).toBe("blob:test");
            expect(link.download).toBe("level-12.json");
            expect(link.click).toHaveBeenCalledOnce();
            expect(revokeUrl).toHaveBeenCalledWith("blob:test");
        } finally {
            vi.unstubAllGlobals();
            createUrl.mockRestore();
            revokeUrl.mockRestore();
        }
    });
});

describe("level import validation", () => {
    it.each([
        ["missing level", null, "Invalid level data"],
        ["zero id", { id: 0, pieces: [] }, "Invalid level data"],
        ["fractional id", { id: 1.5, pieces: [] }, "Invalid level data"],
        ["missing pieces", { id: 1 }, "Invalid level data"],
        ["unknown piece", { id: 1, pieces: [{ type: "other", x: 0, y: 0 }] }, "Invalid level piece"],
        ["fractional coordinate", { id: 1, pieces: [{ type: "wire", x: 0.5, y: 0 }] }, "Invalid level piece"],
        ["bad gate type", { id: 1, pieces: [{ type: "gate", gateType: "NAND", x: 0, y: 0 }] }, "Invalid gate type"],
        ["bad input state", { id: 1, pieces: [{ type: "input", on: "yes", x: 0, y: 0 }] }, "Invalid input state"],
        ["bad fixed state", { id: 1, pieces: [{ type: "wire", fixed: 1, x: 0, y: 0 }] }, "Invalid fixed piece state"],
        ["negative coordinate", { id: 1, pieces: [{ type: "wire", x: -1, y: 0 }] }, "Piece outside grid"],
        ["gate beyond edge", { id: 1, pieces: [{ type: "gate", gateType: "NOT", x: GRID.X_COUNT - 1, y: 0 }] }, "Piece outside grid"],
        ["overlapping gate", { id: 1, pieces: [{ type: "gate", gateType: "OR", x: 0, y: 0 }, { type: "block", x: 1, y: 2 }] }, "Pieces overlap"],
    ])("rejects %s without replacing the board", async (_name, data, message) => {
        const old = new Konva.Group();
        placeElement(old, 9, 5, 1, 1);
        const layer = makeLayer();
        await expect(importLevel(layer, makeFile(data))).rejects.toThrow(message);
        expect(circuitGrid[5][9]).toBe(old);
        expect(layer.add).not.toHaveBeenCalled();
    });

    it("rejects malformed JSON without replacing the board", async () => {
        const old = new Konva.Group();
        placeElement(old, 0, 0, 1, 1);
        const file = { text: async () => "{ invalid" } as File;
        await expect(importLevel(makeLayer(), file)).rejects.toThrow();
        expect(circuitGrid[0][0]).toBe(old);
    });
});
