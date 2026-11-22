import { initTruthTableGame } from "./truth-table-mini-game/truth-table-game";
import { getLevel, LEVEL_COUNT } from "../levels/registry";
import { renderLevelGrid, resetLevels, restoreProgress, getHighestCompleted } from "./levels";
import { hasProgress, hasLocalSave, loadSavedLevel, clearLocalSave } from "../konva/save";
import { signalLevelMetadata } from "../levels/level-metadata";
import { LEVEL_CREATOR_ENABLED } from "../konva/constants";

const continueBtn = document.getElementById(
    "continue-btn",
) as HTMLButtonElement;
const newGameBtn = document.getElementById("new-game-btn") as HTMLButtonElement;
const levelsBtn = document.getElementById("levels-btn") as HTMLButtonElement;
const miniGameBtn = document.getElementById(
    "mini-game-btn",
) as HTMLButtonElement;
const settingsBtn = document.getElementById("settings-btn") as HTMLButtonElement;
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
const miniGameMenu = document.getElementById("mini-game-menu") as HTMLElement;
const miniGame1Btn = document.getElementById("mini-game-1-btn") as HTMLButtonElement;
const miniGame2Btn = document.getElementById("mini-game-2-btn") as HTMLButtonElement;
const miniGameBackBtn = document.getElementById("mini-game-back-btn") as HTMLButtonElement;

levelCreatorBtn.hidden = !LEVEL_CREATOR_ENABLED;

function refreshMenu(): void {
    //new
    continueBtn.hidden = !hasProgress(); //if theres progress button hidden, no progress button present
}

function showMainMenu(): void {
    // Menu time is excluded even if the player leaves before validating.
    signalLevelMetadata({ type: "stop" });
    levelScreen.hidden = true;
    gameScreen.hidden = true;
    mainMenuScreen.hidden = false;
    miniGameMenu.hidden = true;
    refreshMenu(); // new
    //reloads screen to re-check save whenever menu shown
}

function showLevelScreen(): void {
    renderLevelGrid(levelGrid);
    mainMenuScreen.hidden = true;
    gameScreen.hidden = true;
    levelScreen.hidden = false;
    miniGameMenu.hidden = true;
}

// Result buttons request navigation through events instead of manipulating screens.
gameScreen.addEventListener("level-results-continue", () => {
    signalLevelMetadata({ type: "stop" });
    showLevelScreen(); // Re-render to display the newly unlocked level.
});
gameScreen.addEventListener("level-results-exit", showMainMenu);

function showMiniGameMenu(): void {
    mainMenuScreen.hidden = true;
    levelScreen.hidden = true;
    gameScreen.hidden = true;
    miniGameMenu.hidden = false;
}
// Reset session progress and open the first level when no save exists.
// Start over with Level 1 after any existing save has been cleared.
async function startNewGame(): Promise<void>
{
    resetLevels();
    // A confirmed fresh game starts with empty time and validation counters.
    signalLevelMetadata({ type: "reset" });
    refreshMenu();
    const game = await import("../konva/main");
    await game.showPlayerLevel(getLevel(1));
    mainMenuScreen.hidden = true;
    levelScreen.hidden = true;
    gameScreen.hidden = false;
}

// Ask before discarding saved boards or completion earned during this session.
newGameBtn.addEventListener("click", async () =>
{
    try
    {
        const existingProgress = hasLocalSave() || getHighestCompleted() > 0;
        if (existingProgress && !confirm(
            "Start a new game? This will clear your existing progress and restart at Level 1.",
        ))
        {
            return;
        }
        // Delete first so a storage failure preserves session progress and the menu.
        // This also prevents showPlayerLevel from restoring an old Level 1 board.
        if (existingProgress) clearLocalSave();
        await startNewGame();
    }
    catch
    {
        alert("Unable to start a new game. Check your browser storage settings and try again.");
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

miniGameBtn.addEventListener("click", showMiniGameMenu);

// Created on first click so the main menu and its tests never touch the game's elements.
let truthTableGame: { open: () => void } | null = null;

function openTruthTable(): void {
    if (truthTableGame === null) {
        truthTableGame = initTruthTableGame(showMiniGameMenu);
    }
    miniGameMenu.hidden = true;
    truthTableGame.open();
}

miniGame1Btn.addEventListener("click", openTruthTable);

// Scenario mini game is loaded only when its button is clicked,
// so the main wire game (and its tests) never touch it.
let scenarioGame: { open: () => void } | null = null;

miniGame2Btn.addEventListener("click", async () => {
    if (!scenarioGame) {
        const { initScenarioGame } = await import("./scenario-mini-game/scenarioUI");
        scenarioGame = initScenarioGame(showMiniGameMenu);
    }
    miniGameMenu.hidden = true;
    scenarioGame.open();
});

miniGameBackBtn.addEventListener("click", showMainMenu);

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

// Restore unlocks before any level selection, even when Continue is not clicked.
const savedProgress = loadSavedLevel();
if (savedProgress) restoreProgress(savedProgress.highestCompleted);
refreshMenu(); //for first page load
