# Claude Desktop Olympus

Themes and wallpapers for the Claude desktop app on Windows: 30 Greek-god themes (38 with their light versions) in
dithered classical marble, a **Theme** button in Claude's sidebar to switch between them, and a theme for each project
folder if you want one. Nothing in Claude's own files is changed, so app updates leave it alone.

> **Unofficial.** Not made or supported by Anthropic. It uses a developer hook in Claude Desktop that a future update
> could remove. If that happens, Claude just looks normal again.

## Install (Windows)

You need [Node.js](https://nodejs.org) 18 or newer and the Claude desktop app.

```
git clone https://github.com/bigot41/claude-desktop-olympus.git
cd claude-desktop-olympus
node apply.mjs olympus
```

Then **fully quit Claude Desktop** (right-click its tray icon > Quit; closing the window is not enough) and open it
again. That restart is only needed the first time.

To update later: `git pull`, then `node apply.mjs sync`.

## Use

- **Theme** row in the sidebar menu (under Customize): opens a gallery of every theme with search.
  - **Everywhere**: the theme for all chats.
  - **This project**: the theme only for chats in that project folder. Opening a chat in another project switches
    the theme by itself.
  - **Claude's own**: the normal look.
- From a terminal:

```
node apply.mjs <theme>     # set the default theme (e.g. olympus, athena, nyx, boreas-light)
node apply.mjs list        # list themes
node apply.mjs sync        # push edited themes and add-ons, live
node apply.mjs off         # default back to Claude's own look
node apply.mjs uninstall   # remove everything, then restart Claude
```

## How it works

When the `REACT_PROFILE=1` environment variable is set, Claude Desktop loads a browser extension from
`<Claude data folder>\extensions\fmkadmapgofadopljbjfkapdkoienihi`, the slot meant for React DevTools.
`apply.mjs` sets that variable for your Windows account and puts this project's extension in that folder (it finds the
data folder whether Claude keeps it in `%APPDATA%\Claude` or, for some Microsoft Store installs,
`%LOCALAPPDATA%\Claude-Data\claude_<id>`).

The extension only runs on Claude's own pages (`https://claude.ai/*`), never on websites in Claude's built-in browser.
It re-reads its theme files every second, so theme changes show up without a restart. Add-ons in `extension/mods/`
(the picker is one) reload live too. Changes to `extension/src/` or `manifest.json` need a Claude restart.

`uninstall` deletes that folder and the `REACT_PROFILE` variable.

## Make your own theme

Make a folder `themes/<name>/` with a `theme.json`, then `node apply.mjs sync`. It shows up in the picker under "Mine".

```json
{
  "name": "My Theme",
  "bg": "#0e1020",
  "text": "#e8e8f2",
  "accent": "#8b7cff",
  "image": "wallpaper.jpg",
  "vars": { "cds-radius": "10px" }
}
```

- `bg`, `text`, `accent`: three hex colors; every other color in the app is worked out from them.
- `font`: a font family, e.g. `"Inter, sans-serif"`.
- `image`: a wallpaper file in the theme's folder (png, jpg, webp, gif, avif, svg). Set `vars.wall-sky` to
  `"var(--wall-image) center / cover no-repeat, <bg color>"` to show it (see `themes/starter`).
- `images`: named art, e.g. `{ "top": "statue.png" }`, available to CSS as `var(--img-top)`.
- `wallpaper`: an animated ASCII scene from `extension/src/scenes` (`moonlit`, `neon-rain`, `koi-pond`, …), with
  `speed`, `cell` and `veil`.
- `vars`: any of Claude's CSS variables.
- `sheets`: shared CSS files from `themes/` to include, e.g. `["_olympus"]`.
- `theme.css` in the folder (optional): any CSS. No backslashes and no outside URLs (`url()` only for `data:`).

The god themes are generated from [T3 Olympus](https://github.com/bigot41/t3-olympus) with
`node convert-olympus.mjs <path to t3-olympus>`.

## Credits

- Theme engine (`extension/src`, `assemble.mjs`, `themes/_base.css`, `themes/_wallpaper.css`) and the animated
  scenes: [0toshigami/claude-desktop-themes](https://github.com/0toshigami/claude-desktop-themes), MIT
  ([license](docs/THEMES-FOR-CLAUDE-LICENSE.txt)). Changed here: install folder detection, Claude pages only, image
  wallpapers, live add-ons, the picker.
- God art and palettes: [Pantheon](docs/PANTHEON-LICENSE.txt) by Adolanium, MIT. The twelve newer gods were made for
  T3 Olympus from public-domain and CC0 sources ([list](docs/NEW-GODS-CREDITS.md)).
- Not affiliated with Anthropic.
