import { describe, it, expect } from "vitest";
import { checkCircuit } from "../src/konva/levelChecker";


describe("check answer", () => {
  it("checks if level answer matches the user answer", () => {
    const userAnswer = [false, false, false, true];
    const correctAnswer = [false, false, false, true];

    const result = checkCircuit(userAnswer, correctAnswer);

    expect(result.exitState).toBe("open");
    expect(result.passed).toBe(true);
  });

  it("checks if an incorect user answer matches", () => {
    const userAnswer = [true, false, false, true];
    const correctAnswer = [false, false, false, false];

    const result = checkCircuit(userAnswer, correctAnswer);

    expect(result.exitState).toBe("locked");
    expect(result.passed).toBe(false);
  });

  it("checks if an inverse answers match", () => {
    const userAnswer = [true, false, false, true];
    const correctAnswer = [false, true, true, false];

    const result = checkCircuit(userAnswer, correctAnswer);

    expect(result.exitState).toBe("locked");
    expect(result.passed).toBe(false);
  });

  it("checks if an different length answers match", () => {
    const userAnswer = [true, false, false, true, false];
    const correctAnswer = [false];

    const result = checkCircuit(userAnswer, correctAnswer);

    expect(result.exitState).toBe("locked");
    expect(result.passed).toBe(false);
  });

  it("checks if singleton answers match", () => {
    const userAnswer = [];
    const correctAnswer = [];

    const result = checkCircuit(userAnswer, correctAnswer);

    expect(result.exitState).toBe("locked");
    expect(result.passed).toBe(false);
  });
});