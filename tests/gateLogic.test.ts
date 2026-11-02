import { describe, expect, it } from "vitest";
import { calculateGateOutput } from "../src/konva/gateLogic";

describe("gate output", () => {
    it.each([
        [false, false, false],
        [false, true, false],
        [true, false, false],
        [true, true, true],
    ])("AND with %s and %s returns %s", (first, second, expected) => {
        expect(calculateGateOutput("AND", first, second)).toBe(expected);
    });

    it.each([
        [false, false, false],
        [false, true, true],
        [true, false, true],
        [true, true, true],
    ])("OR with %s and %s returns %s", (first, second, expected) => {
        expect(calculateGateOutput("OR", first, second)).toBe(expected);
    });

    it.each([
        [false, false, false],
        [false, true, true],
        [true, false, true],
        [true, true, false],
    ])("XOR with %s and %s returns %s", (first, second, expected) => {
        expect(calculateGateOutput("XOR", first, second)).toBe(expected);
    });

    it.each([
        [false, false, true],
        [false, true, true],
        [true, false, false],
        [true, true, false],
    ])("NOT with %s and %s returns %s", (first, second, expected) => {
        expect(calculateGateOutput("NOT", first, second)).toBe(expected);
    });
});
