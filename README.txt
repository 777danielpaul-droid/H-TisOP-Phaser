H!TisOP — XENOS / OBSIDIAN CONTROL STATION UI PATCH

This is an overlay patch for the EXISTING H!TisOP project. It does not create a new project version and does not replace assets, gameplay logic, package files, or Git history.

Apply it:
1. Open your existing H!TisOP project folder (the folder containing package.json).
2. Extract this ZIP directly into that folder.
3. Allow the matching files under styles/ and src/ to be overwritten.
4. Run: npm run build
5. Start the game as usual.

Redesigned areas:
- styles/main.css: shared visual language for menus, editor, shop, online and music panels
- src/render/hud.js: obsidian-glass controls, illuminated meters and combat HUD framing
- src/render/select.js: character bay, subject-profile console, versus and stage-selection panels
- src/render/lootui.js: holographic booster foil, cards, reward vault and shop
- src/render/packopen.js: booster-opening environment and palette
- src/render/storyhud.js: story pickups
- src/render/meleehud.js: Melee player-status plates

No gameplay rules or input mappings were intentionally changed.
