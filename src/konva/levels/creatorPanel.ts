import Konva from "konva";
import { COLORS, CREATOR_PANEL, GRID, TRASH } from "../constants";
import { isPointerOverTrash } from "../utils/grid";
import { createGate, gateCells } from "../gate";
import { createBlock, createExit, createHigh, createLow, createInput, createWire } from "../wire";
import type { GateType } from "./levelData";

export function createCreatorPanel(
    grid: Konva.Layer,
    creatorMode: boolean,
): Konva.Layer {
    const panel = new Konva.Layer();
    // The creator palette includes constant inputs alongside the player pieces.
    let names: readonly (GateType | "Wire" | "Input" | "HIGH" | "LOW" | "Exit" | "Block")[] =
        CREATOR_PANEL.PLAYER_ITEMS;
    let panelHeight = CREATOR_PANEL.PLAYER_HEIGHT;
    if (creatorMode) {
        names = CREATOR_PANEL.CREATOR_ITEMS;
        panelHeight = CREATOR_PANEL.HEIGHT;
    }
    const itemWidth = CREATOR_PANEL.WIDTH - CREATOR_PANEL.PADDING * 2;
    // Group toolbox items by purpose while keeping their text labels visible.
    const itemColors: Record<GateType | "Wire" | "Input" | "HIGH" | "LOW" | "Exit" | "Block", string> = {
        Input: COLORS.TOOLBOX.INPUT,
        HIGH: COLORS.TOOLBOX.INPUT,
        LOW: COLORS.TOOLBOX.INPUT,
        Exit: COLORS.TOOLBOX.EXIT,
        Wire: COLORS.TOOLBOX.WIRE,
        Block: COLORS.TOOLBOX.BLOCK,
        AND: COLORS.TOOLBOX.GATE,
        OR: COLORS.TOOLBOX.GATE,
        NOT: COLORS.TOOLBOX.GATE,
        XOR: COLORS.TOOLBOX.GATE,
    };

    panel.add(
        new Konva.Rect({
            name: "panelBorder",
            x: CREATOR_PANEL.X,
            y: CREATOR_PANEL.Y,
            width: CREATOR_PANEL.WIDTH,
            height: panelHeight,
            stroke: COLORS.BUTTON.BORDER,
            strokeWidth: CREATOR_PANEL.BORDER_WIDTH,
            cornerRadius: CREATOR_PANEL.BORDER_RADIUS,
            listening: false,
        }),
    );

    names.forEach((name, index) => {
        const item = new Konva.Group({
            x: CREATOR_PANEL.X + CREATOR_PANEL.PADDING,
            y:
                CREATOR_PANEL.Y +
                CREATOR_PANEL.PADDING +
                index * CREATOR_PANEL.ITEM_SPACING,
        });
        const background = new Konva.Rect({
            width: itemWidth,
            height: CREATOR_PANEL.ITEM_HEIGHT,
            fill: COLORS.BUTTON.BACKGROUND,
            stroke: COLORS.BUTTON.BORDER,
            cornerRadius: CREATOR_PANEL.ITEM_CORNER_RADIUS,
        });
        const label = new Konva.Text({
            text: name,
            width: itemWidth,
            height: CREATOR_PANEL.ITEM_HEIGHT,
            fontSize: CREATOR_PANEL.ITEM_FONT_SIZE,
            fill: COLORS.BUTTON.TEXT,
            align: "center",
            verticalAlign: "middle",
        });
        const marker = new Konva.Circle({
            x: 14,
            y: CREATOR_PANEL.ITEM_HEIGHT / 2,
            radius: 5,
            fill: itemColors[name],
            listening: false,
        });

        item.add(background, marker, label);
        item.on("mouseover", () => {
            document.body.style.cursor = "grab";
        });
        item.on("mouseout", () => {
            document.body.style.cursor = "default";
        });
        item.on("mousedown", (event) => {
            const pointer = grid.getStage()?.getPointerPosition();
            if (!pointer) return;

            let element: Konva.Group;
            let width = GRID.CELL_SIZE;
            let height = GRID.CELL_SIZE;
            if (name === "Input") {
                element = createInput();
            } else if (name === "HIGH") {
                // HIGH uses the input appearance with a permanently active signal.
                element = createHigh();
            } else if (name === "LOW") {
                // LOW uses the input appearance with a permanently inactive signal.
                element = createLow();
            } else if (name === "Exit") {
                element = createExit();
            } else if (name === "Block") {
                element = createBlock();
            } else if (name === "Wire") {
                element = createWire();
            } else {
                element = createGate(name);
                width *= gateCells.width;
                height *= gateCells.height;
            }

            grid.add(element);
            element.absolutePosition({
                x: pointer.x - width / 2,
                y: pointer.y - height / 2,
            });
            // Discard new pieces that were not successfully placed on the grid.
            element.on("dragend", () => {
                if (element.getAttr("gridX") === undefined) element.destroy();
            });
            element.startDrag(event);
        });
        panel.add(item);
    });

    if (!creatorMode) addTrashZone(panel);

    return panel;
}

// Trash drop target: one red button, distinct from the grey palette items.
const TRASH_ICON =
    "M9 3h6l1 2h4v2H4V5h4l1-2zM6 9h12l-1 12H7L6 9z";
const TRASH_FILL = "#f4b6b6";
const TRASH_FILL_ACTIVE = "#e88a8a";
const TRASH_TEXT = "#7a1f1f";

function addTrashZone(panel: Konva.Layer): void {
    // One solid red button, as wide as the palette's outer box.
    const iconSize = 24;

    panel.add(
        new Konva.Rect({
            name: "trashZone",
            x: TRASH.X,
            y: TRASH.Y,
            width: TRASH.WIDTH,
            height: TRASH.HEIGHT,
            fill: TRASH_FILL,
            stroke: TRASH_TEXT,
            strokeWidth: 1.5,
            cornerRadius: CREATOR_PANEL.BORDER_RADIUS,
            listening: false,
        }),
        new Konva.Text({
            x: TRASH.X,
            y: TRASH.Y,
            width: TRASH.WIDTH,
            height: TRASH.HEIGHT,
            text: "Trash",
            fontSize: CREATOR_PANEL.ITEM_FONT_SIZE,
            fill: TRASH_TEXT,
            align: "center",
            verticalAlign: "middle",
            listening: false,
        }),
        new Konva.Path({
            x: TRASH.X + 16,
            y: TRASH.Y + (TRASH.HEIGHT - iconSize) / 2,
            data: TRASH_ICON,
            fill: TRASH_TEXT,
            listening: false,
        }),
    );
}

// Highlight the trash zone while a piece is dragged over it. Call once the
// panel layer has been added to a stage; drag events bubble up to the stage.
export function bindTrashHighlight(panel: Konva.Layer): void {
    const stage = panel.getStage();
    const zone = panel.findOne<Konva.Rect>(".trashZone");
    if (!stage || !zone) return;

    const setActive = (active: boolean): void => {
        zone.fill(active ? TRASH_FILL_ACTIVE : TRASH_FILL);
        panel.batchDraw();
    };
    stage.on("dragmove.trash", () => {
        const pointer = stage.getPointerPosition();
        setActive(pointer !== null && isPointerOverTrash(pointer));
    });
    stage.on("dragend.trash", () => setActive(false));
    // A piece dropped on the trash destroys itself, so its dragend never reaches
    // the stage; resetting on the release itself covers that case.
    if (typeof window !== "undefined") {
        window.addEventListener("mouseup", () => setActive(false));
        window.addEventListener("touchend", () => setActive(false));
        window.addEventListener("touchcancel", () => setActive(false));
    }
}
