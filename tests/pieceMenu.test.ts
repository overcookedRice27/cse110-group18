// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { closePieceMenu, openPieceMenu } from "../src/konva/pieceMenu";

afterEach(() => closePieceMenu());

describe("right-click menu", () => {
    it("removes on click and closes", () => {
        const onRemove = vi.fn();
        openPieceMenu(10, 10, "Remove gate", onRemove);
        const button = document.getElementById("piece-context-menu")!;
        expect(button.textContent).toBe("Remove gate");
        button.click();
        expect(onRemove).toHaveBeenCalledOnce();
        expect(document.getElementById("piece-context-menu")).toBeNull();
    });

    it("dismisses on Escape without removing", () => {
        const onRemove = vi.fn();
        openPieceMenu(10, 10, "Remove wire", onRemove);
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(document.getElementById("piece-context-menu")).toBeNull();
        expect(onRemove).not.toHaveBeenCalled();
    });
});
