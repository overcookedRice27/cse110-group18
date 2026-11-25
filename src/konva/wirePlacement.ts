import Konva from "konva";
import { GRID } from "./constants";
import { placeElement } from "./utils/circuitGrid";
import { getRelativeGridCoordinate } from "./utils/grid";
import { createWire, updateWireAndNeighbors, updateWireElectricity } from "./wire";
import { playSound } from "../html/options";

// Keep click-to-place separate from the existing palette drag behavior.
export function setupWirePlacement(stage: Konva.Stage, grid: Konva.Layer, button: HTMLButtonElement): () => void {
    let selected = false;

    function clearSelection(): void {
        selected = false;
        button.textContent = "Place wires: Off";
        button.setAttribute("aria-pressed", "false");
        button.classList.remove("active");
    }

    button.addEventListener("click", () => {
        if (selected) {
            clearSelection();
            return;
        }
        selected = true;
        button.textContent = "Place wires: On";
        button.setAttribute("aria-pressed", "true");
        button.classList.add("active");
    });

    stage.on("click", (event) => {
        if (!selected) return;

        // Let existing pieces and controls handle their own clicks.
        const clickedEmptySpace = event.target === stage;
        const clickedGridLine = event.target.getClassName() === "Line" && event.target.getParent() === grid;
        if (!clickedEmptySpace && !clickedGridLine) return;

        const position = getRelativeGridCoordinate(grid, { width: GRID.WIDTH, height: GRID.HEIGHT }, GRID.CELL_SIZE);
        if (!position) return;

        const wire = createWire();
        if (!placeElement(wire, position.x, position.y, 1, 1)) {
            wire.destroy();
            return;
        }
        grid.add(wire);
        updateWireAndNeighbors(position.x, position.y);
        updateWireElectricity();
        playSound("placeWire");
    });

    return clearSelection;
}
