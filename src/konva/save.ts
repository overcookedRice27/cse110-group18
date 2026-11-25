import type { LevelData } from "./levels/levelData";
import type { ArchivedLevelMetadata } from "../levels/level-metadata";

const SAVE_KEY = "logicGame.save"; //data stored in localStorage
const SAVE_VERSION = 1;
// Share the playable level count with selection and lookup.
import { LEVEL_COUNT as TOTAL_LEVELS } from "../levels/registry";

type LevelSave = {
    version: number;
    highestCompleted: number;
    level: LevelData;
    specialAbilityCharge?: number;
    archivedMetadata?: ArchivedLevelMetadata[];
};

// Store a board snapshot and progress using one shared format for all player levels.
export function saveLevel(
    level: LevelData,
    highestCompleted: number,
    specialAbilityCharge: number = 0,
    metadataToArchive?: ArchivedLevelMetadata,
): void {
    // Older saves can omit the archive. Ordinary saves carry existing entries forward.
    const savedArchive = loadSavedLevel()?.archivedMetadata;
    const archivedMetadata = Array.isArray(savedArchive) ? savedArchive : [];
    if (metadataToArchive) archivedMetadata.push(metadataToArchive);
    const data: LevelSave = {
        version: SAVE_VERSION,
        highestCompleted,
        level,
        specialAbilityCharge,
        archivedMetadata,
    };

    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

// Read a saved session; the level importer validates its board before restoration.
export function loadSavedLevel(): LevelSave | null
{
    try
    {
        const raw = localStorage.getItem(SAVE_KEY);
        const data = raw === null ? null : JSON.parse(raw);
        if (data?.version !== SAVE_VERSION || !Number.isInteger(data.highestCompleted) ||
            data.highestCompleted < 0 || data.highestCompleted > TOTAL_LEVELS ||
            !Number.isInteger(data.level?.id) || data.level.id < 1 ||
            data.level.id > TOTAL_LEVELS || !Array.isArray(data.level.pieces))
        {
            return null;
        }
        return data;
    }
    catch
    {
        return null;
    }
}

// Detect any local game save, including one that fails progress validation.
export function hasLocalSave(): boolean
{
    return localStorage.getItem(SAVE_KEY) !== null;
}

// Clear only the game's save after the player confirms starting over.
export function clearLocalSave(): void
{
    localStorage.removeItem(SAVE_KEY);
}

export function hasProgress(): boolean {
    if (loadSavedLevel() !== null)
    {
        return true;
    }
    try {
        const raw = localStorage.getItem(SAVE_KEY); //retrieves prev game data from local storage
        if (raw === null) return false;

        const data = JSON.parse(raw); //convert string data to javascript obj
        //^^done to access properties like .version or .highestcompleted
        return (
            data.version === SAVE_VERSION && //correct save format version
            Number.isInteger(data.highestCompleted) && //level must be whole num
            data.highestCompleted >= 1 && //must complete atleast one level
            data.highestCompleted <= TOTAL_LEVELS //cannot exceed total num of levels
            //checks if progress is valid
        );
    } catch {
        return false;
    }
}
