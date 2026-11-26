// Small right-click menu with a single "Remove" action, shown next to the pointer.
let menu: HTMLButtonElement | null = null;

export function closePieceMenu(): void {
    menu?.remove();
    menu = null;
}

export function openPieceMenu(
    clientX: number,
    clientY: number,
    label: string,
    onRemove: () => void,
): void {
    closePieceMenu();

    const button = document.createElement("button");
    button.type = "button";
    button.id = "piece-context-menu";
    button.className = "btn btn-light btn-sm border text-danger fw-semibold";
    button.textContent = label;
    button.style.position = "fixed";
    button.style.left = `${clientX}px`;
    button.style.top = `${clientY}px`;
    button.style.zIndex = "1000";
    button.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.2)";
    button.style.borderRadius = "8px";
    button.style.padding = "6px 14px";
    button.addEventListener("click", () => {
        closePieceMenu();
        onRemove();
    });
    document.body.appendChild(button);
    menu = button;

    // Any outside click, Escape, or scroll dismisses the menu without removing.
    const dismiss = (event: Event): void => {
        if (event.target === button) return;
        if (event instanceof KeyboardEvent && event.key !== "Escape") return;
        closePieceMenu();
        document.removeEventListener("mousedown", dismiss, true);
        document.removeEventListener("keydown", dismiss, true);
        document.removeEventListener("scroll", dismiss, true);
    };
    document.addEventListener("mousedown", dismiss, true);
    document.addEventListener("keydown", dismiss, true);
    document.addEventListener("scroll", dismiss, true);
}
