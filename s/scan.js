/* طابعتي — معالجة صور السكانر (كلها داخل جوال العميل، ما يطلع شي للإنترنت)
   1) نلقى حدود الورقة أو البطاقة في الصورة.
   2) نعدّل الميلان (منظور) ونقصّها.
   3) نبيّض الخلفية ونوضّح الكتابة. */
(function () {
"use strict";

/* ---------- أدوات ---------- */
function toCanvas(src, maxSide) {
  const w0 = src.naturalWidth || src.width, h0 = src.naturalHeight || src.height;
  const r = Math.min(1, maxSide / Math.max(w0, h0));
  const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w0 * r)); c.height = Math.max(1, Math.round(h0 * r));
  const x = c.getContext("2d", { willReadFrequently: true }); x.imageSmoothingQuality = "high"; x.drawImage(src, 0, 0, c.width, c.height);
  return c;
}
async function loadFile(file, maxSide = 3000) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch {
    bmp = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = URL.createObjectURL(file); });
  }
  const c = toCanvas(bmp, maxSide); bmp.close?.(); return c;
}
function gray(img) {
  const d = img.data, n = img.width * img.height, g = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) g[i] = .299 * d[j] + .587 * d[j + 1] + .114 * d[j + 2];
  return g;
}
// ضبابية سريعة (صندوقية) أفقي + عمودي
function boxBlur(a, w, h, r) {
  const t = new Float32Array(a.length), o = new Float32Array(a.length), k = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    let s = 0; const row = y * w;
    for (let x = -r; x <= r; x++) s += a[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) { t[row + x] = s / k; s += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)]; }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += t[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) { o[y * w + x] = s / k; s += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x]; }
  }
  return o;
}
function otsu(vals, bins = 256, max = 255) {
  const hist = new Float64Array(bins); let n = 0;
  for (const v of vals) { hist[Math.min(bins - 1, Math.max(0, Math.floor(v / max * (bins - 1))))]++; n++; }
  let sum = 0; for (let i = 0; i < bins; i++) sum += i * hist[i];
  let sb = 0, wb = 0, best = 0, th = 0;
  for (let i = 0; i < bins; i++) {
    wb += hist[i]; if (!wb) continue; const wf = n - wb; if (!wf) break;
    sb += i * hist[i]; const mb = sb / wb, mf = (sum - sb) / wf, v = wb * wf * (mb - mf) ** 2;
    if (v > best) { best = v; th = i; }
  }
  return th / (bins - 1) * max;
}
function dilate(m, w, h, r = 1) {
  const o = new Uint8Array(m.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!m[y * w + x]) continue;
    for (let dy = -r; dy <= r; dy++) { const yy = y + dy; if (yy < 0 || yy >= h) continue; for (let dx = -r; dx <= r; dx++) { const xx = x + dx; if (xx >= 0 && xx < w) o[yy * w + xx] = 1; } }
  }
  return o;
}
const erode = (m, w, h, r = 1) => { const inv = m.map((v) => 1 - v), d = dilate(inv, w, h, r); return d.map((v) => 1 - v); };
// أكبر منطقة متصلة (قيمتها 1)
function largest(m, w, h) {
  const lab = new Int32Array(m.length), st = new Int32Array(m.length); let best = 0, bestId = 0, id = 0;
  for (let i = 0; i < m.length; i++) {
    if (!m[i] || lab[i]) continue;
    id++; let sp = 0, cnt = 0; st[sp++] = i; lab[i] = id;
    while (sp) {
      const p = st[--sp]; cnt++; const x = p % w, y = (p - x) / w;
      if (x > 0 && m[p - 1] && !lab[p - 1]) { lab[p - 1] = id; st[sp++] = p - 1; }
      if (x < w - 1 && m[p + 1] && !lab[p + 1]) { lab[p + 1] = id; st[sp++] = p + 1; }
      if (y > 0 && m[p - w] && !lab[p - w]) { lab[p - w] = id; st[sp++] = p - w; }
      if (y < h - 1 && m[p + w] && !lab[p + w]) { lab[p + w] = id; st[sp++] = p + w; }
    }
    if (cnt > best) { best = cnt; bestId = id; }
  }
  const out = new Uint8Array(m.length); if (!bestId) return { mask: out, area: 0 };
  for (let i = 0; i < m.length; i++) if (lab[i] === bestId) out[i] = 1;
  return { mask: out, area: best };
}
// غلاف محدّب من أطراف كل سطر
function hull(mask, w, h) {
  const pts = [];
  for (let y = 0; y < h; y++) {
    let a = -1, b = -1;
    for (let x = 0; x < w; x++) if (mask[y * w + x]) { if (a < 0) a = x; b = x; }
    if (a >= 0) { pts.push([a, y]); if (b !== a) pts.push([b, y]); }
  }
  if (pts.length < 3) return pts;
  pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  up.pop(); lo.pop(); return lo.concat(up);
}
const polyArea = (q) => { let s = 0; for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
// أكبر رباعي داخل الغلاف (تحسين محلي يبدأ من الأطراف)
function bestQuad(H) {
  if (H.length < 4) return null;
  const n = H.length, sx = (i) => H[i][0] + H[i][1], dx = (i) => H[i][0] - H[i][1];
  let idx = [0, 0, 0, 0];
  for (let i = 0; i < n; i++) {
    if (sx(i) < sx(idx[0])) idx[0] = i; if (dx(i) > dx(idx[1])) idx[1] = i;
    if (sx(i) > sx(idx[2])) idx[2] = i; if (dx(i) < dx(idx[3])) idx[3] = i;
  }
  const area = (ix) => polyArea(ix.map((i) => H[i]));
  let best = area(idx), changed = true, guard = 0;
  while (changed && guard++ < 40) {
    changed = false;
    for (let k = 0; k < 4; k++) for (let i = 0; i < n; i++) {
      const t = idx.slice(); t[k] = i; const a = area(t);
      if (a > best + 1e-6 && new Set(t).size === 4) { best = a; idx = t; changed = true; }
    }
  }
  return order(idx.map((i) => H[i].slice()));
}
// ترتيب الزوايا: أعلى يسار، أعلى يمين، أسفل يمين، أسفل يسار
function order(q) {
  const c = q.reduce((a, p) => [a[0] + p[0] / 4, a[1] + p[1] / 4], [0, 0]);
  q.sort((a, b) => Math.atan2(a[1] - c[1], a[0] - c[0]) - Math.atan2(b[1] - c[1], b[0] - c[0]));
  let s = 0; q.forEach((p, i) => { if (p[0] + p[1] < q[s][0] + q[s][1]) s = i; });
  return [0, 1, 2, 3].map((i) => q[(s + i) % 4]);
}
function convex(q) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = q[i], b = q[(i + 1) % 4], c = q[(i + 2) % 4];
    const z = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(z) < 1e-6) return false; const s = Math.sign(z); if (sign && s !== sign) return false; sign = s;
  }
  return true;
}

