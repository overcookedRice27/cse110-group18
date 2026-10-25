import Konva from "konva";

export function getRelativeGridCoordinate(
    element: Konva.Group | Konva.Layer,
    dimensions: { width: number; height: number },
    cellSize: number,
): { x: number; y: number } | null {
    const pos = element.getRelativePointerPosition();

    if (
        !pos ||
        pos.x < 0 ||
        pos.y < 0 ||
        pos.x >= dimensions.width ||
        pos.y >= dimensions.height
    ) {
        return null;
    }

    return {
        x: Math.floor(pos.x / cellSize),
        y: Math.floor(pos.y / cellSize),
    };
}
