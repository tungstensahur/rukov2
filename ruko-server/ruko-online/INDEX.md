# Code map

The site is split into small files loaded in order by `public/index.html`. They're
numbered to match the order they're loaded in — that order matters (see below).

- `server.js` — the whole backend: accounts, hats/games storage, servers, chat,
  friends/DMs, admin, Redis/file persistence. One file, has `// ----` section banners.
- `public/index.html` — just the page shell (CSS + the `<script src>` list). No logic lives here anymore.
- `public/js/00-boot-and-core.js` — login/signup screens, nav, API helper, boot sequence.
- `public/js/02-...avatar-editor...js` — original avatar editor + mobile detection (mostly superseded, see caveat below).
- `public/js/04-...hat-editor-admin-tools.js` — early hat editor + admin tools (superseded).
- `public/js/05-...shop-2-0-chat...js` — catalog/shop, chat, name tags, thumbnails.
- `public/js/06-profiles-and-player-search.js` — profile pages, player search.
- `public/js/07-...shirts...weapons-pvp.js` — t-shirt review flow, weapons, PVP combat.
- `public/js/08-auto-join-servers-and-game-search.js` — Play auto-joins a server, game search/sort.
- `public/js/09-weapon-editor-2-0-and-admin-console.js` — weapon cards + the searchable Admin console.
- `public/js/10-staff-roles-special-items-on-off-sale.js` — staff permissions, Special items, on/off sale.
- `public/js/11-creator-earnings.js` — the Creator earnings card.
- `public/js/12-...mobile-friendly-item-editor.js` — the 22 faces + current item (hat/accessory) editor. **Live.**
- `public/js/13-refresh-data-on-open.js` — replaces polling with refresh-on-navigate.
- `public/js/14-ruko-studio-3d-level-editor.js` — **Ruko Studio** (the 3D game editor): viewport, gizmos, Properties/Explorer/Game tabs, weapon panel. **Live.**
- `public/js/15-manage-built-in-games.js` — lets admin edit/delete the built-in games.
- `public/js/16-block-code-for-ruko-studio.js` — the Code tab: block palette, script runtime (`SCtick` etc). **Live.**
- `public/js/17-friends-messages-and-boot.js` — Friends/Messages pages, the mobile "More" menu, and the final boot/event-wiring code that used to sit at the bottom of the old single file.

## Important caveat: duplicate function names

This file split preserves the site's history exactly as it was — it does **not** delete
old code. Several functions (`gameEd`, `hatEd`, `hatMesh`, `makePlayer`, `home`, `catalog`,
`adminView`, etc.) were rewritten multiple times over the project's life, and each
rewrite was added as a new `function` declaration rather than editing the old one in
place. In JavaScript, when the same function name is declared twice in the same scope,
**the last one loaded wins** — so the earlier copies are harmless dead code, never
called, but still physically present in an earlier file.

**When editing one of these functions, always edit the LAST file that defines it**
(the files above marked **Live**, plus whichever is physically loaded last for a given
name — check with `grep -rn "function nameHere" public/js/` and edit the one in the
highest-numbered file). Editing an earlier copy will have no effect, since a later file
immediately overwrites it.

If you want this cleaned up properly (deleting the dead copies instead of just routing
around them), that's a separate, riskier job — ask for it explicitly and expect it to
take a real pass of testing, since some of these functions are large.
