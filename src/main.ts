import Konva from "konva";
import { STAGE, COLORS, GRID } from "./constants";
import { createGate } from "./gate";
import { createButton } from "./button";
import { drawGridLayer as createGridLayer } from "./grid";
import { createWire, setWirePower } from "./wire";

const stage = new Konva.Stage({
    container: "game-screen",
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

const wireButton = createButton("Add Wire");

wireButton.x(200);
wireButton.y(500);

const electricityButton = createButton("Toggle Electrcity");

electricityButton.x(500);
electricityButton.y(500);

layer.add(wireButton, electricityButton);

layer.add(gate);

const grid = createGridLayer();

grid.x(180);
grid.y(50);

wireButton.on("click", () => {
    const wire = createWire();
    grid.add(wire);
});

const powerWire = createWire();
grid.add(powerWire);

let electricty = true;

electricityButton.on("click", () => {
    setWirePower(powerWire, electricty);
    electricty = !electricty;
});

stage.add(grid);

stage.add(layer);
