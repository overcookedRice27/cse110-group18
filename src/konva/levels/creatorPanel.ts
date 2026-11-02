import Konva from "konva";
import { COLORS, CREATOR_PANEL, GRID } from "../constants";
import { createGate, gateCells } from "../gate";
import { createBlock, createExit, createInput, createWire } from "../wire";
import type { GateType } from "./levelData";

export function createCreatorPanel(
    grid: Konva.Layer,
    creatorMode: boolean,
): Konva.Layer {
    const panel = new Konva.Layer();
    let names: readonly (GateType | "Wire" | "Input" | "Exit" | "Block")[] =
        CREATOR_PANEL.PLAYER_ITEMS;
    let panelHeight = CREATOR_PANEL.PLAYER_HEIGHT;
    if (creatorMode) {
        names = CREATOR_PANEL.CREATOR_ITEMS;
        panelHeight = CREATOR_PANEL.HEIGHT;
    }
    const itemWidth = CREATOR_PANEL.WIDTH - CREATOR_PANEL.PADDING * 2;

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

        item.add(background, label);
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

    return panel;
}
