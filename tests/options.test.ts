// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createOptionsMarkup(): void {
    document.body.innerHTML = `
        <input id="dark-mode-enabled" type="checkbox">
        <input id="sound-effects-volume" type="range" min="0" max="100" value="50">
        <output id="sound-volume-value"></output>
        <button id="sound-effects-toggle" type="button" aria-pressed="true"></button>
    `;
}

describe("Options controls", () => {
    beforeEach(() => {
        vi.resetModules();
        localStorage.clear();
        document.documentElement.removeAttribute("data-bs-theme");
        createOptionsMarkup();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("switches Dark Mode and saves the selected theme", async () => {
        const { initOptions } = await import("../src/html/options");
        const toggle = document.getElementById("dark-mode-enabled") as HTMLInputElement;
        initOptions();

        expect(document.documentElement.getAttribute("data-bs-theme")).toBe("light");
        toggle.click();

        expect(document.documentElement.getAttribute("data-bs-theme")).toBe("dark");
        expect(JSON.parse(localStorage.getItem("logicGame.settings") ?? "{}")).toMatchObject({
            theme: "dark",
        });
    });

    it("updates the displayed and saved volume", async () => {
        const { initOptions } = await import("../src/html/options");
        const slider = document.getElementById("sound-effects-volume") as HTMLInputElement;
        const output = document.getElementById("sound-volume-value") as HTMLOutputElement;
        initOptions();

        slider.value = "75";
        slider.dispatchEvent(new Event("input"));

        expect(output.value).toBe("75%");
        expect(output.textContent).toBe("75%");
        expect(JSON.parse(localStorage.getItem("logicGame.settings") ?? "{}")).toMatchObject({
            soundEffectsVolume: 75,
        });
    });

    it("toggles sound effects with the icon button and saves the choice", async () => {
        const { initOptions } = await import("../src/html/options");
        const button = document.getElementById("sound-effects-toggle") as HTMLButtonElement;
        initOptions();

        expect(button.getAttribute("aria-pressed")).toBe("true");
        button.click();

        expect(button.getAttribute("aria-pressed")).toBe("false");
        expect(JSON.parse(localStorage.getItem("logicGame.settings") ?? "{}")).toMatchObject({
            soundEffectsEnabled: false,
        });
    });

    it("uses the selected volume when playing a sound", async () => {
        const gainSetValueAtTime = vi.fn();
        const oscillator = {
            type: "sine",
            frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
            connect: vi.fn().mockReturnThis(),
            start: vi.fn(),
            stop: vi.fn(),
        };
        const audioContext = {
            state: "running",
            currentTime: 0,
            destination: {},
            createOscillator: vi.fn(() => oscillator),
            createGain: vi.fn(() => ({
                gain: { setValueAtTime: gainSetValueAtTime, exponentialRampToValueAtTime: vi.fn() },
                connect: vi.fn().mockReturnThis(),
            })),
        };
        class FakeAudioContext {
            constructor() {
                return audioContext as unknown as FakeAudioContext;
            }
        }
        vi.stubGlobal("AudioContext", FakeAudioContext);

        const { initOptions, playSound } = await import("../src/html/options");
        const slider = document.getElementById("sound-effects-volume") as HTMLInputElement;
        initOptions();
        slider.value = "75";
        slider.dispatchEvent(new Event("input"));
        playSound("placeWire");

        expect(gainSetValueAtTime).toHaveBeenCalledWith(0.09, 0);
    });
});
