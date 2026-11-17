import { describe, it, expect } from "vitest";
import { getCircuitHint } from "../src/konva/circuitHints";

describe("getCircuitHint", () => {
    it("hints that the exit is missing", () => {
        expect(getCircuitHint({ exitCount: 0, inputsOnCount: 1 })).toContain("no exit");
    });

    it("hints that no input is on", () => {
        expect(getCircuitHint({ exitCount: 1, inputsOnCount: 0 })).toContain("No input is ON");
    });

    it("gives the generic hint when exit and input exist", () => {
        expect(getCircuitHint({ exitCount: 1, inputsOnCount: 2 })).toContain("not reaching the exit");
    });

    it("reports the missing exit first when several problems exist", () => {
        expect(getCircuitHint({ exitCount: 0, inputsOnCount: 0 })).toContain("no exit");
    });

    it("gives the generic hint with several exits and several inputs on", () => {
        expect(getCircuitHint({ exitCount: 3, inputsOnCount: 5 })).toContain("not reaching the exit");
    });

    it("never returns an empty hint", () => {
        for (const exitCount of [0, 1, 2]) {
            for (const inputsOnCount of [0, 1, 2]) {
                expect(getCircuitHint({ exitCount, inputsOnCount }).length).toBeGreaterThan(0);
            }
        }
    });

    it("returns a different hint for each of the three problems", () => {
        const hints = new Set([
            getCircuitHint({ exitCount: 0, inputsOnCount: 0 }),
            getCircuitHint({ exitCount: 1, inputsOnCount: 0 }),
            getCircuitHint({ exitCount: 1, inputsOnCount: 1 }),
        ]);
        expect(hints.size).toBe(3);
    });

    it("gives the same answer when called twice with the same input", () => {
        const summary = { exitCount: 1, inputsOnCount: 0 };
        expect(getCircuitHint(summary)).toBe(getCircuitHint(summary));
    });
});
