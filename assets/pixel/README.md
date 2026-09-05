# Phase one runtime art

Eight original assets generated for Star Game on 2026-09-05: three rooms and five character sheets. Existing illustrated player/NPC portraits are reused without modification. Scene coordinate definitions live in `src/pixel/data.js`.

- Room source size: 1536 × 1024; world size: 960 × 640.
- Sheets: twelve poses (four facings × idle/two steps), magenta chroma key background.
- The renderer imports the key into a transparent GPU texture once. Generated source files stay unchanged.
- Frame extents are detected inside fixed column/row regions at import; feet are the draw origin. The direction exceptions for practice clothing and Qiao's profiles are recorded in `src/pixel/sprites.js`.
- Foreground furniture uses masked background layers and foot depth ordering. Walkable/blocked polygons are separate from artwork.
- Only Raven is instantiated as the player. The other two actor sheets represent existing NPCs Ji Qing / 喬映澄 and Su Fei / 許映真.

This is the phase one prototype asset set, not the full 32-space production catalog.
