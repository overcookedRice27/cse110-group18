import Konva from "konva";
import { isCreatorView, setCreatorView, STAGE } from "./constants";
import { createButton } from "./button";
import { createLevelResults, LEVEL_RESULTS_EVENTS, type LevelResultSummary } from "./level-results";
import { drawGridLayer as createGridLayer } from "./grid";
import { exportLevel, getLevelData } from "./levels/exportLevel";
import { importLevel } from "./levels/importLevel";
import { createCreatorPanel } from "./levels/creatorPanel";
import { loadLevel } from "./levels/loadLevel";
import type { GateRequirements, LevelData } from "./levels/levelData";
import { missingRequiredGates } from "./levels/checkRequiredGates";
import { readRequirements, showRequirements } from "./levels/requirementsMenu";
import { circuitGrid, clearGrid } from "./utils/circuitGrid";
import { completeLevel, getHighestCompleted } from "../html/levels";
import { loadSavedLevel, saveLevel } from "./save";
import { checkCircuit } from "./wire";
import { useSpecialAbility, getCharge, increaseCharge, setCharge } from "./specialAbility";
import { getCircuitHint } from "./circuitHints";
import { getLevel, LEVEL_COUNT } from "../levels/registry";
import { archiveMetadata, signalLevelMetadata, getLevelMetadata } from "../levels/level-metadata";
import { createFinale, FINALE_CLEARED } from "../levels/summary";

const stage = new Konva.Stage({
    container: "game-screen",
    width: STAGE.WIDTH,
    height: STAGE.HEIGHT,
});

const grid = createGridLayer();

grid.x(180);
grid.y(50);

stage.add(grid);
const levelResults = createLevelResults();
stage.add(levelResults);
const finale = createFinale();
stage.add(finale);

// Relay Konva button events to the HTML menu, which owns screen transitions.
stage.on(LEVEL_RESULTS_EVENTS.CONTINUE, () => {
    document.getElementById("game-view")?.dispatchEvent(new Event("level-results-continue"));
});
stage.on(LEVEL_RESULTS_EVENTS.EXIT, () => {
    document.getElementById("game-view")?.dispatchEvent(new Event("level-results-exit"));
});

let activeLevelId: number | null = null;
let activeRequiredGates: GateRequirements | undefined;
let creatorRequiredGates: GateRequirements | undefined;
const saveButton = document.getElementById("level-save-btn") as HTMLButtonElement;
const resetButton = document.getElementById("reset-level-btn") as HTMLButtonElement;
const saveStatus = document.getElementById("level-save-status") as HTMLElement;
const requirementsMenu = document.getElementById("gate-requirements-menu") as HTMLDetailsElement;
const requirementsError = document.getElementById("gate-requirements-error") as HTMLElement;
const playerRequirements = document.getElementById("player-gate-requirements") as HTMLElement;
const playerRequirementsList = document.getElementById("player-gate-requirements-list") as HTMLElement;

function showPlayerRequirements(requirements?: GateRequirements): void {
    const items = (["AND", "OR", "NOT", "XOR"] as const)
        .filter((type) => (requirements?.[type] ?? 0) > 0)
        .map((type) => `${type}: ${requirements![type]}`);
    playerRequirementsList.textContent = items.length > 0
        ? items.join(", ")
        : "No gates required.";
    playerRequirements.hidden = false;
}

function readCreatorRequirements(): boolean {
    const requirements = readRequirements();
    if (!requirements) {
        requirementsError.textContent = "Enter a non-negative whole number for each gate.";
        requirementsMenu.open = true;
        return false;
    }
    requirementsError.textContent = "";
    creatorRequiredGates = requirements;
    return true;
}

// Save the active player's board; creator layouts continue to use Export Level.
saveButton.addEventListener("click", () =>
{
    if (activeLevelId === null || isCreatorView)
    {
        return;
    }
    try
    {
        saveLevel(getLevelData(activeLevelId, activeRequiredGates), getHighestCompleted(), getCharge());
        saveStatus.textContent = "Level saved.";
    }
    catch
    {
        saveStatus.textContent = "Unable to save. Check browser storage and try again.";
    }
});


