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
- **Player levels and saving:** The menu can open a level, select available levels, and save or resume a player's board and progress using local storage. The current level layouts are sample data.
- **Circuit check:** The game provides feedback based on whether the exits are powered and can mark an active level complete.
- **Truth-table mini-game logic:** Functions for rounds, gate answers, and feedback are implemented and tested; the mini-game menu is not connected to a playable screen yet.

## Codebase structure

The project is written in TypeScript and uses Vite, Konva, and HTML/CSS. Most application logic is organized into functions and modules rather than custom classes.

- `index.html`, `src/style/`, and `src/html/` define the HTML screens, styling, menu navigation, and level-selection state.
- `src/konva/main.ts` initializes the Konva stage and connects the board, creator controls, saving, and circuit checks to the screens.
- `src/konva/grid.ts`, `gate.ts`, `wire.ts`, and `gateLogic.ts` draw the board and pieces and calculate connections and gate outputs. `constants.ts` holds shared dimensions and colors.
- `src/konva/utils/` contains grid-coordinate helpers and the in-memory `circuitGrid`, which tracks occupied cells and checks placements.
- `src/konva/levels/` defines the plain-data level format and handles the creator panel, loading, importing, and exporting. `src/levels/` contains the current sample player layouts.
- `src/konva/save.ts` reads and writes player level data and progress in browser local storage.
- `src/minigames/truthTable.ts` contains the truth-table mini-game's rules and round state.
- `tests/` contains Vitest tests for the board, gates, levels, menu, circuit checking, creator, and truth-table logic. `.github/workflows/ci.yml` configures CI.

The in-memory grid stores references to Konva pieces while the game runs. Level files and saves use plain JSON data, which the loader uses to recreate those pieces on the board.

## Level and save data

- **Level JSON** contains a level ID and a list of pieces. Each piece has a type and grid coordinates. Gates also have a gate type, gates and wires can be marked fixed, and inputs store whether they start on or off. Exits and blocks need only their type and position. Coordinates refer to grid cells, not pixels.
- **Player saves** are stored in the browser's local storage under `logicGame.save`. A save contains a format version, the highest completed level, and the player's current level layout in the same format used by level JSON. Player saves are separate from the files exported by the level creator.

## Level creator

Set `LEVEL_CREATOR_ENABLED` to `true` in `src/konva/constants.ts` to show **Level Creator** on the main menu. Set it to `false` to hide the button while leaving player levels available. The separate `isCreatorView` value tracks the current board view and changes while the application runs; it is not the menu setting.

Open **Level Creator** from the main menu to design a board.

- Drag pieces from the panel onto the grid. Drag a placed piece back to the panel to remove it.
- Click a placed gate or wire to mark it fixed. Fixed pieces stay in place in player view.
- Click an input to switch it on or off. An exit shows whether an adjacent wire is powered.
- Use **Player View** to test the level. Returning to **Creator View** restores the layout from before the test.
- Use **Export Level** to download the layout as JSON. Use **Import Level** to open a previously exported file.
- **Clear Board** removes all pieces after confirmation.

## Current limitations

- The player-level layouts are placeholders; the level selector defines ten levels, but only the first three have sample layouts connected.
- The circuit checker currently checks whether exits are powered. More specific goals, such as requiring a particular gate, are not implemented.
- Feedback loops in circuits are not supported.
- Mini Games and Settings currently show placeholder messages. The truth-table logic does not yet have a playable screen.
