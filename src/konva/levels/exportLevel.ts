import Konva from "konva";
import { circuitGrid } from "../utils/circuitGrid";
import type { GateType, LevelData, LevelPiece } from "./levelData";

export function exportLevel(id: number): void {
    const pieces: LevelPiece[] = [];
    const visited = new Set<Konva.Group>();

    for (const row of circuitGrid) {
        for (const element of row) {
            if (!element || visited.has(element)) continue;
            visited.add(element);

            const x = element.getAttr("gridX") as number;
            const y = element.getAttr("gridY") as number;

            if (element.getAttr("elementType") === "gate") {
                const gateType = element.getAttr("gateType") as GateType;
                pieces.push({ type: "gate", gateType, x, y });
            } else if (element.getAttr("elementType") === "wire") {
                pieces.push({ type: "wire", x, y });
            }
        }
    }

    const level: LevelData = { id, pieces };
    const json = JSON.stringify(level, null, 4);
    const file = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = `level-${id}.json`;
    link.click();
    URL.revokeObjectURL(url);
}
