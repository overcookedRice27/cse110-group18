import { renderLevelGrid } from "./levels";
import { hasProgress } from "../konva/save";
import { initScenarioGame } from "./scenario-mini-game/scenario-game";

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
const backToMenuBtn = document.getElementById(
    "back-to-menu-btn",
) as HTMLButtonElement;

const mainMenuScreen = document.getElementById("main-menu") as HTMLElement;
const levelScreen = document.getElementById("level-screen") as HTMLElement;
const levelGrid = document.getElementById("level-grid") as HTMLElement;
const gameScreen = document.getElementById("game-screen") as HTMLDivElement;
const scenarioGame = initScenarioGame(() => showMainMenu());

// Dev shortcut: open http://localhost:5173/?scenario to jump straight to the mini-game
if (new URLSearchParams(location.search).has("scenario")) {
    mainMenuScreen.hidden = true;
    scenarioGame.open();
}

function refreshMenu(): void { //new
    continueBtn.hidden = !hasProgress(); //if theres progress button hidden, no progress button present
}

function showMainMenu(): void {
    levelScreen.hidden = true;
    miniGameBtn.addEventListener("click", () => {
    mainMenuScreen.hidden = true;
    scenarioGame.open();
});    refreshMenu(); // new
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

miniGameBtn.addEventListener("click", () => {
    alert("Opening mini games menu...");
});

settingsBtn.addEventListener("click", () => {
    alert("Opening settings panel...");
});

refreshMenu(); //for first page load