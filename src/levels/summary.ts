import Konva from "konva";
import { createButton } from "../konva/button";
import { COLORS, STAGE } from "../konva/constants";
import { LEVEL_RESULTS_EVENTS, lockBackgroundWhileVisible } from "../konva/level-results";
import { loadSavedLevel } from "../konva/save";
import { LEVEL_METADATA, type ArchivedLevelMetadata } from "./level-metadata";

export const FINALE_CLEARED = "finaleCleared";

type LevelRecord = { levelId: number; value: number };

function getRecords(archive: readonly ArchivedLevelMetadata[], metric: "time" | "attempts"): LevelRecord[] {
    const byLevel = new Map<number, number>();
    for (const entry of archive) {
        if (!entry || !Number.isInteger(entry.levelId) || !LEVEL_METADATA[entry.levelId - 1]) continue;
        const firstTry = entry.incorrectValidations === 0 && entry.correctValidations > 0;
        const value = metric === "time"
            ? entry.bestTimeMs ?? (firstTry ? entry.timeSpentMs : undefined)
            : entry.best_attempt_count ?? (firstTry ? 1 : undefined);
        if (value === undefined || !Number.isFinite(value) || value < 0) continue;
        if (metric === "attempts" && (!Number.isInteger(value) || value < 1)) continue;
        byLevel.set(entry.levelId, Math.min(value, byLevel.get(entry.levelId) ?? Infinity));
    }
    return Array.from(byLevel, ([levelId, value]) => ({ levelId, value }))
        .sort((left, right) => left.value - right.value || left.levelId - right.levelId);
}

export function getBestRecords(archive: readonly ArchivedLevelMetadata[]) {
    return {
        bestTime: getRecords(archive, "time")[0],
        lowestAttempts: getRecords(archive, "attempts")[0],
    };
}

export function getTotalTimeMs(archive: readonly ArchivedLevelMetadata[]): number | null {
    const times = getRecords(archive, "time");
    return times.length === LEVEL_METADATA.length
        ? times.reduce((total, record) => total + record.value, 0)
        : null;
}

export function formatTotalTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
        .map((part) => String(part).padStart(2, "0")).join(":");
}

function getTotalFailedAttempts(archive: readonly ArchivedLevelMetadata[]): number {
    const previousLegacyCounts = new Map<number, number>();
    let total = 0;
    for (const entry of archive) {
        if (!entry || !Number.isInteger(entry.incorrectValidations) || entry.incorrectValidations < 0) continue;
        if (entry.newFailedAttempts !== undefined) {
            total += entry.newFailedAttempts;
            continue;
        }
        const previous = previousLegacyCounts.get(entry.levelId) ?? 0;
        // Legacy counters accumulated within a session and dropped on restart.
        total += entry.incorrectValidations >= previous
            ? entry.incorrectValidations - previous
            : entry.incorrectValidations;
        previousLegacyCounts.set(entry.levelId, entry.incorrectValidations);
    }
    return LEVEL_METADATA.reduce(
        (count, level) => count + level.incorrectValidations - level.archivedIncorrectValidations,
        total,
    );
}

export function createFinale(): Konva.Layer {
    const finale = new Konva.Layer({ name: "finale", visible: false });
    lockBackgroundWhileVisible(finale);
    const width = 640;
    const height = 340;
    const panel = new Konva.Group({ x: (STAGE.WIDTH - width) / 2, y: (STAGE.HEIGHT - height) / 2 });
    finale.add(new Konva.Rect({ width: STAGE.WIDTH, height: STAGE.HEIGHT, fill: "rgba(0, 0, 0, 0.35)" }), panel);
    panel.add(new Konva.Rect({
        width, height, fill: COLORS.UI.BACKGROUND, stroke: COLORS.BUTTON.BORDER, strokeWidth: 2, cornerRadius: 12,
    }));
    panel.add(new Konva.Text({
        text: "You Completed All Levels!", y: 32, width, fontSize: 36, align: "center", fill: COLORS.BUTTON.TEXT,
    }));
    const stats = new Konva.Text({
        name: "finaleStats", y: 100, width, fontSize: 20, lineHeight: 1.6, align: "center", fill: COLORS.BUTTON.TEXT,
    });
    const menu = createButton("Menu", { width: 180, height: 60 });
    menu.name("finaleMenu");
    menu.position({ x: (width - 180) / 2, y: 248 });
    menu.on("click tap", () => {
        finale.hide();
        document.body.style.cursor = "default";
        finale.fire(LEVEL_RESULTS_EVENTS.EXIT, {}, true);
    });
    panel.add(stats, menu);
    finale.on(FINALE_CLEARED, () => {
        const saved = loadSavedLevel()?.archivedMetadata;
        const archive = Array.isArray(saved) ? saved : [];
        const { bestTime, lowestAttempts } = getBestRecords(archive);
        const totalTime = getTotalTimeMs(archive);
        stats.setAttr("text", [
            `Best clear time: ${bestTime ? `${(bestTime.value / 1000).toFixed(2)} s (Level ${bestTime.levelId})` : "Unavailable"}`,
            `Fewest attempts: ${lowestAttempts ? `${lowestAttempts.value} (Level ${lowestAttempts.levelId})` : "Unavailable"}`,
            `Total failed attempts: ${getTotalFailedAttempts(archive)}`,
            `Total clear time: ${totalTime === null ? "Unavailable" : formatTotalTime(totalTime)}`,
        ].join("\n"));
        finale.show();
        finale.moveToTop();
    });
    return finale;
}
