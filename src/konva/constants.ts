const STAGE_WIDTH = 900;
const STAGE_HEIGHT = 600;

// Controls whether the developer-facing creator is available from the menu.
export const LEVEL_CREATOR_ENABLED = true;

// Tracks the current board view; this changes when entering or leaving a level.
export let isCreatorView = true;

export function setCreatorView(enabled: boolean): void {
    isCreatorView = enabled;
}

export const CREATOR_PANEL = {
    X: 0,
    Y: 10,
    WIDTH: 168,
    // Fit all ten items above the controls at y=500, leaving a 16px gap.
    HEIGHT: 474,
    PLAYER_HEIGHT: 244,
    PADDING: 10,
    // Compact the selections so HIGH and LOW fit without touching Import Level.
    ITEM_HEIGHT: 40,
    ITEM_SPACING: 46,
    ITEM_FONT_SIZE: 24,
    ITEM_CORNER_RADIUS: 8,
    BORDER_WIDTH: 2,
    BORDER_RADIUS: 10,
    CREATOR_ITEMS: [
        "Input",
        // Constant sources are available only in the level creator.
        "HIGH",
        "LOW",
        "Exit",
        "Wire",
        "Block",
        "AND",
        "OR",
        "NOT",
        "XOR",
    ] as const,
    PLAYER_ITEMS: ["Wire", "AND", "OR", "NOT", "XOR"] as const,
};

export const STAGE = {
    WIDTH: STAGE_WIDTH,
    HEIGHT: STAGE_HEIGHT,
};

const GRID_WIDTH = 800;
const GRID_HEIGHT = 400;

const GRID_X_COUNT = 10;
const GRID_Y_COUNT = 6;

const GRID_CELL_SIZE = Math.min(
    GRID_WIDTH / GRID_X_COUNT,
    GRID_HEIGHT / GRID_Y_COUNT,
);

export const GRID = {
    // Layer width & height
    LAYER_WIDTH: GRID_WIDTH,
    LAYER_HEIGHT: GRID_HEIGHT,

    // Render width & height accounting for cell size
    X_COUNT: GRID_X_COUNT,
    Y_COUNT: GRID_Y_COUNT,
    CELL_SIZE: GRID_CELL_SIZE,

    WIDTH: GRID_X_COUNT * GRID_CELL_SIZE,
    HEIGHT: GRID_Y_COUNT * GRID_CELL_SIZE,

    STROKE_WIDTH: 2,
};

export const BUTTON = {
    WIDTH: 200,
    HEIGHT: 80,
};

const lightColors = {
    UI: {
        BACKGROUND: "#FFFFFF",
    },
    GATE: {
        TEXT: "#222222",
        BACKGROUND: "#D4D4D4",
        BORDER: "#222222",
    },
    WIRE: {
        BACKGROUND: "#222222",
        POWERED: "#ff4500",
        ELECTRICITY: "#ffcc00",
    },
    BUTTON: {
        TEXT: "#222222",
        BACKGROUND: "#D4D4D4",
        BORDER: "#222222",
    },
    GRID: {
        BACKGROUND: "#FFFFFF",
        STROKE: "#222222",
    },
    BLOCK: { BACKGROUND: "#888888" },
    TOOLBOX: { INPUT: "#147d52", EXIT: "#b45309", WIRE: "#1d4ed8", BLOCK: "#6b7280", GATE: "#7e22ce" },
};

// Keep the canvas colors alongside the existing game dimensions and colors.
export const COLOR_PRESETS = {
    light: lightColors,
    dark: {
        UI: { BACKGROUND: "#343a40" },
        GATE: { TEXT: "#f1f3f5", BACKGROUND: "#49515b", BORDER: "#f1f3f5" },
        WIRE: { BACKGROUND: "#f1f3f5", POWERED: "#ff4500", ELECTRICITY: "#ffcc00" },
        BUTTON: { TEXT: "#f1f3f5", BACKGROUND: "#49515b", BORDER: "#f1f3f5" },
        GRID: { BACKGROUND: "#212529", STROKE: "#adb5bd" },
        BLOCK: { BACKGROUND: "#6c757d" },
        TOOLBOX: { INPUT: "#75d6a6", EXIT: "#ffba75", WIRE: "#91baff", BLOCK: "#c5cbd3", GATE: "#d4a5ff" },
    },
};

export let COLORS = COLOR_PRESETS.light;

export function setBoardColors(theme: "light" | "dark"): void {
    COLORS = COLOR_PRESETS[theme];
}
