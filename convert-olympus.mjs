// Turns T3 Olympus's god themes (palettes + art) into claude-theme themes: themes/<god>/ and, for a god with
// separate light and dark looks, themes/<god>-light/ too.   node convert-olympus.mjs [path-to-t3-olympus]
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const src = process.argv[2] ?? join(process.env.USERPROFILE, 'Projects', 't3-olympus')
const title = s => s.charAt(0).toUpperCase() + s.slice(1)

// T3's palette names -> Claude Desktop's CSS variables (bg, text, accent derive the rest in the engine)
const toClaude = c => ({
  bg: c.canvas, text: c.text, accent: c.accent,
  vars: {
    'cds-surface-1': c.surface, 'cds-surface-2': c.surfaceOverlay ?? c.surfaceRaised, 'cds-surface-3': c.muted,
    'desktop-theme-backdrop': c.sidebar ?? c.canvas,
    'cds-text-secondary': c.secondaryForeground, 'cds-undimmed-text-secondary': c.secondaryForeground,
    'cds-text-muted': c.textMuted, 'cds-undimmed-text-muted': c.textMuted,
    'cds-role-accent-on': c.accentForeground, 'cds-on-accent': c.accentForeground, 'cds-on-brand': c.accentForeground,
    'cds-bg-accent': c.accentSurface,
    'olympus-border': c.border,
  },
})

let made = 0
for (const file of readdirSync(join(src, 'themes')).filter(f => /^pantheon-.+\.json$/.test(f))) {
  const god = file.slice('pantheon-'.length, -'.json'.length)
  const t3 = JSON.parse(readFileSync(join(src, 'themes', file), 'utf8'))
  const v = t3.variants ?? {}
  const twoLooks = v.light && v.dark && JSON.stringify(v.light) !== JSON.stringify(v.dark)
  const looks = twoLooks ? [[god, v.dark, ''], [`${god}-light`, v.light, '-light']] : [[god, t3.colors, '']]
  for (const [id, colors, suffix] of looks) {
    const out = join(here, 'themes', id)
    mkdirSync(out, { recursive: true })
    const images = {}
    for (const slot of ['top', 'bottom', 'hero']) {
      const art = join(src, 'art', `${god}-${slot}${suffix}.png`)
      if (!existsSync(art)) continue
      copyFileSync(art, join(out, `${id}-${slot}.png`))
      images[slot] = `${id}-${slot}.png`
    }
    const name = `${title(god === 'mars' ? 'ares' : god)}${suffix ? ' (light)' : ''}`
    writeFileSync(join(out, 'theme.json'), JSON.stringify({ name, group: 'Olympus', ...toClaude(colors), images,
      sheets: ['_olympus'] }, null, 2) + '\n')
    made++
  }
}
console.log(`made ${made} themes from ${src}`)
