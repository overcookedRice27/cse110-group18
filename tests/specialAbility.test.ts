
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Wall Breaker", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("starts with zero charge", async () => {
        const { getCharge } = await import("../src/konva/specialAbility");

        expect(getCharge()).toBe(0);
    });

    it("gains 50 percent charge", async () => {
        const { getCharge, increaseCharge } =
            await import("../src/konva/specialAbility");

        increaseCharge();

        expect(getCharge()).toBe(50);
    });

    it("reaches full charge after two increases", async () => {
        const { getCharge, increaseCharge } =
            await import("../src/konva/specialAbility");

        increaseCharge();
        increaseCharge();

        expect(getCharge()).toBe(100);
    });

    it("cannot exceed 100 percent charge", async () => {
        const { getCharge, increaseCharge } =
            await import("../src/konva/specialAbility");

        increaseCharge();
        increaseCharge();
        increaseCharge();

        expect(getCharge()).toBe(100);
    });

    it("cannot activate without full charge", async () => {
        const { increaseCharge, useSpecialAbility, getCharge } =
            await import("../src/konva/specialAbility");

        increaseCharge();

        expect(useSpecialAbility()).toBe(0);
        expect(getCharge()).toBe(50);
    });

    it("retains charge if there are no walls", async () => {
        const { increaseCharge, useSpecialAbility, getCharge } =
            await import("../src/konva/specialAbility");

        increaseCharge();
        increaseCharge();

        expect(useSpecialAbility()).toBe(0);
        expect(getCharge()).toBe(100);
    });

    it("restores charge from a saved value", async () => {
        const { getCharge, setCharge } =
            await import("../src/konva/specialAbility");

        setCharge(50);

        expect(getCharge()).toBe(50);
    });

    it("resets charge for a new game", async () => {
        const { getCharge, setCharge, increaseCharge } =
            await import("../src/konva/specialAbility");

        increaseCharge();
        increaseCharge();

        setCharge(0);

        expect(getCharge()).toBe(0);
    });

    it("rejects negative charge values", async () => {
        const { getCharge, setCharge } =
            await import("../src/konva/specialAbility");

        setCharge(-50);

        expect(getCharge()).toBe(0);
    });

    it("caps restored charge at 100 percent", async () => {
        const { getCharge, setCharge } =
            await import("../src/konva/specialAbility");

        setCharge(150);

        expect(getCharge()).toBe(100);
    });
});
