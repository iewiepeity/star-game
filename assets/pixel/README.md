# Pixel assets — current set v0.4.0

The phase-three city adds all 32 playable spaces, 60 avatar/outfit combinations and 11 canonical NPC identities. The source artwork for the new map and 27 actor atlases was generated with image_gen. Original NPC and wardrobe illustrations are retained. Reviewed scene atlases from the accepted design are rendered with explicit art bounds, individual walk meshes, object footprints, interaction positions and foreground masks.

New assets in city/, cast/ and wardrobe/ are lossless WebP. Decoded RGBA bytes were verified identical to the source PNGs, with a 1.92 MB maximum new asset. The manifest holds 792 canonical atlas frames; exact legacy Raven pose sheets remain in use for the original three outfits. Direction corrections are explicit per frame rather than guessed at runtime. Source provenance and available prompts are in provenance-phase-three.json.

Only the current protagonist is instantiated. The renderer loads selected wardrobe groups on demand and retains two recent hero bundles and three scene atlases. All original NPCs use their own identity, with the hidden character gated by saved story progress.

The following records describe earlier asset production and remain for provenance.

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

Dialogue uses CSS shoulder crops of the original 640 × 1280 `portraits/jiqing.webp` and `portraits/sufei.webp`, plus the three Raven wardrobe illustrations. The 320 × 320 head thumbnails are only for small menu avatars, never for dialogue enlargement.

## Seat alignment correction (0.2.1)

The three `raven-*-seated.png` sheets each contain eight seated poses: SW, SE, NW and NE across four columns, with idle/sipping rows. Rear-facing art is explicit; a front pose is never mirrored to stand in for a rear pose. All three sheets were generated from their matching original Raven walk sheet with image_gen. The game imports their chroma key without modifying the source PNGs.

Seat coordinates in `ACTIVITY_SPOTS` now identify pelvis contact on the cushion/bench, rather than feet. `SEATED_ORIGINS` in the renderer calibrates that contact per outfit/direction. Desk and coffee chairs add foreground masks for their chair backs, visible only for the occupied seat. These layers are removed on cancellation and reconstructed when an activity is restored.

The desk faces NE, the two café seats NW, and the sofa/bench SW. All five seats have been visually inspected with all three outfits. Object hover has text and a pointer cursor only; it draws neither a polygon outline nor a label background box.
