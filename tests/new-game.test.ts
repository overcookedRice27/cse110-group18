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
      "continue-btn", "new-game-btn", "new-game-dialog", "mini-game-btn",
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
    expect(elements.get("new-game-dialog")!.showModal).not.toHaveBeenCalled();
    expect(alertNotice).not.toHaveBeenCalled();
  });

  it("detects an existing save and opens confirmation over the main menu", () =>
  {
    entries.set("logicGame.save", JSON.stringify({ version: 1, highestCompleted: 2 }));
    elements.get("new-game-btn")!.dispatchEvent(new Event("click"));
    expect(getItem).toHaveBeenCalledWith("logicGame.save");
    expect(elements.get("new-game-dialog")!.showModal).toHaveBeenCalledOnce();
    expect(elements.get("main-menu")!.hidden).toBe(false);
    expect(elements.get("level-screen")!.hidden).toBe(true);
    expect(removeItem).not.toHaveBeenCalled();
  });

  it("clears the save and opens level selection after overwrite confirmation", () =>
  {
    entries.set("logicGame.save", JSON.stringify({ version: 1, highestCompleted: 2 }));
    elements.get("new-game-btn")!.dispatchEvent(new Event("click"));
    const dialog = elements.get("new-game-dialog")!;
    dialog.returnValue = "overwrite";
    dialog.dispatchEvent(new Event("close"));
    expect(removeItem).toHaveBeenCalledWith("logicGame.save");
    expect(entries.has("logicGame.save")).toBe(false);
    expect(elements.get("level-screen")!.hidden).toBe(false);
    expect(elements.get("main-menu")!.hidden).toBe(true);
  });

  it("keeps the save and main menu when confirmation is cancelled", () =>
  {
    entries.set("logicGame.save", JSON.stringify({ version: 1, highestCompleted: 2 }));
    elements.get("new-game-btn")!.dispatchEvent(new Event("click"));
    elements.get("new-game-dialog")!.dispatchEvent(new Event("close"));
    expect(removeItem).not.toHaveBeenCalled();
    expect(elements.get("main-menu")!.hidden).toBe(false);
    expect(elements.get("level-screen")!.hidden).toBe(true);
  });

  it("shows the save-check error notice when local storage cannot be read", () =>
  {
    getItem.mockImplementation(() =>
    {
      throw new Error("Storage unavailable");
    });
    elements.get("new-game-btn")!.dispatchEvent(new Event("click"));
    expect(alertNotice).toHaveBeenCalledWith("Unable to check your local save. Check your browser storage settings and try again.");
    expect(elements.get("new-game-dialog")!.showModal).not.toHaveBeenCalled();
    expect(elements.get("main-menu")!.hidden).toBe(false);
    expect(elements.get("level-screen")!.hidden).toBe(true);
  });

  it("shows the clear-save error notice and preserves the menu if deletion fails", () =>
  {
    entries.set("logicGame.save", JSON.stringify({ version: 1, highestCompleted: 2 }));
    elements.get("new-game-btn")!.dispatchEvent(new Event("click"));
    removeItem.mockImplementation(() =>
    {
      throw new Error("Storage unavailable");
    });
    const dialog = elements.get("new-game-dialog")!;
    dialog.returnValue = "overwrite";
    dialog.dispatchEvent(new Event("close"));
    expect(alertNotice).toHaveBeenCalledWith("Unable to clear your local save. Check your browser storage settings and try again.");
    expect(entries.has("logicGame.save")).toBe(true);
    expect(elements.get("main-menu")!.hidden).toBe(false);
    expect(elements.get("level-screen")!.hidden).toBe(true);
  });
});