/* ---------- كشف حدود الورقة ---------- */
function detect(canvas) {
  const W = 420, r = Math.min(1, W / Math.max(canvas.width, canvas.height));
  const c = toCanvas(canvas, W), w = c.width, h = c.height, n = w * h;
  const img = c.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, w, h), d = img.data;
  const g = boxBlur(gray(img), w, h, 1);
  const cands = [];
  // قوة الحواف: كم الرباعي ماشي على خطوط واضحة في الصورة
  const gx = new Float32Array(n);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x;
    const sx = -g[i - w - 1] - 2 * g[i - 1] - g[i + w - 1] + g[i - w + 1] + 2 * g[i + 1] + g[i + w + 1];
    const sy = -g[i - w - 1] - 2 * g[i - w] - g[i - w + 1] + g[i + w - 1] + 2 * g[i + w] + g[i + w + 1];
    gx[i] = Math.hypot(sx, sy);
  }
  const sorted = Float32Array.from(gx).sort(), tE = Math.max(24, sorted[Math.floor(n * .9)]);
  const support = (q) => {
    let hit = 0, tot = 0;
    for (let k = 0; k < 4; k++) {
      const a = q[k], b = q[(k + 1) % 4], len = Math.hypot(b[0] - a[0], b[1] - a[1]), steps = Math.max(8, Math.round(len / 3));
      for (let t = 1; t < steps; t++) {
        const x = Math.round(a[0] + (b[0] - a[0]) * t / steps), y = Math.round(a[1] + (b[1] - a[1]) * t / steps);
        let m = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx > 0 && yy > 0 && xx < w - 1 && yy < h - 1) m = Math.max(m, gx[yy * w + xx]); }
        tot++; if (m > tE * .6) hit++;
      }
    }
    return tot ? hit / tot : 0;
  };
  const judge = (mask, how) => {
    const L = largest(erode(dilate(mask, w, h, 2), w, h, 2), w, h);
    if (L.area < n * .06) return;
    const H = hull(L.mask, w, h), q = bestQuad(H); if (!q || !convex(q)) return;
    const qa = polyArea(q), fill = L.area / qa, frac = qa / n;
    // ما نبي الصورة كلها ولا شي صغير جدًا، ونبي الشكل قريب من مستطيل
    const touches = q.filter((p) => p[0] <= 1 || p[1] <= 1 || p[0] >= w - 2 || p[1] >= h - 2).length;
    if (frac > .97 || fill < .82) return;
    const sup = support(q);
    cands.push({ q, score: Math.min(1, fill) * Math.min(1, frac * 2.5) * (.25 + sup) * (touches >= 3 ? .6 : 1), how, sup });
  };
  // (أ) لون الخلفية من أطراف الصورة، وكل شي يختلف عنه = الورقة
  const bw = Math.max(2, Math.round(Math.min(w, h) * .04));
  let br = 0, bg = 0, bb = 0, bn = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x >= bw && x < w - bw && y >= bw && y < h - bw) continue;
    const j = (y * w + x) * 4; br += d[j]; bg += d[j + 1]; bb += d[j + 2]; bn++;
  }
  br /= bn; bg /= bn; bb /= bn;
  const dist = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) dist[i] = Math.hypot(d[j] - br, d[j + 1] - bg, d[j + 2] - bb);
  const db = boxBlur(dist, w, h, 2);
  const tD = Math.max(18, otsu(db, 256, 442) );
  judge(db.map((v) => v > tD ? 1 : 0), "color");
  // (ب) الإضاءة: الورقة عادة أفتح من اللي حولها
  const tL = otsu(g);
  judge(g.map((v) => v > tL ? 1 : 0), "light");
  // (ب٢) الإضاءة بعد إلغاء الظل: نقسم على نسخة ضبابية كبيرة
  const big = boxBlur(boxBlur(g, w, h, Math.round(w / 6)), w, h, Math.round(w / 6));
  const rel = g.map((v, i) => Math.min(255, 128 * v / Math.max(8, big[i])));
  const tR = otsu(rel);
  judge(rel.map((v) => v > tR ? 1 : 0), "relight");
  // (ج) الحواف: نعبّي من أطراف الصورة لين نوصل لخط الحافة، واللي ما وصلناه هو داخل الورقة
  const edge = dilate(gx.map((v) => v > tE ? 1 : 0), w, h, 1);
  const seen = new Uint8Array(n), st = new Int32Array(n); let sp = 0;
  const push = (i) => { if (!edge[i] && !seen[i]) { seen[i] = 1; st[sp++] = i; } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (sp) { const p = st[--sp], x = p % w; if (x > 0) push(p - 1); if (x < w - 1) push(p + 1); if (p >= w) push(p - w); if (p < n - w) push(p + w); }
  judge(seen.map((v, i) => (!v ? 1 : 0)), "edges");

  cands.sort((a, b) => b.score - a.score);
  const best = cands[0];
  if (!best) return { quad: null, how: "none" };
  const q0 = best.q.map(([x, y]) => [x * canvas.width / w, y * canvas.height / h]);
  return { quad: refine(canvas, q0), how: best.how, score: best.score, sup: best.sup };
}

