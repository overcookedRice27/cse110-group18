import Konva from "konva";
import { LEVEL_CREATOR_MODE, setCreatorMode, STAGE } from "./constants";
import { createButton } from "./button";
import { drawGridLayer as createGridLayer } from "./grid";
import { exportLevel, getLevelData } from "./levels/exportLevel";
import { importLevel } from "./levels/importLevel";
import { createCreatorPanel } from "./levels/creatorPanel";
import { loadLevel } from "./levels/loadLevel";
import type { LevelData } from "./levels/levelData";
import { circuitGrid, clearGrid } from "./utils/circuitGrid";
import { completeLevel, getHighestCompleted } from "../html/levels";
import { loadSavedLevel, saveLevel } from "./save";
import { checkCircuit } from "./wire";

const stage = new Konva.Stage({
    container: "game-screen",
    width: STAGE.WIDTH,
    height: STAGE.HEIGHT,
});

const grid = createGridLayer();

grid.x(180);
grid.y(50);

stage.add(grid);

let activeLevelId: number | null = null;
const saveButton = document.getElementById("level-save-btn") as HTMLButtonElement;
const saveStatus = document.getElementById("level-save-status") as HTMLElement;

// Save the active player's board; creator layouts continue to use Export Level.
saveButton.addEventListener("click", () =>
{
    if (activeLevelId === null || LEVEL_CREATOR_MODE)
    {
        return;
    }
    try
    {
        saveLevel(getLevelData(activeLevelId), getHighestCompleted());
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

validateButton.addEventListener("click", () => {
    const exits = grid.find(
        (node: Konva.Node) => node.getAttr("elementType") === "exit"
    );

    const powered = exits.length > 0 &&
        exits.every((exit) => exit.getAttr("powered") === true);

    const result = checkCircuit(powered);

    circuitStatus.textContent = result.message;
    circuitStatus.style.color = result.passed ? "green" : "red";

    if (result.passed) {
        stage.fire("levelExitPowered");
    }
});

// Complete only an active selected level, never a creator preview.
stage.on("levelExitPowered", () =>
{
    if (!LEVEL_CREATOR_MODE && activeLevelId !== null)
    {
        completeLevel(activeLevelId);
    }
});

let openPlayer: (level: LevelData) => void;
let openCreator: () => void;

// Load a selected layout into the shared stage in player mode.
export async function showPlayerLevel(level: LevelData): Promise<void>
{
    activeLevelId = null;
    openPlayer(level);
    const saved = loadSavedLevel();
    if (saved?.level.id === level.id)
    {
        await importLevel(grid, new File([JSON.stringify(saved.level)], "saved-level.json"));
    }
    saveButton.hidden = false;
    saveStatus.textContent = "";
}

// Return the shared stage to its existing creator view and board.
export function showLevelCreator(): void
{
    activeLevelId = null;
    saveButton.hidden = true;
    saveStatus.textContent = "";
    openCreator();
}

if (LEVEL_CREATOR_MODE) {
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
        const answer = prompt("Enter the level ID:", String(levelId));
        if (answer === null) return;
        const id = Number(answer);
        if (!Number.isSafeInteger(id) || id < 1) {
            alert("Enter a positive whole number for the level ID.");
            return;
        }
        levelId = id;
        exportLevel(id);
    });

    importButton.on("click", () => levelFile.click());
    clearButton.on("click", () => {
        if (confirm("Clear all pieces from the board?")) clearGrid();
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
            levelId = level.id;
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
        if (LEVEL_CREATOR_MODE) {
            creatorLevel = getLevelData(levelId);
        }
        setCreatorMode(!LEVEL_CREATOR_MODE);
        if (LEVEL_CREATOR_MODE && creatorLevel) {
            clearGrid();
            loadLevel(grid, creatorLevel);
            creatorLevel = null;
        }
        controls.visible(LEVEL_CREATOR_MODE);
        creatorPanel.visible(LEVEL_CREATOR_MODE);
        playerPanel.visible(!LEVEL_CREATOR_MODE);

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
                LEVEL_CREATOR_MODE ||
                ((type === "wire" || type === "gate") && !fixed);
            piece.draggable(draggable);
            piece.findOne(".fixedLabel")?.visible(LEVEL_CREATOR_MODE && fixed);
        }

        if (LEVEL_CREATOR_MODE) {
            viewButton.textContent = "Player View";
        } else {
            viewButton.textContent = "Creator View";
        }
    });

    // Preserve the creator board through the existing view toggle before playing.
    openPlayer = (level) =>
    {
        if (LEVEL_CREATOR_MODE)
        {
            viewButton.click();
        }
        clearGrid();
        // Set the level before loading because its EXIT may already be powered.
        activeLevelId = level.id;
        loadLevel(grid, level);
        viewButton.hidden = true;
    };

    // Restore creator controls when entering from the main menu.
    openCreator = () =>
    {
        if (!LEVEL_CREATOR_MODE)
        {
            viewButton.click();
        }
        viewButton.hidden = false;
    };
}
