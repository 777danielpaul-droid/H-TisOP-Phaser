H!TisOP — OBSIDIAN / DARK-CHROME CONTROL STATION
Build: 2026-11-14

This archive contains the full project with the latest visual redesign changes.

Visual changes:
- Main menu: centered mode selector, retained cursor/inactivity show-hide behavior, top-centered persistent H!TisOP logo, angled tactile metal controls.
- Character selection: black-chrome character docking capsules, machined profile console, metallic bay framing and telemetry.
- Versus character selection: player-coloured docking capsules and dark-chrome framing.
- Booster collection/shop: recessed vault deck, raised alloy card frames and black-glass surfaces.
- Booster packs: sealed dark-metal foil, crimped seams, alien energy core and reflective material layers.
- Booster opening: reactor chamber, concentric energy rings and matching dark-chrome atmosphere.
- HTML overlays and controls: unified obsidian / dark-chrome surfaces, bevels, inner highlights and restrained cyan/violet energy accents.
- Existing game logic, input mappings and cursor inactivity timing were not intentionally changed.

Build / run:
1. npm install
2. npm run build
3. npm start

Verification:
- Build completed successfully with node tools/build.mjs.
- node --check dist/game.js passed.
- Focused pack-opening, loot, render and arcade tests passed.
- Full npm test did not finish in this environment; the online test requires the ws dependency to be installed.
- Browser visual automation could not be run in this environment because the browser navigation was blocked by the host policy. Please inspect the running build locally.
