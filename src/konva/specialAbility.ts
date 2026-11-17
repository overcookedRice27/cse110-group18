
import { circuitGrid, removeElement } from "./utils/circuitGrid";
import { updateWireElectricity } from "./wire";

let charge = 0;

export function getCharge(): number {
    return charge;
}

export function setCharge(value: number): void {
    charge = Math.max(0, Math.min(100, value));
}

export function increaseCharge(): void {
    charge = Math.min(100, charge + 50);
}

export function useSpecialAbility(): number {
    if (charge < 100) {
        return 0;
    }

    // Find all wall blocks on the grid.
    const walls = [...new Set(circuitGrid.flat())].filter(
        (element) => element !== null &&
            element.getAttr("elementType") === "block"
    );

    let removed = 0;

    // Randomly remove up to five walls.
    while (walls.length > 0 && removed < 5) {
        const index = Math.floor(Math.random() * walls.length);
        const wall = walls[index];

        if (wall) {
            removeElement(wall);
            wall.destroy();
            removed++;
        }

        walls.splice(index, 1);
    }

    if (removed > 0) {
        charge = 0;
        updateWireElectricity();
    }

    return removed;
}
