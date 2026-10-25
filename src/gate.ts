import Konva from "konva";
import { COLORS, GRID } from "./constants";
import { getRelativeGridCoordinate } from "./utils/grid";
import { clamp } from "./utils/math";
import { placeElement } from "./utils/circuitGrid";
import { refreshGateConnections, updateWireElectricity } from "./wire";

const gateCells = { width: 2, height: 3 };

const gateDimensions = {
    width: GRID.CELL_SIZE * gateCells.width,
    height: GRID.CELL_SIZE * gateCells.height,
};

export function createGate(name: string): Konva.Group {
    const gateGroup = new Konva.Group({
        draggable: true,
    });

    gateGroup.setAttr("elementType", "gate");

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

    // NEW: Create visible connection pins.
    const pin = (x: number, y: number) =>
        new Konva.Circle({
            x,
            y,
            radius: GRID.CELL_SIZE * 0.1,
            fill: COLORS.WIRE.BACKGROUND,
            listening: false,
        });

    // NEW: Two inputs on the left, one output on the right.
    gateGroup.add(
        background,
        label,
        pin(0, GRID.CELL_SIZE * 0.5),
        pin(0, GRID.CELL_SIZE * 2.5),
        pin(gateDimensions.width, GRID.CELL_SIZE * 1.5),
    );

    gateGroup.on("mouseover", () => {
        document.body.style.cursor = "grab";
    });

    let grabbedCoordinate: { x: number; y: number } | null = null;

    let dragStartPosition = { x: 0, y: 0 };

    gateGroup.on("dragstart", () => {
        dragStartPosition = gateGroup.position();

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

        const oldX = gateGroup.getAttr("gridX") as number | undefined;
        const oldY = gateGroup.getAttr("gridY") as number | undefined;

        const placed = placeElement(
            gateGroup,
            newGateCoordinate.x,
            newGateCoordinate.y,
            gateCells.width,
            gateCells.height,
        );

        if (!placed) {
            gateGroup.position(dragStartPosition);
            return;
        }

        gateGroup.position({
            x: newGateCoordinate.x * GRID.CELL_SIZE + gridOffset.x,
            y: newGateCoordinate.y * GRID.CELL_SIZE + gridOffset.y,
        });

        if (oldX !== undefined && oldY !== undefined) {
            refreshGateConnections(oldX, oldY);
        }

        refreshGateConnections(newGateCoordinate.x, newGateCoordinate.y);
    });

    gateGroup.on("mouseout", () => {
        document.body.style.cursor = "default";
    });

    return gateGroup;
}
