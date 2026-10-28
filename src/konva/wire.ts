import Konva from "konva";
import { COLORS, GRID } from "./constants";
import { getRelativeGridCoordinate } from "./utils/grid";
import { circuitGrid, placeElement } from "./utils/circuitGrid";

export type WireShape = "straight" | "corner" | "tee" | "cross";

type GridCoordinate = { x: number; y: number };

export function createWire(shape: WireShape = "cross"): Konva.Group {
    const wireGroup = new Konva.Group({
        draggable: true,
    });

    wireGroup.setAttrs({
        elementType: "wire",
        wireShape: shape,
        powered: false,
        gridWidth: 1,
        gridHeight: 1,
    });

    redrawWire(wireGroup, []);

    wireGroup.on("mouseover", () => {
        document.body.style.cursor = "grab";
    });

    wireGroup.on("dragstart", () => {
        wireGroup.setAttr("dragStartPosition", wireGroup.position());

        const x = wireGroup.getAttr("gridX");
        const y = wireGroup.getAttr("gridY");

        if (x === undefined || y === undefined) return;

        // Remove the wire from its original grid position.
        removeWireFromGrid(wireGroup);

        // Reset the moving wire to its isolated appearance.
        redrawWire(wireGroup, []);

        // Recalculate only its old neighbors.
        redrawWireAt(x - 1, y);
        redrawWireAt(x + 1, y);
        redrawWireAt(x, y - 1);
        redrawWireAt(x, y + 1);
    });

    wireGroup.on("dragend", () => {
        const gridCoord = getWireGridCoordinate(wireGroup);
        const oldX = wireGroup.getAttr("gridX");
        const oldY = wireGroup.getAttr("gridY");

        if (!gridCoord) {
            restorePosition(wireGroup);
            refreshOldPosition(oldX, oldY);
            return;
        }

        const placed = placeElement(wireGroup, gridCoord.x, gridCoord.y, 1, 1);

        if (!placed) {
            restorePosition(wireGroup);
            refreshOldPosition(oldX, oldY);
            return;
        }

        // Refresh both the new and previous positions after placement.
        updateWireAndNeighbors(gridCoord.x, gridCoord.y);
        refreshOldPosition(oldX, oldY);
    });

    wireGroup.on("mouseout", () => {
        document.body.style.cursor = "default";
    });

    return wireGroup;
}

function removeWireFromGrid(wire: Konva.Group): void {
    for (let y = 0; y < circuitGrid.length; y++) {
        for (let x = 0; x < circuitGrid[y].length; x++) {
            if (circuitGrid[y][x] === wire) {
                circuitGrid[y][x] = null;
            }
        }
    }
}

function getWireGridCoordinate(wireGroup: Konva.Group): GridCoordinate | null {
    const grid = wireGroup.getStage()?.findOne(".grid") as
        | Konva.Layer
        | undefined;

    if (!grid) return null;

    return getRelativeGridCoordinate(
        grid,
        { width: GRID.WIDTH, height: GRID.HEIGHT },
        GRID.CELL_SIZE,
    );
}

function refreshOldPosition(
    x: number | undefined,
    y: number | undefined,
): void {
    if (x === undefined || y === undefined) return;
    updateWireAndNeighbors(x, y);
}

function restorePosition(wireGroup: Konva.Group): void {
    const x = wireGroup.getAttr("gridX");
    const y = wireGroup.getAttr("gridY");

    if (x === undefined || y === undefined) {
        const startPosition = wireGroup.getAttr("dragStartPosition");

        if (startPosition) {
            wireGroup.position(startPosition);
        }

        return;
    }

    // Dragging removed the wire from the grid, so restore its registration too.
    placeElement(wireGroup, x, y, 1, 1);

    wireGroup.getLayer()?.batchDraw();
}

type WirePreview = {
    wire: Konva.Group;
    x: number;
    y: number;
};

function updateWireAndNeighbors(
    x: number,
    y: number,
    preview?: WirePreview,
): void {
    redrawWireAt(x, y, preview);
    redrawWireAt(x - 1, y, preview);
    redrawWireAt(x + 1, y, preview);
    redrawWireAt(x, y - 1, preview);
    redrawWireAt(x, y + 1, preview);
}

function isWireAt(
    x: number,
    y: number,
    preview?: WirePreview,
    gateSide?: "left" | "right",
): boolean {
    if (preview) {
        // Ignore the dragged wire at its original grid position.
        const oldX = preview.wire.getAttr("gridX");
        const oldY = preview.wire.getAttr("gridY");

        if (x === oldX && y === oldY) {
            return false;
        }

        // Treat the dragged wire as connected at its preview position.
        if (x === preview.x && y === preview.y) {
            return true;
        }
    }

    const element = circuitGrid[y]?.[x];
    if (element?.getAttr("elementType") === "wire") return true;
    if (element?.getAttr("elementType") !== "gate") return false;

    const relativeX = x - element.getAttr("gridX");
    const relativeY = y - element.getAttr("gridY");
    return (
        (gateSide === "left" &&
            relativeX === 0 &&
            (relativeY === 0 || relativeY === 2)) ||
        (gateSide === "right" && relativeX === 1 && relativeY === 1)
    );
}

