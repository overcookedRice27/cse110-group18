import { renderLevelGrid, resetLevels, restoreProgress } from "./levels";
import { hasProgress, hasLocalSave, loadSavedLevel } from "../konva/save";
import { getLevel, LEVEL_COUNT } from "../levels/registry";
import { LEVEL_CREATOR_ENABLED } from "../konva/constants";

const continueBtn = document.getElementById(
    "continue-btn",
) as HTMLButtonElement;
const newGameBtn = document.getElementById("new-game-btn") as HTMLButtonElement;
const levelsBtn = document.getElementById("levels-btn") as HTMLButtonElement;
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

levelCreatorBtn.hidden = !LEVEL_CREATOR_ENABLED;

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

// Reset session progress and open the first level when no save exists.
async function startNewGame(): Promise<void>
{
    resetLevels();
    refreshMenu();
    const game = await import("../konva/main");
    await game.showPlayerLevel(getLevel(1));
    mainMenuScreen.hidden = true;
    levelScreen.hidden = true;
    gameScreen.hidden = false;
}

// Resume an existing save automatically, or start Level 1 for a fresh game.
newGameBtn.addEventListener("click", async () =>
{
    try
    {
        if (hasLocalSave())
        {
            const saved = loadSavedLevel();
            if (!saved)
            {
                alert("Unable to load your local save. The save is invalid or incompatible.");
                return;
            }
            const game = await import("../konva/main");
            restoreProgress(saved.highestCompleted);
            await game.showPlayerLevel(saved.level);
            mainMenuScreen.hidden = true;
            levelScreen.hidden = true;
            gameScreen.hidden = false;
            return;
        }
        await startNewGame();
    }
    catch
    {
        alert("Unable to load your local save. Check your browser storage settings and try again.");
    }
});

continueBtn.addEventListener("click", async () => {
    const saved = loadSavedLevel();
    if (!saved) return;

    try
    {
        restoreProgress(saved.highestCompleted);
        const game = await import("../konva/main");
        await game.showPlayerLevel(saved.level);
        mainMenuScreen.hidden = true;
        levelScreen.hidden = true;
        gameScreen.hidden = false;
    }
    catch
    {
        alert("Unable to load your saved level. Please try again.");
    }
});

levelsBtn.addEventListener("click", () => {
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

// Resolve every level button through the shared registry of playable layouts.
levelGrid.addEventListener("click", async (event) =>
{
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || target.disabled)
    {
        return;
    }
    // Accept only registered level buttons, including levels with two-digit IDs.
    const match = /^level-(\d+)-btn$/.exec(target.id);
    const levelId = match ? Number(match[1]) : 0;
    if (levelId < 1 || levelId > LEVEL_COUNT) return;
    try
    {
        const game = await import("../konva/main");
        await game.showPlayerLevel(getLevel(levelId));
        mainMenuScreen.hidden = true;
        levelScreen.hidden = true;
        gameScreen.hidden = false;
    }
    catch
    {
        alert(`Unable to load Level ${levelId}. Please try again.`);
    }
});

levelCreatorBtn.addEventListener("click", async () => {
    mainMenuScreen.hidden = true;
    levelScreen.hidden = true;
    gameScreen.hidden = false;
    const game = await import("../konva/main");
    game.showLevelCreator();
});

refreshMenu(); //for first page load
