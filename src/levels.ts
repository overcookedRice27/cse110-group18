const LEVEL_COUNT = 10;

type LevelState = "finished" | "current" | "locked";

type Level = {
    id: number;
    state: LevelState;
};

const levels: Level[] = Array.from({ length: LEVEL_COUNT }, (_, index) => ({
    id: index + 1,
    state: index === 0 ? "current" : "locked",
}));

function createLevelButton(level: Level): HTMLDivElement {
    const col = document.createElement("div");
    col.className = "col";

    const button = document.createElement("button");
    button.type = "button";
    button.id = `level-${level.id}-btn`;
    button.textContent = `Level ${level.id}`;
    button.className = `level-select level-select--${level.state}`;
    button.disabled = level.state === "locked";

    col.append(button);
    return col;
}

export function renderLevelGrid(container: HTMLElement): void {
    container.replaceChildren(
        ...levels.map((level) => createLevelButton(level)),
    );
}

export function completeLevel(id: number): void {
    const level = levels.find((entry) => entry.id === id);
    if (!level || level.state === "locked") {
        return;
    }

    level.state = "finished";

    const next = levels.find((entry) => entry.id === id + 1);
    if (next?.state === "locked") {
        next.state = "current";
    }
}
