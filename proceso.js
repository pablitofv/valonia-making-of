// Valonia, making of. The diagrams are drawn here from datos.js and geo.js;
// the pictures of each slide go one at a time. Keys for whoever presents:
// → the next picture, then the next slide; ← back the same way; ↑ ↓ only the
// pictures; Enter opens the version of the slide; F full screen; Esc closes.

import { DAYS, FIRST, LAST, TOTAL, SOURCES } from "./datos.js";
import { BELGIUM, WALLONIA, LAND, EU_BORDERS } from "./geo.js";
import { qrSvg } from "./qr.js";

const $ = s => document.querySelector(s);
const NS = "http://www.w3.org/2000/svg";
const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const el = (tag, attrs = {}, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; return e; };
const C = { hot: "#F6C945", rail: "#F0A05C", ember: "#E4343B", ai: "#8FB3D9", photo: "#C9B8A0", faint: "#4A4741", soft: "#9A958A", bg: "#0B0C0E", ink: "#EAE5D9" };
const URL_ = "https://pablitofv.github.io/Wallonia/";

// ---- the margin labels: the name over a pill with the kind of message ----
for (const t of document.querySelectorAll(".tag")) {
  const texts = [...t.childNodes].filter(n => n.nodeType === 3), kind = texts.map(n => n.textContent).join("").trim();
  texts.forEach(n => n.remove());
  t.insertAdjacentHTML("beforeend", `<span class="pill">${kind}</span>`);
}

// ---- the cover and the thanks: Belgium and Wallonia in western Europe, north up,
// with the walk across them ----
(async function maps() {
  let route = [];
  for (const [url, pick] of [["route.json", d => d], ["hoy/data/belgica-2025-reel.json", d => d.route.pts.map(p => [p[0], p[1]])]]) {
    try { const r = await fetch(url); if (r.ok) { route = pick(await r.json()); break; } } catch {}
  }
  // Web Mercator, north up; the view: from Cornwall to Berlin, Brittany to the North Sea
  const my = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) * 180 / Math.PI;
  const VIEW = { w: -2.6, e: 11.4, s: 46.9, n: 54.3 }, W = 760, k = W / (VIEW.e - VIEW.w), H = (my(VIEW.n) - my(VIEW.s)) * k;
  const P = ([lon, lat]) => [(lon - VIEW.w) * k, (my(VIEW.n) - my(lat)) * k];
  const path = (ring, close) => ring.map((q, i) => `${i ? "L" : "M"}${P(q).map(v => v.toFixed(1)).join(" ")}`).join("") + (close ? "Z" : "");
  const r = route.filter((_, i) => i % 6 === 0 || i === route.length - 1);
  const label = (svg, ll, text, { size = 11, fill = C.soft, spacing = ".32em", anchor = "middle", italic = false, weight = 600 } = {}) => {
    const [x, y] = P(ll);
    svg.append(el("text", { x, y, "text-anchor": anchor, "font-size": size, "letter-spacing": spacing, fill, "font-weight": weight, ...(italic ? { "font-style": "italic", class: "serif" } : {}) }, text));
  };
  for (const fig of document.querySelectorAll("[data-map]")) {
    const id = fig.dataset.map;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H.toFixed(0)}`, preserveAspectRatio: "xMidYMid meet", role: "img", "aria-label": "Europa occidental: Bélgica, Valonia y el recorrido de Lille a Maastricht" });
    const defs = el("defs");
    defs.innerHTML = `<filter id="glow-${id}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter>
      <radialGradient id="fade-${id}" cx="51%" cy="47%" r="54%"><stop offset="46%" stop-color="#fff"/><stop offset="100%" stop-color="#000"/></radialGradient>
      <mask id="vignette-${id}"><rect width="${W}" height="${H}" fill="url(#fade-${id})"/></mask>`;
    svg.append(defs);
    // Europe, faint, fading out towards the edges
    const europe = el("g", { mask: `url(#vignette-${id})` });
    const land = LAND.map(ring => path(ring, true)).join("");
    // (opaque, so the tiles' overlapping pieces leave no seams)
    europe.append(el("path", { d: land, fill: "#27292D", stroke: "#27292D", "stroke-width": 1, "stroke-linejoin": "round" }));
    for (const line of EU_BORDERS) europe.append(el("path", { d: path(line, false), fill: "none", stroke: "rgba(234,229,217,.22)", "stroke-width": .8 }));
    svg.append(europe);
    // the neighbours' names, quietly; the sea in italics
    for (const [ll, t] of [[[2.4, 47.6], "FRANCIA"], [[9.6, 50.6], "ALEMANIA"], [[5.75, 52.55], "PAÍSES BAJOS"], [[-1.6, 52.4], "REINO UNIDO"]]) label(svg, ll, t, { fill: "rgba(154,149,138,.75)", size: 10.5 });
    label(svg, [2.6, 53.7], "Mar del Norte", { italic: true, size: 13, spacing: ".04em", fill: "rgba(143,179,217,.55)", weight: 400 });
    // Belgium, and Wallonia in it
    svg.append(el("path", { d: path(BELGIUM, true), fill: "rgba(234,229,217,.1)", stroke: "rgba(234,229,217,.75)", "stroke-width": 1.1, "stroke-linejoin": "round" }));
    svg.append(el("path", { d: path(WALLONIA, true), fill: "rgba(246,201,69,.16)", stroke: "rgba(246,201,69,.8)", "stroke-width": 1.1, "stroke-linejoin": "round" }));
    if (r.length) {
      const d = path(r, false);
      svg.append(el("path", { d, fill: "none", stroke: C.ember, "stroke-width": 5, opacity: .5, filter: `url(#glow-${id})`, class: "route" }));
      const line = el("path", { d, fill: "none", stroke: C.hot, "stroke-width": 1.8, "stroke-linecap": "round", "stroke-linejoin": "round", class: "route" });
      svg.append(line);
      const ends = [[r[0], "Lille", "end", -8, 14], [r.at(-1), "Maastricht", "start", 8, -6]];
      for (const [ll, name, anchor, dx, dy] of ends) {
        const [x, y] = P(ll), g = el("g", { class: name === "Maastricht" ? "end" : "" });
        g.append(el("circle", { cx: x, cy: y, r: 3.6, fill: C.bg, stroke: C.hot, "stroke-width": 1.8 }));
        g.append(el("text", { x: x + dx, y: y + dy, "text-anchor": anchor, "font-size": 13, "font-style": "italic", class: "serif", fill: C.ink }, name));
        svg.append(g);
      }
      requestAnimationFrame(() => { const len = line.getTotalLength(); svg.querySelectorAll(".route").forEach(q => q.style.setProperty("--len", len)); });
    }
    // the two names that matter
    label(svg, [4.05, 51.58], "BÉLGICA", { fill: C.ink, size: 12.5, spacing: ".36em" });
    label(svg, [3.95, 49.68], "VALONIA", { fill: C.hot, size: 12.5, spacing: ".36em" });
    fig.append(svg);
  }
})();

