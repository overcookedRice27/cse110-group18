import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

// Provide the DOM operations used by the menu without adding a browser dependency.
class MenuElement extends EventTarget
{
  hidden = false;
  returnValue = "";
  children: MenuElement[] = [];
  showModal = vi.fn();

  // Keep rendered level buttons available for assertions.
  append(child: MenuElement): void
  {
    this.children.push(child);
  }

  // Match the level grid's replacement behavior.
  replaceChildren(...children: MenuElement[]): void
  {
    this.children = children;
  }
}

describe("new game", () =>
{
  const elements = new Map<string, MenuElement>();
  const entries = new Map<string, string>();
  let getItem = vi.fn();
  let removeItem = vi.fn();
  let alertNotice = vi.fn();

  // Load the actual menu handlers against fresh DOM and storage fixtures.
  beforeEach(async () =>
  {
    vi.resetModules();
    elements.clear();
    entries.clear();
    for (const id of [
      "continue-btn", "new-game-btn", "mini-game-btn",
      "settings-btn", "level-creator-btn", "back-to-menu-btn", "game-back-btn",
      "main-menu", "level-screen", "level-grid", "game-view",
    ])
    {
      elements.set(id, new MenuElement());
    }
    elements.get("level-screen")!.hidden = true;
    elements.get("game-view")!.hidden = true;
    getItem = vi.fn((key: string) => entries.get(key) ?? null);
    removeItem = vi.fn((key: string) => entries.delete(key));
    alertNotice = vi.fn();
    vi.stubGlobal("document", {
      getElementById: (id: string) => elements.get(id),
      createElement: () => new MenuElement(),
    });
    vi.stubGlobal("localStorage", { getItem, removeItem });
    vi.stubGlobal("alert", alertNotice);
    await import("../src/html/dom-scripts");
    getItem.mockClear();
  });

  // Restore globals so these fixtures cannot affect other test files.
  afterEach(() =>
  {
    vi.unstubAllGlobals();
  });

  it("checks local saves on click and opens level selection when none exists", () =>
  {
    elements.get("new-game-btn")!.dispatchEvent(new Event("click"));
    expect(getItem).toHaveBeenCalledWith("logicGame.save");
    expect(elements.get("main-menu")!.hidden).toBe(true);
    expect(elements.get("level-screen")!.hidden).toBe(false);
    expect(elements.get("level-grid")!.children).toHaveLength(10);
    expect(alertNotice).not.toHaveBeenCalled();
  });

  it("automatically restores saved progress and opens the saved level", async () =>
  {
    const showPlayerLevel = vi.fn().mockResolvedValue(undefined);
    vi.doMock("../src/konva/main", () => ({ showPlayerLevel }));
    const level = { id: 2, pieces: [] };
    const raw = JSON.stringify({ version: 1, highestCompleted: 1, level });
    entries.set("logicGame.save", raw);
    elements.get("new-game-btn")!.dispatchEvent(new Event("click"));
    await vi.waitFor(() =>
    {
      expect(elements.get("game-view")!.hidden).toBe(false);
    });
    expect(showPlayerLevel).toHaveBeenCalledWith(level);
    expect(elements.get("main-menu")!.hidden).toBe(true);
    expect(elements.get("level-screen")!.hidden).toBe(true);
    expect(entries.get("logicGame.save")).toBe(raw);
    expect(removeItem).not.toHaveBeenCalled();
    expect(alertNotice).not.toHaveBeenCalled();
  });

  it("reports invalid saves without deleting them or leaving the menu", () =>
  {
    entries.set("logicGame.save", "invalid json");
    elements.get("new-game-btn")!.dispatchEvent(new Event("click"));
    expect(alertNotice).toHaveBeenCalledWith("Unable to load your local save. The save is invalid or incompatible.");
    expect(elements.get("main-menu")!.hidden).toBe(false);
    expect(elements.get("game-view")!.hidden).toBe(true);
    expect(removeItem).not.toHaveBeenCalled();
  });

  it("reports storage read errors without leaving the menu", () =>
  {
    getItem.mockImplementation(() =>
    {
      throw new Error("Storage unavailable");
    });
    elements.get("new-game-btn")!.dispatchEvent(new Event("click"));
    expect(alertNotice).toHaveBeenCalledWith("Unable to load your local save. Check your browser storage settings and try again.");
    expect(elements.get("main-menu")!.hidden).toBe(false);
    expect(elements.get("game-view")!.hidden).toBe(true);
  });
});
