// Installs the extension into Claude Desktop's React DevTools slot and switches themes.
//   node apply.mjs <theme>     install (or update) and switch to themes/<theme>
//   node apply.mjs off         back to Claude's own look (extension stays installed)
//   node apply.mjs list        list your themes
//   node apply.mjs uninstall   remove the extension and REACT_PROFILE
// Theme switches show up live (the page re-reads theme.json each second). Engine/manifest changes and the
// first install need a full Claude Desktop restart (quit from the tray, then open it).
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { assemble } from './assemble.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const read = (...p) => readFileSync(join(here, ...p), 'utf8')
const ID = 'fmkadmapgofadopljbjfkapdkoienihi' // React DevTools: the id Claude loads when REACT_PROFILE=1

// Claude's data folder. The Store build can move it to %LOCALAPPDATA%\Claude-Data\claude_<publisher>,
// leaving only a marker in %APPDATA%\Claude, so pick whichever folder Claude actually wrote to last.
function userData() {
  const found = []
  const moved = join(process.env.LOCALAPPDATA, 'Claude-Data')
  if (existsSync(moved))
    for (const d of readdirSync(moved)) if (existsSync(join(moved, d, 'Preferences'))) found.push(join(moved, d))
  const plain = join(process.env.APPDATA, 'Claude')
  if (existsSync(join(plain, 'Preferences'))) found.push(plain)
  if (!found.length) throw new Error('Could not find Claude Desktop\'s data folder. Open Claude once, then try again.')
  return found.sort((a, b) => statSync(join(b, 'Preferences')).mtimeMs - statSync(join(a, 'Preferences')).mtimeMs)[0]
}

const slot = join(userData(), 'extensions', ID)
const reactProfile = () => {
  try { return /REACT_PROFILE\s+REG_\w+\s+1/.test(execFileSync('reg', ['query', 'HKCU\\Environment', '/v', 'REACT_PROFILE'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })) }
  catch { return false }
}

function install() {
  mkdirSync(join(slot, 'scenes'), { recursive: true })
  mkdirSync(join(slot, 'wallpapers'), { recursive: true })
  const scenes = readdirSync(join(here, 'extension/src/scenes')).filter(f => f.endsWith('.js')).sort()
    .map(f => read('extension/src/scenes', f))
  writeFileSync(join(slot, 'theme.js'), assemble(read('extension/src/core.js'), scenes, read('extension/src/engine.js')))
  copyFileSync(join(here, 'extension/manifest.json'), join(slot, 'manifest.json'))
  if (!existsSync(join(slot, 'event.json'))) writeFileSync(join(slot, 'event.json'), '{"n":0}')
  if (!reactProfile()) {
    execFileSync('setx', ['REACT_PROFILE', '1'])
    console.log('Set REACT_PROFILE=1 for your Windows account. Fully quit Claude Desktop (tray icon > Quit) and open it again.')
  }
}

const themeNames = () => readdirSync(join(here, 'themes')).filter(d => existsSync(join(here, 'themes', d, 'theme.json')))

// One theme as the engine reads it: its CSS joined in, its image files copied into the extension's wallpapers/
function compile(name) {
  const dir = join(here, 'themes', name)
  if (!existsSync(join(dir, 'theme.json'))) throw new Error(`No theme "${name}". Try: node apply.mjs list`)
  const t = JSON.parse(readFileSync(join(dir, 'theme.json'), 'utf8'))
  t.id ??= name
  for (const f of [t.image, ...Object.values(t.images ?? {})].filter(Boolean))
    copyFileSync(join(dir, f), join(slot, 'wallpapers', f))
  const own = existsSync(join(dir, 'theme.css')) ? readFileSync(join(dir, 'theme.css'), 'utf8') : ''
  t.css = [read('themes/_base.css'), t.wallpaper || t.image ? read('themes/_wallpaper.css') : '',
    ...(t.sheets ?? []).map(s => read('themes', `${s}.css`)), own].join('\n')
  delete t.sheets
  if (/\\/.test(t.css)) console.warn(`Warning: "${name}" has a backslash in its CSS; the engine will skip that CSS.`)
  return t
}

// Every theme in one file (for the in-app picker) and the add-ons list (a new ?v= reloads one live)
function bundle() {
  const all = {}
  for (const n of themeNames()) all[n] = compile(n)
  writeFileSync(join(slot, 'themes.json'), JSON.stringify(all))
  mkdirSync(join(slot, 'mods'), { recursive: true })
  const mods = readdirSync(join(here, 'extension/mods')).filter(f => f.endsWith('.js'))
  for (const f of mods) copyFileSync(join(here, 'extension/mods', f), join(slot, 'mods', f))
  writeFileSync(join(slot, 'addons.json'), JSON.stringify(mods.map(f =>
    `mods/${f}?v=${Math.round(statSync(join(here, 'extension/mods', f)).mtimeMs)}`)))
}

function use(name) {
  bundle()
  writeFileSync(join(slot, 'theme.json'), JSON.stringify(compile(name)))
  console.log(`Default theme is now "${name}". (A theme picked with the in-app button wins over it.)`)
}

const [cmd = 'list'] = process.argv.slice(2)
if (cmd === 'list') {
  console.log(themeNames().join('\n'))
} else if (cmd === 'sync') {
  install()
  bundle()
  console.log('Themes and add-ons updated.')
} else if (cmd === 'off') {
  install()
  bundle()
  writeFileSync(join(slot, 'theme.json'), '{}')
  console.log('Back to Claude\'s own look.')
} else if (cmd === 'uninstall') {
  rmSync(slot, { recursive: true, force: true })
  try { execFileSync('reg', ['delete', 'HKCU\\Environment', '/v', 'REACT_PROFILE', '/f']) } catch {}
  console.log('Removed. Fully quit and reopen Claude Desktop.')
} else {
  install()
  use(cmd)
}
console.log(`(extension folder: ${slot})`)
