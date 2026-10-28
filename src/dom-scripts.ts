const continueBtn = document.getElementById(
    "continue-btn",
) as HTMLButtonElement;
const newGameBtn = document.getElementById("new-game-btn") as HTMLButtonElement;
const miniGameBtn = document.getElementById(
    "mini-game-btn",
) as HTMLButtonElement;
const settingsBtn = document.getElementById(
    "settings-btn",
) as HTMLButtonElement;

const mainMenuScreen = document.getElementById("main-menu") as HTMLElement;
const gameScreen = document.getElementById("game-screen") as HTMLDivElement;

// 2. Attach Click Event Listeners
newGameBtn.addEventListener("click", () => {
    alert("Starting a new game...");
});

continueBtn.addEventListener("click", () => {
    alert("Checking for local save data...");
});

miniGameBtn.addEventListener("click", () => {
    alert("Opening mini games menu...");
});

settingsBtn.addEventListener("click", () => {
    alert("Opening settings panel...");
});
