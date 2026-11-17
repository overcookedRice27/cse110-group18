import { describe, it, expect } from "vitest";
import { checkCircuit } from "../src/konva/wire";


describe("check answer", () => {
  it("checks if wire is powered", () => {
    const powered = true;

    const result = checkCircuit(powered);

    expect(result.exitState).toBe("open");
    expect(result.passed).toBe(true);
  });

  it("checks if wire power is false", () => {
    const powered = false;

    const result = checkCircuit(powered);

    expect(result.exitState).toBe("locked");
    expect(result.passed).toBe(false);
  });

  it("checks if wire is null", () => {
    const powered = null;

    const result = checkCircuit(powered);

    expect(result.exitState).toBe("locked");
    expect(result.passed).toBe(false);
  });


});