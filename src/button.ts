import Konva from "konva";
import { COLORS, BUTTON } from "./constants";

const buttonDimensions = {
    width: BUTTON.WIDTH,
    height: BUTTON.HEIGHT,
};

export function createButton(
    name: string,
    dimension = buttonDimensions,
): Konva.Group {
    const buttonGroup = new Konva.Group();

    const background = new Konva.Rect({
        size: dimension,
        cornerRadius: 12,
        fill: COLORS.BUTTON.BACKGROUND,
        stroke: COLORS.BUTTON.BORDER,
        strokeWidth: 2,
    });

    const label = new Konva.Text({
        text: name,
        size: dimension,
        fontSize: 30,
        fill: COLORS.BUTTON.TEXT,
        align: "center",
        verticalAlign: "middle",
    });

    buttonGroup.add(background);
    buttonGroup.add(label);

    buttonGroup.on("mouseover", function () {
        document.body.style.cursor = "pointer";
    });

    buttonGroup.on("mouseout", function () {
        document.body.style.cursor = "default";
    });

    return buttonGroup;
}
