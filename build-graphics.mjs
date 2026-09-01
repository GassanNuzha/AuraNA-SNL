// Generates the site's technical illustrations (oblique/isometric SVG scenes)
// Run: node build-graphics.mjs   → writes site/assets/img/*.svg
import { writeFileSync, mkdirSync } from 'fs';

const OUT = 'site/assets/img';
mkdirSync(OUT, { recursive: true });

/* ---------- palette ---------- */
const C = {
  edge: '#dfe7f0',
  edgeSoft: 'rgba(223,231,240,0.55)',
  front: 'rgba(226,235,245,0.07)',
  top: 'rgba(211,172,103,0.30)',
  side: 'rgba(6,12,22,0.55)',
  gold: '#d3ac67',
  goldDim: '#b9924c',
  label: '#9fb0c2',
  labelDim: '#5c7188',
  green: '#7fc98f',
  panel: 'rgba(10,20,34,0.55)',
  panelEdge: 'rgba(255,255,255,0.14)',
  grid: 'rgba(255,255,255,0.045)',
};

/* ---------- oblique projection helpers (depth = up-right 30°) ---------- */
const UX = 0.866, UY = -0.5;
const d = (p, depth) => [p[0] + UX * depth, p[1] + UY * depth];
const pts = a => a.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
const poly = (a, fill, stroke = C.edge, w = 1.8, extra = '') =>
  `<polygon points="${pts(a)}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" ${extra}/>`;

// face extruded from edge p1->p2
const quad = (p1, p2, depth, fill, stroke = C.edge, w = 1.8) =>
  poly([p1, p2, d(p2, depth), d(p1, depth)], fill, stroke, w);

// full box from front rect (x1,y1)-(x2,y2): front + top + right faces
function box(x1, y1, x2, y2, depth, o = {}) {
  const front = o.front ?? C.front, top = o.top ?? C.top, side = o.side ?? C.side;
  const stroke = o.stroke ?? C.edge, w = o.w ?? 1.8;
  return quad([x1, y1], [x2, y1], depth, top, stroke, w) +      // top
         quad([x2, y1], [x2, y2], depth, side, stroke, w) +      // right
         poly([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], front, stroke, w); // front
}

/* ---------- annotation helpers ---------- */
const mono = (x, y, t, size = 11, fill = C.label, ls = 1.5, anchor = 'start') =>
  `<text x="${x}" y="${y}" font-family="IBM Plex Mono,Consolas,monospace" font-size="${size}" fill="${fill}" letter-spacing="${ls}" text-anchor="${anchor}">${t}</text>`;

function dimH(x1, x2, y, label) {
  return `<path d="M${x1} ${y}h${x2 - x1}" stroke="${C.gold}" stroke-width="1.2"/>` +
    `<path d="M${x1} ${y}l8 -3.5v7Z M${x2} ${y}l-8 -3.5v7Z" fill="${C.gold}"/>` +
    mono((x1 + x2) / 2, y - 8, label, 11, C.gold, 1, 'middle');
}
function dimV(x, y1, y2, label) {
  return `<path d="M${x} ${y1}v${y2 - y1}" stroke="${C.gold}" stroke-width="1.2"/>` +
    `<path d="M${x} ${y1}l-3.5 8h7Z M${x} ${y2}l-3.5 -8h7Z" fill="${C.gold}"/>` +
    mono(x + 9, (y1 + y2) / 2 + 4, label, 11, C.gold, 1);
}
const leader = (x1, y1, x2, y2) =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${C.label}" stroke-width="1"/><circle cx="${x1}" cy="${y1}" r="2" fill="${C.label}"/>`;

const hole = (cx, cy, r) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(6,12,22,0.6)" stroke="${C.edge}" stroke-width="1.6"/>` +
  `<path d="M${cx - r} ${cy}a${r} ${r} 0 0 1 ${2 * r} 0" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>`;

const centerlines = (cx, cy, l) =>
  `<path d="M${cx - l} ${cy}h${2 * l}M${cx} ${cy - l}v${2 * l}" stroke="${C.goldDim}" stroke-width="0.9" stroke-dasharray="10 4 2 4"/>`;

