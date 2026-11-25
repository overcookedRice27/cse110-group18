import Konva from "konva";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyBoardTheme } from "../src/konva/boardTheme";
import { COLORS, COLOR_PRESETS, setBoardColors } from "../src/konva/constants";

// The theme code only reads and updates shape colors; no canvas is needed.
function makeShape(fill: string, stroke: string, parentName = "") {
    return {
        fill: vi.fn(function (value?: string) {
            if (value !== undefined) fill = value;
            return fill;
        }),
        stroke: vi.fn(function (value?: string) {
            if (value !== undefined) stroke = value;
            return stroke;
        }),
        getParent: () => ({ name: () => parentName }),
    };
}

afterEach(() => setBoardColors("light"));

describe("board themes", () => {
    it("updates existing shapes and switches back without changing powered colors", () => {
        setBoardColors("light");
        const gridLine = makeShape("", COLOR_PRESETS.light.GRID.STROKE, "grid");
        const wire = makeShape("", COLOR_PRESETS.light.WIRE.BACKGROUND);
        const poweredWire = makeShape("", COLOR_PRESETS.light.WIRE.POWERED);
        const text = makeShape(COLOR_PRESETS.light.BUTTON.TEXT, "");
        const background = makeShape(COLOR_PRESETS.light.BUTTON.BACKGROUND, "");
        const marker = makeShape(COLOR_PRESETS.light.TOOLBOX.GATE, "");
        const stage = {
            find: () => [gridLine, wire, poweredWire, text, background, marker],
            batchDraw: vi.fn(),
        } as unknown as Konva.Stage;

        applyBoardTheme(stage, "dark");
        expect(gridLine.stroke()).toBe(COLOR_PRESETS.dark.GRID.STROKE);
        expect(wire.stroke()).toBe(COLOR_PRESETS.dark.WIRE.BACKGROUND);
        expect(poweredWire.stroke()).toBe(COLOR_PRESETS.dark.WIRE.POWERED);
        expect(text.fill()).toBe(COLOR_PRESETS.dark.BUTTON.TEXT);
        expect(background.fill()).toBe(COLOR_PRESETS.dark.BUTTON.BACKGROUND);
        expect(marker.fill()).toBe(COLOR_PRESETS.dark.TOOLBOX.GATE);
        expect(COLORS).toBe(COLOR_PRESETS.dark);

        applyBoardTheme(stage, "light");
        expect(gridLine.stroke()).toBe(COLOR_PRESETS.light.GRID.STROKE);
        expect(wire.stroke()).toBe(COLOR_PRESETS.light.WIRE.BACKGROUND);
        expect(text.fill()).toBe(COLOR_PRESETS.light.BUTTON.TEXT);
        expect(marker.fill()).toBe(COLOR_PRESETS.light.TOOLBOX.GATE);
        expect(COLORS).toBe(COLOR_PRESETS.light);
    });
});
