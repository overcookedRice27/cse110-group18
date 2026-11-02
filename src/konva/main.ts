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
import { completeLevel } from "../html/levels";

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
export function showPlayerLevel(level: LevelData): void
{
    activeLevelId = null;
    openPlayer(level);
}

// Return the shared stage to its existing creator view and board.
export function showLevelCreator(): void
{
    activeLevelId = null;
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
