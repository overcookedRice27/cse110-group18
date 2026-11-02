import { renderLevelGrid, resetLevels } from "./levels";
import { hasProgress, hasLocalSave, clearLocalSave } from "../konva/save";

const continueBtn = document.getElementById(
    "continue-btn",
) as HTMLButtonElement;
const newGameBtn = document.getElementById("new-game-btn") as HTMLButtonElement;
const newGameDialog = document.getElementById("new-game-dialog") as HTMLDialogElement;
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
    gameScreen.hidden = true;
    levelScreen.hidden = false;
}

// Reset session progress and open level selection after any required confirmation.
function startNewGame(): void
{
    resetLevels();
    refreshMenu();
    showLevelScreen();
}

// Ask before clearing existing saved work; start directly when no save exists.
newGameBtn.addEventListener("click", () =>
{
    try
    {
        if (hasLocalSave())
        {
            newGameDialog.returnValue = "cancel";
            newGameDialog.showModal();
            return;
        }
        startNewGame();
    }
    catch
    {
        alert("Unable to check your local save. Check your browser storage settings and try again.");
    }
});

// Clear the save only for explicit overwrite confirmation; Cancel/Escape keep it.
newGameDialog.addEventListener("close", () =>
{
    if (newGameDialog.returnValue !== "overwrite")
    {
        return;
    }
    try
    {
        clearLocalSave();
        startNewGame();
    }
    catch
    {
        alert("Unable to clear your local save. Check your browser storage settings and try again.");
    }
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
