import Konva from "konva";
import { STAGE, COLORS, GRID } from "./constants";
import { createGate } from "./gate";
import { createButton } from "./button";
import { drawGridLayer as createGridLayer } from "./grid";

const stage = new Konva.Stage({
    container: "app",
    width: STAGE.WIDTH,
    height: STAGE.HEIGHT,
});

const layer = new Konva.Layer();

const background = new Konva.Rect({
    width: STAGE.WIDTH,
    height: STAGE.HEIGHT,
    fill: COLORS.UI.BACKGROUND,
    listening: false,
});

const gate = createGate("AND");

gate.x(10);
gate.y(200);

const button = createButton("Button");

button.x(500);
button.y(500);

layer.add(button);
layer.add(gate);

const grid = createGridLayer();

grid.x(180);
grid.y(50);

stage.add(grid);

stage.add(layer);

