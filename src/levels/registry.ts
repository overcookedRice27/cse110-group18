import type { LevelData } from "../konva/levels/levelData";
import level1 from "./level-1.json";
import level2 from "./level-2.json";
import level3 from "./level-3.json";
import level4 from "./level-4.json";
import level5 from "./level-5.json";
import level6 from "./level-6.json";
import level7 from "./level-7.json";
import level8 from "./level-8.json";
import level9 from "./level-9.json";
import level10 from "./level-10.json";

// Keep the ten playable layouts in level-ID order for menu and game lookups.
export const LEVEL_REGISTRY: readonly LevelData[] = [
    level1, level2, level3, level4, level5,
    level6, level7, level8, level9, level10,
] as LevelData[];

export const LEVEL_COUNT = LEVEL_REGISTRY.length;

// Return the layout (including its ID) for a one-based integer level number.
export function getLevel(level: number): LevelData {
    if (!Number.isInteger(level) || level < 1 || level > LEVEL_COUNT) {
        throw new RangeError(`Invalid level ID: ${level}`);
    }
    return LEVEL_REGISTRY[level - 1];
}