// تدقيق الزوايا بدقة أعلى: نلقى أقوى حافة قريبة من كل ضلع ونرسم خط مستقيم عليها
function refine(canvas, q) {
  const M = 1400, c = toCanvas(canvas, M), w = c.width, h = c.height, k = w / canvas.width;
  const g = boxBlur(gray(c.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, w, h)), w, h, 1);
  const at = (x, y) => { x = Math.max(0, Math.min(w - 1, x)); y = Math.max(0, Math.min(h - 1, y)); const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1), fx = x - x0, fy = y - y0; return (g[y0 * w + x0] * (1 - fx) + g[y0 * w + x1] * fx) * (1 - fy) + (g[y1 * w + x0] * (1 - fx) + g[y1 * w + x1] * fx) * fy; };
  const Q = q.map(([x, y]) => [x * k, y * k]);
  const R = Math.max(6, Math.round(w * .012));
  const lines = [];
  for (let s = 0; s < 4; s++) {
    const a = Q[s], b = Q[(s + 1) % 4], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    const nx = -dy / L, ny = dx / L, pts = [];
    for (let t = .08; t <= .92; t += .02) {
      const px = a[0] + dx * t, py = a[1] + dy * t; let best = 0, bo = 0;
      for (let o = -R; o <= R; o += .5) { const v = Math.abs(at(px + nx * (o + 1), py + ny * (o + 1)) - at(px + nx * (o - 1), py + ny * (o - 1))); if (v > best) { best = v; bo = o; } }
      if (best > 6) pts.push([px + nx * bo, py + ny * bo, best]);
    }
    if (pts.length < 8) { lines.push(null); continue; }
    // خط بالمربعات الصغرى مع استبعاد النقاط الشاذة
    let use = pts;
    for (let it = 0; it < 2; it++) {
      const cx = use.reduce((s2, p) => s2 + p[0], 0) / use.length, cy = use.reduce((s2, p) => s2 + p[1], 0) / use.length;
      let sxx = 0, syy = 0, sxy = 0; use.forEach((p) => { sxx += (p[0] - cx) ** 2; syy += (p[1] - cy) ** 2; sxy += (p[0] - cx) * (p[1] - cy); });
      const ang = .5 * Math.atan2(2 * sxy, sxx - syy), ux = Math.cos(ang), uy = Math.sin(ang);
      const line = { cx, cy, ux, uy };
      const dev = (p) => Math.abs((p[0] - cx) * -uy + (p[1] - cy) * ux);
      lines[s] = line;
      const ds = use.map(dev).sort((m, n2) => m - n2), th = Math.max(1.5, ds[Math.floor(ds.length * .7)] * 1.5);
      const nu = use.filter((p) => dev(p) <= th); if (nu.length < 6) break; use = nu;
    }
  }
  const cross = (l1, l2) => {
    const d = l1.ux * l2.uy - l1.uy * l2.ux; if (Math.abs(d) < 1e-6) return null;
    const t = ((l2.cx - l1.cx) * l2.uy - (l2.cy - l1.cy) * l2.ux) / d; return [l1.cx + l1.ux * t, l1.cy + l1.uy * t];
  };
  const out = Q.map((p, i) => {
    const l1 = lines[(i + 3) % 4], l2 = lines[i];
    if (!l1 || !l2) return p;
    const x = cross(l1, l2); if (!x || Math.hypot(x[0] - p[0], x[1] - p[1]) > R * 2.5) return p;
    return x;
  });
  return convex(out) ? out.map(([x, y]) => [x / k, y / k]) : q;
}
function defaultQuad(cv, inset = .06) {
  const w = cv.width, h = cv.height, a = w * inset, b = h * inset;
  return [[a, b], [w - a, b], [w - a, h - b], [a, h - b]];
}

