export type ThemePreference = "light" | "dark";

export interface GameOptions {
    theme: ThemePreference;
    soundEffectsEnabled: boolean;
    soundEffectsVolume: number;
}

const STORAGE_KEY = "logicGame.settings";
const DEFAULT_OPTIONS: GameOptions = {
    theme: "light",
    soundEffectsEnabled: true,
    soundEffectsVolume: 50,
};

let options = loadOptions();
let audioContext: AudioContext | null = null;

function loadOptions(): GameOptions {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<GameOptions>;
        return {
            theme: saved.theme === "light" || saved.theme === "dark"
                ? saved.theme : DEFAULT_OPTIONS.theme,
            soundEffectsEnabled: typeof saved.soundEffectsEnabled === "boolean"
                ? saved.soundEffectsEnabled : DEFAULT_OPTIONS.soundEffectsEnabled,
            soundEffectsVolume: typeof saved.soundEffectsVolume === "number"
                ? Math.max(0, Math.min(100, saved.soundEffectsVolume)) : DEFAULT_OPTIONS.soundEffectsVolume,
        };
    } catch {
        return { ...DEFAULT_OPTIONS };
    }
}

function saveOptions(): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch {
        // Preferences remain usable for this session if storage is unavailable.
    }
}

function applyTheme(): void {
    document.documentElement.setAttribute("data-bs-theme", options.theme);
    document.dispatchEvent(new CustomEvent("game-theme-changed", { detail: options.theme }));
}

export function initOptions(): void {
    const darkMode = document.getElementById("dark-mode-enabled") as HTMLInputElement;
    const soundToggle = document.getElementById("sound-effects-toggle") as HTMLButtonElement;
    const volume = document.getElementById("sound-effects-volume") as HTMLInputElement;
    const volumeValue = document.getElementById("sound-volume-value") as HTMLOutputElement;

    // Some focused DOM tests load only the menu controls, not the modal.
    if (!darkMode || !soundToggle || !volume || !volumeValue) return;
    applyTheme();
    darkMode.checked = options.theme === "dark";
    updateSoundToggle(soundToggle);
    volume.value = String(options.soundEffectsVolume);
    updateVolumeLabel(volume, volumeValue);

    darkMode.addEventListener("change", () => {
        options.theme = darkMode.checked ? "dark" : "light";
        applyTheme();
        saveOptions();
    });
    soundToggle.addEventListener("click", () => {
        options.soundEffectsEnabled = !options.soundEffectsEnabled;
        updateSoundToggle(soundToggle);
        saveOptions();
    });
    volume.addEventListener("input", () => {
        options.soundEffectsVolume = Number(volume.value);
        updateVolumeLabel(volume, volumeValue);
        saveOptions();
    });
}

function updateSoundToggle(toggle: HTMLButtonElement): void {
    toggle.setAttribute("aria-pressed", String(options.soundEffectsEnabled));
}

function updateVolumeLabel(volume: HTMLInputElement, label: HTMLOutputElement): void {
    const percentage = Number(volume.value);
    label.value = `${percentage}%`;
    label.textContent = label.value;
}

// Sound effects are synthesized with Web Audio: no downloaded sound assets are used.
export function playSound(effect: "placeGate" | "placeWire"): void {
    if (!options.soundEffectsEnabled || options.soundEffectsVolume === 0) return;
    const Context = window.AudioContext ?? window.webkitAudioContext;
    if (!Context) return;
    audioContext ??= new Context();
    if (audioContext.state === "suspended") void audioContext.resume();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(effect === "placeGate" ? 440 : 660, now);
    oscillator.frequency.exponentialRampToValueAtTime(effect === "placeGate" ? 520 : 780, now + 0.06);
    gain.gain.setValueAtTime((options.soundEffectsVolume / 100) * 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.08);
}

declare global {
    interface Window {
        webkitAudioContext?: typeof AudioContext;
    }
}