// ---- the sources, as they were: each as many marks as it has things ----
(function sources() {
  const dots = (n, w, color, pitch, r) => { const cols = Math.floor(w / pitch), rows = Math.ceil(n / cols); let s = ""; for (let k = 0; k < n; k++) s += `<circle cx="${(k % cols) * pitch + r}" cy="${Math.floor(k / cols) * pitch + r}" r="${r}" fill="${color}"/>`; return `<svg viewBox="0 0 ${w} ${rows * pitch}" preserveAspectRatio="xMinYMin meet">${s}</svg>`; };
  const tracks = () => { const max = Math.max(...SOURCES.tracks), W = 300; return `<svg viewBox="0 0 ${W} ${SOURCES.tracks.length * 8}" preserveAspectRatio="xMinYMin meet">${SOURCES.tracks.map((km, k) => `<rect x="0" y="${k * 8}" width="${km / max * W}" height="4.5" rx="2" fill="${C.hot}"/>`).join("")}</svg>`; };
  const plan = () => { let s = ""; for (let k = 0; k < SOURCES.rides; k++) s += `<rect x="${(k % 12) * 24}" y="${Math.floor(k / 12) * 16}" width="18" height="6" rx="3" fill="${C.rail}"/>`; for (let k = 0; k < SOURCES.stays; k++) s += `<rect x="${k * 24}" y="40" width="12" height="12" rx="2" fill="none" stroke="${C.rail}" stroke-width="1.6"/>`; return `<svg viewBox="0 0 288 54" preserveAspectRatio="xMinYMin meet">${s}</svg>`; };
  const pages = () => { let s = ""; for (let k = 0; k < SOURCES.diaryDays; k++) s += `<rect x="${(k % 11) * 22}" y="${Math.floor(k / 11) * 28}" width="15" height="20" rx="1.5" fill="${C.ai}" opacity=".85"/>`; return `<svg viewBox="0 0 240 50" preserveAspectRatio="xMinYMin meet">${s}</svg>`; };
  const unknown = shape => { let s = ""; for (let k = 0; k < 6; k++) s += shape === "page" ? `<rect x="${k * 26 + 1}" y="1" width="18" height="24" rx="1.5" fill="none" stroke="${C.soft}" stroke-dasharray="3 3"/>` : `<path d="M${k * 30 + 3} 2 h22 a3 3 0 0 1 3 3 v12 a3 3 0 0 1 -3 3 h-14 l-6 5 v-5 h-2 a3 3 0 0 1 -3 -3 v-12 a3 3 0 0 1 3 -3 z" fill="none" stroke="${C.soft}" stroke-dasharray="3 3"/>`; return `<svg viewBox="0 0 180 28" preserveAspectRatio="xMinYMin meet">${s}</svg>`; };
  $("#fuentes").innerHTML = [
    ["wide", fmt(SOURCES.videos), "Videos", "cortos, verticales, con sonido", dots(SOURCES.videos, 640, C.ember, 7, 2.4)],
    ["", fmt(SOURCES.photos), "Fotos", "", dots(SOURCES.photos, 300, C.photo, 7, 2.4)],
    ["", "158 km", "Recorridos GPS", "14 tramos grabados", tracks()],
    ["", `${SOURCES.rides} · ${SOURCES.stays}`, "Planilla del viaje", "viajes en tren, bus y metro · alojamientos", plan()],
    ["", String(SOURCES.diaryDays), "Diario", "días escritos", pages()],
    ["", "—", "Dibujos", "en el cuaderno, en papel", unknown("page")],
    ["", "—", "Charlas con Claude", "durante el viaje, en el teléfono", unknown("bubble")],
  ].map(([cls, n, name, note, viz]) => `<div class="src ${cls}"><span class="num${n === "—" ? " none" : ""}">${n}</span><span class="lbl"><b>${name}</b>${note}</span>${viz}</div>`).join("");
})();

