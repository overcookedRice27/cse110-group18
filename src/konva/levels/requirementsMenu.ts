import type { GateRequirements, GateType } from "./levelData";

const gateTypes: GateType[] = ["AND", "OR", "NOT", "XOR"];

// Return null for invalid fields so an invalid count cannot be saved or tested.
export function readRequirements(): GateRequirements | null {
    const requirements: GateRequirements = {};
    for (const type of gateTypes) {
        const field = document.getElementById(`require-${type.toLowerCase()}`) as HTMLInputElement;
        const count = field.valueAsNumber;
        if (!Number.isSafeInteger(count) || count < 0) return null;
        if (count > 0) requirements[type] = count;
    }
    return requirements;
}

export function showRequirements(requirements?: GateRequirements): void {
    for (const type of gateTypes) {
        const field = document.getElementById(`require-${type.toLowerCase()}`) as HTMLInputElement;
        field.value = String(requirements?.[type] ?? 0);
    }
}
