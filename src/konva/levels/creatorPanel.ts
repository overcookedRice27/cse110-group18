import Konva from "konva";
import { CREATOR_PANEL, GRID } from "../constants";
import { createGate, gateCells } from "../gate";
import { createWire } from "../wire";
import type { GateType } from "./levelData";

export function createCreatorPanel(grid: Konva.Layer): Konva.Layer {
    const panel = new Konva.Layer();
    const names: (GateType | "Wire")[] = ["Wire", "AND", "OR", "NOT", "XOR"];
    const itemWidth = CREATOR_PANEL.WIDTH - CREATOR_PANEL.PADDING * 2;

    panel.add(new Konva.Rect({
        x: CREATOR_PANEL.X,
        y: CREATOR_PANEL.Y,
        width: CREATOR_PANEL.WIDTH,
        height: CREATOR_PANEL.HEIGHT,
        stroke: "#222222",
        strokeWidth: 2,
        cornerRadius: 10,
        listening: false,
    }));

    names.forEach((name, index) => {
        const item = new Konva.Group({
            x: CREATOR_PANEL.X + CREATOR_PANEL.PADDING,
            y: CREATOR_PANEL.Y + CREATOR_PANEL.PADDING + index * 70,
        });
        const background = new Konva.Rect({
            width: itemWidth,
            height: 55,
            fill: "#d4d4d4",
            stroke: "#222222",
            cornerRadius: 8,
        });
        const label = new Konva.Text({
            text: name,
            width: itemWidth,
            height: 55,
            fontSize: 24,
            align: "center",
            verticalAlign: "middle",
        });

        item.add(background, label);
        item.on("mouseover", () => { document.body.style.cursor = "grab"; });
        item.on("mouseout", () => { document.body.style.cursor = "default"; });
        item.on("mousedown", (event) => {
            const pointer = grid.getStage()?.getPointerPosition();
            if (!pointer) return;

            let element: Konva.Group;
            let width = GRID.CELL_SIZE;
            let height = GRID.CELL_SIZE;
            if (name === "Wire") {
                element = createWire();
            } else {
                element = createGate(name);
                width *= gateCells.width;
                height *= gateCells.height;
            }

            grid.add(element);
            element.absolutePosition({ x: pointer.x - width / 2, y: pointer.y - height / 2 });
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
