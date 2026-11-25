import Konva from "konva";
import { COLORS, COLOR_PRESETS, setBoardColors } from "./constants";

// Apply the next palette to existing shapes without changing the circuit itself.
export function applyBoardTheme(stage: Konva.Stage, theme: "light" | "dark"): void {
    const previous = COLORS;
    const next = COLOR_PRESETS[theme];

    stage.find("Shape").forEach((node) => {
        const shape = node as Konva.Shape;
        const fill = shape.fill();
        const stroke = shape.stroke();

        if (fill === previous.BUTTON.BACKGROUND) shape.fill(next.BUTTON.BACKGROUND);
        else if (fill === previous.BUTTON.TEXT) shape.fill(next.BUTTON.TEXT);
        else if (fill === previous.UI.BACKGROUND) shape.fill(next.UI.BACKGROUND);
        else if (fill === previous.BLOCK.BACKGROUND) shape.fill(next.BLOCK.BACKGROUND);
        else if (fill === previous.TOOLBOX.INPUT) shape.fill(next.TOOLBOX.INPUT);
        else if (fill === previous.TOOLBOX.EXIT) shape.fill(next.TOOLBOX.EXIT);
        else if (fill === previous.TOOLBOX.WIRE) shape.fill(next.TOOLBOX.WIRE);
        else if (fill === previous.TOOLBOX.BLOCK) shape.fill(next.TOOLBOX.BLOCK);
        else if (fill === previous.TOOLBOX.GATE) shape.fill(next.TOOLBOX.GATE);

        // Grid lines are identified by their parent layer; other strokes belong
        // to pieces or the toolbox and use the regular border color.
        if (stroke === previous.GRID.STROKE && shape.getParent()?.name() === "grid") {
            shape.stroke(next.GRID.STROKE);
        } else if (stroke === previous.WIRE.BACKGROUND) {
            shape.stroke(next.WIRE.BACKGROUND);
        }
    });
    setBoardColors(theme);
    stage.batchDraw();
}
