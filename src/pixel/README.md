# Pixel life · v0.6.0

Entry: `/pixel.html`. Original `/index.html` progress and the pixel save namespace remain separate. This is a playable migration with remaining feature gaps, not full parity with the original UI.

## Modules

- `data.js`, `city-rooms.js`, `city-catalog.js`: 27 map entrances, 32 spaces, furniture geometry, service targets and story gates.
- `navigation.js`, `world.js`: four-direction routing, one player, moving NPCs, per-furniture poses, collision/occlusion, camera and pointer/keyboard input.
- `sprites.js`, `expanded-sprites.js`: source atlas geometry and memory-bounded sprite loading; 15 outfits per avatar, preserving original illustrations for portraits.
- `life.js`, `life-ui.js`: seven-day planning from the first week, training/work/rest/creative/social actions, daily costs/results and weekly review. Directly entering services does not require a separate registration day.
- `career.js`, `career-ui.js`, `core-bridge.js`: original job auditions/contracts, agency applications/interviews, NPC appointments, production, weekly stories, awards, sequels, overseas and endings.
- `cast.js`, `city-ui.js`: city navigation, connected interiors and daily NPC itineraries respecting reserved appointments.
- `model.js`: independent pixel autosave, five manual slots and backups. Original saves are not automatically imported.
- `identity.js`: gender lock at the start, compatible old-save inference, same-gender appearance changes and confirmed clinic changes using the original $60,000 fee.
- `preferences.js`, `settings-ui.js`, `pixel-ui.css`: device-level palette preferences and a shared visual system for the existing pixel screens.
- `main.js`: persistent canvas plus DOM menu/bottom dialogue, portrait synchronization, controller boundary and transactional appearance changes.

The simulation owns costs, rewards and time; animation does not duplicate settlement. Choices pause auto playback. Menus, hidden tabs and dialogue pause world movement. A read-only `window.__pixelRead()` snapshot supports browser tests without mutating game state.

## UI and identity

Five palettes cover the chrome, panels and dialogue while preserving scene and portrait artwork. Preferences use `star-game-pixel-preferences-v1`, independent of all game slots. Toasts appear near the center, inside a native dialog's top layer when required, and disappear when a story starts.

New games choose gender before locking it. Existing v0.5 saves keep their currently worn avatar's gender. Same-gender appearances can be swapped; another gender requires being at the clinic with sufficient funds and explicit in-game confirmation. All wardrobe ownership survives. A failed sprite load restores the previous state and does not charge or persist a partial change. The original clinic transaction is immediate and does not consume a schedule day.

## Remaining parity work

The original full NPC dossier/network, manual romance visibility/breakup controls, complete social and forum interactions, timeline, CG gallery, achievement UI, some agency negotiation/manager tools, audio, export/import/backup management, original full character creation/prologue and several settings are not yet migrated. Weekly simulation/data alone is not considered a completed player-facing feature.

See `PIXEL-UI-REFRESH.md` and `PIXEL-FEATURE-PARITY.md` for the current release and detailed inventory. Historical phase documents describe the scope at those earlier versions.

## Verification and packaging

Run `npm run check` for the original and pixel domain checks and production build. Run `npx playwright test pixel-phase-one pixel-life pixel-city pixel-career pixel-polish` for browser flow coverage. The build must copy **both** `pixel.css` and `pixel-ui.css`, the pixel modules and all referenced assets. The optional pixel entry does not yet promise a complete offline/install/update experience.
