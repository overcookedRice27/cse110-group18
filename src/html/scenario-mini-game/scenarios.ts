export type GateChoice = "AND" | "OR" | "XOR";

export type Scenario = {
    text: string;
    choices: GateChoice[];
    answer: GateChoice;
    explanation: string;
};

export const SCENARIOS: Scenario[] = [
    {
        text: "The microwave only runs when the door is closed _____ the start button is pressed. ",
        choices: ['AND', 'OR', 'XOR'],
        answer: 'AND',
        explanation: "Both conditions must be true, so it is AND."
    },
    {
        text: "You can only go to a theme park if you buy a one day ticket _____ a seasonal pass.",
        choices: ['AND', 'OR', 'XOR'],
        answer: "OR",
        explanation: "Either ticekt is enough, so it is OR"
    },
    {
        text: "With your meal, you can get a free drink ____ a free dessert, but not both.",
        choices: ['AND', 'OR', 'XOR'],
        answer: 'XOR',
        explanation: "You can get either choice, but not both of them. So, it is XOR"
    }
]

export function checkAnswer(scenario: Scenario, choice: GateChoice): boolean {
    return scenario.answer === choice;
}