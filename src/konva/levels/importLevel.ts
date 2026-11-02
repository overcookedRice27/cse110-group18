import Konva from "konva";
import { GRID } from "../constants";
import { gateCells } from "../gate";
import { clearGrid } from "../utils/circuitGrid";
import type { LevelData } from "./levelData";
import { loadLevel } from "./loadLevel";

export async function importLevel(grid: Konva.Layer, file: File): Promise<LevelData> {
    const level = JSON.parse(await file.text());
    const occupied = new Set<string>();

    if (!level || !Number.isSafeInteger(level.id) || level.id < 1 || !Array.isArray(level.pieces)) {
        throw new Error("Invalid level data");
    }

    // Check the entire layout before replacing the current board.
    for (const piece of level.pieces) {
        if (!piece || (piece.type !== "gate" && piece.type !== "wire") ||
            !Number.isInteger(piece.x) || !Number.isInteger(piece.y)) {
            throw new Error("Invalid level piece");
        }
        if (piece.type === "gate" && !["AND", "OR", "NOT", "XOR"].includes(piece.gateType)) {
            throw new Error("Invalid gate type");
        }

        let width = 1;
        let height = 1;
        if (piece.type === "gate") {
            width = gateCells.width;
            height = gateCells.height;
        }
        if (piece.x < 0 || piece.y < 0 || piece.x + width > GRID.X_COUNT || piece.y + height > GRID.Y_COUNT) {
            throw new Error("Piece outside grid");
        }

        for (let y = piece.y; y < piece.y + height; y++) {
            for (let x = piece.x; x < piece.x + width; x++) {
                const cell = `${x},${y}`;
                if (occupied.has(cell)) throw new Error("Pieces overlap");
                occupied.add(cell);
            }
        }
    }

    clearGrid();
    loadLevel(grid, level);
    return level;
}
