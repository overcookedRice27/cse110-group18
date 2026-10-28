import { renderLevelGrid } from "./levels";

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

function showMainMenu(): void {
    levelScreen.hidden = true;
    mainMenuScreen.hidden = false;
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
