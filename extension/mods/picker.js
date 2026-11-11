// The in-app theme picker: a "Theme" row in Claude's sidebar menu (styled as Claude's own rows) that opens a gallery
// of every theme. A pick is saved for the open chat's project, or for everywhere. Reloads live: apply.mjs gives this
// file a new ?v= when it changes, and the copy before it is cleaned up first.
const kit = globalThis.themesForClaude;
kit.pickerCleanup?.();

const KEY = 'claude-theme:picks';
const saved = () => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {}; } catch { return {}; } };
const save = p => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };

// The open chat's project: its sidebar group is tagged data-group-section="project-<folder or repo>"
kit.project = () => {
  const sec = document.querySelector('.dframe-sidebar [aria-current=page]')?.closest('[data-group-section]')?.dataset.groupSection;
  return sec?.startsWith('project-') ? sec.slice('project-'.length) : '';
};
const short = p => p.split(/[\\/]/).filter(Boolean).pop() ?? p;
const art = f => (f ? chrome.runtime.getURL(`wallpapers/${f}`) : '');

let all = {}, allText = '';
const load = async () => {
  try {
    const text = await kit.read('themes.json');
    if (text === allText) return false;
    allText = text; all = JSON.parse(text);
    return true;
  } catch { return false; }
};
await load();

// what is picked for the open chat: its project's pick, else the everywhere pick; 'claude' = Claude's own look
const chosen = () => { const p = saved(), proj = kit.project(); return { id: p[proj] ?? p['*'], from: proj && p[proj] ? proj : '*' }; };
kit.pick = t => {
  const { id } = chosen();
  if (id === 'claude') return {};
  return (id && all[id]) || t;
};

const el = (tag, props = {}, ...kids) => { const e = Object.assign(document.createElement(tag), props); e.append(...kids); return e; };

const css = el('style', { id: 'claude-theme-picker-css', textContent: `
.ct-row .ct-dot { width: 16px; height: 16px; border-radius: 50%; margin: 2px;
  background: conic-gradient(var(--ct-a) 0 50%, var(--ct-b) 0 100%);
  box-shadow: 0 0 0 1px color-mix(in srgb, currentColor 35%, transparent); }
.ct-row .ct-now { margin-inline-start: auto; font-size: 12px; opacity: .6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px; }
#ct-panel { position: fixed; z-index: 2147483647; width: 372px; max-height: min(620px, calc(100vh - 24px)); display: flex; flex-direction: column;
  border-radius: 16px; overflow: hidden; font: 13px/1.35 var(--cds-font-sans, system-ui), sans-serif;
  color: var(--cds-text-primary, #eee); background: color-mix(in srgb, var(--cds-surface-1, #1b1b1b) 88%, transparent);
  backdrop-filter: blur(18px) saturate(1.2); border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  box-shadow: 0 18px 50px rgb(0 0 0 / .45), 0 0 0 1px rgb(0 0 0 / .2); animation: ct-in .16s ease-out; }
@keyframes ct-in { from { opacity: 0; transform: translateX(-6px) scale(.98); } }
#ct-panel .ct-top { display: flex; flex-direction: column; gap: 8px; padding: 12px 12px 10px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent); }
#ct-panel .ct-title { display: flex; align-items: baseline; gap: 8px; font-size: 14px; font-weight: 600; }
#ct-panel .ct-title small { font-weight: 400; opacity: .55; font-size: 12px; }
#ct-panel input { width: 100%; box-sizing: border-box; padding: 7px 10px; border-radius: 9px; font: inherit; color: inherit; outline: none;
  background: color-mix(in srgb, currentColor 7%, transparent); border: 1px solid color-mix(in srgb, currentColor 12%, transparent); }
#ct-panel input:focus { border-color: var(--cds-text-accent, #888); }
#ct-panel .ct-seg { display: flex; padding: 3px; border-radius: 10px; background: color-mix(in srgb, currentColor 7%, transparent); }
#ct-panel .ct-seg button { flex: 1; min-width: 0; padding: 5px 8px; border: 0; border-radius: 8px; font: inherit; font-size: 12px; color: inherit;
  background: none; cursor: pointer; opacity: .7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
#ct-panel .ct-seg button.on { opacity: 1; background: var(--cds-surface-3, #333); box-shadow: 0 1px 3px rgb(0 0 0 / .25); }
#ct-panel .ct-list { overflow: auto; padding: 4px 12px 12px; }
#ct-panel .ct-head { margin: 12px 2px 6px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; opacity: .5; }
#ct-panel .ct-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
#ct-panel .ct-card { position: relative; display: flex; flex-direction: column; padding: 0; border-radius: 11px; overflow: hidden; cursor: pointer;
  font: inherit; color: var(--c-text); background: var(--c-bg); text-align: start;
  border: 1px solid color-mix(in srgb, var(--c-text) 16%, transparent); transition: transform .12s, box-shadow .12s; }
#ct-panel .ct-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgb(0 0 0 / .35); }
#ct-panel .ct-card.on { box-shadow: 0 0 0 2px var(--c-accent), 0 6px 16px rgb(0 0 0 / .35); }
#ct-panel .ct-art { height: 62px; background: var(--c-art) center 4px / 100% auto no-repeat; image-rendering: pixelated;
  -webkit-mask-image: linear-gradient(#000 60%, transparent); mask-image: linear-gradient(#000 60%, transparent); }
#ct-panel .ct-art.none { background: linear-gradient(135deg, var(--c-bg), var(--c-accent)); -webkit-mask-image: none; mask-image: none; }
#ct-panel .ct-name { display: flex; align-items: center; gap: 5px; padding: 5px 7px 7px; font-size: 12px; white-space: nowrap; overflow: hidden; }
#ct-panel .ct-name i { flex: none; width: 7px; height: 7px; border-radius: 50%; background: var(--c-accent); }
#ct-panel .ct-name span { overflow: hidden; text-overflow: ellipsis; }
#ct-panel .ct-tick { position: absolute; top: 5px; right: 5px; width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center;
  font-size: 11px; background: var(--c-accent); color: var(--c-bg); }
#ct-panel .ct-plain { display: flex; gap: 8px; }
#ct-panel .ct-plain button { flex: 1; padding: 8px; border-radius: 10px; font: inherit; font-size: 12px; color: inherit; cursor: pointer;
  background: color-mix(in srgb, currentColor 6%, transparent); border: 1px solid color-mix(in srgb, currentColor 12%, transparent); }
#ct-panel .ct-plain button.on { border-color: var(--cds-text-accent, #888); background: color-mix(in srgb, var(--cds-text-accent, #888) 18%, transparent); }
` });
document.head.append(css);

