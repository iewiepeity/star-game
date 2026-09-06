# Pixel life · v0.8.0

Entry: `/pixel.html`. Original `/index.html` progress and the pixel save namespace remain separate. The original 18 app entry points and the previously listed missing interactions are now accessible inside the pixel world. See the parity inventory for supported operations and limits.

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

## Feature integration

- `feature-ui.js` + `pixel-apps.css`: original pure views within a themed pixel panel, with explicit handlers. Never import the original renderer or bind modules. Formal actions use the pixel booking flow.
- `planner-tools.js`: three selectable weekly focuses, five presets, previous-week reuse, due-job scheduling and guarded undo; later reservations or resource changes invalidate old snapshots.
- `save-transfer.js`, `storage-ui.js`: validated original/pixel import, preview and transactional replacement, export, rollback, deletion recovery, new runs with optional familiar-face inheritance and retirement.
- `onboarding.js`, `tutorial-ui.js`: original prologue, identity fields, ability rolls and contextual pixel tutorials.
- `preferences.js`: palette, font size, volume and tutorial preferences independent of game slots. Audio uses an injected preference reader without changing original defaults.
- `offline.js`: shared service-worker registration, explicit full-pack download, install and update controls. `scripts/build-pixel-offline.mjs` includes atlas JSON as well as image/code/audio assets.

See `PIXEL-INTEGRITY.md` for the latest audit and `PIXEL-FEATURE-PARITY.md` for the entry inventory. `event-context.js` preserves story participants and collection time across choices and reload, including legacy results. Historical phase documents describe those earlier versions. Cross-device transfer is file-based, not cloud synchronization.

## Verification and packaging

Run `npm run check` for original and pixel domain checks and the production build. Run `npx playwright test 'pixel-.*\.spec\.mjs' --workers=3` for the six browser/viewport projects. Download an offline pack and test reloading/entering an unvisited room with the network disabled. Asset-failure tests block service workers so cached responses cannot bypass intentional request failures.

Package the **entire `dist/`** folder, including original shell files, all pixel styles, manifests, modules and assets. This allows the shared service worker to install successfully. Version query strings must retain the pixel HTML fallback while offline.

## Story staging (v0.8.0)

`story-scenes.js` maps all 30 core arcs, 50 longform chapters and eight hidden-route chapters to reviewed city sets, reuses those sets for the 100 branch follow-ups, and preserves every authored beat. Invitations first show the incoming message; only acceptance stages a visit. Declining/rescheduling stays a message. Existing recollections do not spawn actors. `story-blocking.js` finds a connected group of distinct floor marks. `story-actors.js` reserves the cast, walks cardinal paths, faces each speaker, animates reading/dance/listening, frames the cast above the dialogue, and releases them afterward.

`story-director.js` persists presentation phase, selected invitation reply, beat and return position in `life.storyStage`. The shared event engine alone commits effects. Merely arriving, skipping animation or loading cannot settle a choice. Private story invitations may access their authored interior for that scene without opening its public unlock. Scene download failure offers retry. Menus and hidden pages pause staging; a reload resumes the same line/cast. The original activity and room are restored after departure via the city map. Authored CG can be opened at full size after a choice; generic fallback art is not used for an NPC scene.

Hidden-route entry predicates are evaluated when enqueuing, then replaced by serializable requirements. This avoids storing functions inside the pixel transaction. The second-run / familiar-face / trust gates are retained; contact unlock follows the on-screen encounter choice.
