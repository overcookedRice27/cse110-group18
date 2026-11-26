import Konva from "konva";
import { CREATOR_PANEL, TRASH, isCreatorView } from "../constants";

export function isPointerOverCreatorPanel(element: Konva.Group): boolean {
    const pointer = element.getStage()?.getPointerPosition();
    if (!pointer) return false;

    if (!isCreatorView && isPointerOverTrash(pointer)) return true;

    let panelHeight = CREATOR_PANEL.PLAYER_HEIGHT;
    if (isCreatorView) panelHeight = CREATOR_PANEL.HEIGHT;

    return (
        pointer.x >= CREATOR_PANEL.X &&
        pointer.x < CREATOR_PANEL.X + CREATOR_PANEL.WIDTH &&
        pointer.y >= CREATOR_PANEL.Y &&
        pointer.y < CREATOR_PANEL.Y + panelHeight
    );
}

export function isPointerOverTrash(pointer: { x: number; y: number }): boolean {
    return (
        pointer.x >= TRASH.X &&
        pointer.x < TRASH.X + TRASH.WIDTH + TRASH.HIT_MARGIN_X &&
        pointer.y >= TRASH.Y - TRASH.HIT_MARGIN_TOP &&
        pointer.y < TRASH.Y + TRASH.HEIGHT + TRASH.HIT_MARGIN_BOTTOM
    );
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
