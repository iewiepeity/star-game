# Phase one runtime art

Eight original assets generated for Star Game on 2026-09-05: three rooms and five character sheets. Existing illustrated player/NPC portraits are reused without modification. Scene coordinate definitions live in `src/pixel/data.js`.

- Room source size: 1536 × 1024; world size: 960 × 640.
- Sheets: twelve poses (four facings × idle/two steps), magenta chroma key background.
- The renderer imports the key into a transparent GPU texture once. Generated source files stay unchanged.
- Frame extents are detected inside fixed column/row regions at import; feet are the draw origin. The direction exceptions for practice clothing and Qiao's profiles are recorded in `src/pixel/sprites.js`.
- Foreground furniture uses masked background layers and foot depth ordering. Walkable/blocked polygons are separate from artwork.
- Only Raven is instantiated as the player. The other two actor sheets represent existing NPCs Ji Qing / 喬映澄 and Su Fei / 許映真.

This is the phase one prototype asset set, not the full 32-space production catalog.

## Interaction refinement (2026-09-05)

Six new source PNGs provide furniture and rehearsal poses. The five `*-actions.png` sheets have eight frames (four columns × two rows): lying/breathing, sitting, sipping coffee, two dance steps, and two script-reading poses. `raven-newcomer-rest-actions.png` preserves the original barefoot resting frames; the newcomer standing sheet has corrected shoes. The Qiao standing/dance sheet also received a shoe correction. All were produced with image_gen using the matching original pixel actor as reference. No third-party game artwork was used as a source.

`activityFrame` selects and scales these frames; `ACTIVITY_SPOTS` places them at furniture anchors while retaining a separate safe floor position. NPCs use reading/warm-up poses between their walking routes. Generated action sheets retain their original chroma-key pixels; the runtime performs texture import once, as it does for walk sheets.

Dialogue reuses the original `portraits/heads/jiqing.webp` and `portraits/heads/sufei.webp`, plus CSS shoulder crops of the three Raven wardrobe illustrations. It does not replace the original full-body wardrobe artwork.