//Create a validate button and circuit status button with listener
const validateButton = document.getElementById(
    "validate-circuit-btn"
) as HTMLButtonElement;

const circuitStatus = document.getElementById(
    "circuit-status"
) as HTMLElement;

function clearCircuitStatus(): void {
    circuitStatus.textContent = "";
    circuitStatus.style.color = "";
}

document.getElementById("game-back-btn")!.addEventListener("click", clearCircuitStatus);

resetButton.addEventListener("click", () => {
    if (activeLevelId === null || isCreatorView) return;
    if (!confirm("Reset this level's layout? Your current board will be cleared.")) return;

    const originalLevel = getLevel(activeLevelId);
    clearGrid();
    loadLevel(grid, originalLevel);
    clearCircuitStatus();
    saveStatus.textContent = "Layout reset. Select Save to keep it.";
});

validateButton.addEventListener("click", () => {
    // A visible result already represents this validation; avoid duplicate attempts.
    if (levelResults.visible() || finale.visible()) return;
    if (activeLevelId === null && isCreatorView && !readCreatorRequirements()) return;
    const exits = grid.find(
        (node: Konva.Node) => node.getAttr("elementType") === "exit"
    );

    const powered = exits.length > 0 &&
        exits.every((exit) => exit.getAttr("powered") === true);

    const result = checkCircuit(powered);

    const requiredGates = activeLevelId === null ? creatorRequiredGates : activeRequiredGates;
    const missing = missingRequiredGates(requiredGates ?? {});
    const passed = result.passed && missing.length === 0;
    let elapsedMessage = "";
    if (!isCreatorView && activeLevelId !== null) {
        signalLevelMetadata({ type: "validated", levelId: activeLevelId, passed });
        if (!passed) {
            const seconds = getLevelMetadata(activeLevelId).timeSpentMs / 1000;
            elapsedMessage = ` Time spent: ${seconds.toFixed(1)} s.`;
        }
    }

    if (missing.length > 0) {
        const powerMessage = result.passed ? "" : `${result.message} `;
        circuitStatus.textContent =
            `${powerMessage}Connect required gate(s) to an exit: ${missing.join(", ")}.${elapsedMessage}`;
        circuitStatus.style.color = "red";
        return;
    }

    const inputs = grid.find((n: Konva.Node) => n.getAttr("elementType") === "input");
    const hint = result.passed ? "" : getCircuitHint({
        exitCount: exits.length,
        inputsOnCount: inputs.filter((i) => i.getAttr("powerSource") === true).length,
    });
    circuitStatus.textContent = (hint ? `${result.message} Hint: ${hint}` : result.message) + elapsedMessage;
    circuitStatus.style.color = result.passed ? "green" : "red";

    if (result.passed) {
        stage.fire("levelExitPowered");
    }
});


const specialButton = document.getElementById(
    "special-ability-btn"
) as HTMLButtonElement | null;

const specialStatus = document.getElementById("special-ability-status");
const chargeText = document.getElementById("special-ability-charge");
const chargeMeter = document.getElementById("special-ability-meter");

function updateChargeDisplay(): void {
    const charge = getCharge();

    if (chargeText) {
        chargeText.textContent = `Charge: ${charge}%`;
    }

    if (chargeMeter) {
        chargeMeter.style.width = `${charge}%`;
    }

    if (specialButton) {
        specialButton.disabled = charge < 100;
    }
}

if (specialButton && specialStatus) {
    specialButton.addEventListener("click", () => {
        if (isCreatorView || activeLevelId === null) {
            return;
        }

        const removed = useSpecialAbility();

        if (removed > 0) {
            specialStatus.textContent = `${removed} walls destroyed!`;

            try {
                saveLevel(
                    getLevelData(activeLevelId, activeRequiredGates),
                    getHighestCompleted(),
                    getCharge()
                );
            } catch {
                specialStatus.textContent += " Unable to save progress.";
            }
        } else {
            specialStatus.textContent = "No walls available to destroy!";
        }

        updateChargeDisplay();
    });
}

