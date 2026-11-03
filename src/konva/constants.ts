const STAGE_WIDTH = 1000;
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
    Y: 40,
    WIDTH: 168,
    HEIGHT: 430,
    PLAYER_HEIGHT: 274,
    PADDING: 10,
    ITEM_HEIGHT: 45,
    ITEM_SPACING: 52,
    ITEM_FONT_SIZE: 24,
    ITEM_CORNER_RADIUS: 8,
    BORDER_WIDTH: 2,
    BORDER_RADIUS: 10,
    CREATOR_ITEMS: [
        "Input",
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

export const COLORS = {
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
};
