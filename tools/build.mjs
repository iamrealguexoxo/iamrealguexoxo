#!/usr/bin/env node
// Erzeugt die animierten SVGs fürs GitHub-Profil: assets/<name>-dark.svg und assets/<name>-light.svg.
// Aufruf: node tools/build.mjs   (keine Abhängigkeiten)
// Schrift: in <img>-SVGs laden keine Webfonts, deshalb Systemschriften; das Logo selbst ist gezeichnet (Pfade).
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'assets')
mkdirSync(OUT, { recursive: true })

const SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Helvetica, Arial, sans-serif`
const MONO = `ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace`

const THEMES = {
  dark: {
    bg0: '#07090f', bg1: '#0f1324', border: 'rgba(255,255,255,0.09)', grid: '#8b9bd6', gridOp: 0.1,
    text: '#eef1f8', muted: '#8a93b0', dim: '#262c45', line: '#56618c',
    cyan: '#5ee7ff', violet: '#a970ff', green: '#3ddc84',
    bolt: '#ffffff', strike: '#ffffff', hl: '#ffffff', flash: '#e9f8ff', flashPeak: 0.45, glow: 0.8,
    legendary: '#ff9a2e', epic: '#b866ff', rare: '#3d9bff', chipOp: 0.11,
    fur: '#969eb3', furDark: '#62697f', white: '#f2f4f9', mask: '#1b1e2c', outline: '#323850', eye: '#ffffff', nose: '#07080c', frame: '#151a2e',
  },
  light: {
    bg0: '#fbfcff', bg1: '#eef1fa', border: 'rgba(11,13,20,0.10)', grid: '#46508a', gridOp: 0.09,
    text: '#0b0d14', muted: '#4b5374', dim: '#d6dbea', line: '#98a1c4',
    cyan: '#0891b2', violet: '#7c3aed', green: '#16a34a',
    bolt: '#0b0d14', strike: '#1e1b4b', hl: '#ffffff', flash: '#0891b2', flashPeak: 0.16, glow: 0.5,
    legendary: '#c2570a', epic: '#7e22ce', rare: '#0062c4', chipOp: 0.09,
    fur: '#8f97ac', furDark: '#5c6379', white: '#ffffff', mask: '#1b1e2c', outline: '#1d2130', eye: '#ffffff', nose: '#07080c', frame: '#eef1fa',
  },
}

const r2 = (n) => Math.round(n * 100) / 100
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Kleiner, deterministischer Zufall (mulberry32), damit jeder Lauf dieselben Bilder erzeugt */
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const REDUCED = `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`

/** Gemeinsame Karte: abgerundeter „Bildschirm“ mit Punktraster, Inhalt wird auf die Karte zugeschnitten */
function card({ w, h, t, title, css, body, flat = false }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="ttl">
<title id="ttl">${esc(title)}</title>
<style>
text { font-family: ${SANS}; }
.mono { font-family: ${MONO}; }
${css}
${REDUCED}
</style>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${flat ? t.bg0 : t.bg1}"/><stop offset="1" stop-color="${t.bg0}"/></linearGradient>
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="${t.grid}" fill-opacity="${t.gridOp}"/></pattern>
  <clipPath id="clip"><rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="26"/></clipPath>
  <filter id="blur" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>
  <filter id="soft" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.6"/></filter>
</defs>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="26" fill="url(#bg)"/>
<g clip-path="url(#clip)">
<rect width="${w}" height="${h}" fill="url(#dots)"/>
${body}
</g>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="26" fill="none" stroke="${t.border}" stroke-width="1.5"/>
</svg>
`
}

// ---------------------------------------------------------------- Header mit Logo

const circlePath = (x, y, r) => `M${x - r} ${y} A${r} ${r} 0 1 0 ${x + r} ${y} A${r} ${r} 0 1 0 ${x - r} ${y}`

/** Eigene Monoline-Kleinbuchstaben: x-Höhe 40, Grundlinie y = 0 */
const GLYPHS = {
  i: { w: 0, p: ['M0 -40 V0'], dot: [0, -55] },
  a: { w: 40, p: [circlePath(20, -20, 20), 'M40 -40 V0'] },
  m: { w: 56, p: ['M0 0 V-26 A14 14 0 0 1 28 -26 V0', 'M28 -26 A14 14 0 0 1 56 -26 V0'] },
  r: { w: 22, p: ['M0 0 V-24 A16 16 0 0 1 16 -40 H22'] },
  e: { w: 40, p: ['M0 -20 H40 A20 20 0 1 0 34.14 -5.86'] },
  l: { w: 0, p: ['M0 -62 V0'] },
  g: { w: 40, p: [circlePath(20, -20, 20), 'M40 -40 V6 A17 17 0 0 1 8.28 14.5'] },
  u: { w: 28, p: ['M0 -40 V-14 A14 14 0 0 0 28 -14', 'M28 -40 V0'] },
  x: { w: 36, p: ['M0 -40 L36 0', 'M36 -40 L0 0'] },
  o: { w: 40, p: [circlePath(20, -20, 20)] },
}

