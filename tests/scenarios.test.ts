// tests/scenarios.test.ts
// User Story 10: real-life scenario mini-game (answer checking)
// Run with: npx vitest run

import { describe, expect, it } from "vitest";
import {
    GATES,
    SCENARIOS,
    checkAnswer,
    isGate,
} from "../src/html/scenario-mini-game/scenarios";

describe("scenario data", () => {
    it("has at least one scenario", () => {
        expect(SCENARIOS.length).toBeGreaterThan(0);
    });

    it("gives every scenario text before and after the blank", () => {
        for (const s of SCENARIOS) {
            expect(s.before.trim().length).toBeGreaterThan(0);
            expect(s.after.trim().length).toBeGreaterThan(0);
        }
    });

    it("gives every scenario a valid gate as its answer", () => {
        for (const s of SCENARIOS) {
            expect(isGate(s.answer)).toBe(true);
        }
    });

    it("uses AND, OR, and XOR as an answer at least once each", () => {
        for (const gate of GATES) {
            expect(SCENARIOS.some((s) => s.answer === gate)).toBe(true);
        }
    });

    it("has no duplicate scenarios", () => {
        const sentences = SCENARIOS.map((s) => `${s.before}|${s.after}`);
        expect(new Set(sentences).size).toBe(sentences.length);
    });
});

describe("checkAnswer", () => {
    it("accepts the correct gate for every scenario", () => {
        for (const s of SCENARIOS) {
            const result = checkAnswer(s, s.answer);
            expect(result.correct).toBe(true);
            expect(result.message).toBe("Correct!");
        }
    });

    it("rejects every wrong gate for every scenario", () => {
        for (const s of SCENARIOS) {
            for (const gate of GATES.filter((g) => g !== s.answer)) {
                const result = checkAnswer(s, gate);
                expect(result.correct).toBe(false);
                expect(result.message).toBe("Not quite. Try again.");
            }
        }
    });

    it("rejects an empty blank and asks for a word", () => {
        const result = checkAnswer(SCENARIOS[0], null);
        expect(result.correct).toBe(false);
        expect(result.message).toBe("Drag a word into the blank first.");
    });

    it("treats the microwave question as AND", () => {
        const microwave = SCENARIOS[0];
        expect(checkAnswer(microwave, "AND").correct).toBe(true);
        expect(checkAnswer(microwave, "OR").correct).toBe(false);
        expect(checkAnswer(microwave, "XOR").correct).toBe(false);
    });
});

describe("isGate", () => {
    it("accepts AND, OR, and XOR", () => {
        expect(isGate("AND")).toBe(true);
        expect(isGate("OR")).toBe(true);
        expect(isGate("XOR")).toBe(true);
    });

    it("rejects anything else", () => {
        expect(isGate("NAND")).toBe(false);
        expect(isGate("and")).toBe(false); // lowercase is not a valid gate
        expect(isGate("")).toBe(false);
    });
});