// ---- made with Claude Code: a conversation that works inside a folder ----
$("#cc").innerHTML = `
  <div class="zone"><span class="zl">En mi computadora</span>
    <div class="trio">
      <div class="node me"><span class="glyph">P</span><b>Yo</b><p>Escribo en lenguaje común: lo que quiero, lo que veo, lo que no me gusta.</p></div>
      <div class="link"><i>⇄</i>conversación</div>
      <div class="node ai"><span class="glyph">C</span><b>Claude Code</b><p>Un asistente que no solo responde: lee, escribe y prueba dentro de la carpeta del proyecto.</p></div>
      <div class="link"><i>⇄</i>lee, edita, prueba</div>
      <div class="node repo"><span class="glyph">▤</span><b>La carpeta del proyecto</b><p>Un repositorio: el código, los datos y la historia de cada cambio, con la posibilidad de volver atrás.</p></div>
    </div>
    <p class="stat"><b>${Math.round(TOTAL.actions / TOTAL.messages)}</b><span>acciones de Claude, en promedio, por cada mensaje mío: abrir archivos, cambiarlos, probar el sitio, mirar capturas.</span></p>
    <p class="private">Los videos originales y el diario nunca salen de acá.</p>
  </div>
  <div class="out"><i>→</i>publicar</div>
  <div class="zone web"><span class="zl">En internet</span>
    <div class="node copy"><span class="glyph">⧉</span><b>GitHub, privado</b><p>Una copia de seguridad del proyecto.</p></div>
    <div class="node site"><span class="glyph">◉</span><b>GitHub Pages, público</b><p>Solo el sitio terminado: pablitofv.github.io/Wallonia</p></div>
  </div>`;