/* ---------- تعديل المنظور ---------- */
// نحل معادلات تحويل المستطيل الناتج إلى الرباعي في الصورة الأصلية
function homography(src, dst) {
  const A = [], B = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); B.push(v);
  }
  for (let i = 0; i < 8; i++) {
    let p = i; for (let k = i + 1; k < 8; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
    [A[i], A[p]] = [A[p], A[i]]; [B[i], B[p]] = [B[p], B[i]];
    for (let k = i + 1; k < 8; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j < 8; j++) A[k][j] -= f * A[i][j]; B[k] -= f * B[i]; }
  }
  const x = new Array(8);
  for (let i = 7; i >= 0; i--) { let s = B[i]; for (let j = i + 1; j < 8; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
  return [...x, 1];
}
const dist2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function outSize(q, maxSide = 2600) {
  let w = Math.max(dist2(q[0], q[1]), dist2(q[3], q[2])), h = Math.max(dist2(q[0], q[3]), dist2(q[1], q[2]));
  const r = Math.min(1.25, maxSide / Math.max(w, h)); return [Math.round(w * r), Math.round(h * r)];
}
function warp(srcCanvas, q, W, H) {
  const sw = srcCanvas.width, sh = srcCanvas.height;
  const S = srcCanvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, sw, sh).data;
  const M = homography([[0, 0], [W, 0], [W, H], [0, H]], q);
  const out = new ImageData(W, H), O = out.data;
  for (let v = 0; v < H; v++) {
    const vy = v + .5;
    let X = M[0] * .5 + M[1] * vy + M[2], Y = M[3] * .5 + M[4] * vy + M[5], Z = M[6] * .5 + M[7] * vy + M[8];
    for (let u = 0, o = v * W * 4; u < W; u++, o += 4) {
      const sx = X / Z - .5, sy = Y / Z - .5;
      X += M[0]; Y += M[3]; Z += M[6];
      let x0 = Math.floor(sx), y0 = Math.floor(sy);
      const fx = sx - x0, fy = sy - y0;
      if (x0 < 0) x0 = 0; if (y0 < 0) y0 = 0; if (x0 > sw - 2) x0 = sw - 2; if (y0 > sh - 2) y0 = sh - 2;
      const i00 = (y0 * sw + x0) * 4, i10 = i00 + 4, i01 = i00 + sw * 4, i11 = i01 + 4;
      const a = (1 - fx) * (1 - fy), b = fx * (1 - fy), c = (1 - fx) * fy, e = fx * fy;
      O[o] = S[i00] * a + S[i10] * b + S[i01] * c + S[i11] * e;
      O[o + 1] = S[i00 + 1] * a + S[i10 + 1] * b + S[i01 + 1] * c + S[i11 + 1] * e;
      O[o + 2] = S[i00 + 2] * a + S[i10 + 2] * b + S[i01 + 2] * c + S[i11 + 2] * e;
      O[o + 3] = 255;
    }
  }
  return out;
}

