import Konva from "konva";
import { COLORS, GRID } from "./constants";

export function drawGridLayer(): Konva.Layer {
    const gridLayer = new Konva.Layer({
        name: "grid",
    });

    const gridWidth = GRID.X_COUNT * GRID.CELL_SIZE;
    const gridHeight = GRID.Y_COUNT * GRID.CELL_SIZE;

    for (let x = 0; x <= GRID.X_COUNT; x++) {
        const xPos = GRID.CELL_SIZE * x;
        gridLayer.add(
            new Konva.Line({
                points: [xPos, 0, xPos, gridHeight],
                stroke: COLORS.GRID.STROKE,
                strokeWidth: GRID.STROKE_WIDTH,
            }),
        );
    }

    for (let y = 0; y <= GRID.Y_COUNT; y++) {
        const yPos = GRID.CELL_SIZE * y;
        gridLayer.add(
            new Konva.Line({
                points: [0, yPos, gridWidth, yPos],
                stroke: COLORS.GRID.STROKE,
                strokeWidth: GRID.STROKE_WIDTH,
            }),
        );
    }

    return gridLayer;
}
