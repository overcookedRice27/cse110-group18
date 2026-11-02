import Konva from "konva";
import { COLORS, GRID, LEVEL_CREATOR_MODE } from "./constants";
import {
    getRelativeGridCoordinate,
    isPointerOverCreatorPanel,
} from "./utils/grid";
import { circuitGrid, placeElement, removeElement } from "./utils/circuitGrid";
import { calculateGateOutput } from "./gateLogic";
import type { GateType } from "./levels/levelData";

export type WireShape = "straight" | "corner" | "tee" | "cross";

type GridCoordinate = { x: number; y: number };

export function createWire(
    shape: WireShape = "cross",
    fixed = false,
): Konva.Group {
    const wireGroup = new Konva.Group({
        draggable: LEVEL_CREATOR_MODE || !fixed,
    });

    wireGroup.setAttrs({
        elementType: "wire",
        wireShape: shape,
        powered: false,
        gridWidth: 1,
        gridHeight: 1,
        fixed,
    });

    redrawWire(wireGroup, []);
    wireGroup.add(
        new Konva.Text({
            name: "fixedLabel",
            text: "Fixed",
            x: 2,
            y: 2,
            fontSize: 12,
            fill: COLORS.BUTTON.TEXT,
            visible: fixed,
            listening: false,
        }),
    );

    wireGroup.on("mouseover", () => {
        document.body.style.cursor = "grab";
    });

    // Inputs use the same placement and dragging behavior as wires.
    wireGroup.on("click", () => {
        if (
            wireGroup.getAttr("elementType") === "wire" &&
            LEVEL_CREATOR_MODE &&
            wireGroup.getAttr("gridX") !== undefined
        ) {
            const fixed = !wireGroup.getAttr("fixed");
            wireGroup.setAttr("fixed", fixed);
            wireGroup.findOne(".fixedLabel")?.visible(fixed);
            return;
        }
        if (
            wireGroup.getAttr("elementType") !== "input" ||
            wireGroup.getAttr("gridX") === undefined
        )
            return;
        const on = !wireGroup.getAttr("powerSource");
        wireGroup.setAttr("powerSource", on);
        (wireGroup.findOne(".inputLabel") as Konva.Text).text(
            on ? "ON" : "OFF",
        );
        updateWireElectricity();
    });

    wireGroup.on("dragstart", () => {
        wireGroup.setAttr("dragStartPosition", wireGroup.position());

        const x = wireGroup.getAttr("gridX");
        const y = wireGroup.getAttr("gridY");

        if (x === undefined || y === undefined) return;

        // Remove the wire from its original grid position.
        removeElement(wireGroup);
        updateWireElectricity();

        // Reset the moving wire to its isolated appearance.
        redrawWire(wireGroup, []);

        // Recalculate only its old neighbors.
        redrawWireAt(x - 1, y);
        redrawWireAt(x + 1, y);
        redrawWireAt(x, y - 1);
        redrawWireAt(x, y + 1);
    });

    wireGroup.on("dragend", () => {
        if (isPointerOverCreatorPanel(wireGroup)) {
            wireGroup.destroy();
            return;
        }

        const gridCoord = getWireGridCoordinate(wireGroup);
        const oldX = wireGroup.getAttr("gridX");
        const oldY = wireGroup.getAttr("gridY");

        if (!gridCoord) {
            restorePosition(wireGroup);
            refreshOldPosition(oldX, oldY);
            updateWireElectricity();
            return;
        }

        const placed = placeElement(wireGroup, gridCoord.x, gridCoord.y, 1, 1);

        if (!placed) {
            restorePosition(wireGroup);
            refreshOldPosition(oldX, oldY);
            updateWireElectricity();
            return;
        }

        // Refresh both the new and previous positions after placement.
        updateWireAndNeighbors(gridCoord.x, gridCoord.y);
        refreshOldPosition(oldX, oldY);
        updateWireElectricity();
    });

    wireGroup.on("mouseout", () => {
        document.body.style.cursor = "default";
    });

    return wireGroup;
}

export function createInput(on = false): Konva.Group {
    const input = createWire();
    input.draggable(LEVEL_CREATOR_MODE);
    input.destroyChildren();
    input.setAttrs({ elementType: "input", powerSource: on });
    input.add(
        new Konva.Rect({
            width: GRID.CELL_SIZE,
            height: GRID.CELL_SIZE,
            fill: COLORS.BUTTON.BACKGROUND,
            stroke: COLORS.BUTTON.BORDER,
            strokeWidth: 2,
            cornerRadius: 8,
        }),
        new Konva.Text({
            name: "inputLabel",
            text: on ? "ON" : "OFF",
            width: GRID.CELL_SIZE,
            height: GRID.CELL_SIZE,
            fontSize: 20,
            align: "center",
            verticalAlign: "middle",
        }),
    );
    return input;
}