let panel, scope = '*', filter = '';
const close = () => { panel?.remove(); panel = undefined; };

const choose = async id => {
  const p = saved();
  if (id === undefined) delete p[scope]; else p[scope] = id;
  save(p);
  await kit.reapply();
  drawRow();
  if (panel) drawPanel();
};

function drawPanel() {
  const p = saved(), proj = kit.project();
  if (scope !== '*' && scope !== proj) scope = '*';
  const current = p[scope];
  const list = el('div', { className: 'ct-list' });
  const plain = el('div', { className: 'ct-plain' });
  if (scope !== '*') plain.append(el('button', { textContent: 'Same as everywhere', className: current === undefined ? 'on' : '', onclick: () => choose(undefined) }));
  plain.append(el('button', { textContent: scope === '*' ? 'Default' : 'Default (apply.mjs)', className: (scope === '*' ? current === undefined : current === 'default') ? 'on' : '',
    onclick: () => choose(scope === '*' ? undefined : 'default') }));
  plain.append(el('button', { textContent: "Claude's own", className: current === 'claude' ? 'on' : '', onclick: () => choose('claude') }));
  list.append(plain);

  const groups = {};
  const q = filter.trim().toLowerCase();
  for (const [id, t] of Object.entries(all))
    if (!q || `${t.name ?? id} ${id}`.toLowerCase().includes(q)) (groups[t.group ?? 'Mine'] ??= []).push([id, t]);
  for (const [g, items] of Object.entries(groups)) {
    list.append(el('div', { className: 'ct-head', textContent: `${g} · ${items.length}` }));
    const grid = el('div', { className: 'ct-grid' });
    for (const [id, t] of items.sort((a, b) => (a[1].name ?? a[0]).localeCompare(b[1].name ?? b[0]))) {
      const card = el('button', { className: `ct-card${current === id ? ' on' : ''}`, title: t.name ?? id, onclick: () => choose(id) },
        el('div', { className: `ct-art${t.images?.top || t.image ? '' : ' none'}` }),
        el('div', { className: 'ct-name' }, el('i'), el('span', { textContent: (t.name ?? id).replace(' (light)', ' ☀') })));
      if (current === id) card.append(el('span', { className: 'ct-tick', textContent: '✓' }));
      for (const [k, v] of [['bg', t.bg], ['text', t.text], ['accent', t.accent]]) if (v) card.style.setProperty(`--c-${k}`, v);
      const img = art(t.images?.top ?? t.image);
      if (img) card.style.setProperty('--c-art', `url("${img}")`);
      grid.append(card);
    }
    list.append(grid);
  }

  const search = el('input', { placeholder: 'Search themes', value: filter, oninput: e => { filter = e.target.value; drawPanel(); } });
  const top = el('div', { className: 'ct-top' }, el('div', { className: 'ct-title' }, 'Theme', el('small', { textContent: `${Object.keys(all).length} themes` })), search);
  if (proj) top.append(el('div', { className: 'ct-seg' },
    el('button', { textContent: `This project · ${short(proj)}`, title: proj, className: scope === proj ? 'on' : '', onclick: () => { scope = proj; drawPanel(); } }),
    el('button', { textContent: 'Everywhere', className: scope === '*' ? 'on' : '', onclick: () => { scope = '*'; drawPanel(); } })));

  const scroll = panel?.querySelector('.ct-list')?.scrollTop ?? 0, focused = document.activeElement?.tagName === 'INPUT' && panel?.contains(document.activeElement);
  if (!panel) { panel = el('div', { id: 'ct-panel' }); document.body.append(panel); }
  panel.replaceChildren(top, list);
  list.scrollTop = scroll;
  if (focused) { search.focus(); search.setSelectionRange(filter.length, filter.length); }
  place();
}