// Monogramm: ein „G“ (Ring mit Öffnung oben rechts und Querstrich) mit einem Blitz in der Mitte
const RING = 'M645.96 111.43 A60 60 0 1 0 660 150 L628 150'
const BOLT = 'M603.6 110.4 L576 153.6 L592.8 153.6 L584.4 190.8 L612 145.2 L595.2 145.2 Z'
const STRIKE = 'M620 -8 L606 16 L615 27 L598 50 L610 63 L596 86 L603.6 110.4'

function header(t) {
  const W = 1200
  const H = 440
  const rand = rng(11)

  // Hintergrund-Netz links und rechts (verteilt über ein Raster mit Zufallsversatz)
  const nodes = []
  for (const [x0, x1] of [[52, 322], [878, 1148]]) {
    const cells = []
    for (let c = 0; c < 3; c++) for (let r = 0; r < 4; r++) cells.push([c, r])
    cells.splice(Math.floor(rand() * cells.length), 1)
    for (const [c, r] of cells) {
      const cw = (x1 - x0) / 3
      const rh = 318 / 4
      nodes.push({ x: x0 + cw * (c + 0.15 + rand() * 0.7), y: 86 + rh * (r + 0.15 + rand() * 0.7), r: 1.3 + rand() * 1.7, left: x0 < 600 })
    }
    // Ankerpunkt, von dem die Leitung waagrecht ins Logo läuft (links und rechts symmetrisch)
    nodes.push({ x: x0 < 600 ? 318 : 882, y: 150, r: 3, left: x0 < 600, anchor: true })
  }
  const edges = new Set()
  nodes.forEach((n, i) => {
    nodes
      .map((m, j) => ({ j, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2, same: m.left === n.left }))
      .filter((o) => o.j !== i && o.same)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
      .forEach((o) => edges.add(i < o.j ? `${i}-${o.j}` : `${o.j}-${i}`))
  })
  const lines = [...edges]
    .map((k) => {
      const [a, b] = k.split('-').map(Number)
      return `<line x1="${r2(nodes[a].x)}" y1="${r2(nodes[a].y)}" x2="${r2(nodes[b].x)}" y2="${r2(nodes[b].y)}"/>`
    })
    .join('')
  const dots = nodes
    .map((n, i) => {
      const acc = n.anchor ? ' acc1' : i % 7 === 2 ? ' acc1' : i % 7 === 5 ? ' acc2' : ''
      const tw = rand() < 0.5 ? ` tw" style="animation-duration:${r2(2.4 + rand() * 3)}s;animation-delay:${r2(rand() * 4)}s` : ''
      return `<circle class="nd${acc}${tw}" cx="${r2(n.x)}" cy="${r2(n.y)}" r="${r2(n.r)}"/>`
    })
    .join('')

  // Schriftzug
  const WORD = 'iamrealguexoxo'
  let x = 0
  const placed = []
  for (const ch of WORD) {
    placed.push({ ch, x })
    x += GLYPHS[ch].w + 16
  }
  const wordW = x - 16
  const s = 0.8
  const tx = 600 - (wordW / 2) * s
  const colorOf = (i) => (i < 7 ? 'c-dim' : i < 10 ? 'c-hi' : WORD[i] === 'x' ? 'c-x' : 'c-o')
  const glyphs = placed
    .map(({ ch, x: gx }, i) => {
      const g = GLYPHS[ch]
      const d0 = 1.25 + i * 0.075
      const paths = g.p
        .map((d, k) => `<path class="gp ${colorOf(i)}" d="${d}" pathLength="1" style="animation-delay:${r2(d0 + k * 0.12)}s"/>`)
        .join('')
      const dot = g.dot
        ? `<circle class="dot ${colorOf(i)}f" cx="${g.dot[0]}" cy="${g.dot[1]}" r="5.4" style="animation-delay:${r2(d0 + 0.3)}s"/>`
        : ''
      const mark = i >= 10 ? ` class="mark" style="animation-delay:${r2(2.95 + (i - 10) * 0.13)}s"` : ''
      return `<g transform="translate(${gx} 0)"><g${mark}>${paths}${dot}</g></g>`
    })
    .join('')

  const css = `
.hud { font-size: 13px; fill: ${t.muted}; animation: fadein .6s ease .05s both; }
.hud .acc { fill: ${t.cyan}; }
.net { opacity: .45; animation: netwave 1.8s ease-out .5s both; }
.net line { stroke: ${t.line}; stroke-width: 1; stroke-opacity: .6; }
.nd { fill: ${t.line}; }
.nd.acc1 { fill: ${t.cyan}; } .nd.acc2 { fill: ${t.violet}; }
.tw { animation: twinkle 3s ease-in-out infinite alternate; }
.feed { fill: none; stroke: ${t.cyan}; stroke-width: 1.4; stroke-dasharray: 3 9; opacity: .6; animation: feed 1.1s linear infinite, fadein .6s ease 1.3s both; }
.leader { fill: none; stroke: ${t.strike}; stroke-width: 1.4; opacity: 0; animation: leader .34s linear .1s both; }
.strike { opacity: 0; animation: strikefade .62s ease-out .42s both; }
.sb { fill: none; stroke: ${t.strike}; stroke-width: 3.6; stroke-linecap: round; stroke-dasharray: 1 2; animation: draw .13s linear .42s both; }
.sbg { fill: none; stroke: ${t.cyan}; stroke-width: 12; stroke-linecap: round; stroke-dasharray: 1 2; opacity: .85; animation: draw .13s linear .42s both; }
.sbr { fill: none; stroke: ${t.strike}; stroke-width: 1.7; stroke-linecap: round; stroke-dasharray: 1 2; animation: draw .12s linear .5s both; }
.flash { fill: ${t.flash}; opacity: 0; animation: flash .9s ease-out .52s both; }
.shock { fill: none; stroke: ${t.cyan}; stroke-width: 2.5; opacity: 0; transform-origin: 600px 150px; animation: shock 1.1s cubic-bezier(.15,.6,.3,1) .55s both; }
.ring { fill: none; stroke: url(#grad); stroke-width: 11; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1 2; animation: draw .85s cubic-bezier(.65,0,.25,1) .62s both; }
.rglow { fill: none; stroke: url(#grad); stroke-width: 16; stroke-linecap: round; opacity: 0; animation: fadeto3 .9s ease 1.25s both; }
@keyframes fadeto3 { from { opacity: 0 } to { opacity: ${r2(t.glow * 0.5)} } }
.orbit { fill: none; stroke: ${t.hl}; stroke-width: 4; stroke-linecap: round; stroke-dasharray: .07 .93; opacity: 0; animation: orbit 3.4s linear 1.7s infinite, fadeto .4s ease 1.7s both; }
.bolt { fill: ${t.bolt}; transform-box: fill-box; transform-origin: center; animation: pop .55s cubic-bezier(.2,1.5,.35,1) .5s both; }
.bglow { fill: ${t.cyan}; opacity: 0; animation: fadeto2 .4s ease .55s both, breathe 2.6s ease-in-out 1.2s infinite alternate; }
.spark { fill: none; stroke: ${t.cyan}; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; opacity: 0; animation: spark 6.5s linear 3.2s infinite; }
.bflash { fill: ${t.hl}; opacity: 0; animation: spark 6.5s linear 3.2s infinite; }
.gp { fill: none; stroke-width: 8.5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1 2; animation: draw .6s cubic-bezier(.65,0,.25,1) both; }
.c-dim { stroke: ${t.text}; opacity: .6; } .c-dimf { fill: ${t.text}; opacity: .6; }
.c-hi { stroke: ${t.text}; }
.c-x { stroke: ${t.cyan}; } .c-o { stroke: ${t.violet}; }
.dot { transform-box: fill-box; transform-origin: center; animation: popdim .35s cubic-bezier(.2,1.5,.35,1) both; }
.mark { transform-box: fill-box; transform-origin: center; animation: mark .5s cubic-bezier(.2,1.6,.4,1) both; }
.tag { font-size: 15px; font-weight: 650; letter-spacing: 4.2px; fill: ${t.muted}; animation: rise .7s ease 2.6s both; }
.quote { font-size: 15.5px; font-style: italic; fill: ${t.muted}; animation: rise .7s ease 2.85s both; }
.live { fill: ${t.green}; }
.livering { fill: none; stroke: ${t.green}; stroke-width: 1.5; opacity: 0; transform-origin: 1104px 41px; animation: ping 2s ease-out 1s infinite; }
@keyframes draw { from { stroke-dashoffset: 1.05 } to { stroke-dashoffset: 0 } }
@keyframes fadein { from { opacity: 0 } to { opacity: 1 } }
@keyframes fadeto { from { opacity: 0 } to { opacity: .9 } }
@keyframes fadeto2 { from { opacity: 0 } to { opacity: .5 } }
@keyframes netwave { 0% { opacity: .15 } 22% { opacity: 1 } 100% { opacity: .45 } }
@keyframes twinkle { from { opacity: .25 } to { opacity: 1 } }
@keyframes feed { to { stroke-dashoffset: -24 } }
@keyframes leader { 0% { opacity: 0 } 15% { opacity: .5 } 30% { opacity: 0 } 55% { opacity: .35 } 70%, 100% { opacity: 0 } }
@keyframes strikefade { 0%, 45% { opacity: 1 } 100% { opacity: 0 } }
@keyframes flash { 0% { opacity: 0 } 8% { opacity: ${t.flashPeak} } 22% { opacity: ${r2(t.flashPeak * 0.15)} } 32% { opacity: ${r2(t.flashPeak * 0.6)} } 100% { opacity: 0 } }
@keyframes shock { 0% { opacity: 0; transform: scale(1) } 4% { opacity: .85 } 100% { opacity: 0; transform: scale(4.4) } }
@keyframes orbit { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes pop { 0% { opacity: 0; transform: scale(.25) } 60% { opacity: 1; transform: scale(1.18) } 100% { opacity: 1; transform: scale(1) } }
@keyframes popdim { 0% { opacity: 0; transform: scale(.25) } 60% { opacity: .6; transform: scale(1.25) } 100% { opacity: .6; transform: scale(1) } }
@keyframes breathe { from { opacity: .28 } to { opacity: ${t.glow} } }
@keyframes spark { 0%, 88% { opacity: 0 } 89% { opacity: 1 } 90.5% { opacity: .15 } 92% { opacity: 1 } 94%, 100% { opacity: 0 } }
@keyframes mark { 0% { transform: scale(1) } 45% { transform: scale(1.32) } 100% { transform: scale(1) } }
@keyframes rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes ping { 0% { opacity: .8; transform: scale(1) } 100% { opacity: 0; transform: scale(2.6) } }`

  const body = `
<defs>
  <linearGradient id="grad" gradientUnits="userSpaceOnUse" x1="545" y1="92" x2="662" y2="208"><stop offset="0" stop-color="${t.cyan}"/><stop offset="1" stop-color="${t.violet}"/></linearGradient>
  <radialGradient id="aura" cx="600" cy="160" r="360" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${t.violet}" stop-opacity=".16"/><stop offset=".55" stop-color="${t.cyan}" stop-opacity=".05"/><stop offset="1" stop-color="${t.cyan}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#aura)"/>
<g class="net">${lines}${dots}</g>
<path class="feed" d="M321 150 L534 150"/>
<path class="feed" d="M879 150 L666 150"/>
<text class="hud mono" x="40" y="46">~/iamrealguexoxo <tspan class="acc">›</tspan> ./boot --thunder</text>
<circle class="livering" cx="1104" cy="41" r="4.5"/><circle class="live" cx="1104" cy="41" r="4.5"/>
<text class="hud mono" x="1116" y="46">online</text>
<path class="leader" d="${STRIKE}"/>
<g class="strike">
  <path class="sbg" d="${STRIKE}" pathLength="1" filter="url(#blur)"/>
  <path class="sb" d="${STRIKE}" pathLength="1"/>
  <path class="sbr" d="M598 50 L582 64 L575 88" pathLength="1"/>
  <path class="sbr" d="M610 63 L628 74 L636 95" pathLength="1"/>
</g>
<circle class="shock" cx="600" cy="150" r="62"/>
<path class="rglow" d="${RING}" filter="url(#blur)"/>
<path class="ring" d="${RING}" pathLength="1"/>
<path class="orbit" d="${RING}" pathLength="1"/>
<path class="bglow" d="${BOLT}" filter="url(#blur)"/>
<path class="bolt" d="${BOLT}"/>
<path class="bflash" d="${BOLT}" filter="url(#soft)"/>
<path class="spark" d="M549 99 L541 94 L545 87 L535 80"/>
<path class="spark" d="M634 207 L643 211 L640 219 L650 224"/>
<g transform="translate(${r2(tx)} 302) scale(${s})">${glyphs}</g>
<text class="tag" x="600" y="360" text-anchor="middle">BUSINESS ANALYST · DEVELOPER · AUTOMATION ARCHITECT</text>
<text class="quote" x="600" y="392" text-anchor="middle">„Efficiency is not an option – it's the baseline.“</text>
<rect class="flash" width="${W}" height="${H}"/>`

  return card({ w: W, h: H, t, title: 'iamrealguexoxo – Business Analyst, Developer, Automation Architect', css, body })
}