/* ---------- تحسين الصورة ---------- */
// خلفية الورقة: نصغّر الصورة، نشيل الكتابة (أكبر قيمة حولها)، ونرجعها ناعمة
function background(ch, w, h) {
  const k = 16, sw = Math.ceil(w / k), sh = Math.ceil(h / k), s = new Float32Array(sw * sh);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    let m = 0; const y1 = Math.min(h, (y + 1) * k), x1 = Math.min(w, (x + 1) * k);
    // أعلى 90% بدل الأعلى بالضبط عشان النقط الفاتحة ما تخرّب
    const vals = [];
    for (let yy = y * k; yy < y1; yy += 2) for (let xx = x * k; xx < x1; xx += 2) vals.push(ch[yy * w + xx]);
    vals.sort((a, b) => a - b); m = vals[Math.floor(vals.length * .9)] || 255;
    s[y * sw + x] = m;
  }
  let t = s;
  for (let it = 0; it < 2; it++) { const o = new Float32Array(t.length); for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { let m = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = Math.min(sh - 1, Math.max(0, y + dy)), xx = Math.min(sw - 1, Math.max(0, x + dx)); m = Math.max(m, t[yy * sw + xx]); } o[y * sw + x] = m; } t = o; }
  t = boxBlur(t, sw, sh, 2);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = Math.min(sh - 1.001, Math.max(0, (y + .5) / k - .5)), y0 = Math.floor(fy), ty = fy - y0;
    for (let x = 0; x < w; x++) {
      const fx = Math.min(sw - 1.001, Math.max(0, (x + .5) / k - .5)), x0 = Math.floor(fx), tx = fx - x0;
      const a = t[y0 * sw + x0], b = t[y0 * sw + x0 + 1], c = t[(y0 + 1) * sw + x0], e = t[(y0 + 1) * sw + x0 + 1];
      out[y * w + x] = Math.max(8, (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + e * tx) * ty);
    }
  }
  return out;
}
function enhance(img, mode) {
  const w = img.width, h = img.height, d = img.data, n = w * h;
  if (mode === "original") return img;
  if (mode === "doc" || mode === "gray") {
    const L = gray(img);
    if (mode === "doc") {
      const bg = background(L, w, h);
      for (let i = 0, j = 0; i < n; i++, j += 4) {
        let r = L[i] / bg[i];                       // 1 = لون الورقة
        r = (r - .5) / (.9 - .5); r = r < 0 ? 0 : r > 1 ? 1 : r;
        const v = 255 * Math.pow(r, 1.6);
        d[j] = d[j + 1] = d[j + 2] = v;
      }
    } else {
      const s = Float32Array.from(L).sort(), lo = s[Math.floor(n * .01)], hi = s[Math.floor(n * .99)], k = 255 / Math.max(1, hi - lo);
      for (let i = 0, j = 0; i < n; i++, j += 4) { const v = Math.max(0, Math.min(255, (L[i] - lo) * k)); d[j] = d[j + 1] = d[j + 2] = v; }
    }
    return img;
  }
  // ألوان: توازن الأبيض وتصحيح الإضاءة بشكل عام (بدون ما نخرب الصور الكبيرة مثل صورة الهوية)
  for (let c = 0; c < 3; c++) {
    const ch = new Float32Array(n); for (let i = 0; i < n; i++) ch[i] = d[i * 4 + c];
    const s2 = Float32Array.from(ch).sort(), lo = s2[Math.floor(n * .005)], hi = s2[Math.floor(n * .985)], k = 255 / Math.max(1, hi - lo);
    for (let i = 0; i < n; i++) d[i * 4 + c] = Math.max(0, Math.min(255, (ch[i] - lo) * k));
  }
  // تشبع خفيف
  for (let j = 0; j < n * 4; j += 4) { const m = (d[j] + d[j + 1] + d[j + 2]) / 3; for (let c = 0; c < 3; c++) d[j + c] = Math.max(0, Math.min(255, m + (d[j + c] - m) * 1.15)); }
  return img;
}
function rotate(canvas, quarter) {
  quarter = ((quarter % 4) + 4) % 4; if (!quarter) return canvas;
  const c = document.createElement("canvas"); const sw = quarter % 2;
  c.width = sw ? canvas.height : canvas.width; c.height = sw ? canvas.width : canvas.height;
  const x = c.getContext("2d"); x.translate(c.width / 2, c.height / 2); x.rotate(quarter * Math.PI / 2); x.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
  return c;
}

// المعالجة الكاملة لصفحة: قص + تعديل + تحسين + تدوير
function process(src, quad, opt = {}) {
  let [W, H] = opt.size || outSize(quad, opt.maxSide || 2600);
  const img = warp(src, quad, W, H);
  enhance(img, opt.mode || "doc");
  const c = document.createElement("canvas"); c.width = W; c.height = H; c.getContext("2d").putImageData(img, 0, 0);
  return rotate(c, opt.rot || 0);
}

window.TScan = { loadFile, detect, defaultQuad, process, outSize, toCanvas, rotate, order };
})();
