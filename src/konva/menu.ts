import Konva from "konva";
import { createButton } from "./button";

const stage = new Konva.Stage({
    container: "menu-screen",
    width: 1000,
    height: 600,
});

const menu_screen = new Konva.Layer();
stage.add(menu_screen);

//reuse existing buttons
const newGameButton = createButton("New Game");
const continueButton = createButton("Continue");
const minigamesButton = createButton("Minigames");
const settingsButton = createButton("Settings");

//position buttons
newGameButton.position({ x: 400, y: 100 });
continueButton.position({ x: 400, y: 200});
minigamesButton.position({ x: 400, y: 300 });
settingsButton.position({ x: 400, y: 400 });

menu_screen.add(newGameButton, continueButton, minigamesButton, settingsButton);