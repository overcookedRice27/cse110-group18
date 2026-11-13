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
    const nextButton = document.getElementById("scenario-next-btn") as HTMLElement;

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
        nextButton.hidden = true;
        submitButton.hidden = false;

        // Make a draggable button for each choice
        choiceArea.innerHTML = ""; //empty button area
        for (const word of question.choices) {
            const button = document.createElement("button"); //make new button
            button.className = "btn btn-outline-primary px-4 py-2";
            button.textContent = word; //set label
            button.draggable = true; //makes it draggable
            button.addEventListener("dragstart", function (event) { //drag starts -> run function
                event.dataTransfer?.setData("text/plain", word); //saves button's word to drag's storage under label
                //dataTransfer -> storage area for current drag, drag begins = empty, after data set = holds text item
            });
            choiceArea.appendChild(button); //puts button on choiceArea
        }
    }

    // closes minigame takes player back to main menu
    function leave(): void {
        screen.hidden = true;
        onExit();
    }

    // runs when player lets go of dragged word over blank
    function handleDrop(event: DragEvent): void {
        const word = event.dataTransfer?.getData("text/plain") as GateChoice; //reads word from drag envelope and treats as one of gate names
        if (SCENARIOS[questionNumber].choices.includes(word)) { //checks if its one of the choices
            chosenWord = word;
            blank.textContent = word; //shows word in blank
        }
    }

    // when player presses submit, answer checking logic
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

        // correct answer, gives explanation
        feedback.textContent = "Correct! " + question.explanation;
        submitButton.hidden = true;  // answer locked in
        nextButton.hidden = false;   // let player continue
        if (questionNumber === SCENARIOS.length - 1) {
            nextButton.textContent = "Finish";
        }
    }

    function handleNext(): void {
        questionNumber = questionNumber + 1;
        feedback.textContent = "";
        if (questionNumber === SCENARIOS.length) {
            leave();
        } else {
            showQuestion();
        }
    }

    // connects to page 
    blank.addEventListener("dragover", function (event) {
        event.preventDefault(); // cancels default browser behavior, browser doesnt accept drops usually
    });
    blank.addEventListener("drop", handleDrop);
    submitButton.addEventListener("click", handleSubmit);
    backButton.addEventListener("click", leave);
    nextButton.addEventListener("click", handleNext);

    // The menu calls this to start the game
    function open(): void {
        questionNumber = 0;
        feedback.textContent = ""; //clear messages 
        showQuestion();
        screen.hidden = false;
        nextButton.textContent = "Next";
    }

    return { open: open };
}