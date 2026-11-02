import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { completeLevel, renderLevelGrid, resetLevels } from "../src/html/levels";

// Inspect rendered button availability rather than relying on a separate lock checker.
function buttonIsEnabled(id: number): boolean
{
  const container = { replaceChildren: vi.fn() };
  renderLevelGrid(container as unknown as HTMLElement);
  const columns = container.replaceChildren.mock.calls[0];
  return columns[id - 1]?.button.disabled === false;
}

describe("level prerequisites", () =>
{
  // Start each test with only Level 1 available.
  beforeEach(() =>
  {
    resetLevels();
    vi.stubGlobal("document", {
      createElement: () => ({
        // Retain each rendered button for availability assertions.
        append(button: unknown)
        {
          Object.assign(this, { button });
        },
      }),
    });
  });

  // Restore browser globals after inspecting rendered level buttons.
  afterEach(() =>
  {
    vi.unstubAllGlobals();
  });

  it("locks levels 2 and 3 until their previous level is completed", () =>
  {
    expect(buttonIsEnabled(1)).toBe(true);
    expect(buttonIsEnabled(2)).toBe(false);
    expect(buttonIsEnabled(3)).toBe(false);
    completeLevel(1);
    expect(buttonIsEnabled(2)).toBe(true);
    expect(buttonIsEnabled(3)).toBe(false);
    completeLevel(2);
    expect(buttonIsEnabled(3)).toBe(true);
  });

  it("rejects completion of a level whose prerequisite is unfinished", () =>
  {
    completeLevel(2);
    expect(buttonIsEnabled(3)).toBe(false);
    completeLevel(1);
    expect(buttonIsEnabled(3)).toBe(false);
    completeLevel(3);
    expect(buttonIsEnabled(4)).toBe(false);
  });

  it("locks later levels again after resetting progress", () =>
  {
    completeLevel(1);
    completeLevel(2);
    resetLevels();
    expect(buttonIsEnabled(1)).toBe(true);
    expect(buttonIsEnabled(2)).toBe(false);
    expect(buttonIsEnabled(3)).toBe(false);
  });

  it("rejects IDs outside the level list", () =>
  {
    for (const id of [0, -1, 11, 1.5, NaN])
    {
      expect(buttonIsEnabled(id)).toBe(false);
      expect(() => completeLevel(id)).not.toThrow();
    }
  });
});
