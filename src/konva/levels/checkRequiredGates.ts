import Konva from "konva";
import { circuitGrid } from "../utils/circuitGrid";
import type { GateRequirements, GateType } from "./levelData";

// Trace wires upstream from every exit. A gate is reached only at its output,
// then the trace continues from its input pins toward earlier gates.
export function findConnectedGates(): GateRequirements {
    const gates: GateRequirements = {};
    const visitedWires = new Set<Konva.Group>();
    const visitedGates = new Set<Konva.Group>();

    function traceWire(x: number, y: number): void {
        const wire = circuitGrid[y]?.[x];
        if (wire?.getAttr("elementType") !== "wire" || visitedWires.has(wire)) return;
        visitedWires.add(wire);

        traceWire(x + 1, y);
        traceWire(x - 1, y);
        traceWire(x, y + 1);
        traceWire(x, y - 1);

        // Only a gate immediately to the left can output into this wire.
        const gate = circuitGrid[y]?.[x - 1];
        if (gate?.getAttr("elementType") !== "gate" || visitedGates.has(gate)) return;
        const gateX = gate.getAttr("gridX") as number;
        const gateY = gate.getAttr("gridY") as number;
        if (x !== gateX + 2 || y !== gateY + 1) return;

        visitedGates.add(gate);
        const gateType = gate.getAttr("gateType") as GateType;
        gates[gateType] = (gates[gateType] ?? 0) + 1;
        traceWire(gateX - 1, gateY);
        if (gateType !== "NOT") traceWire(gateX - 1, gateY + 2);
    }

    for (const row of circuitGrid) {
        for (const piece of row) {
            if (piece?.getAttr("elementType") !== "exit") continue;
            const x = piece.getAttr("gridX") as number;
            const y = piece.getAttr("gridY") as number;
            traceWire(x + 1, y);
            traceWire(x - 1, y);
            traceWire(x, y + 1);
            traceWire(x, y - 1);
        }
    }
    return gates;
}

export function missingRequiredGates(requiredGates: GateRequirements): string[] {
    const connectedGates = findConnectedGates();
    const missing: string[] = [];
    for (const gateType of ["AND", "OR", "NOT", "XOR"] as GateType[]) {
        const required = requiredGates[gateType] ?? 0;
        const connected = connectedGates[gateType] ?? 0;
        if (connected < required) {
            missing.push(`${gateType} (${connected}/${required})`);
        }
    }
    return missing;
}