/** Das Logo allein (für Avatar, Favicon, Social-Preview): G-Ring mit Blitz, quadratisch */
function logo(t, { withBg }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="520 70 160 160" width="512" height="512" role="img" aria-label="iamrealguexoxo logo">
<defs>
  <linearGradient id="grad" gradientUnits="userSpaceOnUse" x1="545" y1="92" x2="662" y2="208"><stop offset="0" stop-color="${t.cyan}"/><stop offset="1" stop-color="${t.violet}"/></linearGradient>
  <filter id="blur" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>
</defs>
${withBg ? `<rect x="520" y="70" width="160" height="160" rx="36" fill="${t.bg0}"/>` : ''}
<path d="${RING}" fill="none" stroke="url(#grad)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${BOLT}" fill="${t.cyan}" opacity="${t.glow * 0.7}" filter="url(#blur)"/>
<path d="${BOLT}" fill="${t.bolt}"/>
</svg>
`
}

// ---------------------------------------------------------------- bygue-Ökosystem

const APPS = [
  { n: 'socializeME', d: 'meet people over game rounds', c: '#f5c542' },
  { n: 'Thankful', d: 'a private, local-first journal', c: '#f59e0b' },
  { n: 'FastLane', d: 'intermittent fasting, no ads', c: '#34d399' },
  { n: 'Questline', d: 'your to-dos meet a pixel RPG', c: '#facc15' },
  { n: 'Peptide Tracker', d: 'doses, vials & schedules', c: '#2dd4bf' },
  { n: 'Manifest.', d: 'rituals, portal days, moon phases', c: '#a78bfa' },
  { n: 'urlaubmaXXing', d: 'turn little leave into lots of days off', c: '#34d399' },
  { n: 'maXXteam', d: 'team leave planning. bye Excel.', c: '#10b981' },
  { n: 'Starlane', d: 'trade & build across a galaxy', c: '#38bdf8' },
  { n: 'FoodLane', d: 'food tracking, connected', c: '#fbbf24', soon: true },
  { n: 'ChatSafe', d: 'an encrypted vault for chats', c: '#2dd4bf', soon: true },
  { n: 'next idea', d: 'there is always one more', ghost: true },
]

function ecosystem(t) {
  const W = 1200
  const H = 570
  const cx = 600
  const cy = 330
  const rx = 350
  const ry = 178
  const angles = [-66, -40, -13, 13, 40, 66, 114, 140, 167, 193, 220, 246]
  const rand = rng(5)

  let links = ''
  let packets = ''
  let nodes = ''
  let labels = ''
  APPS.forEach((a, i) => {
    const th = (angles[i] * Math.PI) / 180
    const x = cx + rx * Math.cos(th)
    const y = cy + ry * Math.sin(th)
    const dx = x - cx
    const dy = y - cy
    const len = Math.hypot(dx, dy)
    const qx = cx + dx / 2 - (dy / len) * len * 0.12
    const qy = cy + dy / 2 + (dx / len) * len * 0.12
    const kind = a.ghost ? ' ghost' : a.soon ? ' soon' : ''
    links += `<path id="l${i}" class="link${kind}" d="M${cx} ${cy} Q${r2(qx)} ${r2(qy)} ${r2(x)} ${r2(y)}"/>`
    if (!a.ghost && !a.soon) {
      const dur = r2(2.6 + rand() * 1.4)
      const b1 = r2(rand() * 3)
      const b2 = r2(b1 + dur / 2)
      const motion = (dir, begin, fill, r) =>
        `<circle r="${r}" fill="${fill}" opacity="0"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite"${dir ? ' keyPoints="1;0" keyTimes="0;1" calcMode="linear"' : ''}><mpath xlink:href="#l${i}"/></animateMotion><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.82;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/></circle>`
      packets += motion(false, b1, a.c, 2.8) + motion(true, b2, t.text, 1.9)
    }
    const delay = r2(0.25 + i * 0.07)
    if (a.ghost) {
      nodes += `<g class="node" style="animation-delay:${delay}s"><circle cx="${r2(x)}" cy="${r2(y)}" r="7" fill="none" stroke="${t.muted}" stroke-width="1.5" stroke-dasharray="2.5 3"/></g>`
    } else {
      nodes += `<g class="node" style="animation-delay:${delay}s"><circle class="halo" cx="${r2(x)}" cy="${r2(y)}" r="14" fill="${a.c}" style="animation-delay:${r2(rand() * 3)}s"/><circle cx="${r2(x)}" cy="${r2(y)}" r="6.5" fill="${a.c}"${a.soon ? ' fill-opacity=".55"' : ''}/></g>`
    }
    const right = Math.cos(th) > 0
    const lx = r2(x + (right ? 20 : -20))
    const anchor = right ? 'start' : 'end'
    const desc = a.soon
      ? `<tspan fill="${a.c}" font-weight="700">soon · </tspan>${esc(a.d)}`
      : esc(a.d)
    labels += `<g class="lbl" style="animation-delay:${r2(delay + 0.15)}s"><text class="name knock${a.ghost ? ' ghostt' : ''}" x="${lx}" y="${r2(y - 3)}" text-anchor="${anchor}">${esc(a.n)}</text><text class="desc knock" x="${lx}" y="${r2(y + 15)}" text-anchor="${anchor}">${desc}</text></g>`
  })

  const css = `
.eyebrow { font-size: 12.5px; letter-spacing: 4px; fill: ${t.muted}; }
.title { font-size: 30px; font-weight: 800; fill: ${t.text}; letter-spacing: -.3px; }
.sub { font-size: 15px; fill: ${t.muted}; }
.ell { fill: none; stroke: ${t.line}; stroke-opacity: .35; stroke-dasharray: 2 9; animation: ell 40s linear infinite; }
.link { fill: none; stroke: ${t.line}; stroke-opacity: .55; stroke-width: 1.2; }
.link.soon { stroke-dasharray: 4 6; stroke-opacity: .45; }
.link.ghost { stroke-dasharray: 2 6; stroke-opacity: .3; }
.halo { opacity: .16; transform-box: fill-box; transform-origin: center; animation: halo 3s ease-in-out infinite; }
.node { transform-box: fill-box; transform-origin: center; animation: nodein .5s cubic-bezier(.2,1.5,.35,1) both; }
.lbl { animation: fadein .6s ease both; }
.name { font-size: 16px; font-weight: 700; fill: ${t.text}; }
.ghostt { fill: ${t.muted}; font-style: italic; }
.desc { font-size: 12.5px; fill: ${t.muted}; }
.knock { paint-order: stroke; stroke: ${t.bg0}; stroke-width: 6px; stroke-linejoin: round; }
.hubt { font-size: 21px; font-weight: 800; fill: ${t.text}; letter-spacing: -.2px; }
.hubs { font-size: 12px; fill: ${t.muted}; letter-spacing: .4px; }
.orb { fill: none; stroke: ${t.line}; stroke-opacity: .55; stroke-dasharray: 3 7; transform-origin: 600px 330px; animation: spin 24s linear infinite; }
.hp { fill: none; stroke: ${t.cyan}; stroke-width: 1.5; opacity: 0; transform-origin: 600px 330px; animation: hp 3.2s ease-out infinite; }
.foot { font-size: 12.5px; fill: ${t.muted}; letter-spacing: 1px; }
.foot .acc { fill: ${t.cyan}; }
@keyframes ell { to { stroke-dashoffset: -330 } }
@keyframes halo { 0%, 100% { transform: scale(1); opacity: .14 } 50% { transform: scale(1.5); opacity: .3 } }
@keyframes spin { to { transform: rotate(360deg) } }
@keyframes hp { 0% { opacity: .7; transform: scale(1) } 100% { opacity: 0; transform: scale(1.9) } }
@keyframes nodein { from { opacity: 0; transform: scale(.2) } to { opacity: 1; transform: scale(1) } }
@keyframes fadein { from { opacity: 0 } to { opacity: 1 } }`

  const body = `
<defs>
  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.cyan}"/><stop offset="1" stop-color="${t.violet}"/></linearGradient>
  <radialGradient id="aura" cx="600" cy="330" r="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${t.violet}" stop-opacity=".12"/><stop offset="1" stop-color="${t.violet}" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#aura)"/>
<text class="eyebrow mono" x="600" y="58" text-anchor="middle">NOW BUILDING</text>
<text class="title" x="600" y="96" text-anchor="middle">bygue</text>
<text class="sub" x="600" y="124" text-anchor="middle">Not a big studio. Just Gü – and a few ideas, sharing one account.</text>
<ellipse class="ell" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>
${links}
${packets}
<circle class="orb" cx="${cx}" cy="${cy}" r="60"/>
<circle class="hp" cx="${cx}" cy="${cy}" r="42"/>
<circle cx="${cx}" cy="${cy}" r="42" fill="${t.bg0}" stroke="url(#grad)" stroke-width="2.5"/>
<text class="hubt" x="${cx}" y="${cy + 7}" text-anchor="middle">bygue</text>
${nodes}
${labels}
<text class="hubs knock" x="${cx}" y="${cy + 64}" text-anchor="middle">one account · all apps</text>
<text class="foot mono" x="600" y="548" text-anchor="middle"><tspan class="acc">→</tspan> bygue.app</text>`

  return card({ w: W, h: H, t, title: 'bygue – the apps I am building', css, body, flat: true })
}

