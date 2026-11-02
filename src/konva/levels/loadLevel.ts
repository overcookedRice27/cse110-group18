import Konva from "konva";
import { createGate, gateCells } from "../gate";
import { LevelData } from "./levelData";
import {
    createBlock,
    createExit,
    createInput,
    createWire,
    updateWireAndNeighbors,
    updateWireElectricity,
} from "../wire";
import { placeElement } from "../utils/circuitGrid";

export function loadLevel(grid: Konva.Layer, level: LevelData): void {
    for (const piece of level.pieces) {
        let element: Konva.Group;
        let size: { width: number; height: number };

        if (piece.type === "gate") {
            element = createGate(piece.gateType, piece.fixed === true);
            size = gateCells;
        } else if (piece.type === "input") {
            element = createInput(piece.on);
            size = { width: 1, height: 1 };
        } else if (piece.type === "exit") {
            element = createExit();
            size = { width: 1, height: 1 };
        } else if (piece.type === "block") {
            element = createBlock();
            size = { width: 1, height: 1 };
        } else {
            element = createWire("cross", piece.fixed === true);
            size = { width: 1, height: 1 };
        }

        if (placeElement(element, piece.x, piece.y, size.width, size.height)) {
            grid.add(element);
        } else {
            element.destroy();
            console.error("Could not place level piece:", piece);
        }
    }

    for (const piece of level.pieces) {
        if (piece.type === "wire") {
            updateWireAndNeighbors(piece.x, piece.y);
        }
    }
    updateWireElectricity();
}
