import { describe, it, expect } from "vitest";
import { SCENARIOS, checkAnswer } from "../src/html/scenario-mini-game/scenarios";
 
 
describe("check answer", () => {
  it("accepts the right word", () => {
    const scenario = SCENARIOS[0];
    const choice = "AND";
 
    const result = checkAnswer(scenario, choice);
 
    expect(result).toBe(true);
  });
 
  it("rejects a wrong word", () => {
    const scenario = SCENARIOS[0];
    const choice = "OR";
 
    const result = checkAnswer(scenario, choice);
 
    expect(result).toBe(false);
  });
 
  it("rejects the other wrong word", () => {
    const scenario = SCENARIOS[0];
    const choice = "XOR";
 
    const result = checkAnswer(scenario, choice);
 
    expect(result).toBe(false);
  });
 
  it("accepts the right word for an OR question", () => {
    const scenario = SCENARIOS[1];
    const choice = "OR";
 
    const result = checkAnswer(scenario, choice);
 
    expect(result).toBe(true);
  });
 
  it("accepts the right word for an XOR question", () => {
    const scenario = SCENARIOS[2];
    const choice = "XOR";
 
    const result = checkAnswer(scenario, choice);
 
    expect(result).toBe(true);
  });
 
 
});
 
describe("question labels", () => {
  it("offers AND, OR and XOR as choices", () => {
    const scenario = SCENARIOS[0];
 
    expect(scenario.choices).toEqual(["AND", "OR", "XOR"]);
  });
 
  it("includes the answer in the choices", () => {
    const scenario = SCENARIOS[0];
 
    expect(scenario.choices).toContain(scenario.answer);
  });
 
  it("has an explanation", () => {
    const scenario = SCENARIOS[0];
 
    expect(scenario.explanation.length).toBeGreaterThan(0);
  });
 
  it("has one blank in the sentence", () => {
    const scenario = SCENARIOS[0];
 
    const blanks = scenario.text.match(/_{3,}/g);
 
    expect(blanks?.length).toBe(1);
  });
 
 
});
 
describe("speed", () => {
  it("checks 1000 answers in under 50 ms", () => {
    const scenario = SCENARIOS[0];
    const start = performance.now();
 
    for (let i = 0; i < 1000; i++) {
      checkAnswer(scenario, "AND");
    }
 
    expect(performance.now() - start).toBeLessThan(50);
  });
 
 
});