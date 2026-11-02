# Level selection, completion, and saving

## Commit 1 — New Game save checks and overwrite confirmation

Existing commit: `d2ff489`

- Check for a local save before starting a new game.
- Open level selection directly when no save exists.
- Show an HTML overwrite dialog when a save exists.
- Preserve progress on Cancel or Escape; clear the save and reset level availability after confirmation.
- Report storage read and deletion errors.
- Document the reset flow in the HTML.
- Add six New Game tests covering save checks, confirmation, cancellation, navigation, and storage failures.

## Commit 2 — Dummy layouts and level selection

Existing commit: `d15d2c0`

- Map level buttons 1–3 to `src/levels/dummy1.json`, `dummy2.json`, and `dummy3.json`.
- Open selected layouts through the shared Konva stage in player mode.
- Preserve the creator board and restore creator controls when returning to Level Creator.
- Keep level availability in the existing `locked`, `current`, and `finished` states.
- Start with Level 1 available and later levels locked.
- Add tests for sequential unlocking, rejected out-of-order completion, reset behavior, and invalid IDs.
- Keep completion out of reusable JSON layouts; no separate `completed` boolean is required.

## Commit 3 — Complete levels when EXIT powers on

Existing commit: `74b2b31`

- Emit a stage event when an EXIT becomes powered.
- Track the active selected level and call `completeLevel()` when its EXIT lights up.
- Set its internal state to `finished` and unlock the next level.
- Exclude creator previews from completion tracking.

## Commit 4 — Save and restore player levels

Suggested commit: `feat: save player layouts and restore level progress`

Status: working-tree changes; not yet committed.

- Add a shared Save button in the top-right player header, with an accessible status message.
- Save the active board layout and highest completed level to `logicGame.save` in local storage.
- Show save success or storage failure in the header.
- Accept saved sessions before any level has been completed and support progress across ten levels.
- Restore completion progress when Continue opens level selection.
- Restore the saved board when selecting its matching level, using the existing validating level importer.
- Hide the player Save button in Level Creator; retain JSON export for creator layouts.

Files: `index.html`, `src/html/dom-scripts.ts`, `src/html/levels.ts`, `src/konva/main.ts`, and `src/konva/save.ts`.

## Validation and known limits

- The ten New Game and level-state tests passed after the save integration.
- Targeted TypeScript checks passed after the save integration.
- The Vite build passed for the earlier level-selection integration.
- The old `tests/save.test.ts` targets removed dummy-save APIs and previously failed; it needs updating before the full test suite can pass.
- There is no dedicated automated coverage of the new Save button or saved-board restoration yet.
- One local save slot is used; saving another level replaces the previous board snapshot.
- Completion is persisted when Save is pressed, rather than automatically when EXIT powers on.
- Malformed saves trigger New Game overwrite confirmation; saved board contents are validated when restored.

This document describes existing commits and a suggested commit for the remaining work. It does not create commits or push changes.
