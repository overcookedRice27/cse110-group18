import Konva from "konva";
import { CREATOR_PANEL, LEVEL_CREATOR_MODE } from "../constants";

export function isPointerOverCreatorPanel(element: Konva.Group): boolean {
    if (!LEVEL_CREATOR_MODE) return false;

    const pointer = element.getStage()?.getPointerPosition();
    if (!pointer) return false;

    return pointer.x >= CREATOR_PANEL.X &&
        pointer.x < CREATOR_PANEL.X + CREATOR_PANEL.WIDTH &&
        pointer.y >= CREATOR_PANEL.Y &&
        pointer.y < CREATOR_PANEL.Y + CREATOR_PANEL.HEIGHT;
}

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