// ---- the sources along the way: what each concept used, and where each fell away ----
function flow(svg, stage) {
  const COLS = [{ x: 400, name: "El atlas", when: "23 – 26 sep" }, { x: 640, name: "A pie", when: "28 sep" }, { x: 880, name: "La película", when: "28 sep → hoy" }];
  const L0 = 300, now = COLS[stage - 1].x, merge = { x: 1030, y: 106 };
  COLS.forEach((c, k) => {
    const lit = k < stage;
    svg.append(el("line", { x1: c.x, x2: c.x, y1: 62, y2: 452, stroke: lit ? "rgba(234,229,217,.14)" : "rgba(234,229,217,.05)" }));
    svg.append(el("text", { x: c.x, y: 24, "text-anchor": "middle", "font-size": 19, class: "serif", fill: lit ? C.ink : "#4A4741" }, c.name));
    svg.append(el("text", { x: c.x, y: 44, "text-anchor": "middle", "font-size": 11.5, "letter-spacing": ".12em", fill: lit ? C.soft : "#3A3833" }, c.when.toUpperCase()));
  });
  const rows = [
    { name: "Recorridos GPS", n: "158 km", color: C.hot, w: 4 },
    { name: "Planilla del viaje", n: "24 viajes · 12 alojamientos", color: C.rail, w: 4 },
    { name: "Videos", n: "1.094", color: C.ember, w: 8 },
    { name: "Fotos", n: "778", color: C.photo, w: 4, from: 352, drop: 3 },
    { name: "Diario", n: "21 días", color: C.ai, w: 4, drop: 2 },
    { name: "Dibujos", n: "", never: "nunca se digitalizaron" },
    { name: "Charlas con Claude", n: "", never: "nunca llegaron aparte" },
  ];
  rows.forEach((r, k) => {
    const y = 96 + k * 56;
    svg.append(el("text", { x: 0, y: y - (r.n ? 2 : -5), "font-size": 17, fill: r.never ? C.soft : C.ink }, r.name));
    if (r.n) svg.append(el("text", { x: 0, y: y + 18, "font-size": 12.5, class: "soft" }, r.n));
    if (r.never) { svg.append(el("line", { x1: L0, x2: L0 + 40, y1: y, y2: y, stroke: C.soft, "stroke-width": 1.5, "stroke-dasharray": "3 5" })); cross(L0 + 54, y, C.soft); note(L0 + 70, y, r.never); return; }
    const x0 = r.from || L0;
    if (r.from) svg.append(el("circle", { cx: x0, cy: y, r: 4, fill: r.color }));
    const dropAt = r.drop && r.drop <= stage ? COLS[r.drop - 1].x : null;
    if (dropAt) {
      svg.append(el("path", { d: `M ${x0} ${y} H ${dropAt - 34}`, stroke: r.color, "stroke-width": r.w, fill: "none", "stroke-linecap": "round" }));
      stations(y, r, x0, dropAt - 34); cross(dropAt - 18, y, r.color);
      return;
    }
    if (stage < 3) {
      svg.append(el("path", { d: `M ${x0} ${y} H ${now}`, stroke: r.color, "stroke-width": r.w, fill: "none", "stroke-linecap": "round" }));
      svg.append(el("path", { d: `M ${now + 16} ${y} H ${now + 72}`, stroke: r.color, "stroke-width": r.w, fill: "none", "stroke-dasharray": "2 8", "stroke-linecap": "round", opacity: .45 }));
      stations(y, r, x0, now);
      return;
    }
    svg.append(el("path", { d: `M ${x0} ${y} H 880 C 960 ${y}, 960 ${merge.y + (k - 1) * 7}, ${merge.x} ${merge.y + (k - 1) * 7}`, stroke: r.color, "stroke-width": r.w, fill: "none", "stroke-linecap": "round" }));
    stations(y, r, x0, 880);
  });
  if (stage === 3) {
    svg.append(el("circle", { cx: merge.x + 4, cy: merge.y, r: 15, fill: C.bg, stroke: C.hot, "stroke-width": 2.5 }));
    svg.append(el("text", { x: merge.x + 34, y: merge.y - 34, "font-size": 11.5, class: "soft", "letter-spacing": ".14em" }, "LO QUE QUEDÓ"));
    ["803 videos,", "una línea de 249 km,", "un reloj."].forEach((t, k) => svg.append(el("text", { x: merge.x + 34, y: merge.y - 4 + k * 27, "font-size": 22, class: "serif" }, t)));
  }
  function stations(y, r, x0, x1) { for (const c of COLS) if (c.x > x0 && c.x <= x1 + 1) svg.append(el("circle", { cx: c.x, cy: y, r: r.w / 2 + 3.5, fill: C.bg, stroke: r.color, "stroke-width": 2 })); }
  function cross(x, y, color) { svg.append(el("path", { d: `M ${x - 6} ${y - 6} L ${x + 6} ${y + 6} M ${x + 6} ${y - 6} L ${x - 6} ${y + 6}`, stroke: color, "stroke-width": 2.2, "stroke-linecap": "round" })); }
  function note(x, y, t) { svg.append(el("text", { x, y: y + 5, "font-size": 14.5, class: "soft serif", "font-style": "italic" }, t)); }
}
document.querySelectorAll("[data-flow]").forEach(svg => { flow(svg, +svg.dataset.flow); svg.setAttribute("preserveAspectRatio", "xMinYMin meet"); });

