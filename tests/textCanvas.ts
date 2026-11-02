import Konva from "konva";
import { beforeAll, vi } from "vitest";

// Konva measures text during construction; these tests do not render a canvas.
beforeAll(() => {
    vi.spyOn(Konva.Util, "createCanvasElement").mockReturnValue({
        getContext: () => ({ save: () => {}, restore: () => {}, measureText: (text: string) => ({ width: text.length * 10 }) }),
    } as unknown as HTMLCanvasElement);
});
