import Konva from "konva";
import { LEVEL_CREATOR_MODE, STAGE } from "./constants";
import { createButton } from "./button";
import { drawGridLayer as createGridLayer } from "./grid";
import { exportLevel } from "./levels/exportLevel";
import { importLevel } from "./levels/importLevel";
import { createCreatorPanel } from "./levels/creatorPanel";
import { clearGrid } from "./utils/circuitGrid";

const stage = new Konva.Stage({
    container: "game-screen",
    width: STAGE.WIDTH,
    height: STAGE.HEIGHT,
});

const grid = createGridLayer();

grid.x(180);
grid.y(50);

stage.add(grid);

if (LEVEL_CREATOR_MODE) {
    stage.add(createCreatorPanel(grid));
    const controls = new Konva.Layer();
    const exportButton = createButton("Export Level");
    const importButton = createButton("Import Level");
    const clearButton = createButton("Clear Board");
    const levelFile = document.createElement("input");
    let levelId = 1;

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
    clearButton.on("click", () => clearGrid());
    levelFile.addEventListener("change", async () => {
        const file = levelFile.files?.[0];
        if (!file) return;

        try {
            const level = await importLevel(grid, file);
            levelId = level.id;
        } catch {
            alert("Could not import the level. Check that the JSON contains a valid level layout.");
        } finally {
            levelFile.value = "";
        }
    });

    controls.add(importButton, exportButton, clearButton);
    stage.add(controls);
}