// The sidebar row: a copy of Claude's own "Customize" row, so it looks native; Claude may redraw its menu, so it is
// put back each second
let row;
const anchor = () => document.querySelector('.dframe-sidebar [data-nav-item=customize]');
function drawRow() {
  if (!row) return;
  const { id } = chosen(), t = id && id !== 'claude' ? all[id] : undefined;
  const name = id === 'claude' ? "Claude's own" : t?.name ?? 'Default';
  const label = row.querySelector('.ct-label'), now = row.querySelector('.ct-now'), dot = row.querySelector('.ct-dot');
  if (label) label.textContent = 'Theme';
  if (now) now.textContent = name;
  dot?.style.setProperty('--ct-a', t?.accent ?? 'var(--cds-text-accent, #999)');
  dot?.style.setProperty('--ct-b', t?.bg ?? 'var(--cds-surface-3, #333)');
}
function mountRow() {
  const a = anchor();
  if (!a) return;
  if (row?.isConnected && row.previousElementSibling === a) return;
  row?.remove();
  row = a.cloneNode(true);
  row.classList.add('ct-row');
  for (const k of ['data-nav-item', 'aria-label', 'data-selected', 'aria-current', 'id']) row.removeAttribute(k);
  row.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
  const icon = row.querySelector('[data-cds=Icon]');
  icon?.replaceChildren(el('span', { className: 'ct-dot' }));
  const text = [...row.querySelectorAll('span')].find(s => s.children.length === 0 && s.textContent.trim());
  if (text) { text.classList.add('ct-label'); text.after(el('span', { className: 'ct-now' })); }
  row.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); if (panel) close(); else drawPanel(); }, true);
  a.after(row);
  drawRow();
}
function place() {
  if (!panel) return;
  const r = (row?.isConnected ? row : document.querySelector('.dframe-sidebar'))?.getBoundingClientRect();
  const side = document.querySelector('.dframe-sidebar')?.getBoundingClientRect();
  const left = Math.max(8, (side?.right ?? r?.right ?? 0) + 8);
  const h = panel.offsetHeight || 500;
  const top = Math.max(12, Math.min((r?.top ?? 12) - 12, innerHeight - h - 12));
  Object.assign(panel.style, { left: `${left}px`, top: `${top}px` });
}

const onDoc = e => { if (panel && !panel.contains(e.target) && !row?.contains(e.target)) close(); };
const onKey = e => { if (e.key === 'Escape' && panel) close(); };
document.addEventListener('pointerdown', onDoc, true);
document.addEventListener('keydown', onKey, true);
addEventListener('resize', place);

// each second: keep the row in place; follow the open chat's project; pick up edited themes (node apply.mjs sync)
let lastProject = kit.project();
const tick = setInterval(async () => {
  mountRow();
  const proj = kit.project(), changed = await load();
  if (proj !== lastProject || changed) {
    lastProject = proj;
    await kit.reapply();
    drawRow();
    if (panel) drawPanel();
  }
}, 1000);

mountRow();
await kit.reapply();

kit.pickerCleanup = () => {
  clearInterval(tick);
  document.removeEventListener('pointerdown', onDoc, true);
  document.removeEventListener('keydown', onKey, true);
  removeEventListener('resize', place);
  row?.remove(); close(); css.remove();
  delete kit.pick; delete kit.project;
};