/* ---------- svg wrappers ---------- */
function panelSvg(w, h, caption, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none">
<defs><pattern id="g" width="26" height="26" patternUnits="userSpaceOnUse"><path d="M26 0H0V26" stroke="${C.grid}" stroke-width="1" fill="none"/></pattern></defs>
<rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="12" fill="${C.panel}" stroke="${C.panelEdge}"/>
<rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="12" fill="url(#g)"/>
<path d="M22 34v-12h12M${w - 22} 34v-12h-12M22 ${h - 34}v12h12M${w - 22} ${h - 34}v12h-12" stroke="rgba(255,255,255,0.35)" stroke-width="1.4"/>
${mono(30, 48, caption, 10.5, C.labelDim, 2)}
${inner}
</svg>`;
}
const plainSvg = (w, h, inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none">${inner}</svg>`;

const scenes = {};

/* ================= 1. ENGINEERING — CAD bracket ================= */
scenes['hero-engineering'] = panelSvg(520, 400, 'AN-2210 — MOUNTING BRACKET · 3D CAD', (() => {
  let s = '';
  const DEP = 64;
  // ghost wireframe (design iteration) further back
  const ghost = `M150 168 L212 168 L212 262 L370 262 L370 296 L150 296 Z`;
  s += `<g transform="translate(78,-46)"><path d="${ghost}" stroke="${C.goldDim}" stroke-width="1.1" stroke-dasharray="6 5" fill="none" opacity="0.5"/></g>`;
  s += mono(300, 96, 'REV B (SUPERSEDED)', 9.5, 'rgba(185,146,76,0.55)', 1.5);
  // bracket: L front face
  const F = [[150, 168], [212, 168], [212, 262], [370, 262], [370, 296], [150, 296]];
  s += quad(F[0], F[1], DEP, C.top);                    // top of wall
  s += quad(F[2], F[3], DEP, C.top);                    // top of base arm
  s += quad(F[3], F[4], DEP, C.side);                   // right end of base
  s += poly(F, C.front);                                // front face
  // holes
  s += hole(181, 200, 9) + centerlines(181, 200, 16);
  s += hole(258, 279, 8) + centerlines(258, 279, 14);
  s += hole(330, 279, 8) + centerlines(330, 279, 14);
  // dims
  s += `<path d="M150 310v24M370 310v24" stroke="#7c8fa5" stroke-width="1"/>` + dimH(150, 370, 328, '220.0 ±0.2');
  s += `<path d="M136 168h-24M136 296h-24" stroke="#7c8fa5" stroke-width="1"/>` + dimV(120, 168, 296, '128.0');
  s += leader(181, 191, 120, 130) + mono(46, 122, 'Ø9.0 (3×)', 10.5, '#c3cfdd');
  // cursor
  s += `<g transform="translate(392,190)"><circle r="10" stroke="${C.gold}" stroke-width="1.4"/><path d="M-16 0h9M7 0h9M0 -16v9M0 7v9" stroke="${C.gold}" stroke-width="1.4"/></g>`;
  s += mono(30, 372, 'STEP · SLDPRT · DWG — DELIVERED WITH EVERY PROGRAM', 9.5, C.labelDim, 1.5);
  return s;
})());

/* ================= 2. PLASTICS — open injection mold ================= */
scenes['hero-plastics'] = panelSvg(520, 400, 'INJECTION MOLD — OPEN · EJECT', (() => {
  let s = '';
  const DEP = 52;
  // sprue path hint from top
  s += `<path d="M252 92h36l-8 26h-20zM260 118l6 88M280 118l-6 88" stroke="${C.edgeSoft}" stroke-width="1.2" stroke-dasharray="5 4" fill="none"/>`;
  // cavity half (left)
  s += box(98, 130, 218, 330, DEP);
  s += `<rect x="192" y="206" width="26" height="78" fill="rgba(6,12,22,0.65)" stroke="${C.edgeSoft}" stroke-width="1.3"/>`; // cavity
  s += mono(112, 158, 'CAVITY', 10, C.label, 2);
  // guide pins on cavity half
  s += `<circle cx="122" cy="188" r="7" stroke="${C.edgeSoft}" stroke-width="1.4"/><circle cx="122" cy="302" r="7" stroke="${C.edgeSoft}" stroke-width="1.4"/>`;
  // core half (right)
  s += box(322, 130, 442, 330, DEP);
  s += `<rect x="322" y="212" width="20" height="66" fill="rgba(211,172,103,0.22)" stroke="${C.edgeSoft}" stroke-width="1.3"/>`; // core bump
  s += mono(384, 158, 'CORE', 10, C.label, 2);
  // ejector pins
  s += `<path d="M352 232h44M352 258h44" stroke="${C.edgeSoft}" stroke-width="2.4" opacity="0.5"/>`;
  // molded part center (gold)
  s += box(248, 206, 296, 284, 26, { front: 'rgba(211,172,103,0.28)', top: 'rgba(211,172,103,0.5)', side: 'rgba(143,114,51,0.6)', stroke: C.gold, w: 1.8 });
  s += mono(272, 316, 'MOLDED PART', 9.5, C.gold, 1.5, 'middle');
  // open/close arrows
  s += `<path d="M232 246h-26M206 246l9 -5v10Z" stroke="${C.gold}" stroke-width="1.6" fill="${C.gold}"/>`;
  s += `<path d="M312 246h26M338 246l-9 -5v10Z" stroke="${C.gold}" stroke-width="1.6" fill="${C.gold}"/>`;
  s += mono(30, 372, 'ABS · PC · PA66 · POM · TPE — TOOLING MANAGED BY AURA', 9.5, C.labelDim, 1.5);
  return s;
})());

/* ================= 3. METALS — CNC machining ================= */
scenes['hero-metals'] = panelSvg(520, 400, '5-AXIS CNC — 6061-T6 BILLET', (() => {
  let s = '';
  const DEP = 66;
  // base block
  s += box(120, 250, 400, 334, DEP);
  // upper step (left portion)
  s += box(120, 186, 268, 250, DEP);
  // pocket on top face of base (right area) — parallelogram
  const pk = [[300, 246], [366, 246]];
  s += poly([d(pk[0], 14), d(pk[1], 14), d(pk[1], 52), d(pk[0], 52)], 'rgba(6,12,22,0.6)', C.edgeSoft, 1.3);
  // toolpath on step top
  s += `<path d="M${d([140, 182], 18).join(' ')} L ${d([240, 182], 18).join(' ')} L ${d([240, 182], 44).join(' ')} L ${d([150, 182], 44).join(' ')}" stroke="${C.gold}" stroke-width="1.1" stroke-dasharray="5 4" fill="none"/>`;
  // holes on base front
  s += hole(318, 292, 9) + centerlines(318, 292, 15);
  s += hole(368, 292, 9) + centerlines(368, 292, 15);
  // end mill above step boundary
  const mx = 296;
  s += `<rect x="${mx - 13}" y="66" width="26" height="76" rx="3" fill="rgba(226,235,245,0.12)" stroke="${C.edge}" stroke-width="1.6"/>`; // holder
  s += `<rect x="${mx - 8}" y="142" width="16" height="58" fill="rgba(226,235,245,0.09)" stroke="${C.edge}" stroke-width="1.6"/>`;   // tool
  s += `<path d="M${mx - 8} 158l16 12M${mx - 8} 176l16 12" stroke="${C.gold}" stroke-width="1.3"/>`;                                   // flutes
  s += `<path d="M${mx - 22} 208a22 8 0 0 1 44 0" stroke="${C.goldDim}" stroke-width="1.1" stroke-dasharray="4 4" fill="none"/>`;      // rotation
  // chips
  s += `<circle cx="${mx + 26}" cy="212" r="2" fill="${C.gold}"/><circle cx="${mx + 36}" cy="204" r="1.6" fill="${C.gold}"/><circle cx="${mx - 28}" cy="214" r="1.6" fill="${C.gold}"/>`;
  // dims
  s += `<path d="M120 348v18M400 348v18" stroke="#7c8fa5" stroke-width="1"/>` + dimH(120, 400, 362, '280.0');
  s += leader(340, 262, 424, 224) + mono(408, 214, '±0.05', 10.5, '#c3cfdd');
  s += mono(30, 386, 'MILLING · TURNING · 5-AXIS — STEEL / STAINLESS / BRASS / AL', 9.5, C.labelDim, 1.5);
  return s;
})());

/* ================= 4. FINISHING — powder coat ================= */
scenes['hero-finishing'] = panelSvg(520, 400, 'POWDER COATING — LINE 2', (() => {
  let s = '';
  const DEP = 56;
  // enclosure body
  s += box(120, 176, 330, 318, DEP);
  // coated right half overlay (front + top)
  s += `<polygon points="${pts([[228, 176], [330, 176], [330, 318], [228, 318]])}" fill="rgba(211,172,103,0.38)" stroke="none"/>`;
  s += `<polygon points="${pts([[228, 176], [330, 176], d([330, 176], DEP), d([228, 176], DEP)])}" fill="rgba(211,172,103,0.42)" stroke="none"/>`;
  s += `<path d="M228 176v142" stroke="${C.gold}" stroke-width="1.6" stroke-dasharray="7 5"/>`;
  // vents on raw half
  s += `<path d="M140 206h64M140 224h64M140 242h64M140 260h64" stroke="${C.edgeSoft}" stroke-width="3" opacity="0.5"/>`;
  // hanging hook
  s += `<path d="M225 176V120a14 14 0 0 1 14 -14" stroke="${C.edgeSoft}" stroke-width="2" fill="none"/>`;
  // spray gun
  s += `<g transform="translate(430,150) rotate(18)"><rect x="-6" y="-10" width="44" height="20" rx="5" fill="rgba(226,235,245,0.12)" stroke="${C.edge}" stroke-width="1.5"/><rect x="26" y="8" width="14" height="30" rx="4" fill="rgba(226,235,245,0.12)" stroke="${C.edge}" stroke-width="1.5"/><rect x="-14" y="-6" width="10" height="12" fill="rgba(226,235,245,0.2)" stroke="${C.edge}" stroke-width="1.4"/></g>`;
  // spray cone + particles
  s += `<path d="M414 158 L330 196 L338 246 Z" fill="rgba(211,172,103,0.14)"/>`;
  for (const [px, py] of [[398, 172], [382, 184], [366, 196], [352, 210], [386, 206], [370, 222], [356, 232], [398, 196]])
    s += `<circle cx="${px}" cy="${py}" r="1.8" fill="${C.gold}"/>`;
  // labels
  s += leader(160, 290, 108, 344) + mono(60, 358, 'RAW SUBSTRATE', 9.5, '#c3cfdd', 1.5);
  s += leader(300, 230, 356, 300) + mono(300, 316, 'COATED — RAL / AAMA SPEC', 9.5, C.gold, 1);
  // finish swatches
  s += `<g transform="translate(396,340)"><rect width="22" height="22" rx="4" fill="#d3ac67"/><rect x="28" width="22" height="22" rx="4" fill="#20303f" stroke="${C.edgeSoft}"/><rect x="56" width="22" height="22" rx="4" fill="#8d98a5"/></g>`;
  return s;
})());

/* ================= 5. PROTOTYPING — FDM printer ================= */
scenes['hero-prototyping'] = panelSvg(520, 400, 'FDM PROTOTYPE — LAYER 128 / 210', (() => {
  let s = '';
  // frame columns + crossbar
  s += box(132, 96, 152, 330, 16, { top: 'rgba(211,172,103,0.2)' });
  s += box(388, 96, 408, 330, 16, { top: 'rgba(211,172,103,0.2)' });
  s += box(132, 74, 408, 96, 16, { top: 'rgba(211,172,103,0.2)' });
  // gantry
  s += box(152, 158, 388, 172, 12, {});
  // carriage + nozzle
  s += `<rect x="252" y="146" width="36" height="38" rx="5" fill="rgba(226,235,245,0.12)" stroke="${C.edge}" stroke-width="1.6"/>`;
  s += `<path d="M263 184h14l-5 14h-4z" fill="rgba(226,235,245,0.15)" stroke="${C.edge}" stroke-width="1.4"/>`;
  // motion arrows
  s += `<path d="M212 165h-34M178 165l9 -4.5v9ZM328 165h34M362 165l-9 -4.5v9Z" stroke="${C.gold}" stroke-width="1.4" fill="${C.gold}"/>`;
  // build plate
  s += box(168, 306, 372, 318, 46, {});
  // part: stepped layers (printed)
  const layers = [[196, 344, 296], [186, 354, 295], [176, 364, 284], [166, 374, 273], [156, 384, 262]];
  let y = 306;
  for (let i = 0; i < 5; i++) {
    const wHalf = [74, 74, 60, 60, 46][i];
    const yTop = y - 12;
    s += box(270 - wHalf, yTop, 270 + wHalf, y, 22, i === 4
      ? { front: 'rgba(211,172,103,0.3)', top: 'rgba(211,172,103,0.5)', side: 'rgba(143,114,51,0.55)', stroke: C.gold, w: 1.5 }
      : { w: 1.4 });
    y = yTop;
  }
  // filament from nozzle to part
  s += `<path d="M270 198v${306 - 60 - 198 + 4}" stroke="${C.gold}" stroke-width="1.6" stroke-dasharray="3 4"/>`;
  s += leader(336, 252, 424, 218) + mono(402, 208, 'PLA · ABS', 10, '#c3cfdd', 1);
  s += mono(30, 372, 'FDM · SLA · SLS — PARTS IN DAYS, NOT MONTHS', 9.5, C.labelDim, 1.5);
  return s;
})());

/* ================= 6. QUALITY — inspection ================= */
scenes['hero-quality'] = panelSvg(520, 400, 'DIMENSIONAL INSPECTION — LOT 0412', (() => {
  let s = '';
  const DEP = 54;
  // caliper above
  s += `<rect x="128" y="128" width="266" height="13" fill="rgba(226,235,245,0.12)" stroke="${C.edge}" stroke-width="1.5"/>`; // beam
  for (let x = 140; x <= 380; x += 12) s += `<path d="M${x} 128v5" stroke="${C.edgeSoft}" stroke-width="1"/>`;
  s += `<rect x="236" y="104" width="70" height="24" rx="4" fill="rgba(6,12,22,0.65)" stroke="${C.edgeSoft}" stroke-width="1.3"/>` + mono(271, 121, '219.98', 11.5, C.gold, 1, 'middle');
  s += `<rect x="136" y="141" width="10" height="66" fill="rgba(226,235,245,0.12)" stroke="${C.edge}" stroke-width="1.5"/>`;   // fixed jaw
  s += `<rect x="356" y="141" width="10" height="66" fill="rgba(226,235,245,0.12)" stroke="${C.edge}" stroke-width="1.5"/>`;   // sliding jaw
  // part (plate)
  s += box(141, 228, 361, 316, DEP);
  s += hole(196, 272, 12) + centerlines(196, 272, 20);
  s += hole(306, 272, 12) + centerlines(306, 272, 20);
  // measure extension lines from jaws to part edges
  s += `<path d="M141 207v21M361 207v21" stroke="#7c8fa5" stroke-width="1" stroke-dasharray="4 4"/>`;
  // CMM probe touching top face
  const t = d([330, 224], 34);
  s += `<path d="M${t[0]} ${t[1] - 66}v54" stroke="${C.edge}" stroke-width="2"/>`;
  s += `<circle cx="${t[0]}" cy="${t[1] - 6}" r="5" fill="${C.gold}"/>`;
  s += `<path d="M${t[0] - 14} ${t[1] - 6}a14 14 0 0 1 28 0" stroke="${C.goldDim}" stroke-width="1" stroke-dasharray="3 3" fill="none"/>`;
  s += mono(t[0] + 14, t[1] - 46, 'CMM', 9.5, C.label, 2);
  // callouts
  s += leader(196, 261, 116, 196) + mono(52, 188, 'Ø12.0 H7', 10.5, '#c3cfdd');
  // flatness feature frame
  s += `<g transform="translate(376,330)"><rect width="104" height="24" rx="3" stroke="${C.edgeSoft}" fill="rgba(6,12,22,0.5)"/><path d="M30 0v24M66 0v24" stroke="${C.edgeSoft}"/><path d="M10 16l4 -8h6l-4 8z" stroke="${C.label}" fill="none" stroke-width="1.2"/>${mono(48, 16, '0.05', 10, C.label, 0.5, 'middle')}${mono(85, 16, 'A', 10, C.label, 0.5, 'middle')}</g>`;
  // pass stamp
  s += `<g transform="translate(52,330) rotate(-8)"><rect width="118" height="38" rx="6" stroke="${C.green}" stroke-width="1.6" fill="rgba(127,201,143,0.07)"/>${mono(16, 17, 'PASS ✓', 10.5, C.green, 1.5)}${mono(16, 31, 'FAI REPORT 0412', 8.5, 'rgba(127,201,143,0.8)', 1)}</g>`;
  return s;
})());

/* ================= 7. WAREHOUSING — rack ================= */
scenes['hero-warehousing'] = panelSvg(520, 400, 'NA WAREHOUSE — CUSTOMER STOCK', (() => {
  let s = '';
  const DEP = 46;
  const boxIt = (x1, y1, x2, y2, dep, label) => {
    let r = box(x1, y1, x2, y2, dep, { front: 'rgba(226,235,245,0.09)', top: 'rgba(211,172,103,0.22)', w: 1.5 });
    r += `<path d="M${(x1 + x2) / 2} ${y1}v${y2 - y1}" stroke="${C.goldDim}" stroke-width="2.4" opacity="0.55"/>`; // tape
    if (label) {
      r += `<rect x="${x1 + 7}" y="${y2 - 24}" width="46" height="15" rx="2" fill="rgba(226,235,245,0.85)"/>` +
           mono(x1 + 11, y2 - 13, label, 7.5, '#16324f', 0.5);
    }
    return r;
  };
  // uprights
  s += box(120, 104, 131, 336, DEP, { w: 1.5 });
  s += box(402, 104, 413, 336, DEP, { w: 1.5 });
  // top beam level
  s += box(131, 196, 402, 208, DEP, { top: 'rgba(211,172,103,0.35)', w: 1.5 });
  // bottom beam level
  s += box(131, 324, 402, 336, DEP, { top: 'rgba(211,172,103,0.35)', w: 1.5 });
  // boxes upper shelf (sit on y=196)
  s += boxIt(146, 148, 210, 196, 30, 'AN-1024');
  s += boxIt(226, 138, 300, 196, 30, 'AN-1025');
  s += boxIt(318, 156, 372, 196, 30, 'AN-1026');
  // boxes lower shelf (sit on y=324)
  s += boxIt(150, 258, 234, 324, 34, 'AN-1031');
  s += boxIt(258, 252, 336, 324, 34, 'AN-1040');
  // location tags on beams
  s += mono(150, 219, 'A-01', 8.5, C.gold, 1.5) + mono(238, 219, 'A-02', 8.5, C.gold, 1.5) + mono(322, 219, 'A-03', 8.5, C.gold, 1.5);
  s += mono(160, 347, 'B-01', 8.5, C.gold, 1.5) + mono(272, 347, 'B-02', 8.5, C.gold, 1.5);
  // scan beam
  s += `<path d="M438 268l-84 44" stroke="${C.green}" stroke-width="1.2" stroke-dasharray="6 5"/><g transform="translate(436,254)"><rect width="26" height="18" rx="4" transform="rotate(24)" fill="rgba(127,201,143,0.15)" stroke="${C.green}" stroke-width="1.3"/></g>`;
  s += mono(30, 372, 'BARCODE-TRACKED · LIVE IN YOUR CUSTOMER PORTAL', 9.5, C.labelDim, 1.5);
  return s;
})());

/* ================= PROJECT VISUALS (transparent bg) ================= */

/* p1 — aluminum C-channel profile (hollow cross-section, section-hatched) */
scenes['proj-extrusion'] = plainSvg(440, 340, (() => {
  let s = '';
  const DEP = 120;
  const outer = 'M112 128 H292 V258 H226 V232 H178 V258 H112 Z';
  const inner = 'M128 144 H276 V242 H242 V216 H162 V242 H128 Z';
  // extruded faces first (behind)
  s += quad([112, 128], [292, 128], DEP, C.top);   // top
  s += quad([292, 128], [292, 258], DEP, C.side);  // right
  // hollow interior seen through the section
  s += `<path d="${inner}" fill="rgba(6,12,22,0.55)" stroke="none"/>`;
  // inner contour receding along depth (hollow continues)
  s += `<path d="M128 144 L ${d([128, 144], DEP).join(' ')} M276 144 L ${d([276, 144], DEP).join(' ')}" stroke="rgba(223,231,240,0.25)" stroke-width="1" stroke-dasharray="5 5"/>`;
  // wall (cut face) with section hatching
  s += `<defs><clipPath id="wall"><path d="${outer} ${inner}" clip-rule="evenodd"/></clipPath></defs>`;
  s += `<path d="${outer} ${inner}" fill-rule="evenodd" fill="rgba(211,172,103,0.16)"/>`;
  s += `<g clip-path="url(#wall)">`;
  for (let x = 60; x < 340; x += 11) s += `<path d="M${x} 270 L${x + 150} 120" stroke="rgba(211,172,103,0.55)" stroke-width="1"/>`;
  s += `</g>`;
  s += `<path d="${outer}" fill="none" stroke="${C.edge}" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<path d="${inner}" fill="none" stroke="${C.edge}" stroke-width="1.6" stroke-linejoin="round"/>`;
  // screw bosses tucked in the top corners of the cavity
  for (const bx of [146, 258]) {
    s += `<circle cx="${bx}" cy="162" r="14" fill="rgba(211,172,103,0.16)" stroke="${C.edge}" stroke-width="1.6"/>`;
    s += `<circle cx="${bx}" cy="162" r="6.5" fill="rgba(6,12,22,0.6)" stroke="${C.gold}" stroke-width="1.4"/>`;
    s += centerlines(bx, 162, 11);
  }
  s += `<path d="M112 264v26M292 264v26" stroke="#7c8fa5" stroke-width="1"/>` + dimH(112, 292, 286, '180.0');
  s += mono(114, 320, 'AL 6063-T5 · ANODIZED · CUSTOM DIE', 10, C.gold, 1.5);
  return s;
})());

/* p2 — die-cast latch body */
scenes['proj-latch'] = plainSvg(440, 340, (() => {
  let s = '';
  const DEP = 54;
  // body with chamfered top-right corner
  const F = [[118, 128], [262, 128], [292, 158], [292, 250], [118, 250]];
  s += quad(F[0], F[1], DEP, C.top);
  s += quad(F[1], F[2], DEP, 'rgba(211,172,103,0.2)');
  s += quad(F[2], F[3], DEP, C.side);
  s += poly(F, C.front);
  // keyhole
  s += `<circle cx="168" cy="190" r="13" fill="rgba(6,12,22,0.6)" stroke="${C.edge}" stroke-width="1.6"/><rect x="164" y="196" width="8" height="22" fill="rgba(6,12,22,0.6)" stroke="${C.edge}" stroke-width="1.4"/>`;
  // pivot + lever
  s += `<g transform="rotate(-24 244 190)"><rect x="244" y="180" width="102" height="20" rx="10" fill="rgba(211,172,103,0.3)" stroke="${C.gold}" stroke-width="1.6"/><circle cx="336" cy="190" r="7" fill="rgba(211,172,103,0.5)" stroke="${C.gold}" stroke-width="1.4"/></g>`;
  s += `<circle cx="244" cy="190" r="11" stroke="${C.edge}" stroke-width="1.7" fill="rgba(226,235,245,0.14)"/><circle cx="244" cy="190" r="3.5" fill="${C.edge}"/>`;
  s += `<path d="M352 140a92 92 0 0 1 12 38" stroke="${C.goldDim}" stroke-width="1.1" stroke-dasharray="4 4" fill="none"/><path d="M364 178l-5 -7.5 8 -1Z" fill="${C.goldDim}"/>`;
  // mount holes
  s += hole(140, 236, 6) + hole(272, 236, 6);
  s += mono(120, 292, 'ZAMAK 3 · POWDER COAT BLK', 10, C.gold, 1.5);
  return s;
})());

/* p3 — overmolded enclosure */
scenes['proj-enclosure'] = plainSvg(440, 340, (() => {
  let s = '';
  const DEP = 48;
  const F = [[118, 118], [312, 118], [312, 252], [118, 252]];
  s += quad(F[0], F[1], DEP, C.top);
  s += quad(F[1], F[2], DEP, C.side);
  s += poly(F, C.front);
  // TPE grip band (left third)
  s += `<rect x="146" y="118" width="52" height="134" fill="rgba(211,172,103,0.32)" stroke="${C.gold}" stroke-width="1.5"/>`;
  s += `<path d="M158 132v106M172 132v106M186 132v106" stroke="rgba(143,114,51,0.8)" stroke-width="2"/>`;
  // grip band wraps over top
  s += `<polygon points="${pts([[146, 118], [198, 118], d([198, 118], DEP), d([146, 118], DEP)])}" fill="rgba(211,172,103,0.4)" stroke="${C.gold}" stroke-width="1.3"/>`;
  // seam + LED + port
  s += `<path d="M220 118v134" stroke="${C.edgeSoft}" stroke-width="1" stroke-dasharray="4 4"/>`;
  s += `<circle cx="286" cy="140" r="4" fill="${C.green}"/>`;
  s += `<rect x="252" y="228" width="34" height="10" rx="3" fill="rgba(6,12,22,0.55)" stroke="${C.edgeSoft}" stroke-width="1.2"/>`;
  s += leader(172, 180, 96, 150) + mono(38, 142, 'TPE GRIP', 10, '#c3cfdd', 1);
  s += mono(120, 294, 'ABS + TPE · 2-SHOT MOLD', 10, C.gold, 1.5);
  return s;
})());

/* p4 — machined shaft (side view) */
scenes['proj-shaft'] = plainSvg(440, 340, (() => {
  let s = '';
  const cy = 180;
  s += `<defs><linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(226,235,245,0.05)"/><stop offset="0.45" stop-color="rgba(226,235,245,0.22)"/><stop offset="1" stop-color="rgba(6,12,22,0.5)"/></linearGradient></defs>`;
  s += `<path d="M52 ${cy}h340" stroke="${C.goldDim}" stroke-width="0.9" stroke-dasharray="12 4 3 4"/>`;
  const segs = [[64, 44, 20], [108, 56, 34], [164, 110, 27], [274, 46, 34], [320, 78, 15]]; // x, w, halfDia
  for (const [x, w, hd] of segs)
    s += `<rect x="${x}" y="${cy - hd}" width="${w}" height="${hd * 2}" fill="url(#sh)" stroke="${C.edge}" stroke-width="1.7"/>`;
  // chamfers on first seg
  s += `<path d="M64 ${cy - 20}l7 -4M64 ${cy + 20}l7 4" stroke="${C.edge}" stroke-width="1.4"/>`;
  // thread hatch on last seg
  for (let x = 324; x <= 390; x += 8) s += `<path d="M${x} ${cy - 15}l-6 30" stroke="${C.edgeSoft}" stroke-width="1.1"/>`;
  // keyway on big seg
  s += `<rect x="188" y="${cy - 27}" width="58" height="9" fill="rgba(6,12,22,0.5)" stroke="${C.edgeSoft}" stroke-width="1.2"/>`;
  // dims
  s += `<path d="M164 ${cy - 27}v-36M274 ${cy - 27}v-36" stroke="#7c8fa5" stroke-width="1"/>` + dimH(164, 274, cy - 52, '110.0');
  s += leader(130, cy + 30, 96, 262) + mono(46, 276, 'Ø68 g6', 10.5, '#c3cfdd');
  s += leader(354, cy + 12, 372, 250) + mono(330, 266, 'M30 × 1.5', 10.5, '#c3cfdd');
  s += mono(64, 306, '17-4 PH · TURNED + GROUND', 10, C.gold, 1.5);
  return s;
})());

/* ================= MINI 3D ICON SET ================= */
/* Small dimensional objects (64×64) — shaded navy bodies + gold accents,
   same oblique language as the big scenes. Used in cards and tiles. */

const IC = {
  stroke: 'rgba(223,231,240,0.9)',
  w: 1.5,
  dark: '#0b1a2c',
};
const iconDefs = `<defs>
<linearGradient id="nG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f5178"/><stop offset="1" stop-color="#16324f"/></linearGradient>
<linearGradient id="gG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0bc7e"/><stop offset="1" stop-color="#b08a41"/></linearGradient>
<linearGradient id="tG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(224,188,126,0.75)"/><stop offset="1" stop-color="rgba(176,138,65,0.55)"/></linearGradient>
</defs>`;
const iconSvg = inner => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">${iconDefs}${inner}</svg>`;
// mini oblique box: front gradient navy, top gold-lit, side dark
function mbox(x1, y1, x2, y2, dep, o = {}) {
  const front = o.front ?? 'url(#nG)', top = o.top ?? 'url(#tG)', side = o.side ?? IC.dark;
  const st = o.stroke ?? IC.stroke, w = o.w ?? IC.w;
  return quad([x1, y1], [x2, y1], dep, top, st, w) +
         quad([x2, y1], [x2, y2], dep, side, st, w) +
         poly([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], front, st, w);
}
const gbox = (x1, y1, x2, y2, dep) =>
  mbox(x1, y1, x2, y2, dep, { front: 'url(#gG)', top: 'rgba(240,214,160,0.95)', side: '#8a6a30' });

scenes['ic-engineering'] = iconSvg(
  `<path d="M14 12h36" stroke="#d3ac67" stroke-width="1.6"/>` +
  `<path d="M14 12l5 -2.5v5Z M50 12l-5 -2.5v5Z" fill="#d3ac67"/>` +
  `<path d="M14 8v8M50 8v8" stroke="rgba(211,172,103,0.6)" stroke-width="1.2"/>` +
  mbox(14, 22, 24, 52, 7) +
  mbox(14, 44, 52, 52, 7) +
  `<circle cx="40" cy="48" r="3.2" fill="${IC.dark}" stroke="${IC.stroke}" stroke-width="1.3"/>` +
  `<circle cx="19" cy="30" r="2.6" fill="${IC.dark}" stroke="${IC.stroke}" stroke-width="1.2"/>`
);

scenes['ic-plastics'] = iconSvg(
  mbox(8, 14, 22, 52, 6) +
  `<rect x="18" y="26" width="4" height="14" fill="${IC.dark}"/>` +
  mbox(42, 14, 56, 52, 6) +
  `<rect x="42" y="28" width="3.5" height="10" fill="url(#gG)"/>` +
  gbox(27, 26, 37, 40, 4.5)
);

scenes['ic-metals'] = iconSvg(
  mbox(10, 38, 54, 54, 7) +
  mbox(10, 26, 32, 38, 7) +
  `<rect x="40" y="6" width="8" height="12" rx="2" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.4"/>` +
  `<rect x="41.5" y="18" width="5" height="16" fill="url(#gG)" stroke="rgba(223,231,240,0.7)" stroke-width="1.1"/>` +
  `<path d="M41.5 22l5 3M41.5 27l5 3" stroke="#7a5c26" stroke-width="1.1"/>` +
  `<circle cx="47" cy="36" r="1.4" fill="#ffe9c4"/><circle cx="38.5" cy="35" r="1.1" fill="#d3ac67"/>`
);

scenes['ic-finishing'] = iconSvg(
  mbox(10, 18, 40, 52, 6) +
  `<polygon points="26,18 40,18 ${d([40, 18], 6).join(',')} ${d([26, 18], 6).join(',')}" fill="rgba(224,188,126,0.85)"/>` +
  `<rect x="26" y="18" width="14" height="34" fill="url(#gG)" opacity="0.85"/>` +
  `<path d="M26 18v34" stroke="#f0d6a0" stroke-width="1.3" stroke-dasharray="3.5 2.5"/>` +
  `<path d="M14 26h8M14 32h8M14 38h8" stroke="rgba(223,231,240,0.55)" stroke-width="1.8"/>` +
  `<g transform="translate(50,10) rotate(20)"><rect x="-5" y="-4" width="13" height="8" rx="2.5" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.2"/><rect x="6" y="1" width="4.5" height="9" rx="1.8" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.2"/></g>` +
  `<circle cx="46" cy="24" r="1.4" fill="#d3ac67"/><circle cx="43" cy="30" r="1.2" fill="#d3ac67"/><circle cx="47.5" cy="33" r="1" fill="#d3ac67"/>`
);

scenes['ic-prototyping'] = iconSvg(
  mbox(8, 8, 56, 14, 5) +
  mbox(8, 14, 13, 52, 5) + mbox(51, 14, 56, 52, 5) +
  `<rect x="27" y="14" width="10" height="9" rx="2" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.3"/>` +
  `<path d="M30 23h4l-2 4z" fill="url(#gG)"/>` +
  `<path d="M32 27v7" stroke="#d3ac67" stroke-width="1.2" stroke-dasharray="2 2.4"/>` +
  mbox(18, 46, 46, 52, 6) +
  mbox(21, 40, 43, 46, 5) +
  gbox(25, 34, 39, 40, 4)
);

scenes['ic-quality'] = iconSvg(
  `<rect x="8" y="12" width="48" height="7" rx="1.5" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.4"/>` +
  `<path d="M12 12v3M17 12v3M22 12v3M27 12v3M37 12v3M42 12v3M47 12v3M52 12v3" stroke="rgba(223,231,240,0.5)" stroke-width="1"/>` +
  `<rect x="10" y="19" width="5" height="18" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.3"/>` +
  `<rect x="49" y="19" width="5" height="18" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.3"/>` +
  gbox(15, 40, 49, 52, 6) +
  `<path d="M15 37v3M49 37v3" stroke="#d3ac67" stroke-width="1.1" stroke-dasharray="2.5 2"/>` +
  `<circle cx="53" cy="45" r="8.5" fill="#10243c" stroke="#7fc98f" stroke-width="1.6"/>` +
  `<path d="M49.5 45.2l2.4 2.4 4.8-5" stroke="#7fc98f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
);

scenes['ic-warehousing'] = iconSvg(
  mbox(9, 8, 14, 56, 5) + mbox(50, 8, 55, 56, 5) +
  mbox(14, 30, 50, 34, 5) + mbox(14, 52, 50, 56, 5) +
  gbox(17, 18, 30, 30, 5) +
  mbox(33, 21, 46, 30, 5) +
  mbox(17, 41, 32, 52, 5) +
  gbox(35, 43, 47, 52, 5)
);

scenes['ic-supply'] = iconSvg(
  mbox(9, 12, 14, 56, 5) + mbox(48, 12, 53, 56, 5) +
  mbox(14, 32, 48, 36, 5) + mbox(14, 52, 48, 56, 5) +
  mbox(17, 21, 31, 32, 5) +
  gbox(34, 24, 45, 32, 5) +
  gbox(17, 43, 30, 52, 5) +
  mbox(33, 45, 45, 52, 5) +
  `<circle cx="51" cy="14" r="9" fill="#10243c" stroke="#7fc98f" stroke-width="1.7"/>` +
  `<path d="M47 14.2l2.6 2.6 5-5.2" stroke="#7fc98f" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>`
);

/* --- industry tile icons --- */

scenes['ic-ind-doors'] = iconSvg(
  mbox(14, 10, 50, 54, 6) +
  `<rect x="19" y="15" width="26" height="34" fill="${IC.dark}" stroke="rgba(223,231,240,0.6)" stroke-width="1.2"/>` +
  `<path d="M32 15v34M19 32h26" stroke="url(#gG)" stroke-width="2.2"/>`
);

scenes['ic-ind-construction'] = iconSvg(
  mbox(10, 14, 54, 21, 6) +
  mbox(27, 21, 37, 45, 5, { top: 'rgba(255,255,255,0.12)' }) +
  mbox(10, 45, 54, 52, 6) +
  `<circle cx="18" cy="17.5" r="1.6" fill="#d3ac67"/><circle cx="46" cy="17.5" r="1.6" fill="#d3ac67"/>` +
  `<circle cx="18" cy="48.5" r="1.6" fill="#d3ac67"/><circle cx="46" cy="48.5" r="1.6" fill="#d3ac67"/>`
);

scenes['ic-ind-hvac'] = iconSvg(
  mbox(10, 12, 54, 52, 6) +
  `<circle cx="32" cy="32" r="15" fill="${IC.dark}" stroke="${IC.stroke}" stroke-width="1.4"/>` +
  `<g fill="url(#gG)"><path d="M32 32c-2-6 0-11 4-13 1 5 0 9-1 12z"/><path d="M32 32c6-1 10 3 11 8-5 0-9-2-11-5z"/><path d="M32 32c-4 5-9 5-14 3 3-4 7-6 11-6z"/></g>` +
  `<circle cx="32" cy="32" r="3.4" fill="url(#gG)" stroke="#8a6a30" stroke-width="1"/>` +
  `<circle cx="15" cy="17" r="1.3" fill="rgba(223,231,240,0.5)"/><circle cx="49" cy="47" r="1.3" fill="rgba(223,231,240,0.5)"/>`
);

scenes['ic-ind-auto'] = iconSvg(
  `<path d="M8 40l4-9c1-2.4 3-4 5.6-4h11l7-7c1.4-1.4 3-2 5-2h8c2.6 0 5 1.6 6 4l3.4 9M8 40v6a2 2 0 0 0 2 2h3" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.5" stroke-linejoin="round"/>` +
  `<path d="M58 40v6a2 2 0 0 1-2 2h-3M22 48h20" stroke="${IC.stroke}" stroke-width="1.5"/>` +
  `<path d="M8 40h50l-1.4-4H10z" fill="rgba(224,188,126,0.55)" stroke="${IC.stroke}" stroke-width="1.2"/>` +
  `<circle cx="18" cy="48" r="5.4" fill="${IC.dark}" stroke="url(#gG)" stroke-width="2.2"/>` +
  `<circle cx="46" cy="48" r="5.4" fill="${IC.dark}" stroke="url(#gG)" stroke-width="2.2"/>` +
  `<path d="M30 27h10l4 4" stroke="rgba(223,231,240,0.55)" stroke-width="1.2"/>`
);

scenes['ic-ind-industrial'] = iconSvg(
  (() => {
    let teeth = '';
    for (let i = 0; i < 8; i++) {
      const a = (i * 45) * Math.PI / 180;
      const x = 32 + Math.cos(a) * 17, y = 34 + Math.sin(a) * 17;
      teeth += `<rect x="${(x - 3.4).toFixed(1)}" y="${(y - 3.4).toFixed(1)}" width="6.8" height="6.8" rx="1.6" transform="rotate(${i * 45} ${x.toFixed(1)} ${y.toFixed(1)})" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.2"/>`;
    }
    return `<circle cx="36" cy="30" r="14" fill="rgba(224,188,126,0.35)"/>` + teeth +
      `<circle cx="32" cy="34" r="14" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.5"/>` +
      `<circle cx="32" cy="34" r="5.5" fill="${IC.dark}" stroke="url(#gG)" stroke-width="2"/>`;
  })()
);

scenes['ic-ind-electrical'] = iconSvg(
  mbox(14, 10, 50, 54, 6) +
  `<path d="M35 16L24 34h7l-3 14 12-19h-8z" fill="url(#gG)" stroke="#8a6a30" stroke-width="1"/>` +
  `<path d="M19 15h6M19 49h6" stroke="rgba(223,231,240,0.5)" stroke-width="1.4"/>`
);

scenes['ic-ind-furniture'] = iconSvg(
  mbox(14, 8, 21, 38, 5) +
  gbox(14, 32, 46, 39, 6) +
  `<rect x="15.5" y="39" width="4" height="15" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.3"/>` +
  `<rect x="41" y="39" width="4" height="15" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.3"/>` +
  `<rect x="49" y="27" width="4" height="27" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.3" transform="rotate(6 51 40)"/>`
);

scenes['ic-ind-hardware'] = iconSvg(
  `<polygon points="32,6 45,13 45,27 32,34 19,27 19,13" fill="rgba(224,188,126,0.5)"/>` +
  `<polygon points="32,10 44,16.5 44,29.5 32,36 20,29.5 20,16.5" fill="url(#gG)" stroke="#8a6a30" stroke-width="1.3"/>` +
  `<circle cx="32" cy="23" r="5" fill="${IC.dark}" stroke="#8a6a30" stroke-width="1.2"/>` +
  `<rect x="27" y="36" width="10" height="20" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.4"/>` +
  `<path d="M27 40h10M27 44.5h10M27 49h10M27 53.5h10" stroke="rgba(223,231,240,0.5)" stroke-width="1.1"/>`
);

scenes['ic-ind-consumer'] = iconSvg(
  mbox(12, 22, 52, 54, 8) +
  `<path d="M32 22v32" stroke="url(#gG)" stroke-width="3"/>` +
  `<path d="M${d([32, 22], 8).join(' ')} L32 22" stroke="url(#gG)" stroke-width="3"/>` +
  `<path d="M12 22l-4 -7h20l4 7M52 22l4 -7h-20" stroke="${IC.stroke}" stroke-width="1.4" fill="rgba(47,81,120,0.5)"/>`
);

scenes['ic-ind-energy'] = iconSvg(
  `<rect x="30" y="26" width="4.5" height="26" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.3"/>` +
  `<path d="M24 52h16l2 4H22z" fill="url(#nG)" stroke="${IC.stroke}" stroke-width="1.3"/>` +
  `<g fill="url(#gG)" stroke="#8a6a30" stroke-width="1">` +
  `<path d="M32 26c-1.6-7-1-13 2-18 2 5 1.6 12-0.5 17z"/>` +
  `<path d="M32 26c6-1.4 11.6 0.6 15 5-5.4 0.8-11.4-1-14-3.6z"/>` +
  `<path d="M32 26c-4.6 4.6-10.4 6-15.6 4 3.6-4 9.6-6 13.6-5.4z"/>` +
  `</g><circle cx="32" cy="26" r="3" fill="url(#gG)" stroke="#8a6a30" stroke-width="1.1"/>`
);

/* ---------- write files ---------- */
for (const [name, svg] of Object.entries(scenes)) {
  writeFileSync(`${OUT}/${name}.svg`, svg + '\n');
  console.log('wrote', `${OUT}/${name}.svg`, (svg.length / 1024).toFixed(1) + 'kb');
}
