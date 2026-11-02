// Connects the scenario data (scenarios.ts) to the scenario screen in index.html.

import { SCENARIOS, checkAnswer, isGate, type Gate } from "./scenarios";

const EMPTY_BLANK = "_______";

export function initScenarioGame(onExit: () => void): { open: () => void } {
    const $ = (id: string) => document.getElementById(id) as HTMLElement;
    const screen = $("scenario-screen");
    const progress = $("scenario-progress");
    const before = $("scenario-before");
    const blank = $("scenario-blank");
    const after = $("scenario-after");
    const feedback = $("scenario-feedback");
    const submitBtn = $("scenario-submit-btn");
//gets each piece of page and organizes into different sections

    let index = 0; // which question we are on
    let choice: Gate | null = null; // the word currently in the blank
    let solved = false; // true after a correct answer

    function setBlank(gate: Gate | null): void {
        choice = gate;
        blank.textContent = gate ?? EMPTY_BLANK;
    }

    function setFeedback(text: string, type: "secondary" | "success" | "danger"): void {
        feedback.textContent = text;
        feedback.className = `alert alert-${type}`;
    }

    function showQuestion(): void {
        before.textContent = SCENARIOS[index].before;
        after.textContent = SCENARIOS[index].after;
        progress.textContent = `Question ${index + 1}/${SCENARIOS.length}`;
        blank.classList.remove("is-correct");
        setBlank(null);
        setFeedback("Drag a word into the blank, then press Submit.", "secondary");
        submitBtn.textContent = "Submit";
        solved = false;
    }

    // Puts a word in the blank (ignored once the question is solved or the word isn't a gate)
    function fillBlank(value: string): void {
        if (!solved && isGate(value)) setBlank(value);
    }

    function exit(): void {
        screen.hidden = true;
        onExit();
    }

    // Choices: drag them, or click them (fallback for touch screens)
    document.querySelectorAll<HTMLElement>(".scenario-choice").forEach((btn) => {
        const gate = btn.dataset.gate ?? "";
        btn.addEventListener("dragstart", (e) => e.dataTransfer?.setData("text/plain", gate));
        btn.addEventListener("click", () => fillBlank(gate));
    });

    // The blank is the drop target
    blank.addEventListener("dragover", (e) => e.preventDefault()); // allows dropping
    blank.addEventListener("drop", (e) => {
        e.preventDefault();
        fillBlank(e.dataTransfer?.getData("text/plain") ?? "");
    });

    submitBtn.addEventListener("click", () => {
        const isLast = index === SCENARIOS.length - 1;

        // After a correct answer the button says "Next question" or "Finish"
        if (solved) {
            if (isLast) {
                exit();
            } else {
                index += 1;
                showQuestion();
            }
            return;
        }

        const result = checkAnswer(SCENARIOS[index], choice);
        if (result.correct) {
            solved = true;
            blank.classList.add("is-correct");
            setFeedback(result.message, "success");
            submitBtn.textContent = isLast ? "Finish" : "Next question";
        } else {
            setFeedback(result.message, "danger");
            setBlank(null); // send the wrong word back so the player can try again
        }
    });

    $("scenario-back-btn").addEventListener("click", exit);

    return {
        open(): void {
            index = 0;
            showQuestion();
            screen.hidden = false;
        },
    };
}