// ---------------------------------------------------------------- Loadout (Skills in WoW-Seltenheitsfarben)

const LOADOUT = [
  ['LANGUAGES', [['TypeScript', 'L'], ['Swift', 'E'], ['Python', 'E'], ['C++', 'R'], ['JavaScript', 'R']]],
  ['APPS & UI', [['React', 'L'], ['Capacitor', 'L'], ['Electron', 'E'], ['Tailwind', 'R'], ['Vite', 'R']]],
  ['BACKEND', [['Cloudflare Workers', 'L'], ['D1 · R2 · KV', 'E'], ['Durable Objects', 'E'], ['Node.js', 'R'], ['SQLite', 'R']]],
  ['AI & AUTOMATION', [['LLM agents', 'L'], ['n8n', 'L'], ['Claude Code', 'E'], ['Telegram bots', 'R'], ['Webhooks & APIs', 'R']]],
  ['INFRA & TOOLS', [['Docker', 'E'], ['Xcode', 'E'], ['Linux', 'R'], ['Git & GitHub', 'R'], ['MongoDB', 'R']]],
]

function loadout(t) {
  const W = 1200
  const H = 392
  const col = { L: t.legendary, E: t.epic, R: t.rare }
  let chips = ''
  LOADOUT.forEach(([head, items], c) => {
    const x = 44 + c * 224
    chips += `<text class="colh mono" x="${x}" y="140">${esc(head)}</text>`
    items.forEach(([name, rar], r) => {
      const y = 156 + r * 42
      const d = r2(0.15 + c * 0.08 + r * 0.06)
      chips += `<g class="chip" style="animation-delay:${d}s"><rect class="${rar === 'L' ? 'leg' : ''}" x="${x}" y="${y}" width="208" height="32" rx="9" fill="${col[rar]}" fill-opacity="${t.chipOp}" stroke="${col[rar]}" stroke-opacity=".45"/><rect x="${x + 8}" y="${y + 9}" width="3" height="14" rx="1.5" fill="${col[rar]}"/><text x="${x + 20}" y="${y + 21}" fill="${col[rar]}" class="cht">${esc(name)}</text></g>`
    })
  })
  const legend = [['legendary', t.legendary, 868], ['epic', t.epic, 990], ['rare', t.rare, 1074]]
    .map(([n, c, x]) => `<rect x="${x}" y="80" width="11" height="11" rx="2.5" fill="${c}"/><text class="lg mono" x="${x + 18}" y="90">${n}</text>`)
    .join('')
  const css = `
.eyebrow { font-size: 12.5px; letter-spacing: 4px; fill: ${t.muted}; }
.title { font-size: 24px; font-weight: 800; fill: ${t.text}; }
.colh { font-size: 12px; letter-spacing: 2.5px; fill: ${t.muted}; }
.cht { font-size: 14px; font-weight: 650; }
.lg { font-size: 12px; fill: ${t.muted}; }
.chip { animation: rise .5s ease both; }
.leg { animation: legend 2.4s ease-in-out infinite; }
@keyframes rise { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
@keyframes legend { 0%, 100% { stroke-opacity: .4 } 50% { stroke-opacity: 1 } }`
  const body = `
<text class="eyebrow mono" x="44" y="58">LOADOUT</text>
<text class="title" x="44" y="92">Gear I actually use</text>
${legend}
${chips}`
  return card({ w: W, h: H, t, title: 'Loadout – languages, frameworks and tools', css, body })
}

