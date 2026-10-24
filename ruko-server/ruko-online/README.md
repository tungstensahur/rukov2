# Ruko
Run locally: `node server.js` then open http://localhost:3000 (Node 18+, no installs needed).
Deploy: put these files in a GitHub repo, then on render.com choose New > Web Service, pick the repo,
Build Command: (leave empty), Start Command: `node server.js`.
Data is stored in `data/data.json`. On Render's free plan this file is wiped on restarts/redeploys;
add a Render Disk and set the environment variable DATA_DIR to its mount path to keep it.

## Admin account
Log in with username `Ruko`. Its password is read from the ADMIN_PASSWORD environment variable
(on Render: your service > Environment > Add Environment Variable). It is not stored in the code.
The Admin tab lets Ruko rename or delete any player hat or game and change hat prices.

## New in this version
Game thumbnails (upload an image or use the 3D preview), a full level editor (platforms, walls, moving and crumbling
platforms, lava, bounce pads, checkpoints, goals, coins, decorations, undo/redo, draft autosave, edit your published
games), a shop with search/filters/sorting/likes/try-on, global chat and in-game chat, and name tags above players.

## Keeping data when the server restarts (free)
Render's free plan wipes its disk on every restart or redeploy. To keep accounts, hats, games, sales and likes:
1. Go to upstash.com, sign up, and create a Redis database (free plan, any region).
2. On the database page, copy the REST URL and the REST TOKEN.
3. In Render: your service > Environment > add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN with those values. Save (it redeploys).
The deploy log should say "Loaded all data from Redis" (or "Redis is empty: starting fresh" the first time).
If Redis cannot be reached at startup, the server refuses to start instead of overwriting your data.
The Admin tab has a "Download full backup" button as an extra safety net.

## Profiles
Click any username (catalog, games, chat, servers) to open their profile, or use the Profile button / Find players.

## T-shirts and weapons
Players design shirts in Creator Studio > T-shirts. Shirts stay hidden until the Ruko account approves them in the Admin tab
(a count shows next to Admin). Game creators can add weapons (sword, pistol, rifle, shotgun, sniper, custom), place weapon pickups
and spawn points, and turn on PVP. PVP damage only happens on servers (the Servers tab), where the server decides every hit.

## Auto-join and game search
Pressing Play on a game now puts you in the first server that has room (Server 1 until it holds 10 players, then Server 2, and so on).
"Practice solo" on each card starts a solo run. The Games tab has search (name, creator, genre, description), sorting
(most players now, most played, newest, A to Z), genre filters and a PVP-only filter. The Servers tab has its own search.

## Weapon editor 2.0 and admin console
Weapons: visual weapon cards with a 3D preview and a stats readout (hits to eliminate, fastest kill, DPS), magazine size and reload time,
hold-to-fire or click-per-shot, eight weapon looks, duplicate, up to three starting weapons, and weapon pickups labelled on the map.
Admin tab: one search box across players, items and games, with Review / Players / Items / Games / Tools tabs, filters, sorting and paging.

## Staff, Special items and sale status
The Ruko (owner) account can make a player staff from Admin > Players > Make staff. Staff can mute players, delete chat messages, review shirts,
rename items and games, remove game thumbnails and take items on or off sale. Only the owner can give Rukos or items, ban, delete, set prices,
promote staff, mark items Special and download backups. Special items get a gold border and badge and a "Special items" row in the catalog.
Off-sale items disappear from the catalog for everyone who does not own them (staff still see them) and cannot be bought, but nothing is deleted.
The six built-in hats can be made Special, re-priced or taken off sale too.

## Economy
Coins collected or won inside games are only a score for that run and are no longer added to your Rukos balance.
Creators earn 50% of the price (rounded down) every time someone else buys their item, and 10 Rukos per visit to their game
(a visit is joining a server; the same player only pays out once per game every 10 minutes, and your own visits never pay).
The built-in Ruko hats and games pay the Ruko account. Earnings show in Creator Studio > My creations.

## More faces and the new item editor
22 faces (picked from a grid of previews in the Avatar tab). The item editor is built for phones: a preview that stays on screen while you edit,
tabs (Shape, Move, Size, Turn, Paint, More) with big minus/plus buttons that repeat when held, 15 shapes (new: star, heart, cross, hexagon, spike),
a color palette, finishes and see-through, mirroring, "copies in a circle" for crowns and spikes, 12 templates, drag-to-spin preview,
undo/redo, up to 24 parts, and an automatic draft so you do not lose work.

## Refresh on open
Pages no longer update on a timer. Sales, visits, balances, likes and active servers refresh when you open a page (including after leaving a game),
and the Games, Catalog and Servers pages have a ↻ Refresh button. Only the Chat page keeps updating live.

## Physics, camera and Ruko Studio
Movement now accelerates and slows down smoothly, with a short grace period for jumping after leaving a ledge, a jump buffer, variable jump height,
auto step-up for small ledges and a smooth follow camera. You can look up and down (drag up/down); weapons aim where the camera points (crosshair in PVP games).
The game editor is now Ruko Studio: a 3D viewport with Select / Move / Scale tools and drag handles, a Toolbox, an Explorer, a Properties panel, undo/redo,
snap, keyboard shortcuts, and a Game tab for settings, thumbnail and weapons. Levels can hold 300 objects and span about 400 studs.

## Built-in games and run animation
Sky Steps, Coin Rush and Ruko Park are now normal games owned by the Ruko account. In Admin > Games the owner can rename them, change the
description, remove or replace the thumbnail, open them in Ruko Studio to edit the level, or delete them (they stay deleted; Admin > Tools can restore them).
The run animation now advances by distance travelled instead of absolute time, so it is slower, smoother and eases in and out.
