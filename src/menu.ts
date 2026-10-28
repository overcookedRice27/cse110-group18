import Konva from "konva";
import { createButton } from "./button";

const stage = new Konva.Stage({
    container: "menu-screen",
    width: 1000,
    height: 400,
});

const menu_screen = new Konva.Layer();
stage.add(menu_screen);

// Reuse existing buttons
const playButton = createButton("Play");
const levelsButton = createButton("Level Select");
const howToButton = createButton("How To Play");

// Position buttons
playButton.position({ x: 400, y: 40 });
levelsButton.position({ x: 400, y: 140 });
howToButton.position({ x: 400, y: 240 });

// Temporary test functionality
playButton.on("click", () => {alert("play alert");});   //dummy testing

levelsButton.on("click", () => {alert("level select alert");});

howToButton.on("click", () => {alert("how to play alert");});

menu_screen.add(playButton, levelsButton, howToButton);