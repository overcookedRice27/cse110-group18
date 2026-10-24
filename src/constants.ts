const STAGE_WIDTH = 1000;
const STAGE_HEIGHT = 600;

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