// ---- the film · the four ideas Claude proposed ----
(function ideas() {
  const icon = {
    line: `<svg viewBox="0 0 120 48"><line x1="6" y1="24" x2="114" y2="24" stroke="${C.ai}" stroke-width="3"/>${[6, 33, 60, 87, 114].map(x => `<circle cx="${x}" cy="24" r="5.5" fill="${C.bg}" stroke="${C.ai}" stroke-width="2.5"/>`).join("")}</svg>`,
    ground: `<svg viewBox="0 0 120 48"><path d="M2 32 H118 M30 2 V46 M88 2 V46" stroke="${C.ai}" stroke-width="1" opacity=".4"/><path d="M4 44 L36 14 L74 22 L116 6" fill="none" stroke="${C.ai}" stroke-width="1.8" opacity=".7"/><rect x="50" y="4" width="20" height="40" rx="3" fill="${C.bg}" stroke="${C.ai}" stroke-width="2.5"/></svg>`,
    gauges: `<svg viewBox="0 0 120 48"><text x="2" y="30" font-size="30" font-family="Lora, serif" fill="${C.ai}">08:35</text><text x="3" y="46" font-size="11" fill="${C.ai}" opacity=".7">084,7 km</text></svg>`,
    wall: `<svg viewBox="0 0 120 48">${Array.from({ length: 24 }, (_, k) => `<rect x="${2 + (k % 8) * 14.5}" y="${1 + Math.floor(k / 8) * 16}" width="11" height="14" rx="1.5" fill="${C.ai}" opacity="${k === 11 ? .95 : .3}"/>`).join("")}</svg>`,
  };
  $("#ideas").innerHTML = `
    <div class="idea"><span class="vote">Claude: sí</span>${icon.line}<b>1 · La línea</b><small>El recorrido como una línea de metro, con los pueblos como estaciones</small></div>
    <div class="idea"><span class="vote">Claude: segunda</span>${icon.ground}<b>2 · El suelo debajo</b><small>El video sobre el mapa, en el lugar donde fue filmado</small></div>
    <div class="idea"><span class="vote">Claude: sí</span>${icon.gauges}<b>3 · Los instrumentos</b><small>Reloj, día y kilómetros que giran entre video y video</small></div>
    <div class="idea out"><span class="vote">Claude: no</span>${icon.wall}<b>4 · Todo a la vez</b><small>Una pared con todos los videos, uno crece</small></div>`;
  // (each drawing starts at the card's text edge)
  document.querySelectorAll(".idea svg").forEach(svg => svg.setAttribute("preserveAspectRatio", "xMinYMid meet"));
})();

// ---- the film · three options ----
$("#opciones").innerHTML = `
  <div class="option part"><b><span>A</span>Una puerta, dos susurros</b><small>Un solo botón claro; lo demás, en voz baja.</small><span class="also">de acá, la jerarquía</span></div>
  <div class="option pick"><b><span>B</span>Entrar por un fragmento</b><small>Los videos que flotan detrás del título son puertas a su momento.</small></div>
  <div class="option"><b><span>C</span>Elegir por tiempo</b><small>«¿Cuánto tiempo tenés?» 3 min · 20 min · 1 h 27.</small></div>`;

// ---- the film · one message, twenty-one bouncebacks ----
(function bounces() {
  const at = ["13.23 (15/7)", "17.32 (15/7)", "18.05 (15/7)", "18.08 (15/7)", "13.10 (16/7)", "13.13 (16/7)", "14.14 (16/7)", "16.02 (16/7)", "10.39 (17/7)", "10.26 (19/7)", "10.31 (19/7)",
    "10.40 (19/7)", "11.08 (19/7)", "11.29 (19/7)", "11.40 (19/7)", "11.50 (19/7)", "13.06 (19/7)", "13.23 (19/7)", "13.45 (19/7)", "13.54 (19/7)", "15.44 (19/7)"];
  $("#rebotes").innerHTML = at.map(t => `<p>Hay un pequeño rebote en el video de las ${t}. Evitémoslo.</p>`).join("");
  $("#rebotes").insertAdjacentHTML("afterend", `<span class="count">${at.length} rebotes, uno por uno, en un mensaje</span>`);
})();

