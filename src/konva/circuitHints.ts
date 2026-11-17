// Pure hint logic: no DOM or Konva, so it is easy to unit test.
export type CircuitSummary = {
    exitCount: number;
    inputsOnCount: number;
};

// Checks the most basic problem first and returns a hint for the first one found.
export function getCircuitHint(s: CircuitSummary): string {
    if (s.exitCount === 0) {
        return "There is no exit on the board.";
    }
    if (s.inputsOnCount === 0) {
        return "No input is ON, so no power enters the circuit. Click an input to turn it on.";
    }
    return "Power is not reaching the exit. Check that your wires connect and that you used the right gates.";
}
