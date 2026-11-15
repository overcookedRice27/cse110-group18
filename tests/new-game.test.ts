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
  let confirmReset = vi.fn();

  // Load the actual menu handlers against fresh DOM and storage fixtures.
  beforeEach(async () =>
  {
    vi.resetModules();
    elements.clear();
    entries.clear();
    for (const id of [
      "continue-btn", "new-game-btn", "levels-btn", "mini-game-btn",
      "settings-btn", "level-creator-btn", "back-to-menu-btn", "settings-back-btn", "game-back-btn",
      "main-menu", "level-screen", "settings-screen", "level-grid", "game-view",
    ])
    {
      elements.set(id, new MenuElement());
    }
    elements.get("level-screen")!.hidden = true;
    elements.get("game-view")!.hidden = true;
    getItem = vi.fn((key: string) => entries.get(key) ?? null);
    removeItem = vi.fn((key: string) => entries.delete(key));
    alertNotice = vi.fn();
    confirmReset = vi.fn().mockReturnValue(true);
    vi.stubGlobal("document", {
      getElementById: (id: string) => elements.get(id),
      createElement: () => new MenuElement(),
    });
    vi.stubGlobal("localStorage", { getItem, removeItem });
    vi.stubGlobal("alert", alertNotice);
    vi.stubGlobal("confirm", confirmReset);
    await import("../src/html/dom-scripts");
    getItem.mockClear();
  });

  // Restore globals so these fixtures cannot affect other test files.
  afterEach(() =>
  {
    vi.unstubAllGlobals();
  });

  it("checks local saves on click and opens Level 1 when none exists", async () =>
  {
    const showPlayerLevel = vi.fn().mockResolvedValue(undefined);
    vi.doMock("../src/konva/main", () => ({ showPlayerLevel }));
    elements.get("new-game-btn")!.dispatchEvent(new Event("click"));
    await vi.waitFor(() =>
    {
      expect(elements.get("game-view")!.hidden).toBe(false);
    });
    expect(getItem).toHaveBeenCalledWith("logicGame.save");
    expect(confirmReset).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    expect(showPlayerLevel).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(elements.get("main-menu")!.hidden).toBe(true);
    expect(elements.get("level-screen")!.hidden).toBe(true);
    expect(alertNotice).not.toHaveBeenCalled();
  });

  it("opens the level selection screen when Levels is clicked", () =>
  {
    elements.get("levels-btn")!.dispatchEvent(new Event("click"));
    expect(elements.get("main-menu")!.hidden).toBe(true);
    expect(elements.get("level-screen")!.hidden).toBe(false);
    expect(elements.get("game-view")!.hidden).toBe(true);
    expect(elements.get("level-grid")!.children).toHaveLength(10);
  });

  it("opens the how-to-play settings screen and returns to the menu", () =>
  {
    elements.get("settings-btn")!.dispatchEvent(new Event("click"));
    expect(elements.get("main-menu")!.hidden).toBe(true);
    expect(elements.get("settings-screen")!.hidden).toBe(false);
    expect(elements.get("game-view")!.hidden).toBe(true);

    elements.get("settings-back-btn")!.dispatchEvent(new Event("click"));
    expect(elements.get("main-menu")!.hidden).toBe(false);
    expect(elements.get("settings-screen")!.hidden).toBe(true);
  });

  // Exercise the real selection handler for every registry entry, including Level 10.
  it.each(Array.from({ length: 10 }, (_, index) => index + 1))(
    "opens registered Level %i when its enabled button is clicked",
    async (id) =>
    {
      const showPlayerLevel = vi.fn().mockResolvedValue(undefined);
      vi.doMock("../src/konva/main", () => ({ showPlayerLevel }));
      vi.stubGlobal("HTMLButtonElement", MenuElement);
      const button = Object.assign(new MenuElement(), {
        id: `level-${id}-btn`, disabled: false,
      });
      const event = new Event("click");
      Object.defineProperty(event, "target", { value: button });
      elements.get("level-grid")!.dispatchEvent(event);
      const { getLevel } = await import("../src/levels/registry");
      await vi.waitFor(() => expect(showPlayerLevel).toHaveBeenCalledWith(getLevel(id)));
      expect(elements.get("game-view")!.hidden).toBe(false);
      expect(alertNotice).not.toHaveBeenCalled();
    },
  );

  it("restores progress and opens the saved current level when Continue is clicked", async () =>
  {
    const showPlayerLevel = vi.fn().mockResolvedValue(undefined);
    vi.doMock("../src/konva/main", () => ({ showPlayerLevel }));
    const level = { id: 2, pieces: [] };
    entries.set("logicGame.save", JSON.stringify({ version: 1, highestCompleted: 1, level }));

    elements.get("continue-btn")!.dispatchEvent(new Event("click"));

    await vi.waitFor(() =>
    {
      expect(elements.get("game-view")!.hidden).toBe(false);
    });
    expect(showPlayerLevel).toHaveBeenCalledWith(level);
    expect(elements.get("main-menu")!.hidden).toBe(true);
    expect(elements.get("level-screen")!.hidden).toBe(true);
    expect(alertNotice).not.toHaveBeenCalled();
  });

  // Confirming removes the saved board and completion before loading fresh Level 1.
  it.each(["valid", "malformed"])("clears a %s save and restarts after confirmation", async (kind) =>
  {
    const showPlayerLevel = vi.fn().mockResolvedValue(undefined);
    vi.doMock("../src/konva/main", () => ({ showPlayerLevel }));
    const { restoreProgress, getHighestCompleted } = await import("../src/html/levels");
    restoreProgress(3);
    entries.set("logicGame.save", kind === "valid"
      ? JSON.stringify({ version: 1, highestCompleted: 3, level: { id: 4, pieces: [] } })
      : "invalid json");
    elements.get("new-game-btn")!.dispatchEvent(new Event("click"));
    await vi.waitFor(() => expect(showPlayerLevel).toHaveBeenCalled());
    expect(confirmReset).toHaveBeenCalledOnce();
    expect(removeItem).toHaveBeenCalledWith("logicGame.save");
    expect(entries.has("logicGame.save")).toBe(false);
    expect(getHighestCompleted()).toBe(0);
    expect(showPlayerLevel).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(elements.get("continue-btn")!.hidden).toBe(true);
    expect(alertNotice).not.toHaveBeenCalled();
  });

  // Cancel must retain both persisted data and completion earned in memory.
  it("preserves all progress and stays in the menu when cancelled", async () =>
  {
    const showPlayerLevel = vi.fn();
    vi.doMock("../src/konva/main", () => ({ showPlayerLevel }));
    const { restoreProgress, getHighestCompleted } = await import("../src/html/levels");
    restoreProgress(2);
    entries.set("logicGame.save", "existing save");
    confirmReset.mockReturnValue(false);
    elements.get("new-game-btn")!.dispatchEvent(new Event("click"));
    expect(confirmReset).toHaveBeenCalledOnce();
    expect(entries.get("logicGame.save")).toBe("existing save");
    expect(getHighestCompleted()).toBe(2);
    expect(removeItem).not.toHaveBeenCalled();
    expect(showPlayerLevel).not.toHaveBeenCalled();
    expect(elements.get("main-menu")!.hidden).toBe(false);
  });

  it("asks before clearing session progress even without a local save", async () =>
  {
    const { restoreProgress, getHighestCompleted } = await import("../src/html/levels");
    restoreProgress(1);
    confirmReset.mockReturnValue(false);
    elements.get("new-game-btn")!.dispatchEvent(new Event("click"));
    expect(confirmReset).toHaveBeenCalledOnce();
    expect(getHighestCompleted()).toBe(1);
    expect(removeItem).not.toHaveBeenCalled();
  });

  // Failed deletion must not reset in-memory progress or open a fresh game.
  it("preserves progress and reports storage deletion failures", async () =>
  {
    const { restoreProgress, getHighestCompleted } = await import("../src/html/levels");
    restoreProgress(2);
    entries.set("logicGame.save", "existing save");
    removeItem.mockImplementation(() => { throw new Error("Storage unavailable"); });
    elements.get("new-game-btn")!.dispatchEvent(new Event("click"));
    expect(getHighestCompleted()).toBe(2);
    expect(entries.get("logicGame.save")).toBe("existing save");
    expect(alertNotice).toHaveBeenCalledWith("Unable to start a new game. Check your browser storage settings and try again.");
    expect(elements.get("main-menu")!.hidden).toBe(false);
  });

  it("reports storage read errors without leaving the menu", () =>
  {
    getItem.mockImplementation(() =>
    {
      throw new Error("Storage unavailable");
    });
    elements.get("new-game-btn")!.dispatchEvent(new Event("click"));
    expect(alertNotice).toHaveBeenCalledWith("Unable to start a new game. Check your browser storage settings and try again.");
    expect(elements.get("main-menu")!.hidden).toBe(false);
    expect(elements.get("game-view")!.hidden).toBe(true);
  });
});
