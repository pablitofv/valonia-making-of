// A QR code for a short text (a web address), drawn as SVG. No dependencies:
// byte mode, error correction level M, versions 1 to 3 (up to 42 bytes), as
// in ISO/IEC 18004 (and as Project Nayuki's reference implementation lays it
// out). Returns the module matrix too, for checking.

const DATA = { 1: 16, 2: 28, 3: 44 }, EC = { 1: 10, 2: 16, 3: 26 }, ALIGN = { 1: [], 2: [6, 18], 3: [6, 22] };

function mul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 255; }
function divisor(n) { const r = new Array(n).fill(0); r[n - 1] = 1; let root = 1; for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { r[j] = mul(r[j], root); if (j + 1 < n) r[j] ^= r[j + 1]; } root = mul(root, 2); } return r; }
function remainder(data, div) { const r = new Array(div.length).fill(0); for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= mul(c, f); }); } return r; }

export function qr(text) {
  const bytes = [...new TextEncoder().encode(text)];
  const version = [1, 2, 3].find(v => 4 + 8 + bytes.length * 8 <= DATA[v] * 8);
  if (!version) throw new Error("text too long for this small QR encoder");
  const size = version * 4 + 17, cap = DATA[version];
  // the bits: mode (byte), count, data, terminator, padding
  const bits = [];
  const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
  put(4, 4); put(bytes.length, 8); bytes.forEach(b => put(b, 8));
  put(0, Math.min(4, cap * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => a * 2 + b, 0));
  for (let pad = 0xEC; data.length < cap; pad ^= 0xEC ^ 0x11) data.push(pad);
  const words = data.concat(remainder(data, divisor(EC[version])));

  const M = Array.from({ length: size }, () => new Array(size).fill(false));
  const F = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, dark) => { M[y][x] = dark; F[y][x] = true; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]])
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
      if (x >= 0 && y >= 0 && x < size && y < size) set(x, y, d !== 2 && d !== 4);
    }
  const al = ALIGN[version];
  for (let i = 0; i < al.length; i++) for (let j = 0; j < al.length; j++) {
    if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }
  const format = mask => {
    const d = (0 << 3) | mask; // level M is 00
    let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const b = ((d << 10) | r) ^ 0x5412, bit = i => ((b >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  format(0); // (reserve the format areas)
  // the codewords, in the zigzag
  let k = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < size; v++) for (let j = 0; j < 2; j++) {
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - v : v;
      if (!F[y][x] && k < words.length * 8) { M[y][x] = ((words[k >>> 3] >>> (7 - (k & 7))) & 1) === 1; k++; }
    }
  }
  const MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
    (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
  const apply = m => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!F[y][x] && MASKS[m](x, y)) M[y][x] = !M[y][x]; };
  // the mask with the fewest long runs and the most even balance
  const penalty = () => {
    let p = 0;
    for (const line of [...M, ...M[0].map((_, x) => M.map(r => r[x]))]) { let run = 1; for (let i = 1; i <= line.length; i++) { if (i < line.length && line[i] === line[i - 1]) run++; else { if (run >= 5) p += run - 2; run = 1; } } }
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = M[y][x]; if (c === M[y][x + 1] && c === M[y + 1][x] && c === M[y + 1][x + 1]) p += 3; }
    const dark = M.flat().filter(Boolean).length; p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    return p;
  };
  let best = 0, bestP = Infinity;
  for (let m = 0; m < 8; m++) { apply(m); format(m); const p = penalty(); if (p < bestP) { bestP = p; best = m; } apply(m); }
  apply(best); format(best);
  return { size, modules: M, mask: best, version };
}

export function qrSvg(text, { dark = "#EAE5D9", light = "none", quiet = 4 } = {}) {
  const { size, modules } = qr(text), n = size + quiet * 2;
  let d = "";
  modules.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x + quiet} ${y + quiet}h1v1h-1z`; }));
  return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img" aria-label="${text}">${light !== "none" ? `<rect width="${n}" height="${n}" fill="${light}"/>` : ""}<path d="${d}" fill="${dark}"/></svg>`;
}