// ---------------------------------------------------------------- Spielerkarte mit Pixel-Waschbär

const RACOON = [
  '.kk............kk.',
  'kwwk..........kwwk',
  'kwdgk........kgdwk',
  'kwdggkkkkkkkkggdwk',
  'kgggggggmmgggggggk',
  'kggwwwggmmggwwwggk',
  'kmmmmmmmmmmmmmmmmk',
  'kmmmenmmmmmmenmmmk',
  'kgmmnnmmwwmmnnmmgk',
  'kggmmmmwwwwmmmmggk',
  'kgggmmwwwwwwmmgggk',
  '.kgggwwwnnwwwgggk.',
  '..kggwwwwwwwwggk..',
  '...kkgwwwwwwgkk...',
  '.....kkkkkkkk.....',
]

function racoonRects(t, ox, oy, px) {
  const pal = { k: t.outline, g: t.fur, d: t.furDark, w: t.white, m: t.mask, e: t.eye, n: t.nose }
  let out = ''
  RACOON.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      if (ch === '.') {
        x++
        continue
      }
      let run = 1
      while (ch !== 'e' && row[x + run] === ch) run++
      out += `<rect${ch === 'e' ? ' class="eye"' : ''} x="${ox + x * px}" y="${oy + y * px}" width="${run * px}" height="${px}" fill="${pal[ch]}"/>`
      x += run
    }
  })
  return out
}

