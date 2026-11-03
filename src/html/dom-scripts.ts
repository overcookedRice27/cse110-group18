import { renderLevelGrid, resetLevels, restoreProgress } from "./levels";
import { hasProgress, hasLocalSave, loadSavedLevel } from "../konva/save";
import dummy1 from "../levels/dummy1.json";
import dummy2 from "../levels/dummy2.json";
import dummy3 from "../levels/dummy3.json";
import type { LevelData } from "../konva/levels/levelData";
import { LEVEL_CREATOR_ENABLED } from "../konva/constants";

//DUMMYTEST, change later for actual implementation
const dummyLevels: Record<string, LevelData> = {
    "level-1-btn": { ...dummy1, id: 1 } as LevelData,
    "level-2-btn": { ...dummy2, id: 2 } as LevelData,
    "level-3-btn": { ...dummy3, id: 3 } as LevelData,
};

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
    await game.showPlayerLevel(dummyLevels["level-1-btn"]);
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

// Open levels 1–3 using their corresponding dummy layouts in /levels.
levelGrid.addEventListener("click", async (event) =>
{
    const target = event.target;
    if (!(target instanceof HTMLButtonElement) || !dummyLevels[target.id] || target.disabled)
    {
        return;
    }
    try
    {
        const game = await import("../konva/main");
        await game.showPlayerLevel(dummyLevels[target.id]);
        mainMenuScreen.hidden = true;
        levelScreen.hidden = true;
        gameScreen.hidden = false;
    }
    catch
    {
        alert(`Unable to load Level ${dummyLevels[target.id].id}. Please try again.`);
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
