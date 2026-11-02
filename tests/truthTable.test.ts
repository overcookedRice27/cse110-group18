import { describe, it, expect } from "vitest";
import {
    GATE_TEXT,
    ROUNDS,
    TOTAL_ROUNDS,
    evaluateGate,
    checkToken,
    createRound,
    placeToken,
    isRoundComplete,
    nextRound,
    type Bit,
    type GateName,
    type Round,
} from "../src/minigames/truthTable";

const GATES: GateName[] = ["AND", "OR", "XOR"];

// Cell inputs in table order: A=0,B=0 / A=0,B=1 / A=1,B=0 / A=1,B=1
const INPUTS: [Bit, Bit][] = [[0, 0], [0, 1], [1, 0], [1, 1]];

// Expected outputs, written out by hand (not computed with evaluateGate),
// so a bug in evaluateGate can't hide itself in the tests.
const TRUTH_TABLES: Record<GateName, Bit[]> = {
    AND: [0, 0, 0, 1],
    OR: [0, 1, 1, 1],
    XOR: [0, 1, 1, 0],
};

// Helper: the right token for a cell, taken from the hand-written tables.
function correctToken(gate: GateName, a: Bit, b: Bit): Bit {
    return TRUTH_TABLES[gate][a * 2 + b]; // a * 2 + b converts given token into index
}

// Helper: the wrong token for a cell (the opposite bit).
function wrongToken(gate: GateName, a: Bit, b: Bit): Bit {
    return correctToken(gate, a, b) === 0 ? 1 : 0;
}

// Helper: every cell of a round that is still empty, as [a, b] pairs.
function emptyCells(round: Round): [Bit, Bit][] {
    const found: [Bit, Bit][] = [];
    for (const a of [0, 1] as const) {
        for (const b of [0, 1] as const) {
            if (round.cells[a][b] === "empty") {
                found.push([a, b]);
            }
        }
    }
    return found;
}

// Helper: place the right token in every empty cell and return the finished round.
function solveRound(round: Round): Round {
    let current = round;
    for (const [a, b] of emptyCells(round)) {
        current = placeToken(current, a, b, correctToken(current.gate, a, b)).round;
    }
    return current;
}

describe("evaluateGate", () => {
    for (const gate of GATES) {
        // Tests each gate's output for all four input pairs.
        it(`${gate} matches its truth table`, () => {
            INPUTS.forEach(([a, b], i) => {
                expect(evaluateGate(gate, a, b)).toBe(TRUTH_TABLES[gate][i]);
            });
        });
    }
});

describe("checkToken", () => {
    for (const gate of GATES) {
        // Tests that every cell accepts the right token and rejects the wrong one
        // with this gate's explanation.
        it(`${gate}: accepts right tokens, rejects wrong ones with the explanation`, () => {
            INPUTS.forEach(([a, b]) => {
                expect(checkToken(gate, a, b, correctToken(gate, a, b))).toEqual({ correct: true });
                expect(checkToken(gate, a, b, wrongToken(gate, a, b))).toEqual({
                    correct: false,
                    explanation: GATE_TEXT[gate].explanation,
                });
            });
        });
    }
});

describe("createRound", () => {
    // Tests that every round uses its configured gate and number, with exactly
    // the configured cells "given" and every other cell "empty".
    it("builds every round from its config", () => {
        ROUNDS.forEach((config, index) => {
            const round = createRound(index + 1);
            expect(round.gate).toBe(config.gate);
            expect(round.roundNumber).toBe(index + 1);

            for (const a of [0, 1] as const) {
                for (const b of [0, 1] as const) {
                    const isGiven = config.given.some((cell) => cell.a === a && cell.b === b);
                    expect(round.cells[a][b]).toBe(isGiven ? "given" : "empty");
                }
            }
        });
    });

    // Tests that round numbers before the first and after the last are rejected.
    it("rejects round numbers outside the list", () => {
        expect(() => createRound(0)).toThrow();
        expect(() => createRound(TOTAL_ROUNDS + 1)).toThrow();
    });
});

describe("placeToken", () => {
    // Tests that the right token locks only that cell, and the original round is untouched.
    it("locks the cell for the right token and changes nothing else", () => {
        const round = createRound(1);
        const before = structuredClone(round);
        const [a, b] = emptyCells(round)[0];

        const result = placeToken(round, a, b, correctToken(round.gate, a, b));

        const expectedCells = structuredClone(before.cells);
        expectedCells[a][b] = "correct";
        expect(result.check).toEqual({ correct: true });
        expect(result.round.cells).toEqual(expectedCells);
        expect(round).toEqual(before);
    });

    // Tests that a wrong token leaves the round unchanged and returns the explanation.
    it("leaves the round unchanged and explains a wrong token", () => {
        const round = createRound(1);
        const [a, b] = emptyCells(round)[0];

        const result = placeToken(round, a, b, wrongToken(round.gate, a, b));

        expect(result.check).toEqual({
            correct: false,
            explanation: GATE_TEXT[round.gate].explanation,
        });
        expect(result.round).toEqual(round);
    });

    // Tests that given cells and already-correct cells refuse drops as "locked".
    it("refuses drops on given and already-correct cells", () => {
        const round = createRound(1);
        const { a: givenA, b: givenB } = ROUNDS[0].given[0];
        const onGiven = placeToken(round, givenA, givenB, correctToken(round.gate, givenA, givenB));
        expect(onGiven.check).toMatchObject({ correct: false, reason: "locked" });
        expect(onGiven.round).toEqual(round);

        const filled = solveRound(round);
        const [a, b] = emptyCells(round)[0];
        const again = placeToken(filled, a, b, correctToken(round.gate, a, b));
        expect(again.check).toMatchObject({ correct: false, reason: "locked" });
        expect(again.round).toEqual(filled);
    });
});

describe("isRoundComplete", () => {
    // Tests, for every round, that it is incomplete when new or one cell short,
    // and complete once every cell is filled.
    it("is complete only when no cell is empty", () => {
        ROUNDS.forEach((_, index) => {
            const round = createRound(index + 1);
            expect(isRoundComplete(round)).toBe(false);

            let almost = round;
            for (const [a, b] of emptyCells(round).slice(0, -1)) {
                almost = placeToken(almost, a, b, correctToken(almost.gate, a, b)).round;
            }
            expect(isRoundComplete(almost)).toBe(false);

            expect(isRoundComplete(solveRound(round))).toBe(true);
        });
    });
});

describe("nextRound", () => {
    // Tests that each round leads to the following one and the last one returns null.
    it("moves through the rounds in order and ends with null", () => {
        // counts rounds 1 to the second-to-last, since the last round has no next
        for (let n = 1; n < TOTAL_ROUNDS; n++) {
            expect(nextRound(createRound(n))).toEqual(createRound(n + 1));
        }
        expect(nextRound(createRound(TOTAL_ROUNDS))).toBeNull();
    });
});