const STATS = [
  ['AUTOMATION', 99, '99'],
  ['BÜROKRATIE-RESISTENZ', 100, 'MAX'],
  ['PIXEL ART', 72, '72'],
  ['ACTIVE SIDE QUESTS', 92, '11'],
]

function player(t) {
  const W = 1200
  const H = 260
  const tags = ['main: WoW', 'alt: Star Citizen', 'buff: Fitness & Biohacking']
  let tx = 228
  const tagSvg = tags
    .map((s) => {
      const w = Math.round(s.length * 7.1 + 26)
      const out = `<g><rect x="${tx}" y="178" width="${w}" height="26" rx="13" fill="${t.bg1}" stroke="${t.border}"/><text class="tg" x="${tx + 13}" y="195.5">${esc(s)}</text></g>`
      tx += w + 10
      return out
    })
    .join('')
  const bars = STATS.map(([label, v, shown], i) => {
    const y = 82 + i * 40
    const w = r2((416 * v) / 100)
    return `<text class="sl mono" x="740" y="${y}">${esc(label)}</text><text class="sv mono" x="1156" y="${y}" text-anchor="end">${shown}</text><rect x="740" y="${y + 9}" width="416" height="8" rx="4" fill="${t.dim}"/><rect class="bar${v === 100 ? ' max' : ''}" x="740" y="${y + 9}" width="${w}" height="8" rx="4" fill="url(#bar)" style="animation-delay:${r2(0.5 + i * 0.15)}s"/>`
  }).join('')
  const css = `
.eyebrow { font-size: 12.5px; letter-spacing: 4px; fill: ${t.muted}; }
.name { font-size: 44px; font-weight: 800; fill: ${t.text}; letter-spacing: -.5px; }
.handle { font-size: 15px; fill: ${t.muted}; }
.cls { font-size: 15px; fill: ${t.muted}; }
.cls .hi { fill: ${t.text}; font-weight: 650; }
.tg { font-size: 12.5px; fill: ${t.text}; }
.sl { font-size: 11.5px; letter-spacing: 1.5px; fill: ${t.muted}; }
.sv { font-size: 12px; font-weight: 700; fill: ${t.text}; }
.bar { transform-box: fill-box; transform-origin: left center; animation: fill 1.1s cubic-bezier(.3,.8,.3,1) both; }
.max { animation: fill 1.1s cubic-bezier(.3,.8,.3,1) both, maxglow 1.8s ease-in-out 1.8s infinite alternate; }
.frame { fill: ${t.frame}; stroke: ${t.border}; stroke-width: 1.5; }
.sprite { animation: bob 1.2s steps(1) infinite; }
.eye { animation: blink 4.6s steps(1) 1.5s infinite; }
@keyframes fill { from { transform: scaleX(0) } to { transform: scaleX(1) } }
@keyframes maxglow { from { opacity: 1 } to { opacity: .55 } }
@keyframes bob { 0% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
@keyframes blink { 0% { fill: ${t.eye} } 93% { fill: ${t.mask} } 97% { fill: ${t.eye} } }`
  const body = `
<defs><linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.cyan}"/><stop offset="1" stop-color="${t.violet}"/></linearGradient></defs>
<rect class="frame" x="44" y="52" width="152" height="152" rx="18"/>
<g class="sprite" shape-rendering="crispEdges">${racoonRects(t, 57, 76, 7)}</g>
<text class="eyebrow mono" x="228" y="76">PLAYER 1</text>
<text class="name" x="226" y="124">Gü</text>
<text class="handle mono" x="300" y="124">@iamrealguexoxo</text>
<text class="cls" x="228" y="158"><tspan class="hi">Automation Architect</tspan>  ·  Guild: bygue  ·  Realm: Moon</text>
${tagSvg}
${bars}`
  return card({ w: W, h: H, t, title: 'Player card – Gü, Automation Architect', css, body })
}