updateChargeDisplay();


// Complete only an active selected level, never a creator preview.
stage.on("levelExitPowered", () =>
{
    if (!isCreatorView && activeLevelId !== null)
    {
        const previousProgress = getHighestCompleted();

        completeLevel(activeLevelId);

        if (getHighestCompleted() > previousProgress) {
            increaseCharge();
            updateChargeDisplay();
        }
        // Persist completion and the validation snapshot in the same save.
        let newPersonalBest = false;
        try
        {
            newPersonalBest = archiveMetadata(
                getLevelData(activeLevelId, activeRequiredGates), getHighestCompleted(), getCharge(),
            );
            saveStatus.textContent = "Progress saved.";
        }
        catch
        {
            saveStatus.textContent = "Level completed, but progress could not be saved. Try Save again.";
        }
        if (activeLevelId === LEVEL_COUNT) {
            finale.fire(FINALE_CLEARED);
            return;
        }
        const metadata = getLevelMetadata(activeLevelId);
        const summary: LevelResultSummary = {
            clearTimeMs: metadata.clearTimeMs,
            incorrectValidations: metadata.incorrectValidations,
            newPersonalBest,
        };
        levelResults.fire(LEVEL_RESULTS_EVENTS.CLEARED, { summary });
    }
});

let openPlayer: (level: LevelData) => void;
let openCreator: () => void;

// Load a selected layout into the shared stage in player mode.
export async function showPlayerLevel(level: LevelData): Promise<void>
{
    clearCircuitStatus();
    // End the previous visit before loading; failed loads must not start a new timer.
    signalLevelMetadata({ type: "stop" });
    levelResults.hide();
    finale.hide();
    activeLevelId = null;
    const saved = loadSavedLevel();
    // Completion can come from a saved session or from a clear whose save failed.
    const wasCleared = level.id <= Math.max(getHighestCompleted(), saved?.highestCompleted ?? 0);
    openPlayer(wasCleared ? getLevel(level.id) : level);
    showPlayerRequirements(activeRequiredGates);
    setCharge(saved?.specialAbilityCharge ?? 0);
    updateChargeDisplay();

    if (specialStatus) {
        specialStatus.textContent = "";
    }
    if (!wasCleared && saved?.level.id === level.id)
    {
        await importLevel(grid, new File([JSON.stringify(saved.level)], "saved-level.json"));
    }
    // All menu entry points share this loader: level selection, Continue, and New Game.
    signalLevelMetadata({ type: "start", levelId: level.id });
    saveButton.hidden = false;
    resetButton.hidden = false;
    saveStatus.textContent = "";
}

// Return the shared stage to its existing creator view and board.
export function showLevelCreator(): void
{
    clearCircuitStatus();
    // Creator previews do not contribute to player metadata.
    signalLevelMetadata({ type: "stop" });
    levelResults.hide();
    finale.hide();
    activeLevelId = null;
    activeRequiredGates = undefined;
    saveButton.hidden = true;
    resetButton.hidden = true;
    saveStatus.textContent = "";
    openCreator();
    requirementsMenu.hidden = false;
    playerRequirements.hidden = true;
}

