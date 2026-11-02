import Konva from "konva";
import { circuitGrid } from "../utils/circuitGrid";
import type { GateType, LevelData, LevelPiece } from "./levelData";

export function getLevelData(id: number): LevelData {
    const pieces: LevelPiece[] = [];
    // A gate appears in every cell it occupies, but is exported only once.
    const visited = new Set<Konva.Group>();

    for (const row of circuitGrid) {
        for (const element of row) {
            if (!element || visited.has(element)) continue;
            visited.add(element);

            const x = element.getAttr("gridX") as number;
            const y = element.getAttr("gridY") as number;

            if (element.getAttr("elementType") === "gate") {
                const gateType = element.getAttr("gateType") as GateType;
                const fixed = element.getAttr("fixed") === true;
                pieces.push({ type: "gate", gateType, fixed, x, y });
            } else if (element.getAttr("elementType") === "wire") {
                const fixed = element.getAttr("fixed") === true;
                pieces.push({ type: "wire", fixed, x, y });
            } else if (element.getAttr("elementType") === "input") {
                const on = element.getAttr("powerSource") === true;
                pieces.push({ type: "input", on, x, y });
            } else if (element.getAttr("elementType") === "exit") {
                pieces.push({ type: "exit", x, y });
            } else if (element.getAttr("elementType") === "block") {
                pieces.push({ type: "block", x, y });
            }
        }
    }

    return { id, pieces };
}

export function exportLevel(id: number): void {
    const level = getLevelData(id);
    const json = JSON.stringify(level, null, 4);
    const file = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = `level-${id}.json`;
    link.click();
    URL.revokeObjectURL(url);
}
