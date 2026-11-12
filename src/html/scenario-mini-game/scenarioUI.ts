import { SCENARIOS, checkAnswer, type GateChoice } from "./scenarios";

export function initScenarioGame(onExit: () => void): { open: () => void } { //sets up game
    // onExit, takes in function to call when player leaves
    //open, outputs object whose open func starts game
    // The parts of the page we use
    const screen = document.getElementById("scenario-screen") as HTMLElement;
    const progress = document.getElementById("scenario-progress") as HTMLElement;
    const textBefore = document.getElementById("scenario-before") as HTMLElement;
    const blank = document.getElementById("scenario-blank") as HTMLElement;
    const textAfter = document.getElementById("scenario-after") as HTMLElement;
    const choiceArea = document.getElementById("scenario-choices") as HTMLElement;
    const feedback = document.getElementById("scenario-feedback") as HTMLElement;
    const submitButton = document.getElementById("scenario-submit-btn") as HTMLElement;
    const backButton = document.getElementById("scenario-back-btn") as HTMLElement;

    // What the game remembers
    let questionNumber = 0; // 0 is the first question
    let chosenWord: GateChoice | null = null; // the word in the blank (null = empty)

    // Show the current question on the page
    function showQuestion(): void {
        const question = SCENARIOS[questionNumber];

        // Split the sentence around the blank (the underscores)
        const blankStart = question.text.indexOf("_");
        const blankEnd = question.text.lastIndexOf("_");
        textBefore.textContent = question.text.slice(0, blankStart).trim(); 
        textAfter.textContent = question.text.slice(blankEnd + 1).trim();
        //textBefore.textContext changes text inside elem on page, textBefore changed to trimmed text

        progress.textContent = "Question " + (questionNumber + 1) + "/" + SCENARIOS.length;
        //builds label at top
        blank.textContent = "?"; //resets blank to show ?
        chosenWord = null;

        // Make a draggable button for each choice
        choiceArea.innerHTML = "";
        for (const word of question.choices) {
            const button = document.createElement("button");
            button.className = "btn btn-outline-primary px-4 py-2";
            button.textContent = word;
            button.draggable = true;
            button.addEventListener("dragstart", function (event) {
                event.dataTransfer?.setData("text/plain", word);
            });
            choiceArea.appendChild(button);
        }
    }

    // Hide this screen and go back to the menu
    function leave(): void {
        screen.hidden = true;
        onExit();
    }

    // The player drops a word onto the blank
    function handleDrop(event: DragEvent): void {
        event.preventDefault();
        const word = event.dataTransfer?.getData("text/plain") as GateChoice;
        if (SCENARIOS[questionNumber].choices.includes(word)) {
            chosenWord = word;
            blank.textContent = word;
        }
    }

    // The player presses Submit
    function handleSubmit(): void {
        if (chosenWord === null) {
            feedback.textContent = "Drag a word into the blank first.";
            return;
        }

        const question = SCENARIOS[questionNumber];
        if (checkAnswer(question, chosenWord) === false) {
            feedback.textContent = "Not quite. Try again.";
            return;
        }

        // Correct: show the explanation, then go to the next question
        feedback.textContent = "Correct! " + question.explanation;
        questionNumber = questionNumber + 1;
        if (questionNumber === SCENARIOS.length) {
            leave();
        } else {
            showQuestion();
        }
    }

    // Connect the page to the functions above
    blank.addEventListener("dragover", function (event) {
        event.preventDefault(); // lets the blank accept drops
    });
    blank.addEventListener("drop", handleDrop);
    submitButton.addEventListener("click", handleSubmit);
    backButton.addEventListener("click", leave);

    // The menu calls this to start the game
    function open(): void {
        questionNumber = 0;
        feedback.textContent = "";
        showQuestion();
        screen.hidden = false;
    }

    return { open: open };
}