// ---------------------------------------------------------------- Kontakt-Knöpfe

function pill(t, kind) {
  const text = kind === 'web' ? 'bygue.app' : 'github@beazzd.de'
  const w = Math.round(70 + text.length * 9.6 + 26)
  const h = 56
  const icon =
    kind === 'web'
      ? `<circle cx="38" cy="28" r="10" fill="none" stroke="${t.cyan}" stroke-width="1.8"/><ellipse cx="38" cy="28" rx="4.4" ry="10" fill="none" stroke="${t.cyan}" stroke-width="1.6"/><path d="M28 28 H48" stroke="${t.cyan}" stroke-width="1.6"/>`
      : `<rect x="27" y="20" width="22" height="16" rx="3.5" fill="none" stroke="${t.violet}" stroke-width="1.8"/><path d="M28.5 22.5 L38 29.5 L47.5 22.5" fill="none" stroke="${t.violet}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(text)}">
<style>text { font-family: ${SANS}; font-size: 17px; font-weight: 650; fill: ${t.text}; }</style>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${(h - 2) / 2}" fill="${t.bg1}" stroke="${t.border}" stroke-width="1.5"/>
${icon}
<text x="62" y="34">${esc(text)}</text>
</svg>
`
}

// ---------------------------------------------------------------- Schreiben

const files = []
for (const [name, t] of Object.entries(THEMES)) {
  files.push([`header-${name}.svg`, header(t)])
  files.push([`bygue-${name}.svg`, ecosystem(t)])
  files.push([`loadout-${name}.svg`, loadout(t)])
  files.push([`player-${name}.svg`, player(t)])
  files.push([`pill-web-${name}.svg`, pill(t, 'web')])
  files.push([`pill-mail-${name}.svg`, pill(t, 'mail')])
  files.push([`logo-${name}.svg`, logo(t, { withBg: false })])
  files.push([`logo-${name}-tile.svg`, logo(t, { withBg: true })])
}
for (const [file, svg] of files) writeFileSync(join(OUT, file), svg)
console.log(`${files.length} Dateien nach assets/ geschrieben`)
