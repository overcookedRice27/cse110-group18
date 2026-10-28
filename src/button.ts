import { COLORS, BUTTON } from "./constants";

const buttonDimensions = {
    width: BUTTON.WIDTH,
    height: BUTTON.HEIGHT,
};
//html buttons in html (cleaner, doesn't need rendering, controlled by browser)
export function createButton( //factory function (can reuse already configured object)
    name: string,
    dimension = buttonDimensions,

): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;

    Object.assign(button.style, { //adding bootstrap later
         width: `${dimension.width}px`,
        height: `${dimension.height}px`,
        borderRadius: "12px",
        background: COLORS.BUTTON.BACKGROUND,
        border: `2px solid ${COLORS.BUTTON.BORDER}`,
        color: COLORS.BUTTON.TEXT,
        fontSize: "30px",
        textAlign: "center",
        cursor: "pointer", // replaces the mouseover/mouseout handlers
        boxSizing: "border-box",
    });

    return button;
}

