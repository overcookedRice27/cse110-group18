import Konva from "konva";
import { GRID } from "../constants";

export const circuitGrid: (Konva.Group | null)[][] = [];

for (let y = 0; y < GRID.Y_COUNT; y++) {
    const row: (Konva.Group | null)[] = [];

    for (let x = 0; x < GRID.X_COUNT; x++) {
        row.push(null);
    }

    circuitGrid.push(row);
}

export function placeElement(
    element: Konva.Group,
    x: number,
    y: number,
    width: number,
    height: number,
): boolean {
    // Check grid boundaries.
    if (
        x < 0 ||
        y < 0 ||
        x + width > GRID.X_COUNT ||
        y + height > GRID.Y_COUNT
    ) {
        return false;
    }

    // Check whether the destination cells are occupied.
    for (let offsetY = 0; offsetY < height; offsetY++) {
        for (let offsetX = 0; offsetX < width; offsetX++) {
            const cellX = x + offsetX;
            const cellY = y + offsetY;
            const occupant = circuitGrid[cellY][cellX];

            if (occupant !== null && occupant !== element) {
                return false;
            }
        }
    }

    // Clear the element's previous grid position.
    for (let gridY = 0; gridY < GRID.Y_COUNT; gridY++) {
        for (let gridX = 0; gridX < GRID.X_COUNT; gridX++) {
            if (circuitGrid[gridY][gridX] === element) {
                circuitGrid[gridY][gridX] = null;
            }
        }
    }

    // Register the element in every cell it occupies.
    for (let offsetY = 0; offsetY < height; offsetY++) {
        for (let offsetX = 0; offsetX < width; offsetX++) {
            circuitGrid[y + offsetY][x + offsetX] = element;
        }
    }

    // Save its grid position and dimensions.
    element.setAttrs({
        gridX: x,
        gridY: y,
        gridWidth: width,
        gridHeight: height,
    });

    // Position the element relative to the grid.
    element.position({
        x: x * GRID.CELL_SIZE,
        y: y * GRID.CELL_SIZE,
    });

    return true;
}
