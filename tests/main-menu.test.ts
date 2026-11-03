// @vitest-environment jsdom
// tests/main-menu.test.ts
// Main menu buttons, navigation, and speed.

import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SCREEN_IDS = ["main-menu", "level-screen", "scenario-screen", "game-screen"];

// Loads index.html, then runs dom-scripts.ts against it
async function loadMenu(): Promise<void> {
    vi.resetModules();
    const html = readFileSync("index.html", "utf8");
    document.body.innerHTML = new DOMParser().parseFromString(html, "text/html").body.innerHTML;
    await import("../src/html/dom-scripts");
}

const click = (id: string) => (document.getElementById(id) as HTMLElement).click();

// Which of the main screens are showing right now
const visibleScreens = () =>
    SCREEN_IDS.filter((id) => !(document.getElementById(id) as HTMLElement).hidden);

let alertSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    localStorage.clear();
    // A saved game so the Continue button is available
    localStorage.setItem("logicGame.save", JSON.stringify({ version: 1, highestCompleted: 3 }));
    alertSpy = vi.spyOn(globalThis, "alert").mockImplementation(() => {});
});

afterEach(() => {
    alertSpy.mockRestore();
});

describe("main menu navigation", () => {
    it("starts on the main menu only", async () => {
        await loadMenu();
        expect(visibleScreens()).toEqual(["main-menu"]);
    });

    it("Continue opens level select", async () => {
        await loadMenu();
        click("continue-btn");
        expect(visibleScreens()).toEqual(["level-screen"]);
    });

    it("Mini Games opens the mini-game", async () => {
        await loadMenu();
        click("mini-game-btn");
        expect(visibleScreens()).toEqual(["scenario-screen"]);
    });

    it("Back from level select returns to the main menu", async () => {
        await loadMenu();
        click("continue-btn");
        click("back-to-menu-btn");
        expect(visibleScreens()).toEqual(["main-menu"]);
    });

    it("Back from the mini-game returns to the main menu", async () => {
        await loadMenu();
        click("mini-game-btn");
        click("scenario-back-btn");
        expect(visibleScreens()).toEqual(["main-menu"]);
    });

    // Placeholders for now: update these when the screens exist
    it("New Game responds when clicked", async () => {
        await loadMenu();
        click("new-game-btn");
        expect(alertSpy).toHaveBeenCalled();
    });

    it("Settings responds when clicked", async () => {
        await loadMenu();
        click("settings-btn");
        expect(alertSpy).toHaveBeenCalled();
    });
});

describe("Continue button and saved progress", () => {
    const continueHidden = () => (document.getElementById("continue-btn") as HTMLElement).hidden;

    it("is shown when progress is saved", async () => {
        await loadMenu(); // beforeEach saved 3 completed levels
        expect(continueHidden()).toBe(false);
    });

    it("is hidden when there is no saved progress", async () => {
        localStorage.clear();
        await loadMenu();
        expect(continueHidden()).toBe(true);
    });

    it("is hidden when the save is corrupted", async () => {
        localStorage.setItem("logicGame.save", "{oops");
        await loadMenu();
        expect(continueHidden()).toBe(true);
    });

    it("opens level select when clicked with saved progress", async () => {
        await loadMenu();
        click("continue-btn");
        expect(visibleScreens()).toEqual(["level-screen"]);
    });

    it("appears after returning to the menu once progress is saved", async () => {
        localStorage.clear();
        await loadMenu();
        expect(continueHidden()).toBe(true);

        localStorage.setItem("logicGame.save", JSON.stringify({ version: 1, highestCompleted: 1 }));
        click("mini-game-btn");
        click("scenario-back-btn"); // back to the menu re-checks the save
        expect(continueHidden()).toBe(false);
    });

    it("disappears after returning to the menu once progress is cleared", async () => {
        await loadMenu();
        expect(continueHidden()).toBe(false);

        localStorage.removeItem("logicGame.save");
        click("mini-game-btn");
        click("scenario-back-btn");
        expect(continueHidden()).toBe(true);
    });
});

//checks that the menu logic isn't slow
describe("speed", () => {
    it("a full tour of the menu takes under 100 ms", async () => {
        await loadMenu();
        const start = performance.now();
        click("continue-btn");
        click("back-to-menu-btn");
        click("mini-game-btn");
        click("scenario-back-btn");
        expect(performance.now() - start).toBeLessThan(100);
    });

    it("100 trips to level select and back take under 2 seconds", async () => {
        await loadMenu();
        const start = performance.now();
        for (let i = 0; i < 100; i++) {
            click("continue-btn");
            click("back-to-menu-btn");
        }
        expect(performance.now() - start).toBeLessThan(2000);
    });
});