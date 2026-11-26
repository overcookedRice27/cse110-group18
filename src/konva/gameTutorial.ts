import Konva from "konva";
import { CREATOR_PANEL, GRID, isCreatorView } from "./constants";

// The guide never blocks the canvas, so players can try each step as they read.
export function setupGameTutorial(stage: Konva.Stage, grid: Konva.Layer): () => void {
    const openButton = document.getElementById("game-how-to-btn") as HTMLButtonElement;
    const guide = document.getElementById("game-tutorial") as HTMLElement;
    const progress = document.getElementById("game-tutorial-progress") as HTMLElement;
    const title = document.getElementById("game-tutorial-title") as HTMLElement;
    const text = document.getElementById("game-tutorial-text") as HTMLElement;
    const back = document.getElementById("tutorial-back") as HTMLButtonElement;
    const next = document.getElementById("tutorial-next") as HTMLButtonElement;
    const skip = document.getElementById("tutorial-skip") as HTMLButtonElement;
    const validate = document.getElementById("validate-circuit-btn") as HTMLButtonElement;

    const steps = [
        { title: "Build your circuit", text: "Drag wires and gates from the toolbox onto the grid. You can also turn on Place wires and click empty cells." },
        { title: "Turn on an input", text: "Click an input switch to turn it on or off. Constant HIGH and LOW inputs cannot be switched." },
        { title: "Connect the exit", text: "Connect the wires and gates so that power reaches every exit. Check the gate requirements beside the board." },
        { title: "Validate your circuit", text: "When your circuit is ready, click Validate Circuit. You can skip or finish this guide at any time." },
    ];

    const highlightLayer = new Konva.Layer({ listening: false });
    const highlight = new Konva.Rect({ stroke: "#e48a00", strokeWidth: 4, cornerRadius: 6, listening: false });
    highlightLayer.add(highlight);
    stage.add(highlightLayer);
    highlightLayer.hide();
    let step = 0;

    function close(): void {
        guide.hidden = true;
        validate.classList.remove("tutorial-highlight");
        highlightLayer.hide();
    }

    function showStep(): void {
        progress.textContent = `Step ${step + 1} of ${steps.length}`;
        title.textContent = steps[step].title;
        text.textContent = steps[step].text;
        back.disabled = step === 0;
        next.textContent = step === steps.length - 1 ? "Finish" : "Next";
        validate.classList.remove("tutorial-highlight");
        highlightLayer.hide();

        if (step === 3) {
            validate.classList.add("tutorial-highlight");
            return;
        }

        if (step === 0) {
            highlight.setAttrs({
                x: CREATOR_PANEL.X,
                y: CREATOR_PANEL.Y,
                width: CREATOR_PANEL.WIDTH,
                height: isCreatorView ? CREATOR_PANEL.HEIGHT : CREATOR_PANEL.PLAYER_HEIGHT,
            });
        } else {
            const type = step === 1 ? "input" : "exit";
            const piece = grid.findOne((node: Konva.Node) => node.getAttr("elementType") === type);
            if (piece) {
                const bounds = piece.getClientRect({ relativeTo: stage });
                highlight.setAttrs({ x: bounds.x - 4, y: bounds.y - 4, width: bounds.width + 8, height: bounds.height + 8 });
            } else {
                // An empty creator board has no input or exit to highlight yet.
                highlight.setAttrs({ x: grid.x(), y: grid.y(), width: GRID.WIDTH, height: GRID.HEIGHT });
            }
        }
        highlightLayer.moveToTop();
        highlightLayer.show();
    }

    openButton.addEventListener("click", () => {
        step = 0;
        guide.hidden = false;
        showStep();
    });
    back.addEventListener("click", () => {
        if (step > 0) step--;
        showStep();
    });
    next.addEventListener("click", () => {
        if (step === steps.length - 1) {
            close();
            return;
        }
        step++;
        showStep();
    });
    skip.addEventListener("click", close);
    return close;
}