// ---- how to ask: six things learned, each with a real message ----
$("#lecciones").innerHTML = [
  ["Contá qué querés que se sienta, no cómo hacerlo", "La tensión entre la belleza y el aburrimiento es el corazón del proyecto."],
  ["Mirá con lupa y señalá con precisión", "Hay un pequeño rebote en el video de las 13.23 (15/7). Evitémoslo."],
  ["Cuando no sabés, pedí opciones", "Proponé tres alternativas y elijo."],
  ["Pedí lo que no se ve", "Hacé una revisión completa de seguridad. Mejorá el rendimiento sin perder calidad. Revisá la accesibilidad."],
  ["Pedí que te hable en tu idioma", "Tus informes son demasiado técnicos para mí. Adaptá tu forma de hablar."],
  ["Probalo vos, donde lo va a usar la gente", "Toqué «volver» en el mapa y no funcionaba. No se podían saltear videos."],
].map(([t, q]) => `<li><b>${t}</b><span class="ex"><span class="pill">Pablo</span><q>${q}</q></span></li>`).join("");

// ---- the back and forth: how much I wrote, and Claude ----
(function tally() {
  const pagesMe = Math.round(TOTAL.words / TOTAL.perPage), pagesAi = Math.round(TOTAL.claudeWords / TOTAL.perPage);
  const sheets = (n, cls, title, note, cols) => `<div class="sheets ${cls}"><div class="grid" data-cols="${cols}">${"<i></i>".repeat(n)}</div><b>${title}</b><span>${note}</span></div>`;
  $("#ida").innerHTML = `
    <div class="big"><b>${TOTAL.messages}</b><span>mensajes míos</span><small>y ${TOTAL.answers} respuestas a preguntas de Claude</small></div>
    <figure class="daily"><figcaption><b class="me">Lo que escribí</b> y <b class="ai">lo que respondió Claude</b>, día por día, en palabras</figcaption><svg id="ritmo" viewBox="0 0 1000 250" preserveAspectRatio="xMinYMin meet" role="img" aria-label="Palabras y mensajes por día"></svg></figure>
    <div class="pages">
      ${sheets(pagesMe, "me", `${pagesMe} hojas A4`, `lo que escribí: ${fmt(TOTAL.words)} palabras`, 7)}
      ${sheets(pagesAi, "ai", `${pagesAi} hojas A4`, `lo que respondió Claude: ${fmt(TOTAL.claudeWords)} palabras`, 14)}
      <div class="facts"><div><b>${TOTAL.days}</b><span>días de trabajo, en 27</span></div><div><b>${fmt(TOTAL.code)}</b><span>líneas de código</span></div></div>
    </div>`;
  // (set here: the security policy allows no inline styles)
  document.querySelectorAll(".sheets .grid").forEach(g => g.style.setProperty("--cols", g.dataset.cols));
  const svg = $("#ritmo"), day = 864e5, t0 = Date.parse(FIRST), n = Math.round((Date.parse(LAST) - t0) / day) + 1;
  const X0 = 0, X1 = 1000, mid = 130, H = 82, slot = (X1 - X0) / n, bw = Math.max(8, slot * .56);
  const max = Math.max(...DAYS.map(d => Math.max(d.w, d.cw)));
  svg.append(el("line", { x1: X0, x2: X1, y1: mid, y2: mid, stroke: "rgba(234,229,217,.25)" }));
  for (let k = 0; k < n; k++) svg.append(el("circle", { cx: X0 + slot * (k + .5), cy: mid, r: 1.4, fill: "rgba(234,229,217,.25)" }));
  for (const d of DAYS) {
    const x = X0 + slot * (Math.round((Date.parse(d.d) - t0) / day) + .5), up = d.w / max * H, down = d.cw / max * H;
    svg.append(el("rect", { x: x - bw / 2, y: mid - up - 1.5, width: bw, height: Math.max(2, up), rx: 2, fill: C.hot }));
    svg.append(el("rect", { x: x - bw / 2, y: mid + 1.5, width: bw, height: down, rx: 2, fill: C.ai, opacity: .85 }));
    const [, mo, dd] = d.d.split("-");
    svg.append(el("text", { x, y: mid + H + 26, "text-anchor": "middle", "font-size": 12, class: "soft" }, `${+dd}/${+mo}`));
  }
})();