export function createExit(): Konva.Group {
    const exit = createWire();
    exit.draggable(LEVEL_CREATOR_MODE);
    exit.destroyChildren();
    exit.setAttrs({ elementType: "exit", powered: false });
    exit.add(
        new Konva.Rect({
            width: GRID.CELL_SIZE,
            height: GRID.CELL_SIZE,
            fill: COLORS.BUTTON.BACKGROUND,
            stroke: COLORS.BUTTON.BORDER,
            strokeWidth: 2,
            cornerRadius: 8,
        }),
        new Konva.Text({
            name: "exitLabel",
            text: "EXIT\nOFF",
            width: GRID.CELL_SIZE,
            height: GRID.CELL_SIZE,
            fontSize: 18,
            align: "center",
            verticalAlign: "middle",
        }),
    );
    return exit;
}

export function createBlock(): Konva.Group {
    const block = createWire();
    block.draggable(LEVEL_CREATOR_MODE);
    block.destroyChildren();
    block.setAttr("elementType", "block");
    block.add(
        new Konva.Rect({
            width: GRID.CELL_SIZE,
            height: GRID.CELL_SIZE,
            fill: "#888888",
            stroke: COLORS.BUTTON.BORDER,
            strokeWidth: 2,
        }),
    );
    return block;
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

export function updateWireAndNeighbors(
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
    if (
        element?.getAttr("elementType") === "wire" ||
        element?.getAttr("elementType") === "input" ||
        element?.getAttr("elementType") === "exit"
    )
        return true;
    if (element?.getAttr("elementType") !== "gate") return false;

    const relativeX = x - element.getAttr("gridX");
    const relativeY = y - element.getAttr("gridY");
    return (
        (gateSide === "left" &&
            relativeX === 0 &&
            (relativeY === 0 ||
                (relativeY === 2 && element.getAttr("gateType") !== "NOT"))) ||
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
    if (wireGroup.getAttr("elementType") !== "wire") return;
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
    const sources: Konva.Group[] = [];
    const exits: Konva.Group[] = [];
    const gates = new Set<Konva.Group>();

    // Gates occupy several cells, so keep each gate only once.
    for (const row of circuitGrid) {
        for (const element of row) {
            if (
                element?.getAttr("elementType") === "input" &&
                element.getAttr("powerSource")
            ) {
                sources.push(element);
            }
            if (element?.getAttr("elementType") === "gate") gates.add(element);
            if (element?.getAttr("elementType") === "exit") exits.push(element);
        }
    }

    // Recalculate from the inputs rather than keeping old gate outputs.
    for (const gate of gates) gate.setAttr("outputPowered", false);

    function updateWires(): void {
        const visited = new Set<Konva.Group>();
        for (const row of circuitGrid) {
            for (const element of row) {
                if (element?.getAttr("elementType") === "wire")
                    setWirePower(element, false);
            }
        }

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

        for (const source of sources) {
            const x = source.getAttr("gridX");
            const y = source.getAttr("gridY");
            power(x + 1, y);
            power(x - 1, y);
            power(x, y + 1);
            power(x, y - 1);
        }
        for (const gate of gates) {
            if (gate.getAttr("outputPowered")) {
                power(gate.getAttr("gridX") + 2, gate.getAttr("gridY") + 1);
            }
        }
    }

    function inputIsPowered(x: number, y: number): boolean {
        const element = circuitGrid[y]?.[x];
        if (element?.getAttr("elementType") === "wire")
            return element.getAttr("powered") === true;
        if (element?.getAttr("elementType") === "input")
            return element.getAttr("powerSource") === true;
        return false;
    }

    function updateExits(): void {
        for (const exit of exits) {
            const x = exit.getAttr("gridX");
            const y = exit.getAttr("gridY");
            const neighbors = [
                circuitGrid[y]?.[x - 1],
                circuitGrid[y]?.[x + 1],
                circuitGrid[y - 1]?.[x],
                circuitGrid[y + 1]?.[x],
            ];
            const powered = neighbors.some(
                (element) =>
                    element?.getAttr("elementType") === "wire" &&
                    element.getAttr("powered") === true,
            );
            exit.setAttr("powered", powered);
            const label = exit.findOne(".exitLabel") as Konva.Text;
            if (powered) {
                label.text("EXIT\nON");
            } else {
                label.text("EXIT\nOFF");
            }
            // Notify the owning stage when an EXIT lights up.
            if (powered)
            {
                exit.getStage()?.fire("levelExitPowered");
            }
        }
    }

    // Each pass can carry a signal through one more gate. Gate outputs are
    // applied together so the result does not depend on the order of the grid.
    for (let pass = 0; pass <= gates.size; pass++) {
        updateWires();
        const outputs = new Map<Konva.Group, boolean>();
        let changed = false;
        for (const gate of gates) {
            const x = gate.getAttr("gridX");
            const y = gate.getAttr("gridY");
            const output = calculateGateOutput(
                gate.getAttr("gateType") as GateType,
                inputIsPowered(x - 1, y),
                inputIsPowered(x - 1, y + 2),
            );
            outputs.set(gate, output);
            if (output !== gate.getAttr("outputPowered")) changed = true;
        }
        if (!changed) {
            updateExits();
            return;
        }
        for (const [gate, output] of outputs)
            gate.setAttr("outputPowered", output);
    }

    // Feedback loops are not supported yet; leave only input-powered wires on.
    for (const gate of gates) gate.setAttr("outputPowered", false);
    updateWires();
    updateExits();
    console.warn(
        "Circuit did not settle. Feedback loops are not supported yet.",
    );
}
