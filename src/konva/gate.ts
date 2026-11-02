import Konva from "konva";
import { COLORS, GRID, LEVEL_CREATOR_MODE } from "./constants";
import {
    getRelativeGridCoordinate,
    isPointerOverCreatorPanel,
} from "./utils/grid";
import { clamp } from "./utils/math";
import { placeElement, removeElement } from "./utils/circuitGrid";
import { refreshGateConnections, updateWireElectricity } from "./wire";
import type { GateType } from "./levels/levelData";

export const gateCells = { width: 2, height: 3 };

const gateDimensions = {
    width: GRID.CELL_SIZE * gateCells.width,
    height: GRID.CELL_SIZE * gateCells.height,
};

export function createGate(name: GateType, fixed = false): Konva.Group {
    const gateGroup = new Konva.Group({
        draggable: LEVEL_CREATOR_MODE || !fixed,
    });

    gateGroup.setAttr("elementType", "gate");
    gateGroup.setAttr("gateType", name);
    gateGroup.setAttr("fixed", fixed);

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

    // NOT uses only the top input pin.
    gateGroup.add(
        background,
        label,
        pin(0, GRID.CELL_SIZE * 0.5),
        pin(gateDimensions.width, GRID.CELL_SIZE * 1.5),
    );
    if (name !== "NOT") {
        gateGroup.add(pin(0, GRID.CELL_SIZE * 2.5));
    }
    const fixedLabel = new Konva.Text({
        name: "fixedLabel",
        text: "Fixed",
        x: 5,
        y: 5,
        fontSize: 12,
        fill: COLORS.BUTTON.TEXT,
        visible: fixed,
        listening: false,
    });
    gateGroup.add(fixedLabel);

    gateGroup.on("click", () => {
        if (!LEVEL_CREATOR_MODE || gateGroup.getAttr("gridX") === undefined)
            return;
        const fixed = !gateGroup.getAttr("fixed");
        gateGroup.setAttr("fixed", fixed);
        fixedLabel.visible(fixed);
    });

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
        if (isPointerOverCreatorPanel(gateGroup)) {
            const oldX = gateGroup.getAttr("gridX") as number | undefined;
            const oldY = gateGroup.getAttr("gridY") as number | undefined;
            removeElement(gateGroup);
            gateGroup.destroy();
            if (oldX !== undefined && oldY !== undefined) {
                refreshGateConnections(oldX, oldY);
            }
            updateWireElectricity();
            return;
        }

        const grid = gateGroup.getStage()?.findOne(".grid") as Konva.Layer;

        if (!grid || !grabbedCoordinate) return;

        const gridCoord = getRelativeGridCoordinate(
            grid,
            { width: GRID.WIDTH, height: GRID.HEIGHT },
            GRID.CELL_SIZE,
        );

        if (!gridCoord) {
            gateGroup.position(dragStartPosition);
            return;
        }

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

        if (oldX !== undefined && oldY !== undefined) {
            refreshGateConnections(oldX, oldY);
        }

        refreshGateConnections(newGateCoordinate.x, newGateCoordinate.y);
        updateWireElectricity();
    });

    gateGroup.on("mouseout", () => {
        document.body.style.cursor = "default";
    });

    return gateGroup;
}
