# Pixel phase one

Entry: `/pixel.html`. The stable `/index.html` runtime and save schema remain separate.

- `data.js`: three room layouts, collision and occlusion polygons, object targets, original wardrobe/NPC identifiers, short encounters, deterministic NPC itineraries.
- `navigation.js`: grid construction, A* routing, corner and furniture clearance.
- `world.js`: Phaser scene lifecycle, one player, autonomous NPCs, camera/pointer/keyboard input and actor depth.
- `sprites.js`: source sheet import, chroma-key texture decoding, frame extents and facing exceptions.
- `model.js`: strict prototype save schema, independent namespace, five slots and backups.
- `main.js`: accessible DOM overlays, portrait/wardrobe synchronization, controller event boundary, checkpointing.

The canvas stays mounted when overlays update. Both pointer targets and DOM object shortcuts route through the same movement/arrival method. Browser tests use only the read-only `window.__pixelRead()` snapshot and real UI inputs.

Phase two can replace controller action handlers with adapters to the existing training, work, creative and week-runner logic. The simulation must remain the sole owner of rewards and time advancement; scene animation must not duplicate those effects. A separate migration needs to be designed before connecting stable saves to the pixel runtime.

The current prototype has flavor interactions, not the full training/economy/week/romance loop. NPC time pauses in overlays or hidden tabs; it does not simulate offline progress. Pixel progress is local to the browser origin.

Verification: `npm run check` and `npx playwright test pixel-phase-one`. The normal release build includes the optional pixel entry, the runtime and its assets. A standalone preview can serve only the pixel entry/modules, shared NPC/wardrobe data and referenced portraits.
