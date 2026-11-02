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

// Require the immediately previous level to be finished; Level 1 has no prerequisite.
export function isLevelUnlocked(id: number): boolean
{
    const level = levels.find((entry) => entry.id === id);
    if (!level)
    {
        return false;
    }
    const unlocked = id === 1 || levels.find((entry) => entry.id === id - 1)?.state === "finished";
    if (!unlocked)
    {
        level.state = "locked";
    }
    else if (level.state !== "finished")
    {
        level.state = "current";
    }
    return unlocked;
}

// Restore initial level availability when starting a new game.
export function resetLevels(): void
{
    for (const level of levels)
    {
        level.state = level.id === 1 ? "current" : "locked";
    }
}

function createLevelButton(level: Level): HTMLDivElement {
    const unlocked = isLevelUnlocked(level.id);
    const col = document.createElement("div");
    col.className = "col";

    const button = document.createElement("button");
    button.type = "button";
    button.id = `level-${level.id}-btn`;
    button.textContent = `Level ${level.id}`;
    button.className = `level-select level-select--${level.state}`;
    button.disabled = !unlocked;

    col.append(button);
    return col;
}

export function renderLevelGrid(container: HTMLElement): void {
    container.replaceChildren(
        ...levels.map((level) => createLevelButton(level)),
    );
}

// Reject out-of-order completion and apply the same prerequisite check to the next level.
export function completeLevel(id: number): void
{
    const level = levels.find((entry) => entry.id === id);
    if (!level || !isLevelUnlocked(id))
    {
        return;
    }

    level.state = "finished";

    isLevelUnlocked(id + 1);
}
