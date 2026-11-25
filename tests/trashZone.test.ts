import "./textCanvas";
import Konva from "konva";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setCreatorView, TRASH } from "../src/konva/constants";
import { bindTrashHighlight, createCreatorPanel } from "../src/konva/levels/creatorPanel";
import { isPointerOverCreatorPanel } from "../src/konva/utils/grid";

// Konva.Layer needs a real canvas; a Group stands in for it in these tests.
vi.mock("konva", async (importOriginal) => {
    const mod = await importOriginal<typeof import("konva")>();
    // Changing a fill asks the nearest container to redraw; there is no canvas here.
    Object.assign(mod.default.Group.prototype, { batchDraw: () => undefined });
    class FakeLayer extends mod.default.Group {}
    return { ...mod, default: { ...mod.default, Layer: FakeLayer } };
});

afterEach(() => {
    setCreatorView(true);
    vi.unstubAllGlobals();
});

type Point = { x: number; y: number };

// Konva's Stage needs a real DOM, so use a plain node that reports a pointer position.
function fakeStage(pointer: Point) {
    const stage = new Konva.Group();
    const getPointerPosition = vi.fn((): Point => pointer);
    Object.assign(stage, { getPointerPosition });
    return { stage: stage as unknown as Konva.Stage, getPointerPosition };
}

function pieceWithPointer(pointer: Point) {
    const piece = new Konva.Group();
    vi.spyOn(piece, "getStage").mockReturnValue(fakeStage(pointer).stage);
    return piece;
}

const overTrash = { x: TRASH.X + 20, y: TRASH.Y + 20 };

describe("trash zone", () => {
    it("is added to the player palette only", () => {
        const player = createCreatorPanel(new Konva.Layer(), false);
        const creator = createCreatorPanel(new Konva.Layer(), true);
        expect(player.findOne(".trashZone")).toBeDefined();
        expect(creator.findOne(".trashZone")).toBeUndefined();
    });

    it("counts a drop on the trash as a delete in player view", () => {
        setCreatorView(false);
        expect(isPointerOverCreatorPanel(pieceWithPointer(overTrash))).toBe(true);
    });

    it("counts a drop in the margin around the button, so big gates are easy to delete", () => {
        setCreatorView(false);
        const below = { x: TRASH.X + 20, y: TRASH.Y + TRASH.HEIGHT + TRASH.HIT_MARGIN_BOTTOM - 5 };
        const beside = { x: TRASH.X + TRASH.WIDTH + 4, y: TRASH.Y + 10 };
        expect(isPointerOverCreatorPanel(pieceWithPointer(below))).toBe(true);
        expect(isPointerOverCreatorPanel(pieceWithPointer(beside))).toBe(true);
    });

    it("does not count a drop past the margin or on the grid", () => {
        setCreatorView(false);
        const tooLow = { x: TRASH.X + 20, y: TRASH.Y + TRASH.HEIGHT + TRASH.HIT_MARGIN_BOTTOM + 5 };
        expect(isPointerOverCreatorPanel(pieceWithPointer(tooLow))).toBe(false);
        expect(isPointerOverCreatorPanel(pieceWithPointer({ x: 500, y: 200 }))).toBe(false);
    });

    it("highlights while dragging over it and resets after the drop", () => {
        const { stage, getPointerPosition } = fakeStage(overTrash);
        const panel = createCreatorPanel(new Konva.Layer(), false);
        vi.spyOn(panel, "getStage").mockReturnValue(stage);
        bindTrashHighlight(panel);
        const zone = panel.findOne<Konva.Rect>(".trashZone")!;
        const idle = zone.fill();

        stage.fire("dragmove");
        expect(zone.fill()).not.toBe(idle);

        getPointerPosition.mockReturnValue({ x: 500, y: 200 });
        stage.fire("dragmove");
        expect(zone.fill()).toBe(idle);

        getPointerPosition.mockReturnValue(overTrash);
        stage.fire("dragmove");
        stage.fire("dragend");
        expect(zone.fill()).toBe(idle);
    });

    it("resets when the dropped piece destroys itself before dragend reaches the stage", () => {
        const fakeWindow = new EventTarget();
        vi.stubGlobal("window", fakeWindow);
        const { stage } = fakeStage(overTrash);
        const panel = createCreatorPanel(new Konva.Layer(), false);
        vi.spyOn(panel, "getStage").mockReturnValue(stage);
        bindTrashHighlight(panel);
        const zone = panel.findOne<Konva.Rect>(".trashZone")!;
        const idle = zone.fill();

        stage.fire("dragmove");
        expect(zone.fill()).not.toBe(idle);

        // No stage dragend: the piece was destroyed first. Only the release happens.
        fakeWindow.dispatchEvent(new Event("mouseup"));
        expect(zone.fill()).toBe(idle);
    });
});
