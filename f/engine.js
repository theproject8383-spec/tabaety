/* طابعتي — محرك تنسيق الصفحات
   نرتّب الصفحة بوحدة النقطة (A4 = 595×842) ونرسم كل كلمة في مكانها على canvas.
   المتصفح يتكفّل بتشكيل الحروف العربية داخل الكلمة، واحنا نتكفّل بترتيب الكلمات (يمين/يسار)
   عشان نقدر نسوي محاذاة من الطرفين، وكلام عريض وسط السطر، وإنجليزي داخل نص عربي بدون ما ينقلب. */
(function () {
"use strict";
const PW = 595.28, PH = 841.89;
const FAMS = { naskh: "TNaskh", amiri: "TAmiri", plex: "TPlex" };
const fontOf = (fam, size, bold) => `${bold ? 700 : 400} ${size}px ${FAMS[fam] || fam}, TPlex, sans-serif`;

const mc = document.createElement("canvas").getContext("2d");
const MEM = new Map();
function mw(f, s) {
  const k = f + "\u0001" + s; let v = MEM.get(k);
  if (v === undefined) { mc.font = f; v = mc.measureText(s).width; if (MEM.size > 60000) MEM.clear(); MEM.set(k, v); }
  return v;
}

const AR = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/, LA = /[A-Za-zÀ-ɏ]/;
const tdir = (s) => AR.test(s) ? "r" : LA.test(s) ? "l" : "n";

/* ---------- تنظيف النص الملصوق (من ChatGPT أو Word أو PDF) ---------- */
function clean(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[​‎‏‪-‮⁦-⁩﻿]/g, "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{20E3}]/gu, "")
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[ \t ]+/g, " ")
    .replace(/ +([،؛؟:!.,;?)\]»])/g, "$1")
    .replace(/([(\[«]) +/g, "$1")
    .replace(/،(?=[^\s\d])/g, "، ")
    .split("\n").map((l) => l.trim()).join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

/* ---------- الكلام العريض داخل السطر: **كذا** ---------- */
// g = ملتصقة بالكلمة اللي قبلها بدون مسافة (مثل «،» بعد كلمة عريضة، أو «؟» بعد كلمة إنجليزية)
function tokens(str) {
  const out = [];
  String(str).split(/(\*\*[^*]+?\*\*)/g).forEach((part) => {
    if (!part) return;
    const bold = /^\*\*[^*]+\*\*$/.test(part);
    const t = (bold ? part.slice(2, -2) : part).replace(/\*\*/g, "").replace(/(^|\s)\*(\S[^*]*?)\*(?=\s|$)/g, "$1$2");
    const glueFirst = out.length && !/^\s/.test(t);
    t.split(/\s+/).forEach((w, i) => {
      if (!w) return;
      const g = i === 0 && glueFirst;
      // علامات الترقيم العربية في آخر كلمة إنجليزية تنفصل عشان تجي بمكانها الصحيح في السطر العربي
      const m = LA.test(w) && w.match(/^(.*?[^؟،؛])([؟،؛]+)$/);
      if (m) { out.push({ s: m[1], b: bold, d: tdir(m[1]), g }); out.push({ s: m[2], b: bold, d: "r", g: true }); }
      else out.push({ s: w, b: bold, d: tdir(w), g });
    });
  });
  return out;
}

/* ---------- تحويل النص إلى كتل ---------- */
const BULLET = /^[-•*▪●◦–—✓✔]\s+(.+)$/;
const NUM = /^(\(?[0-9٠-٩]{1,3}[.)\-]|[أبجدهوزحطي][.)\-]|\([أبجدهوزحطي]\))\s*(.+)$/;
function blocks(text, opt = {}) {
  const lines = (opt.clean === false ? String(text || "").replace(/\r/g, "") : clean(text)).split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i], s = raw.trim();
    if (!s) { out.push({ k: "gap" }); continue; }
    // جدول ماركداون
    if (/^\|.*\|$/.test(s) || (s.split("|").length >= 3 && lines[i + 1] && /^\|?[\s:|-]+\|?$/.test(lines[i + 1].trim()) && lines[i + 1].includes("-"))) {
      const rows = [];
      while (i < lines.length && lines[i].trim().includes("|")) {
        const r = lines[i].trim();
        if (!/^\|?[\s:|-]+\|?$/.test(r)) rows.push(r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
        i++;
      }
      i--;
      if (rows.length) out.push({ k: "table", rows });
      continue;
    }
    let m;
    if (/^([-*_]\s*){3,}$/.test(s)) { out.push({ k: "hr" }); continue; }
    if ((m = s.match(/^(#{1,6})\s*(.+)$/))) { out.push({ k: m[1].length <= 2 ? "h2" : "h3", s: m[2].replace(/\*\*/g, "").replace(/[:：]$/, "").trim() }); continue; }
    if ((m = s.match(/^\*\*([^*]+)\*\*\s*[:：]?$/)) && m[1].split(/\s+/).length <= 12) { out.push({ k: "h3", s: m[1].trim() }); continue; }
    if ((m = s.match(/^>\s?(.*)$/))) { out.push({ k: "quote", s: m[1] }); continue; }
    if ((m = s.match(BULLET))) { out.push({ k: "li", s: m[1], lvl: /^\s{2,}/.test(raw) ? 1 : 0 }); continue; }
    if ((m = s.match(NUM)) && !/^[0-9٠-٩]+[.)]\s*[0-9٠-٩]/.test(s)) { out.push({ k: "ol", n: m[1].replace(/[-)]$/, ".").replace(/^\(|\)$/g, ""), s: m[2], lvl: /^\s{2,}/.test(raw) ? 1 : 0 }); continue; }
    out.push({ k: "p", s });
  }
  // نشيل الفراغات الزايدة في البداية والنهاية والمتكررة
  return out.filter((b, i, a) => b.k !== "gap" || (i > 0 && i < a.length - 1 && a[i - 1].k !== "gap"));
}

/* ---------- تقسيم نص كامل إلى أقسام (وضع «الصق النص كامل») ---------- */
const KNOWN = /^(المقدمة|مقدمة|التمهيد|تمهيد|الخاتمة|خاتمة|المراجع|المصادر|المراجع والمصادر|النتائج|التوصيات|النتائج والتوصيات|الملخص|ملخص|الأهداف|أهداف البحث|أهمية البحث|مشكلة البحث|منهج البحث|الدراسات السابقة|الإطار النظري|المناقشة|الاستنتاج|الاستنتاجات|الفهرس|الملاحق|Summary|Profile|Objective|Education|Experience|Work Experience|Skills|Projects|Certifications|Certificates|Languages|Courses|Activities|Volunteering|Awards|References|Introduction|Conclusion|Abstract)\s*[:：]?$/i;
const ORDINAL = /^(أولًا|أولاً|ثانيًا|ثانياً|ثالثًا|ثالثاً|رابعًا|رابعاً|خامسًا|خامساً|سادسًا|سادساً|سابعًا|سابعاً|ثامنًا|ثامناً|تاسعًا|تاسعاً|عاشرًا|عاشراً|الفصل|المبحث|المطلب|الباب|القسم)\b/;
function splitSections(text) {
  const lines = clean(text).split("\n");
  const has = (re) => lines.some((l) => re.test(l));
  const H1 = /^#{1,2}\s+\S/, BOLD = /^\*\*[^*]{1,80}\*\*\s*[:：]?$/;
  let isHead;
  if (has(H1)) isHead = (l) => H1.test(l);
  else if (lines.filter((l) => BOLD.test(l)).length >= 2) isHead = (l) => BOLD.test(l);
  else isHead = (l, next) => {
    const t = l.replace(/^[0-9٠-٩]+\s*[-.)]\s*/, "");
    if (KNOWN.test(t)) return true;
    const words = l.split(/\s+/).length;
    return ORDINAL.test(l) && words <= 9 && !/[.؟?!]$/.test(l) && !!next;
  };
  const secs = []; let cur = { h: "", t: [] };
  lines.forEach((l, i) => {
    if (l && isHead(l, lines[i + 1])) {
      if (cur.h || cur.t.join("").trim()) secs.push(cur);
      cur = { h: l.replace(/^#{1,2}\s+/, "").replace(/^\*\*|\*\*\s*[:：]?$/g, "").replace(/[:：]$/, "").trim(), t: [] };
    } else cur.t.push(l);
  });
  if (cur.h || cur.t.join("").trim()) secs.push(cur);
  return secs.map((s) => ({ h: s.h, t: s.t.join("\n").trim() }));
}

/* ---------- الكاتب: يوزّع المحتوى على الصفحات ---------- */
class Writer {
  constructor(o) {
    this.rtl = o.rtl !== false; this.M = o.margins || { t: 72, b: 72, l: 66, r: 66 };
    this.pages = []; this.images = new Set(); this.marks = {}; this.newPage();
  }
  newPage(kind) { this.p = { ops: [], kind: kind || "body" }; this.pages.push(this.p); this.y = this.M.t; return this.p; }
  get x0() { return this.M.l; } get x1() { return PW - this.M.r; } get cw() { return PW - this.M.l - this.M.r; }
  get bottom() { return PH - this.M.b; }
  room(h) { if (this.y + h > this.bottom + .01) { this.newPage(); return true; } return false; }
  // رسم مباشر
  text(s, x, y, f, o = {}) {
    const d = o.d || (tdir(s) === "l" ? "ltr" : tdir(s) === "r" ? "rtl" : (this.rtl ? "rtl" : "ltr"));
    this.p.ops.push({ k: "t", s, x, y, f, a: o.a || (this.rtl ? "right" : "left"), c: o.c || "#141414", d });
  }
  line(x1, y1, x2, y2, w = .6, c = "#141414", dash) { this.p.ops.push({ k: "l", x1, y1, x2, y2, w, c, dash }); }
  rect(x, y, w, h, lw = .6, c = "#141414", r = 0) { this.p.ops.push({ k: "r", x, y, w, h, lw, c, r }); }
  fill(x, y, w, h, c = "#EEEEEE", r = 0) { this.p.ops.push({ k: "f", x, y, w, h, c, r }); }
  image(src, x, y, w, h, round) { if (!src) return; this.images.add(src); this.p.ops.push({ k: "i", src, x, y, w, h, round: !!round }); }
  // يرجع X لنقطة على بعد d من طرف البداية (يمين للعربي)
  sx(d) { return this.rtl ? this.x1 - d : this.x0 + d; }
  ex(d) { return this.rtl ? this.x0 + d : this.x1 - d; }

  /* فقرة: التفاف، محاذاة، علامة نقطة/رقم، خلفية أو شريط جانبي */
  para(input, st) {
    const toks = typeof input === "string" ? tokens(input) : input;
    if (!toks.length) return 0;
    const size = st.size, fam = st.fam, lh = size * (st.lh || 1.8);
    const fr = fontOf(fam, size, !!st.bold), fb = fontOf(fam, size, true);
    const fonts = toks.map((t) => (t.b || st.bold) ? fb : fr);
    const wid = toks.map((t, i) => mw(fonts[i], t.s));
    const space = mw(fr, " ");
    const indS = st.indent || 0, indE = st.indentEnd || 0;
    const avail = this.cw - indS - indE;
    // تقسيم الأسطر
    const lines = []; let cur = [], w = 0;
    toks.forEach((t, i) => {
      if (wid[i] > avail) {          // كلمة طويلة جدًا (رابط مثلًا): نقطّعها
        if (cur.length) { lines.push(cur); cur = []; w = 0; }
        let s = t.s, piece = "";
        for (const ch of s) { if (mw(fonts[i], piece + ch) > avail && piece) { lines.push([{ ...t, s: piece, _w: mw(fonts[i], piece), _f: fonts[i] }]); piece = ""; } piece += ch; }
        cur = [{ ...t, s: piece, _w: mw(fonts[i], piece), _f: fonts[i] }]; w = cur[0]._w; return;
      }
      const add = (cur.length && !t.g ? space : 0) + wid[i];
      if (cur.length && w + add > avail && !t.g) { lines.push(cur); cur = []; w = 0; }
      cur.push({ ...t, _w: wid[i], _f: fonts[i] }); w += (cur.length > 1 && !t.g ? space : 0) + wid[i];
    });
    if (cur.length) lines.push(cur);

    this.y += st.before || 0;
    const need = Math.min(lines.length, st.keepLines || 2) * lh + (st.keepAfter || 0);
    this.room(need);
    lines.forEach((ln, li) => {
      this.room(lh);
      const top = this.y, base = top + lh / 2 + size * .36;
      if (st.bg) this.fill(this.x0 - (st.bgPad || 0), top - .3, this.cw + (st.bgPad || 0) * 2, lh + .6, st.bg);
      if (st.bar) { const bx = this.sx(Math.max(0, indS - (st.barGap || 10))); this.line(bx, top, bx, top + lh, st.barW || 2.4, st.barC || "#141414"); }
      if (li === 0 && st.label) {
        const lf = fontOf(fam, size, st.labelBold ?? !!st.bold);
        this.text(st.label, this.sx(st.labelAt || 0), base, lf, { c: st.labelC || st.c, d: this.rtl ? "rtl" : "ltr" });
      }
      this._place(ln, {
        y: base, c: st.c, space, x0: this.x0 + (this.rtl ? indE : indS), x1: this.x1 - (this.rtl ? indS : indE),
        justify: st.align === "justify" && li < lines.length - 1, align: st.align || "start",
      });
      this.y += lh;
    });
    this.y += st.after || 0;
    return lines.length;
  }

  // ترتيب كلمات السطر: الكلمات اللي بنفس اتجاه الفقرة تمشي عادي، والكلمات المعاكسة (إنجليزي وسط عربي) تتجمع وتنكتب بترتيبها الصحيح
  _place(ln, o) {
    const n = ln.length, sum = ln.reduce((a, t) => a + t._w, 0);
    const gaps = ln.filter((t, k) => k && !t.g).length;
    let gap = o.space;
    if (o.justify && gaps) { const g = (o.x1 - o.x0 - sum) / gaps; if (g >= o.space * .5 && g <= o.space * 3.6) gap = g; }
    const G = (k) => (k > 0 && ln[k].g ? 0 : gap);   // المسافة قبل الكلمة رقم k
    const total = sum + gap * gaps, rtl = this.rtl;
    let x = rtl ? o.x1 : o.x0;
    if (o.align === "center") x = rtl ? (o.x0 + o.x1) / 2 + total / 2 : (o.x0 + o.x1) / 2 - total / 2;
    else if (o.align === "end") x = rtl ? o.x0 + total : o.x1 - total;
    const other = rtl ? "l" : "r", D = ln.map((t) => t.d);
    const nextStrong = (k) => { for (let m = k; m < n; m++) if (D[m] !== "n") return D[m]; return null; };
    const sg = rtl ? -1 : 1;
    let i = 0;
    while (i < n) {
      if (D[i] === other) {
        let j = i;
        while (j + 1 < n && (D[j + 1] === other || (D[j + 1] === "n" && nextStrong(j + 1) === other))) j++;
        if (i > 0) x += sg * G(i);
        let rw = 0; for (let k = i; k <= j; k++) rw += ln[k]._w + (k > i ? G(k) : 0);
        let ix = rtl ? x - rw : x + rw;
        for (let k = i; k <= j; k++) {
          const t = ln[k];
          if (k > i) ix += (rtl ? 1 : -1) * G(k);
          if (rtl) { this.p.ops.push({ k: "t", s: t.s, x: ix, y: o.y, f: t._f, a: "left", c: o.c || "#141414", d: "ltr" }); ix += t._w; }
          else { this.p.ops.push({ k: "t", s: t.s, x: ix, y: o.y, f: t._f, a: "right", c: o.c || "#141414", d: "rtl" }); ix -= t._w; }
        }
        x += sg * rw; i = j + 1;
      } else {
        const t = ln[i];
        if (i > 0) x += sg * G(i);
        this.p.ops.push({ k: "t", s: t.s, x, y: o.y, f: t._f, a: rtl ? "right" : "left", c: o.c || "#141414", d: rtl ? "rtl" : "ltr" });
        x += sg * t._w; i++;
      }
    }
  }

  /* جدول: الأعمدة توزّع حسب طول المحتوى، والرأس يتكرر لو انقسم على صفحتين */
  table(rows, st) {
    const size = st.size, fam = st.fam, lh = size * 1.5, pad = 5;
    const nc = Math.max(...rows.map((r) => r.length));
    rows = rows.map((r) => { const c = r.slice(); while (c.length < nc) c.push(""); return c; });
    const fr = fontOf(fam, size, false), fb = fontOf(fam, size, true);
    const nat = new Array(nc).fill(24), min = new Array(nc).fill(24);
    rows.forEach((r, ri) => r.forEach((c, ci) => {
      const f = ri === 0 ? fb : fr, tk = tokens(c);
      nat[ci] = Math.max(nat[ci], Math.min(260, tk.reduce((a, t) => a + mw(f, t.s), 0) + mw(f, " ") * Math.max(0, tk.length - 1)) + pad * 2 + 1);
      min[ci] = Math.max(min[ci], Math.min(120, Math.max(0, ...tk.map((t) => mw(f, t.s)))) + pad * 2 + 1);
    }));
    const avail = this.cw, sn = nat.reduce((a, b) => a + b, 0), sm = min.reduce((a, b) => a + b, 0);
    let ws;
    if (sn <= avail) ws = nat.map((v) => v + (avail - sn) * v / sn);
    else if (sm >= avail) ws = min.map((v) => v * avail / sm);
    else ws = min.map((v, i) => v + (avail - sm) * (nat[i] - min[i]) / (sn - sm));
    const cellLines = (c, f, w) => {
      const tk = tokens(c), ls = []; let cur = [], cw = 0; const sp = mw(f, " ");
      tk.forEach((t) => { const tw = mw(f, t.s); if (cur.length && cw + sp + tw > w) { ls.push(cur); cur = []; cw = 0; } cur.push({ ...t, _w: tw, _f: t.b ? fb : f }); cw += (cur.length > 1 ? sp : 0) + tw; });
      if (cur.length) ls.push(cur); return ls.length ? ls : [[]];
    };
    const drawRow = (r, head) => {
      const f = head ? fb : fr, cells = r.map((c, ci) => cellLines(c, f, ws[ci] - pad * 2));
      const h = Math.max(...cells.map((l) => l.length)) * lh + pad * 2 - 2;
      return { h, paint: () => {
        let x = this.rtl ? this.x1 : this.x0;
        if (head && st.headBg) this.fill(this.x0, this.y, this.cw, h, st.headBg);
        cells.forEach((ls, ci) => {
          const cx0 = this.rtl ? x - ws[ci] : x, cx1 = cx0 + ws[ci];
          this.rect(cx0, this.y, ws[ci], h, .6, st.border || "#8C8C8C");
          ls.forEach((ln, li) => { if (ln.length) this._place(ln, { y: this.y + pad + li * lh + lh / 2 + size * .36 - 1, c: st.c, space: mw(f, " "), x0: cx0 + pad, x1: cx1 - pad, align: "start" }); });
          x = this.rtl ? cx0 : cx1;
        });
        this.y += h;
      } };
    };
    this.y += st.before || 0;
    const head = drawRow(rows[0], true);
    this.room(head.h + lh * 2 + pad * 2);
    head.paint();
    rows.slice(1).forEach((r) => {
      const row = drawRow(r, false);
      if (this.room(row.h)) drawRow(rows[0], true).paint();
      row.paint();
    });
    this.y += st.after || 0;
  }
}

/* ---------- عرض الكتل بأسلوب القالب ---------- */
function flow(W, bl, S) {
  let n = 0, prev = null;
  bl.forEach((b) => {
    if (b.k !== "ol") n = 0;
    switch (b.k) {
      case "gap": W.y += S.gap ?? S.body.size * .35; break;
      case "hr": W.y += S.body.size * .6; break;
      case "h2": S.h2 ? S.h2(W, b.s) : W.para(b.s, { ...S.body, size: S.body.size + 3, bold: true, align: "start", before: 6, after: 2, keepAfter: S.body.size * 3.5 }); break;
      case "h3": S.h3 ? S.h3(W, b.s) : W.para(b.s, { ...S.body, size: S.body.size + 1, bold: true, align: "start", before: 4, after: 1, keepAfter: S.body.size * 3.5 }); break;
      case "li": W.para(b.s, { ...S.body, ...S.li, indent: (S.li?.indent || 20) + b.lvl * 18, label: b.lvl ? "◦" : (S.bullet || "•"), labelAt: 5 + b.lvl * 18 }); break;
      case "ol": W.para(b.s, { ...S.body, ...S.li, indent: (S.li?.indent || 20) + 6 + b.lvl * 18, label: b.n, labelAt: 2 + b.lvl * 18, labelBold: true }); break;
      case "quote": W.para(b.s, { ...S.body, ...S.quote }); break;
      case "table": W.table(b.rows, { ...S.table, fam: S.body.fam, size: S.body.size - 2, before: 4, after: S.body.size * .7 }); break;
      default: {
        if (S.qa && /^(س\s*[0-9٠-٩]*\s*[:：/\-]|السؤال\b|سؤال\b|Q[0-9]*[:.])/.test(b.s)) { W.para(b.s, { ...S.body, bold: true, align: "start", before: S.body.size * .3, keepAfter: S.body.size * 2 }); break; }
        if (S.qa) { const m = b.s.match(/^(ج|الجواب|الإجابة|الحل|A)\s*[:：/\-]\s*(.+)$/); if (m) { W.para(`**${m[1]}:** ${m[2]}`, S.body); break; } }
        if (S.term) {
          const m = b.s.match(/^([^:：،.]{2,38}?)\s*[:：]\s+(.+)$/);
          if (m && m[1].split(/\s+/).length <= 5 && !/\*\*/.test(m[1])) { W.para(`**${m[1]}:** ${m[2]}`, S.body); break; }
        }
        W.para(b.s, S.body);
      }
    }
    prev = b;
  });
  return prev;
}

/* ---------- الرسم ---------- */
const IMG = new Map();
function loadImages(srcs) {
  return Promise.all([...srcs].map((src) => {
    if (IMG.has(src)) return IMG.get(src).p;
    const im = new Image(); const p = new Promise((r) => { im.onload = () => r(); im.onerror = () => r(); });
    im.src = src; IMG.set(src, { im, p }); return p;
  }));
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); if (ctx.roundRect && r) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
function draw(ctx, page, sc, mark) {
  ctx.setTransform(sc, 0, 0, sc, 0, 0);
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, PW, PH);
  ctx.textBaseline = "alphabetic";
  for (const o of page.ops) {
    switch (o.k) {
      case "t": ctx.font = o.f; ctx.fillStyle = o.c; ctx.direction = o.d; ctx.textAlign = o.a; ctx.fillText(o.s, o.x, o.y); break;
      case "l": ctx.strokeStyle = o.c; ctx.lineWidth = o.w; ctx.setLineDash(o.dash || []); ctx.beginPath(); ctx.moveTo(o.x1, o.y1); ctx.lineTo(o.x2, o.y2); ctx.stroke(); ctx.setLineDash([]); break;
      case "r": ctx.strokeStyle = o.c; ctx.lineWidth = o.lw; rr(ctx, o.x, o.y, o.w, o.h, o.r); ctx.stroke(); break;
      case "f": ctx.fillStyle = o.c; rr(ctx, o.x, o.y, o.w, o.h, o.r); ctx.fill(); break;
      case "d": ctx.fillStyle = o.c || "#8C8C8C"; for (let x = o.x2; x > o.x1; x -= 4.2) { ctx.beginPath(); ctx.arc(x, o.y, .65, 0, 7); ctx.fill(); } break;
      case "i": {
        const e = IMG.get(o.src); if (!e || !e.im.complete || !e.im.naturalWidth) break;
        const im = e.im, r = Math.min(o.w / im.naturalWidth, o.h / im.naturalHeight);
        let w = im.naturalWidth * r, h = im.naturalHeight * r, x = o.x + (o.w - w) / 2, y = o.y + (o.h - h) / 2;
        ctx.save();
        if (o.round) {   // صورة شخصية دائرية: نقص الصورة لتملأ الدائرة
          const R = Math.max(o.w / im.naturalWidth, o.h / im.naturalHeight); w = im.naturalWidth * R; h = im.naturalHeight * R; x = o.x + (o.w - w) / 2; y = o.y + (o.h - h) / 2;
          ctx.beginPath(); ctx.arc(o.x + o.w / 2, o.y + o.h / 2, Math.min(o.w, o.h) / 2, 0, 7); ctx.clip();
        }
        ctx.drawImage(im, x, y, w, h); ctx.restore(); break;
      }
    }
  }
  if (mark) {
    ctx.save(); ctx.translate(PW / 2, PH / 2); ctx.rotate(-Math.PI / 6);
    ctx.font = "700 26px TPlex, sans-serif"; ctx.fillStyle = "rgba(10,107,116,.085)"; ctx.textAlign = "center"; ctx.direction = "rtl";
    for (let y = -600, r = 0; y <= 600; y += 112, r++) for (let x = -560 + (r % 2 ? 140 : 0); x <= 560; x += 280) ctx.fillText("معاينة · طابعتي", x, y);
    ctx.restore();
  }
}

/* ---------- ملف PDF: كل صفحة صورة بدقة طباعة، بدون مكتبات ---------- */
async function pdf(pages, dpi = 200, onProgress) {
  const sc = dpi / 72, enc = new TextEncoder(), parts = [], offs = []; let len = 0;
  const push = (x) => { const b = typeof x === "string" ? enc.encode(x) : x; parts.push(b); len += b.length; };
  const c = document.createElement("canvas"); c.width = Math.round(PW * sc); c.height = Math.round(PH * sc);
  const ctx = c.getContext("2d");
  push(new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 226, 227, 207, 211, 10]));
  const obj = (n, body) => { offs[n] = len; push(`${n} 0 obj\n`); body.forEach(push); push("\nendobj\n"); };
  const N = pages.length;
  obj(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  obj(2, [`<< /Type /Pages /Count ${N} /Kids [${pages.map((_, i) => `${3 + 3 * i} 0 R`).join(" ")}] >>`]);
  for (let i = 0; i < N; i++) {
    draw(ctx, pages[i], sc, false);
    const jpg = new Uint8Array(await (await new Promise((r) => c.toBlob(r, "image/jpeg", .9))).arrayBuffer());
    const pg = 3 + 3 * i, ct = pg + 1, im = pg + 2, cs = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
    obj(pg, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${im} 0 R >> >> /Contents ${ct} 0 R >>`]);
    obj(ct, [`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`]);
    obj(im, [`<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`, jpg, "\nendstream"]);
    onProgress?.((i + 1) / N);
    await new Promise((r) => setTimeout(r, 0));
  }
  const xref = len, total = 3 + 3 * N;
  let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let n = 1; n < total; n++) x += String(offs[n]).padStart(10, "0") + " 00000 n \n";
  push(x + `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts, { type: "application/pdf" });
}

/* ---------- الخطوط ---------- */
const FONT_FILES = { TNaskh: "naskh", TAmiri: "amiri", TPlex: "plex" };
const loaded = {};
function loadFont(fam) {
  const key = FAMS[fam] || fam;
  if (!loaded[key]) loaded[key] = Promise.all([400, 700].map(async (w) => {
    const ff = new FontFace(key, `url(/assets/fonts/${FONT_FILES[key]}-${w}.woff)`, { weight: String(w) });
    await ff.load(); document.fonts.add(ff);
  })).then(() => MEM.clear()).catch((e) => { console.warn("font", key, e); });
  return loaded[key];
}

window.TF = { PW, PH, fontOf, mw, tokens, blocks, clean, splitSections, Writer, flow, draw, pdf, loadImages, loadFont, tdir };
})();
