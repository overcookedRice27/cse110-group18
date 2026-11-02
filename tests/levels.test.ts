import { beforeEach, describe, it, expect } from "vitest";
import { completeLevel, isLevelUnlocked, resetLevels } from "../src/html/levels";

describe("level prerequisites", () =>
{
  // Start each test with only Level 1 available.
  beforeEach(() =>
  {
    resetLevels();
  });

  it("locks levels 2 and 3 until their previous level is completed", () =>
  {
    expect(isLevelUnlocked(1)).toBe(true);
    expect(isLevelUnlocked(2)).toBe(false);
    expect(isLevelUnlocked(3)).toBe(false);
    completeLevel(1);
    expect(isLevelUnlocked(2)).toBe(true);
    expect(isLevelUnlocked(3)).toBe(false);
    completeLevel(2);
    expect(isLevelUnlocked(3)).toBe(true);
  });

  it("rejects completion of a level whose prerequisite is unfinished", () =>
  {
    completeLevel(2);
    expect(isLevelUnlocked(3)).toBe(false);
    completeLevel(1);
    expect(isLevelUnlocked(3)).toBe(false);
    completeLevel(3);
    expect(isLevelUnlocked(4)).toBe(false);
  });

  it("locks later levels again after resetting progress", () =>
  {
    completeLevel(1);
    completeLevel(2);
    resetLevels();
    expect(isLevelUnlocked(1)).toBe(true);
    expect(isLevelUnlocked(2)).toBe(false);
    expect(isLevelUnlocked(3)).toBe(false);
  });

  it("rejects IDs outside the level list", () =>
  {
    for (const id of [0, -1, 11, 1.5, NaN])
    {
      expect(isLevelUnlocked(id)).toBe(false);
      expect(() => completeLevel(id)).not.toThrow();
    }
  });
});
