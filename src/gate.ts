import Konva from "konva";
import { COLORS, GRID } from "./constants";
import { getRelativeGridCoordinate } from "./utils/grid";
import { clamp } from "./utils/math";

const gateCells = { width: 2, height: 3 };

const gateDimensions = {
    width: GRID.CELL_SIZE * gateCells.width,
    height: GRID.CELL_SIZE * gateCells.height,
};

export function createGate(name: string): Konva.Group {
    const gateGroup = new Konva.Group({
        draggable: true,
    });

    const background = new Konva.Rect({
        size: gateDimensions,
        cornerRadius: 12,
        fill: COLORS.BUTTON.BACKGROUND,
        stroke: COLORS.BUTTON.BORDER,
        strokeWidth: 2,
    });

    const label = new Konva.Text({
        text: name,
        size: gateDimensions,
        fontSize: 30,
        fill: COLORS.BUTTON.TEXT,
        align: "center",
        verticalAlign: "middle",
    });

    gateGroup.add(background, label);

    gateGroup.on("mouseover", () => {
        document.body.style.cursor = "grab";
    });

    let grabbedCoordinate: { x: number; y: number } | null = null;

    gateGroup.on("dragstart", () => {
        grabbedCoordinate = getRelativeGridCoordinate(
            gateGroup,
            gateDimensions,
            GRID.CELL_SIZE,
        );
    });

    gateGroup.on("dragend", () => {
        const grid = gateGroup.getStage()?.findOne(".grid") as Konva.Layer;

        if (!grid || !grabbedCoordinate) return;

        const gridCoord = getRelativeGridCoordinate(
            grid,
            { width: GRID.WIDTH, height: GRID.HEIGHT },
            GRID.CELL_SIZE,
        );

        if (!gridCoord) return;

        const gridOffset = grid.getAbsolutePosition();

        const newGateCoordinate = {
            x: clamp(
                gridCoord.x - grabbedCoordinate.x,
                0,
                GRID.X_COUNT - gateCells.width,
            ),
            y: clamp(
                gridCoord.y - grabbedCoordinate.y,
                0,
                GRID.Y_COUNT - gateCells.height,
            ),
        };

        gateGroup.position({
            x: newGateCoordinate.x * GRID.CELL_SIZE + gridOffset.x,
            y: newGateCoordinate.y * GRID.CELL_SIZE + gridOffset.y,
        });
    });

    gateGroup.on("mouseout", () => {
        document.body.style.cursor = "default";
    });

    return gateGroup;
}
