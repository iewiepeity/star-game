# Pixel life v0.6.0 · UI and identity

The v0.5 settings were an uneven group of large buttons, transient messages covered the bottom controls, and any of the four avatars could be selected after the game started. This update gives the existing pixel interfaces a consistent visual system and restores the original gender-change constraint.

## Player-visible changes

- Five device-level palettes: cream, rose, sage, lilac and night. Changes apply immediately to HUD, menus, map information, schedule, shops/wardrobe, profile, creative/career cards, phone, saves, results and bottom dialogue. Original scene and portrait artwork stays unchanged.
- Settings group palette previews, five direct speed choices, pause, camera and utility actions. Compact menus retain a single vertical list and fit short desktop/mobile viewports.
- Toasts sit near the screen center with no pointer blocking. They enter the native dialog's top layer when a panel is open and clear before story dialogue.
- Gender is selected before starting and then locked. The profile lists only the two matching appearances. A v0.5 save keeps the gender of its current avatar.
- Another gender requires entering the clinic, selecting the target appearance, confirming and paying the original $60,000 cost. Wardrobe ownership is retained. Insufficient funds, the wrong venue and an ongoing primary action are guarded. The original clinic service is instant and does not consume a day.
- Failed appearance loading restores state and money; no partial transaction is checkpointed. Recoverable room/texture loading errors no longer display the blocking startup screen after the game is already running.

## Scope and compatibility

`PIXEL-FEATURE-PARITY.md` inventories all 18 original app entries and additional game mechanisms. This update does not assert full migration. The original complete dossiers, manual romance controls, forums/social interactions, collection views, some agency tools, audio and data-transfer/settings tools remain incomplete.

Pixel save key: `star-game-pixel-phase-one-v1`, unchanged. New preference key: `star-game-pixel-preferences-v1`. Normalization adds an identity to older pixel saves. Original runtime saves remain separate; there is no automatic original-to-pixel save migration.

The production build includes `pixel-ui.css` after `pixel.css`. A standalone copy must include both stylesheets, all `src/` modules and referenced assets. Current standalone release metadata reports v0.6.0.

## Verification

- Full repository `npm run check`: formatting, lint, content validation, 340 domain tests, five-year simulation, world reactions, asset/PWA audits and build passed.
- After final changes: lint, production build and 64 targeted identity/persistence/city/sprite tests passed.
- Browser regression: 139 passed, 5 intentionally skipped (12.9 minutes), covering desktop Chromium, mobile Chromium, touch tablet Chromium, mobile WebKit, tablet WebKit and desktop Firefox. The repeated all-32-room sweep runs on desktop only; it passed there.
- Actual 4194 preview verified as v0.6.0 with five themes, theme persistence, preserved legacy male save, exactly two matching appearances, 27 map destinations and a toast above the HUD. No page errors.

Browser tests use ephemeral contexts; they do not alter the user's existing preview save. UI palette screenshots and `preview-verification.json` accompany the deliverable.
