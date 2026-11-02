import type { GateType } from "./levels/levelData";

export function calculateGateOutput(
    type: GateType,
    first: boolean,
    second: boolean,
): boolean {
    if (type === "AND") return first && second;
    if (type === "OR") return first || second;
    if (type === "XOR") return first !== second;
    return !first;
}
