// @vitest-environment jsdom
// tests/main-menu.test.ts
// 1. Continue button visibility   2. Each main menu button goes to the right place   3. Speed
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The Konva game needs a real canvas, so use stand-ins
const showPlayerLevel = vi.fn(async () => {});
const showLevelCreator = vi.fn();
vi.mock("../src/konva/main", () => ({ showPlayerLevel, showLevelCreator }));


const VALID_SAVE = JSON.stringify({
    version: 1,
    highestCompleted: 1,
    level: { id: 2, pieces: [] },
});


// Load index.html, then run dom-scripts.ts on it
async function loadMenu(): Promise<void> {
    vi.resetModules();
    const html = readFileSync("index.html", "utf8");
    document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
    await import("../src/html/dom-scripts");
}

const el = (id: string) => document.getElementById(id) as HTMLElement;

// Which screens are showing right now
function visibleScreens(): string[] {
    return ["main-menu", "level-screen", "game-view"].filter((id) => !el(id).hidden);
}

let alertSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    localStorage.clear();
    showPlayerLevel.mockClear();
    showLevelCreator.mockClear();
    alertSpy = vi.spyOn(globalThis, "alert").mockImplementation(() => {});
});

describe("Continue button visibility", () => {
    it("is shown when there is a save", async () => {
        localStorage.setItem("logicGame.save", VALID_SAVE);
        await loadMenu();
        expect(el("continue-btn").hidden).toBe(false);
    });

    it("is hidden when there is no save", async () => {
        await loadMenu();
        expect(el("continue-btn").hidden).toBe(true);
    });

    it("is hidden when the save is corrupted", async () => {
        localStorage.setItem("logicGame.save", "{oops");
        await loadMenu();
        expect(el("continue-btn").hidden).toBe(true);
    });

    it("updates when returning to the menu", async () => {
        await loadMenu();
        localStorage.setItem("logicGame.save", VALID_SAVE);
        el("back-to-menu-btn").click();
        expect(el("continue-btn").hidden).toBe(false);
    });
});

describe("main menu buttons go to the right place", () => {
    it("starts on the main menu only", async () => {
        await loadMenu();
        expect(visibleScreens()).toEqual(["main-menu"]);
    });

    it("Continue opens the saved level in the game screen", async () => {
        localStorage.setItem("logicGame.save", VALID_SAVE);
        await loadMenu();
        el("continue-btn").click();

        await vi.waitFor(() => expect(visibleScreens()).toEqual(["game-view"]));
        expect(showPlayerLevel).toHaveBeenCalledTimes(1);
    });

    it("New Game opens level 1 in the game screen", async () => {
        await loadMenu();
        el("new-game-btn").click();

        await vi.waitFor(() => expect(visibleScreens()).toEqual(["game-view"]));
        expect(showPlayerLevel).toHaveBeenCalledTimes(1);
    });

    it("Levels opens the level select screen", async () => {
        await loadMenu();
        el("levels-btn").click();
        expect(visibleScreens()).toEqual(["level-screen"]);
    });

    it("Level Creator opens the level creator in the game screen", async () => {
        await loadMenu();
        el("level-creator-btn").click();

        await vi.waitFor(() => expect(showLevelCreator).toHaveBeenCalledTimes(1));
        expect(visibleScreens()).toEqual(["game-view"]);
    });

    it("Mini Games shows its message and stays on the menu", async () => {
        await loadMenu();
        el("mini-game-btn").click();
        expect(alertSpy).toHaveBeenCalledWith("Opening mini games menu...");
        expect(visibleScreens()).toEqual(["main-menu"]);
    });

    it("Settings shows its message and stays on the menu", async () => {
        await loadMenu();
        el("settings-btn").click();
        expect(alertSpy).toHaveBeenCalledWith("Opening settings panel...");
        expect(visibleScreens()).toEqual(["main-menu"]);
    });

    it("Back returns to the main menu from level select and from the game", async () => {
        await loadMenu();
        el("levels-btn").click();
        el("back-to-menu-btn").click();
        expect(visibleScreens()).toEqual(["main-menu"]);

        el("level-creator-btn").click();
        await vi.waitFor(() => expect(visibleScreens()).toEqual(["game-view"]));
        el("game-back-btn").click();
        expect(visibleScreens()).toEqual(["main-menu"]);
    });
});

// jsdom is not a real browser, so these only check that the menu logic isn't slow
describe("speed", () => {
    it("a button click switches screens in under 100 ms", async () => {
        await loadMenu();
        const start = performance.now();
        el("levels-btn").click();
        expect(performance.now() - start).toBeLessThan(100);
    });

    it("100 menu round trips take under 2 seconds", async () => {
        await loadMenu();
        const start = performance.now();
        for (let i = 0; i < 100; i++) {
            el("levels-btn").click();
            el("back-to-menu-btn").click();
        }
        expect(performance.now() - start).toBeLessThan(2000);
    });
});