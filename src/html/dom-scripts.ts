import { renderLevelGrid } from "./levels";
import { hasProgress } from "../konva/save";

const continueBtn = document.getElementById(
    "continue-btn",
) as HTMLButtonElement;
const newGameBtn = document.getElementById("new-game-btn") as HTMLButtonElement;
const miniGameBtn = document.getElementById(
    "mini-game-btn",
) as HTMLButtonElement;
const settingsBtn = document.getElementById(
    "settings-btn",
) as HTMLButtonElement;
const levelCreatorBtn = document.getElementById(
    "level-creator-btn",
) as HTMLButtonElement;
const backToMenuBtn = document.getElementById(
    "back-to-menu-btn",
) as HTMLButtonElement;
const gameBackBtn = document.getElementById("game-back-btn") as HTMLButtonElement;

const mainMenuScreen = document.getElementById("main-menu") as HTMLElement;
const levelScreen = document.getElementById("level-screen") as HTMLElement;
const levelGrid = document.getElementById("level-grid") as HTMLElement;
const gameScreen = document.getElementById("game-view") as HTMLElement;

function refreshMenu(): void {
    //new
    continueBtn.hidden = !hasProgress(); //if theres progress button hidden, no progress button present
}

function showMainMenu(): void {
    levelScreen.hidden = true;
    gameScreen.hidden = true;
    mainMenuScreen.hidden = false;
    refreshMenu(); // new
    //reloads screen to re-check save whenever menu shown
}

function showLevelScreen(): void {
    renderLevelGrid(levelGrid);
    mainMenuScreen.hidden = true;
    levelScreen.hidden = false;
}

newGameBtn.addEventListener("click", () => {
    alert("Starting a new game...");
});

continueBtn.addEventListener("click", () => {
    showLevelScreen();
});

backToMenuBtn.addEventListener("click", () => {
    showMainMenu();
});

gameBackBtn.addEventListener("click", () => {
    showMainMenu();
});

miniGameBtn.addEventListener("click", () => {
    alert("Opening mini games menu...");
});

settingsBtn.addEventListener("click", () => {
    alert("Opening settings panel...");
});

levelCreatorBtn.addEventListener("click", async () => {
    mainMenuScreen.hidden = true;
    levelScreen.hidden = true;
    gameScreen.hidden = false;
    await import("../konva/main");
});

refreshMenu(); //for first page load
