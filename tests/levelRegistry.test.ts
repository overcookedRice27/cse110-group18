import { describe, expect, it } from "vitest";
import { getLevel, LEVEL_COUNT, LEVEL_REGISTRY } from "../src/levels/registry";

// Verify that all playable IDs resolve to the actual layouts in the registry.
describe("level registry", () => {
    it("registers ten levels in ID order", () => {
        expect(LEVEL_COUNT).toBe(10);
        expect(LEVEL_REGISTRY.map((level) => level.id)).toEqual(
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        );
    });

    it.each(Array.from({ length: 10 }, (_, index) => index + 1))(
        "returns the actual layout for level %i",
        (id) => {
            expect(getLevel(id)).toBe(LEVEL_REGISTRY[id - 1]);
            expect(getLevel(id).id).toBe(id);
            expect(getLevel(id).pieces.length).toBeGreaterThan(0);
        },
    );

    // Invalid IDs must not silently select a different level or return undefined.
    it.each([0, -1, 11, 1.5, NaN, Infinity])("rejects invalid ID %s", (id) => {
        expect(() => getLevel(id)).toThrow(RangeError);
    });
});
