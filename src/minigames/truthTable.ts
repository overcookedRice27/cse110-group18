export type Bit = 0 | 1;
export type GateName = "AND" | "OR" | "XOR";
export type CellState = "given" | "empty" | "correct"; 

// Result of dropping a token on a cell.
export type TokenCheck =
    | { correct: true }
    | { correct: false; explanation: string; reason?: "locked" };

// rule text and mistake explanation for each gate
export const GATE_TEXT: Record<GateName, { rule: string; explanation: string }> = { 
    AND: {
        rule: "AND is on only when A and B are both on.",
        explanation: "AND is 1 only when both inputs are 1.",
    },
    OR: {
        rule: "OR is on when at least one input is 1.",
        explanation: "OR is 1 only when at least one input is 1, which includes both.",
    },
    XOR: {
        rule: "XOR is on only when one input is 1 and the other is 0.",
        explanation: "XOR is 1 only when one input is 1 and the other is 0 (the inputs are different).",
    },
    
};

// gives expected value for given logic gate
export function evaluateGate(gate: GateName, a: Bit, b: Bit): Bit {
    switch (gate) {
        case "AND":
            return a && b;
        case "OR":
            return a || b;
        case "XOR":
            return a !== b ? 1 : 0; // not a ^ b: TypeScript types that as number, not Bit.
    }
}

// checks expected value vs. player input 
export function checkToken(gate: GateName, a: Bit, b: Bit, token: Bit): TokenCheck {
    const expectedBit: Bit = evaluateGate(gate, a, b);
    if (token !== expectedBit){
        return { correct: false, explanation: GATE_TEXT[gate].explanation };
    } else {
        return { correct: true };
    }
}

// Round state: gate, round number, and the four cell states.
export type Round = { 
    gate: GateName,
    roundNumber: number,
    cells: CellState[][]
};

type RoundConfig = { gate: GateName; given: { a: Bit; b: Bit }[] };

// stores each round's setup | changing/adding rounds goes in this list
// note: a and b values represent cell indices not values 
export const ROUNDS: RoundConfig[] = [
    { gate: "AND", given: [{a: 0, b: 0}, {a: 0, b: 1}, {a:1, b:0}]}, // round 1
    { gate: "AND", given: [{ a: 0, b: 0 }] },                        // round 2
    { gate: "OR",  given: [{ a: 0, b: 0 }] },                        // round 3
    { gate: "XOR", given: [{ a: 0, b: 0 }] },                        // round 4
];

export const TOTAL_ROUNDS = ROUNDS.length;

// create a round 
export function createRound(roundNumber: number): Round {
    const config = ROUNDS[roundNumber - 1];
    if (!config) {
        throw new Error(`Invalid round number: ${roundNumber}`);
    }

    const cells: CellState[][] = [
        ["empty", "empty"],
        ["empty", "empty"],
    ];

    // loop used to allow for multiple given values
    for (const cell of config.given) {
        cells[cell.a][cell.b] = "given";
    }

    return { gate: config.gate, roundNumber, cells };
}

// place token in table
export function placeToken(round: Round, a: Bit, b: Bit, token: Bit): { round: Round; check: TokenCheck } {
    const check = checkToken(round.gate, a, b, token);

    // 1. cell isn't empty -> nothing changes
    if (round.cells[a][b] !== "empty") {
        return {
            round,
            check: { correct: false, explanation: "That cell is already filled.", reason: "locked" },
        };
    }

    // 2. wrong token -> round unchanged, return the check as is
    if (!check.correct) {
        return { round, check };
    }

    // 3. correct token -> new table with that one cell set to "correct"
    const cells = round.cells.map((row) => [...row]);
    cells[a][b] = "correct";
    return { round: { ...round, cells }, check };
}

// checks if the round is complete
export function isRoundComplete(round: Round): boolean { 
    for (const row of round.cells) {
        for (const cell of row) {
            if (cell === "empty") {
                return false;
            }
        }
    }

    return true;
}

// initializes next round 
export function nextRound(round: Round): Round | null { 
    if (round.roundNumber >= ROUNDS.length) {
        return null; // all rounds completed
    }

    return createRound(round.roundNumber + 1);
}