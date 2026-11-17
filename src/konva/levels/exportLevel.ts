import Konva from "konva";
import { circuitGrid } from "../utils/circuitGrid";
import type { GateRequirements, GateType, LevelData, LevelPiece } from "./levelData";

export function getLevelData(id: number, requiredGates?: GateRequirements): LevelData {
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
                // Keep constant sources distinct so loading cannot turn them into toggles.
                const constantValue = element.getAttr("constantValue");
                if (constantValue !== undefined) {
                    pieces.push({ type: constantValue === 1 ? "high" : "low", x, y });
                } else {
                    pieces.push({ type: "input", on, x, y });
                }
            } else if (element.getAttr("elementType") === "exit") {
                pieces.push({ type: "exit", x, y });
            } else if (element.getAttr("elementType") === "block") {
                pieces.push({ type: "block", x, y });
            }
        }
    }

    if (requiredGates !== undefined) return { id, pieces, requiredGates };
    return { id, pieces };
}

export function exportLevel(id: number, requiredGates?: GateRequirements): void {
    const level = getLevelData(id, requiredGates);
    const json = JSON.stringify(level, null, 4);
    const file = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = `level-${id}.json`;
    link.click();
    URL.revokeObjectURL(url);
}
