// Connects the truth table logic (src/minigames/truthTable.ts) to the screen in index.html.
import {
    GATE_TEXT,
    TOTAL_ROUNDS,
    createRound,
    evaluateGate,
    isRoundComplete,
    nextRound,
    placeToken,
    type Bit,
    type GateName,
    type Round,
} from "../../minigames/truthTable";

const GATE_SYMBOL: Record<GateName, string> = {
    AND: "&",
    OR: "|",
    XOR: "^",
};

export function initTruthTableGame(onExit: () => void): { open: () => void } {
    const $ = (id: string) => document.getElementById(id) as HTMLElement;
    const screen = $("truth-table-screen");
    const title = $("tt-title");
    const progress = $("tt-progress");
    const tableBody = $("tt-table-body");
    const feedback = $("tt-feedback");
    const rule = $("tt-rule");
    const nextBtn = $("tt-next-btn") as HTMLButtonElement;
    const backBtn = $("tt-back-btn");
    const corner = $("tt-corner");

    let round: Round = createRound(1); // the round being played

    // Draws everything on the screen from the current round.
    function render(): void {
        // 1. Fill in the simple text pieces
        title.textContent = `Truth table: ${round.gate}`;
        corner.textContent = `A ${GATE_SYMBOL[round.gate]} B`;
        progress.textContent = `Round ${round.roundNumber}/${TOTAL_ROUNDS}`;
        rule.textContent = GATE_TEXT[round.gate].rule;
        nextBtn.disabled = !isRoundComplete(round);
        nextBtn.textContent = round.roundNumber === TOTAL_ROUNDS ? "Finish!" : "Next round";  
        const isLastRound = round.roundNumber === TOTAL_ROUNDS;
        nextBtn.classList.toggle("btn-success", isLastRound);
        nextBtn.classList.toggle("btn-primary", !isLastRound);

        // 2. Clear the old table, then rebuild it
        tableBody.replaceChildren(); // empties the <tbody>

        for (const a of [0, 1] as const) {
            const row = document.createElement("tr");

            const header = document.createElement("th"); // the row label (0 or 1)
            header.textContent = `A = ${a}`;
            row.appendChild(header);

            for (const b of [0, 1] as const) {
                const cell = document.createElement("td");
                const state = round.cells[a][b]; // "given" | "empty" | "correct"
                cell.classList.add("tt-cell", `tt-cell--${state}`);

                if (state !== "empty") {
                    cell.textContent = String(evaluateGate(round.gate, a, b));
                }
                
                cell.addEventListener("dragover", (e) => {
                    e.preventDefault();
                });
                cell.addEventListener("drop", (e) => {
                    e.preventDefault();
                    const raw = e.dataTransfer?.getData("text/plain");
                    if (raw === "0" || raw === "1") {
                        handleDrop(a, b, Number(raw) as Bit);
                    }
                });
                
                row.appendChild(cell);
            }
            tableBody.appendChild(row);
        }
    }

    // Called when a token is dropped on the cell in row a, column b.
    function handleDrop(a: Bit, b: Bit, token: Bit): void {
        const result = placeToken(round, a, b, token);
        round = result.round;

        if (!result.check.correct) {
            feedback.textContent = result.check.explanation;
        } else {
            feedback.textContent = "Correct!";
        }

        render();
    }

    function open(): void {
        round = createRound(1);
        feedback.textContent = "";   
        screen.hidden = false;
        render();
    }

    function exit(): void {
        screen.hidden = true;
        onExit();
    }

    backBtn.addEventListener("click", exit);
    
    nextBtn.addEventListener("click", () => {
        const next = nextRound(round);
        if (next === null) {
            exit();
            return;
        }
        round = next;
        feedback.textContent = "";
        render();
    });

    screen.querySelectorAll<HTMLElement>(".tt-token").forEach((tokenEl) => {
        tokenEl.addEventListener("dragstart", (e) => {
            e.dataTransfer?.setData("text/plain", tokenEl.dataset.token ?? "");
        });
    });

    return { open };
}

