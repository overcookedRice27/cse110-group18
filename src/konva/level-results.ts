import Konva from "konva";
import { createButton } from "./button";
import { COLORS, STAGE } from "./constants";

// Successful validation opens this submenu; buttons emit navigation events to its stage.
export const LEVEL_RESULTS_EVENTS = {
    CLEARED: "levelResultsCleared",
    EXIT: "levelResultsExit",
    CONTINUE: "levelResultsContinue",
} as const;

// A snapshot keeps the displayed result fixed after the validation timer stops.
export type LevelResultSummary = {
    timeSpentMs: number;
    incorrectValidations: number;
    newPersonalBest?: boolean;
};

export function lockBackgroundWhileVisible(results: Konva.Layer): void {
    // Preserve prior states so closing restores controls without enabling locked ones.
    const disabledButtons = new Map<HTMLButtonElement, boolean>();
    const backgroundLayers = new Map<Konva.Node, boolean>();
    results.on("visibleChange", () => {
        if (results.visible()) {
            // The backdrop covers only canvas content; disable the HTML header too.
            document.querySelectorAll?.<HTMLButtonElement>("#game-view button").forEach((button) => {
                if (!disabledButtons.has(button)) disabledButtons.set(button, button.disabled);
                button.disabled = true;
            });
            // Prevent pointer interaction with every background Konva layer.
            results.getParent()?.getChildren().forEach((layer) => {
                if (layer === results) return;
                if (!backgroundLayers.has(layer)) backgroundLayers.set(layer, layer.listening());
                layer.listening(false);
            });
        } else {
            disabledButtons.forEach((disabled, button) => { button.disabled = disabled; });
            backgroundLayers.forEach((listening, layer) => { layer.listening(listening); });
            disabledButtons.clear();
            backgroundLayers.clear();
        }
    });
}

export function createLevelResults(): Konva.Layer {
    const results = new Konva.Layer({ name: "levelResults", visible: false });
    lockBackgroundWhileVisible(results);
    // Cover the board so clicks cannot edit the circuit underneath the dialog.
    const backdrop = new Konva.Rect({
        width: STAGE.WIDTH,
        height: STAGE.HEIGHT,
        fill: "rgba(0, 0, 0, 0.35)",
    });
    const width = 440;
    const height = 278;
    const box = new Konva.Group({
        x: (STAGE.WIDTH - width) / 2,
        y: (STAGE.HEIGHT - height) / 2,
    });

    box.add(new Konva.Rect({
        width,
        height,
        fill: COLORS.UI.BACKGROUND,
        stroke: COLORS.BUTTON.BORDER,
        strokeWidth: 2,
        cornerRadius: 12,
    }));


    box.add(new Konva.Text({
        text: "Level cleared!",
        y: 32,
        width,
        fontSize: 32,
        fill: COLORS.BUTTON.TEXT,
        align: "center",
    }));

    // Subtext uses smaller shared-color typography beneath the cleared heading.
    const summaryText = new Konva.Text({
        name: "resultsSummary",
        y: 88,
        width,
        fontSize: 20,
        lineHeight: 1.5,
        fill: COLORS.BUTTON.TEXT,
        align: "center",
    });
    box.add(summaryText);

    const personalBest = new Konva.Group({ name: "resultsPersonalBest", x: 118, y: 150, visible: false });
    personalBest.add(new Konva.Rect({ width: 204, height: 28, fill: "#17324D", cornerRadius: 14 }));
    personalBest.add(new Konva.Text({
        text: "new personal best!",
        width: 204,
        height: 28,
        fontSize: 16,
        fill: "#ADD8E6",
        align: "center",
        verticalAlign: "middle",
    }));
    box.add(personalBest);

    // Reuse the shared button shape, typography, and pointer behavior.
    const exit = createButton("Exit", { width: 180, height: 60 });
    const next = createButton("Continue", { width: 180, height: 60 });

    exit.name("resultsExit");
    next.name("resultsContinue");
    exit.position({ x: 30, y: 190 });
    next.position({ x: 230, y: 190 });

    for (const [button, event] of [
        [exit, LEVEL_RESULTS_EVENTS.EXIT],
        [next, LEVEL_RESULTS_EVENTS.CONTINUE],
    ] as const) {
        button.on("click tap", () => {
            results.hide();
            document.body.style.cursor = "default";
            // Bubble to the stage; screen ownership stays with the menu handlers.
            results.fire(event, {}, true);
        });
    }
    
    box.add(exit, next);
    results.add(backdrop, box);
    results.on(LEVEL_RESULTS_EVENTS.CLEARED, (event) => {
        // Render each success snapshot anew so another level cannot retain old stats.
        const summary = (event as Konva.KonvaEventObject<Event> & { summary?: LevelResultSummary }).summary;
        const seconds = Math.max(0, (summary?.timeSpentMs ?? 0)) / 1000;
        summaryText.setAttr("text",
            `Time to clear: ${seconds.toFixed(1)} s\nIncorrect validations: ${summary?.incorrectValidations ?? 0}`,
        );
        personalBest.visible(summary?.newPersonalBest === true);
        results.show();
        results.moveToTop();
    });
    return results;
}
