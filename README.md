# Circuit Game

A logic-gate puzzle game built by CSE 110 Group 18. Players build circuits on a grid using wires, inputs, and gates. The project also includes a level creator for designing and exporting layouts.

## Setup and running

Install Node.js and npm. The CI workflow uses Node.js 22. From the project directory:

```sh
npm install
npm run dev
```

Open the local address printed by Vite in a browser. The main menu provides access to the game and level selection. It also shows the level creator when enabled in the developer settings. The browser's local storage is used for player saves.

To run the automated checks:

```sh
npm test
npm run build
```

`npm run test:watch` runs tests in watch mode, and `npm run test:coverage` generates coverage. GitHub Actions installs dependencies, runs tests, and builds on pushes to `main` and pull requests.

## Current features

- **Circuit board:** Drag wires and AND, OR, NOT, and XOR gates onto a grid. Inputs can be switched on and off, power propagates through connected wires and gates, and exits show whether they receive power.
- **Level creator:** Build a layout with inputs, exits, wires, gates, and blocked cells. Mark gates and wires as fixed, try the layout in player view, and import or export JSON files.
- **Player levels and saving:** Select from ten levels and save or resume a player's board and progress using local storage. A results screen displays the time and number of incorrect validations after a level is completed.
- **Circuit check:** Validate that exits are powered and any required gates are connected. The game displays feedback and marks an active level complete when the check passes.
- **Reset layout:** In a player level, reset the board to its original layout. Select Save afterward to keep the reset layout in the existing save.
- **Mini-games:** Open the Mini Games menu to play the truth-table and real-life scenario games. Both provide feedback on answers.
- **Wall Breaker:** Completing new levels charges an ability that removes up to five random wall blocks. The charge is saved with player progress.
- **How to play:** The settings screen includes instructions for playing the game.

## Codebase structure

The project is written in TypeScript and uses Vite, Konva, and HTML/CSS. Most application logic is organized into functions and modules rather than custom classes.

- `index.html`, `src/style/`, and `src/html/` define the HTML screens, styling, menu navigation, and level-selection state.
- `src/konva/main.ts` initializes the Konva stage and connects the board, creator controls, saving, and circuit checks to the screens.
- `src/konva/grid.ts`, `gate.ts`, `wire.ts`, and `gateLogic.ts` draw the board and pieces and calculate connections and gate outputs. `constants.ts` holds shared dimensions and colors.
- `src/konva/utils/` contains grid-coordinate helpers and the in-memory `circuitGrid`, which tracks occupied cells and checks placements.
- `src/konva/levels/` defines the level data format and handles the creator panel, loading, importing, exporting, and gate requirements. `src/levels/` contains the player level layouts and level metadata.
- `src/konva/save.ts` reads and writes player level data and progress in browser local storage.
- `src/minigames/truthTable.ts` contains the truth-table mini-game's rules and round state. `src/html/` contains the mini-game screens and navigation.
- `tests/` contains Vitest tests for the board, gates, levels, menu, circuit checking, creator, and truth-table logic. `.github/workflows/ci.yml` configures CI.

The in-memory grid stores references to Konva pieces while the game runs. Level files and saves use plain JSON data, which the loader uses to recreate those pieces on the board.

## Level and save data

- **Level JSON** contains a level ID and a list of pieces. Each piece has a type and grid coordinates. Gates also have a gate type, gates and wires can be marked fixed, and inputs store whether they start on or off. Exits and blocks need only their type and position. Coordinates refer to grid cells, not pixels.
- A level may include `"requiredGates": { "AND": 2, "NOT": 1 }`. Checking the circuit requires at least that many distinct gates of each type connected upstream of an exit, in addition to powering all exits. Levels without this field keep the existing check. The check traces connectivity, so a gate on an alternate branch may count even when it is not needed to power the exit.
- **Player saves** are stored in the browser's local storage under `logicGame.save`. A save contains a format version, the highest completed level, the Wall Breaker charge, and the player's current level layout in the same format used by level JSON. Player saves are separate from the files exported by the level creator.
- **Level metadata archive:** On each successful player level completion, `archiveMetadata` in `src/levels/level-metadata.ts` copies the level ID, elapsed milliseconds, and correct and incorrect validation counts into a snapshot. The completion handler in `src/konva/main.ts` saves that snapshot with the board and progress. `src/konva/save.ts` appends it to `archivedMetadata`, preserves the array on subsequent saves, and starts with an empty array for older saves. Repeated completions append new entries. Starting a new game clears the archive with the rest of the player save.
- **Personal bests:** Each completion snapshot saves the lowest clear time so far for that level as `bestTimeMs` and the fewest validation attempts as `best_attempt_count`. Clear time adds up across visits to the same level within the current session, including time spent after failed attempts. The timer pauses while the player is away and resets after a successful clear. The attempt count includes every validation in that visit, including the successful one. The two records can come from different visits. Legacy snapshots with zero recorded failures can seed both records.
- **Finale:** Clearing Level 10 shows the fastest clear and fewest attempts across levels, the total failed validations, and the sum of the ten per-level best clear times in `hh:mm:ss`. The total time is available when all ten levels have a recorded full clear time. New snapshots store the number of failures added since that level's previous snapshot so the finale can count failures across sessions.

## Level creator

Set `LEVEL_CREATOR_ENABLED` to `true` in `src/konva/constants.ts` to show **Level Creator** on the main menu. Set it to `false` to hide the button while leaving player levels available. The separate `isCreatorView` value tracks the current board view and changes while the application runs; it is not the menu setting.

Open **Level Creator** from the main menu to design a board.

- Drag pieces from the panel onto the grid. Drag a placed piece back to the panel to remove it.
- Click a placed gate or wire to mark it fixed. Fixed pieces stay in place in player view.
- Click an input to switch it on or off. An exit shows whether an adjacent wire is powered.
- Open **Gate Requirements** to set a minimum count for each gate type. Zero means the type is optional. Requirements are saved in exported JSON and restored when importing a level.
- Use **Player View** to test the level. Returning to **Creator View** restores the layout from before the test.
- Use **Export Level** to download the layout as JSON. Use **Import Level** to open a previously exported file.
- **Clear Board** removes all pieces after confirmation.

## Current limitations

- Feedback loops in circuits are not supported.
- Gate requirements check connectivity upstream of an exit. A gate on a connected alternate branch may count even if it is not needed to power the exit.