// Refresh wire endpoints when a gate is placed or moved.
export function refreshGateConnections(x: number, y: number): void {
    for (let row = 0; row < 3; row++) {
        redrawWireAt(x - 1, y + row);
        redrawWireAt(x + 2, y + row);
    }
}

function redrawWireAt(x: number, y: number, preview?: WirePreview): void {
    const wire =
        preview && x === preview.x && y === preview.y
            ? preview.wire
            : circuitGrid[y]?.[x];

    if (!wire || wire.getAttr("elementType") !== "wire") return;

    // During dragging, don't redraw the old grid entry as if it were
    // still occupying its original position.
    if (
        preview &&
        wire === preview.wire &&
        (x !== preview.x || y !== preview.y)
    ) {
        return;
    }

    const connections: string[] = [];

    if (isWireAt(x, y - 1, preview)) connections.push("up");
    if (isWireAt(x + 1, y, preview, "left")) connections.push("right");
    if (isWireAt(x, y + 1, preview)) connections.push("down");
    if (isWireAt(x - 1, y, preview, "right")) connections.push("left");

    redrawWire(wire, connections);
}

function redrawWire(wireGroup: Konva.Group, connections: string[]): void {
    const half = GRID.CELL_SIZE / 2;
    const size = GRID.CELL_SIZE;

    wireGroup.find(".bgLine").forEach((line) => line.destroy());
    wireGroup.find(".elecLine").forEach((line) => line.destroy());

    const up = connections.includes("up");
    const right = connections.includes("right");
    const down = connections.includes("down");
    const left = connections.includes("left");

    const points: number[][] = [];

    if (up) points.push([half, half, half, 0]);
    if (right) points.push([half, half, size, half]);
    if (down) points.push([half, half, half, size]);
    if (left) points.push([half, half, 0, half]);

    // Extend a line fully across the cell when connected on only one axis.
    if (!up && !down && (left || right)) {
        points.push([0, half, size, half]);
    } else if (!left && !right && (up || down)) {
        points.push([half, 0, half, size]);
    }

    // Default appearance for an isolated wire.
    if (!up && !right && !down && !left) {
        const inset = size * 0.15;

        points.push(
            [half, inset, half, size - inset],
            [inset, half, size - inset, half],
        );
    }

    const powered = wireGroup.getAttr("powered") === true;

    for (const linePoints of points) {
        wireGroup.add(
            new Konva.Line({
                points: linePoints,
                stroke: powered ? COLORS.WIRE.POWERED : COLORS.WIRE.BACKGROUND,
                strokeWidth: 8,
                lineCap: "round",
                lineJoin: "round",
                name: "bgLine",
            }),
        );

        wireGroup.add(
            new Konva.Line({
                points: linePoints,
                stroke: COLORS.WIRE.ELECTRICITY,
                strokeWidth: 4,
                lineCap: "round",
                lineJoin: "round",
                dash: [1, 8],
                visible: powered,
                name: "elecLine",
            }),
        );
    }

    wireGroup.setAttr("connections", connections);

    const count = [up, right, down, left].filter(Boolean).length;

    let shape: WireShape;

    if (count >= 3) {
        shape = count === 4 ? "cross" : "tee";
    } else if (
        (up && down && !left && !right) ||
        (left && right && !up && !down)
    ) {
        shape = "straight";
    } else if (count === 2) {
        shape = "corner";
    } else {
        shape = "straight";
    }

    wireGroup.setAttr("wireShape", shape);
    wireGroup.getLayer()?.batchDraw();
}

export function setWirePower(wireGroup: Konva.Group, turnOn: boolean): void {
    wireGroup.setAttr("powered", turnOn);

    wireGroup.find(".bgLine").forEach((node) => {
        (node as Konva.Line).stroke(
            turnOn ? COLORS.WIRE.POWERED : COLORS.WIRE.BACKGROUND,
        );
    });

    wireGroup.find(".elecLine").forEach((node) => {
        node.visible(turnOn);
    });
}

export function updateWireElectricity(): void {
    const visited = new Set<Konva.Group>();
    const sources: Konva.Group[] = [];

    // Reset all wires and remember power sources.
    for (const row of circuitGrid) {
        for (const wire of row) {
            if (wire?.getAttr("elementType") !== "wire") continue;

            if (wire.getAttr("powerSource")) {
                sources.push(wire);
            }

            setWirePower(wire, false);
        }
    }

    // Spread electricity to adjacent wires.
    function power(x: number, y: number): void {
        const wire = circuitGrid[y]?.[x];

        if (wire?.getAttr("elementType") !== "wire" || visited.has(wire))
            return;

        visited.add(wire);
        setWirePower(wire, true);

        power(x + 1, y);
        power(x - 1, y);
        power(x, y + 1);
        power(x, y - 1);
    }

    // Start spreading from each power source.
    for (const source of sources) {
        power(source.getAttr("gridX"), source.getAttr("gridY"));
    }
}
