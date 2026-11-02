//user story 10

export type Gate = "AND" | "OR" | "XOR";
export const GATES: readonly Gate[] = ["AND", "OR", "XOR"]; //readonly so nothing can add/remove a gate

//checks if text is one of the three gates
export function isGate(value: string): value is Gate {
    return (GATES as readonly string[]).includes(value);
}
 
export interface Scenario {
    before: string; // sentence text before the blank
    after: string; // sentence text after the blank
    answer: Gate;
}

export interface CheckResult {
    correct: boolean;
    message: string;
}
 
export const SCENARIOS: readonly Scenario[] = [
    {
        before: "A microwave only runs when the door is closed",
        after: "the start button is pressed.",
        answer: "AND",
    },
    {
        before: "Someone can enter a theme park if they buy a one day ticket",
        after: "if they have a seasonal pass.",
        answer: "OR",
    },
    {
        before: "A stairway light is on when the top switch is up",
        after: "the bottom switch is up, but it is off if both are up.",
        answer: "XOR",
    },
  
];
 
//Checks the player’s choice against a scenario
export function checkAnswer(scenario: Scenario, choice: Gate | null): CheckResult {
    if (choice === null) {
        return { correct: false, message: "Drag a word into the blank first." };
    }
    if (choice === scenario.answer) {
        return { correct: true, message: "Correct!" };
    }
    return { correct: false, message: "Not quite. Try again." };
}