if (isCreatorView) {
    const creatorPanel = createCreatorPanel(grid, true);
    const playerPanel = createCreatorPanel(grid, false);
    playerPanel.hide();
    stage.add(creatorPanel, playerPanel);
    const controls = new Konva.Layer();
    const exportButton = createButton("Export Level");
    const importButton = createButton("Import Level");
    const clearButton = createButton("Clear Board");
    const levelFile = document.createElement("input");
    let levelId = 1;
    let creatorLevel: LevelData | null = null;

    importButton.position({ x: 150, y: 500 });
    exportButton.position({ x: 400, y: 500 });
    clearButton.position({ x: 650, y: 500 });
    levelFile.type = "file";
    levelFile.accept = ".json,application/json";

    exportButton.on("click", () => {
        if (!readCreatorRequirements()) return;
        const answer = prompt("Enter the level ID:", String(levelId));
        if (answer === null) return;
        const id = Number(answer);
        if (!Number.isSafeInteger(id) || id < 1) {
            alert("Enter a positive whole number for the level ID.");
            return;
        }
        levelId = id;
        exportLevel(id, creatorRequiredGates);
    });

    importButton.on("click", () => levelFile.click());
    clearButton.on("click", () => {
        if (confirm("Clear all pieces from the board?")) {
            clearGrid();
            clearCircuitStatus();
        }
    });
    levelFile.addEventListener("change", async () => {
        const file = levelFile.files?.[0];
        if (!file) return;

        try {
            if (
                !confirm(
                    "Importing a level will replace the current board. Continue?",
                )
            )
                return;
            const level = await importLevel(grid, file);
            clearCircuitStatus();
            levelId = level.id;
            creatorRequiredGates = level.requiredGates;
            showRequirements(creatorRequiredGates);
            requirementsError.textContent = "";
        } catch {
            alert(
                "Could not import the level. Check that the JSON contains a valid level layout.",
            );
        } finally {
            levelFile.value = "";
        }
    });

    controls.add(importButton, exportButton, clearButton);
    stage.add(controls);

    const viewButton = document.getElementById(
        "view-toggle-btn",
    ) as HTMLButtonElement;
    viewButton.hidden = false;
    viewButton.addEventListener("click", () => {
        if (isCreatorView) {
            if (!readCreatorRequirements()) return;
            creatorLevel = getLevelData(levelId, creatorRequiredGates);
        }
        clearCircuitStatus();
        setCreatorView(!isCreatorView);
        if (isCreatorView && creatorLevel) {
            clearGrid();
            loadLevel(grid, creatorLevel);
            creatorLevel = null;
        }
        controls.visible(isCreatorView);
        creatorPanel.visible(isCreatorView);
        playerPanel.visible(!isCreatorView);
        requirementsMenu.hidden = !isCreatorView;
        if (isCreatorView) {
            playerRequirements.hidden = true;
        } else {
            showPlayerRequirements(creatorRequiredGates);
        }

        // Gates occupy several cells, so update each piece only once.
        const pieces = new Set<Konva.Group>();
        for (const row of circuitGrid) {
            for (const piece of row) {
                if (piece) pieces.add(piece);
            }
        }
        for (const piece of pieces) {
            const type = piece.getAttr("elementType");
            const fixed = piece.getAttr("fixed") === true;
            const draggable =
                isCreatorView ||
                ((type === "wire" || type === "gate") && !fixed);
            piece.draggable(draggable);
            piece.findOne(".fixedLabel")?.visible(isCreatorView && fixed);
        }

        if (isCreatorView) {
            viewButton.textContent = "Player View";
        } else {
            viewButton.textContent = "Creator View";
        }
    });

    // Preserve the creator board through the existing view toggle before playing.
    openPlayer = (level) =>
    {
        if (isCreatorView)
        {
            // Preserve the last valid requirements if a player level is opened
            // while a creator field is incomplete.
            if (!readCreatorRequirements()) showRequirements(creatorRequiredGates);
            viewButton.click();
        }
        requirementsMenu.hidden = true;
        clearGrid();
        // Set the level before loading because its EXIT may already be powered.
        activeLevelId = level.id;
        // Use the current level definition even when an older save has no requirements.
        activeRequiredGates = getLevel(level.id).requiredGates ?? level.requiredGates;
        loadLevel(grid, level);
        viewButton.hidden = true;
    };

    // Restore creator controls when entering from the main menu.
    openCreator = () =>
    {
        if (!isCreatorView)
        {
            viewButton.click();
        }
        viewButton.hidden = false;
    };
}