// ---- under the hood · a small drawing for each step ----
(function icons() {
  const s = (w, body) => `<svg viewBox="0 0 ${w} 96">${body}</svg>`;
  const I = {
    1: s(170, `<rect x="2" y="16" width="34" height="60" rx="3" fill="none" stroke="${C.ember}" stroke-width="2"/><path d="M15 38 L25 46 L15 54 Z" fill="${C.ember}"/>
      <rect x="46" y="26" width="46" height="36" rx="3" fill="none" stroke="${C.photo}" stroke-width="2"/><circle cx="60" cy="38" r="4" fill="${C.photo}"/><path d="M50 58 L64 46 L74 54 L88 42" fill="none" stroke="${C.photo}" stroke-width="1.6"/>
      <path d="M102 70 C 110 40, 124 64, 132 30 S 150 40, 158 18" fill="none" stroke="${C.hot}" stroke-width="2.4" stroke-linecap="round"/>
      <rect x="112" y="76" width="22" height="16" rx="1.5" fill="${C.ai}" opacity=".8"/><rect x="138" y="76" width="22" height="16" rx="1.5" fill="${C.ai}" opacity=".5"/>`),
    2: s(170, `${[[8, 70], [30, 24], [52, 58], [20, 46], [44, 14], [64, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="${C.ember}" opacity=".6"/>`).join("")}<path d="M76 48 H96 M90 42 L96 48 L90 54" fill="none" stroke="${C.soft}" stroke-width="1.6"/>
      <line x1="106" y1="48" x2="166" y2="48" stroke="${C.hot}" stroke-width="2"/>${[106, 118, 130, 142, 154, 166].map(x => `<circle cx="${x}" cy="48" r="5" fill="${C.ember}"/>`).join("")}`),
    4: s(170, `<text x="2" y="56" font-size="22" font-family="Lora, serif" fill="${C.ink}">08:35</text><rect x="70" y="8" width="44" height="80" rx="3" fill="none" stroke="${C.ink}" stroke-width="2"/>
      <rect x="124" y="8" width="44" height="80" rx="3" fill="rgba(234,229,217,.05)"/><path d="M146 86 C 140 64, 156 50, 146 10" fill="none" stroke="${C.hot}" stroke-width="2.4"/><circle cx="148" cy="44" r="4" fill="${C.ember}"/>`),
    5: s(150, `<rect x="2" y="12" width="70" height="50" rx="3" fill="none" stroke="${C.ink}" stroke-width="2"/><rect x="88" y="20" width="26" height="46" rx="4" fill="none" stroke="${C.ink}" stroke-width="2"/>
      <path d="M26 82 L36 90 L52 72" fill="none" stroke="${C.hot}" stroke-width="3" stroke-linecap="round"/><path d="M96 82 L104 90 L118 74" fill="none" stroke="${C.hot}" stroke-width="3" stroke-linecap="round"/>`),
  };
  for (const i of document.querySelectorAll("[data-ico]")) i.innerHTML = I[i.dataset.ico];
})();

// ---- the thanks: the address, and a QR to it ----
$("#qr").innerHTML = qrSvg(URL_, { dark: "#0B0C0E" });

// ---- pictures: one at a time, with a caption, a count and arrows ----
const slides = [...document.querySelectorAll(".slide")];
for (const pics of document.querySelectorAll(".pics")) {
  const figs = [...pics.querySelectorAll("figure")], stage = document.createElement("div"), bar = document.createElement("div");
  stage.className = "stage"; bar.className = "bar";
  figs.forEach(f => { stage.append(f); const img = f.querySelector("img"); img.onclick = () => zoom(img.src); });
  bar.innerHTML = `<span class="cap"></span><span></span><p class="count"></p><span class="arrows"><button type="button" class="nav" aria-label="Imagen anterior">←</button> <button type="button" class="nav" aria-label="Imagen siguiente">→</button></span>`;
  const [prev, next] = bar.querySelectorAll(".nav");
  prev.onclick = () => picture(pics, +pics.dataset.pic - 1); next.onclick = () => picture(pics, +pics.dataset.pic + 1);
  pics.append(stage, bar);
  picture(pics, 0);
}
for (const img of document.querySelectorAll(".triptych img")) img.onclick = () => zoom(img.src);
function picture(pics, k) {
  const figs = [...pics.querySelectorAll(".stage figure")], n = figs.length;
  k = (k + n) % n; pics.dataset.pic = k;
  figs.forEach((f, j) => f.classList.toggle("on", j === k));
  pics.querySelector(".cap").textContent = figs[k].querySelector("figcaption")?.textContent || "";
  pics.querySelector(".count").textContent = `${k + 1} / ${n}`;
}

// ---- the parts along the foot: one group per part, a mark per slide ----
const parts = [];
slides.forEach((s, i) => { const name = s.dataset.section; let p = parts.at(-1); if (!p || p.name !== name) parts.push(p = { name, slides: [] }); p.slides.push(i); });
$("#line").innerHTML = parts.map(p => `<div class="part" data-part="${p.name}"><span>${p.name}</span><div class="dots">${p.slides.map(i => `<button type="button" data-go="${i}" aria-label="${p.name}, ${p.slides.indexOf(i) + 1}"></button>`).join("")}</div></div>`).join("");
$("#line").querySelectorAll("[data-go]").forEach(b => b.onclick = () => show(+b.dataset.go));
let cur = 0;
const wake = i => { for (const j of [i, i + 1, i - 1, i + 2]) slides[j]?.querySelectorAll("img[data-src]").forEach(img => { img.src = img.dataset.src; img.removeAttribute("data-src"); }); };
function show(i) {
  cur = Math.max(0, Math.min(slides.length - 1, i));
  wake(cur);
  slides.forEach((s, j) => { s.classList.toggle("on", j === cur); s.classList.toggle("past", j < cur); s.toggleAttribute("inert", j !== cur); });
  $("#line").querySelectorAll("[data-go]").forEach(b => { const j = +b.dataset.go; b.classList.toggle("done", j < cur); if (j === cur) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
  $("#line").querySelectorAll(".part").forEach(p => p.classList.toggle("on", p.dataset.part === slides[cur].dataset.section));
  document.body.classList.toggle("on-cover", slides[cur].classList.contains("cover"));
  history.replaceState(null, "", `#${cur + 1}`);
}

// ---- a picture, large; a version, running ----
function zoom(src) { const z = $("#zoom"); z.querySelector("img").src = src; z.hidden = false; }
$("#zoom").onclick = () => { $("#zoom").hidden = true; };
const live = $("#live");
function open(url) { if (!live) return; const f = live.querySelector("iframe"); f.src = url; live.hidden = false; f.onload = () => f.contentWindow?.focus(); }
function close() { if (!live || live.hidden) return; live.querySelector("iframe").src = "about:blank"; live.hidden = true; }
document.querySelectorAll("[data-open]").forEach(b => b.onclick = () => open(b.dataset.open));
if (live) $("#back").onclick = close;

addEventListener("keydown", e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === "Escape") { if (!$("#zoom").hidden) $("#zoom").hidden = true; else close(); return; }
  if (live && !live.hidden) return;
  $("#zoom").hidden = true;
  const pics = slides[cur].querySelector(".pics"), k = pics ? +pics.dataset.pic : 0, n = pics ? pics.querySelectorAll(".stage figure").length : 0;
  if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); if (pics && k < n - 1) picture(pics, k + 1); else show(cur + 1); }
  else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); if (pics && k > 0) picture(pics, k - 1); else show(cur - 1); }
  else if (e.key === "ArrowDown" && pics) { e.preventDefault(); picture(pics, k + 1); }
  else if (e.key === "ArrowUp" && pics) { e.preventDefault(); picture(pics, k - 1); }
  else if (e.key === "Home") show(0);
  else if (e.key === "End") show(slides.length - 1);
  else if (e.key === "Enter" && !e.target.closest("button")) slides[cur].querySelector("[data-open]")?.click();
  else if (e.key.toLowerCase() === "f") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {});
});
let touch = null;
addEventListener("touchstart", e => { touch = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
addEventListener("touchend", e => {
  if (!touch || (live && !live.hidden)) return;
  const dx = e.changedTouches[0].clientX - touch[0], dy = e.changedTouches[0].clientY - touch[1]; touch = null;
  if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  dispatchEvent(new KeyboardEvent("keydown", { key: dx < 0 ? "ArrowRight" : "ArrowLeft" }));
});
addEventListener("hashchange", () => { const i = (+location.hash.slice(1) || 1) - 1; if (i !== cur) show(i); });
show((+location.hash.slice(1) || 1) - 1);
