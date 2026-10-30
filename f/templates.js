/* طابعتي — القوالب والأشكال
   كل قالب = بيانات + أقسام + دالة بناء. كل شكل (كلاسيكي/عصري/هادئ) يغيّر الغلاف والعناوين والترقيم.
   كل شي بالأسود والرمادي عشان يطلع مرتب على طابعات الأبيض والأسود. */
(function () {
"use strict";
const { PW, PH, fontOf, mw, blocks, flow, Writer, tokens } = window.TF;
const INK = "#141414", SOFT = "#5A5A5A", RULE = "#9A9A9A", FILL = "#EFEFEF";

/* ================= الأشكال ================= */
const THEMES = {
  classic: { name: "كلاسيكي", desc: "إطار رسمي وخط نسخ" },
  modern: { name: "عصري", desc: "عناوين عريضة وشريط جانبي" },
  calm: { name: "هادئ", desc: "مساحات واسعة وبساطة" },
};
const FONTS = {
  naskh: { name: "نسخ", desc: "رسمي وواضح" },
  amiri: { name: "أميري", desc: "تقليدي أنيق" },
  plex: { name: "حديث", desc: "عصري ومريح" },
};
const LH = { naskh: 1.55, amiri: 1.62, plex: 1.5 };
const SPACING = { "1": 1, "1.5": 1.22, "2": 1.55 };

function styles(D, opt = {}) {
  const th = D.theme, fam = opt.fam || D.font, size = +D.size;
  const head = opt.headFam || (th === "classic" ? fam : "plex");
  const lh = LH[fam] * (SPACING[D.spacing] || 1.22);
  const body = { fam, size, lh, align: opt.align || "justify", after: size * .42, c: INK };
  const S = { body, gap: size * .3, li: { after: size * .18 }, table: { headBg: FILL, border: "#8C8C8C" },
    quote: { bg: "#F1F1F1", bar: true, barW: 2.6, barGap: 12, indent: 16, indentEnd: 10, align: "start", before: 4, after: size * .6 },
    term: !!opt.term, qa: !!opt.qa, head };
  S.h3 = (W, s) => W.para(s, { fam: head, size: size + 1, bold: true, lh: 1.55, align: "start", before: size * .35, after: 1, keepAfter: size * 3.5, c: th === "calm" ? "#2A2A2A" : INK });
  S.h2 = (W, s) => heading(W, s, D, S, 0);
  return S;
}

// عنوان القسم حسب الشكل
function heading(W, s, D, S, big) {
  const th = D.theme, size = S.body.size + (big || 0), head = S.head;
  if (W.y > W.M.t + 4) W.y += size * .7;
  if (th === "classic") {
    W.para(s, { fam: head, size: size + 5, bold: true, lh: 1.55, align: "start", after: 1, keepAfter: size * 4 });
    W.line(W.sx(0), W.y + 1, W.sx(48), W.y + 1, 1.6); W.y += size * .7;
  } else if (th === "modern") {
    W.para(s, { fam: "plex", size: size + 4, bold: true, lh: 1.5, align: "start", indent: 13, bar: true, barW: 4.5, barGap: 13, after: size * .5, keepAfter: size * 4 });
  } else {
    W.para(s, { fam: "plex", size: size + 3, bold: true, lh: 1.5, align: "start", after: 3, keepAfter: size * 4, c: "#222" });
    W.line(W.x0, W.y + 1, W.x1, W.y + 1, .6, "#C9C9C9"); W.y += size * .65;
  }
}

const ORD = ["أولًا", "ثانيًا", "ثالثًا", "رابعًا", "خامسًا", "سادسًا", "سابعًا", "ثامنًا", "تاسعًا", "عاشرًا", "حادي عشر", "ثاني عشر"];
const isRefs = (h) => /المراجع|المصادر|references|bibliography/i.test(h || "");
const people = (D) => (D.people || []).filter((p) => (p.n || "").trim() || (p.id || "").trim());
const v = (D, k) => (D.f[k] || "").trim();
const teacher = (D) => v(D, "teacher").replace(/^(د\.|أ\.|أ\.د\.)\s*$/, "");

/* ================= الأغلفة ================= */
function cover(W, D, kind) {
  W.p.kind = "cover";
  const th = D.theme, fam = D.font, title = v(D, "title") || "العنوان", ps = people(D), tch = teacher(D);
  const info = [];
  const generic = D.tpl === "report" || D.tpl === "general";
  if (ps.length === 1) { info.push([generic ? "إعداد" : "إعداد الطالب/ـة", ps[0].n]); if (ps[0].id) info.push([generic ? "الرقم" : "الرقم الجامعي", ps[0].id]); }
  if (tch) info.push([D.tpl === "report" ? "مقدَّم إلى" : "إشراف", tch]);
  const T = (s, x, y, size, o = {}) => W.text(s, x, y, fontOf(o.fam || fam, size, !!o.b), { a: o.a, c: o.c || INK });
  const cx = PW / 2;

  if (th === "classic") {
    W.rect(26, 26, PW - 52, PH - 52, 1.8); W.rect(31.5, 31.5, PW - 63, PH - 63, .5);
    let y = 76;
    ["المملكة العربية السعودية", "وزارة التعليم", v(D, "uni"), v(D, "college")].filter(Boolean).forEach((s, i) => { T(s, PW - 64, y, i < 2 ? 12.5 : 13.5, { b: 1 }); y += 21; });
    if (D.logo) W.image(D.logo, 60, 56, 96, 96);
    W.y = 286;
    W.para(kind, { fam, size: 15, lh: 1.6, align: "center", c: SOFT, after: 6 });
    W.para(title, { fam, size: 26, bold: true, lh: 1.5, align: "center", after: 8 });
    if (v(D, "course")) W.para(`مقرر: ${v(D, "course")}`, { fam, size: 14, lh: 1.6, align: "center", c: SOFT });
    W.line(cx - 34, W.y + 16, cx + 34, W.y + 16, 1); W.line(cx - 14, W.y + 20, cx + 14, W.y + 20, 1);
    coverInfo(W, D, info, ps, { y: Math.max(W.y + 70, 520), fam, center: true });
    if (v(D, "term")) T(v(D, "term"), cx, PH - 74, 13, { a: "center", c: SOFT });
  } else if (th === "modern") {
    let y = 84;
    if (v(D, "uni")) { T(v(D, "uni"), W.x1, y, 13, { b: 1, fam: "plex" }); y += 20; }
    if (v(D, "college")) T(v(D, "college"), W.x1, y, 11.5, { fam: "plex", c: SOFT });
    if (D.logo) W.image(D.logo, W.x0, 52, 74, 74);
    W.line(W.x0, 140, W.x1, 140, .6, RULE);
    W.y = 262;
    W.para(kind.replace(/ (بعنوان|عن)$/, ""), { fam: "plex", size: 13, lh: 1.6, align: "start", c: SOFT, indent: 22, after: 2 });
    W.para(title, { fam: "plex", size: 31, bold: true, lh: 1.35, align: "start", indent: 22, bar: true, barW: 6, barGap: 22, after: 10 });
    if (v(D, "course")) W.para(v(D, "course"), { fam: "plex", size: 14, lh: 1.6, align: "start", indent: 22, c: SOFT });
    coverInfo(W, D, info, ps, { y: Math.max(W.y + 80, 540), fam: "plex", grid: true });
    W.line(W.x0, PH - 96, W.x1, PH - 96, .6, RULE);
    if (v(D, "term")) T(v(D, "term"), W.x1, PH - 74, 12, { fam: "plex", c: SOFT });
  } else {
    let y = 92;
    if (D.logo) { W.image(D.logo, cx - 40, 64, 80, 80); y = 168; }
    if (v(D, "uni")) { T(v(D, "uni"), cx, y, 12.5, { a: "center", fam: "plex", c: "#333" }); y += 19; }
    if (v(D, "college")) T(v(D, "college"), cx, y, 11, { a: "center", fam: "plex", c: SOFT });
    W.y = 318;
    W.para(kind.replace(/ (بعنوان|عن)$/, ""), { fam: "plex", size: 12, lh: 1.6, align: "center", c: SOFT, after: 6 });
    W.para(title, { fam: "plex", size: 27, bold: true, lh: 1.45, align: "center", after: 4 });
    if (v(D, "course")) W.para(v(D, "course"), { fam: "plex", size: 13, lh: 1.6, align: "center", c: SOFT });
    W.line(cx - 22, W.y + 18, cx + 22, W.y + 18, .8, INK);
    coverInfo(W, D, info, ps, { y: Math.max(W.y + 70, 540), fam: "plex", stacked: true });
    if (v(D, "term")) T(v(D, "term"), cx, PH - 70, 11.5, { a: "center", fam: "plex", c: SOFT });
  }
}

// بيانات الغلاف: طالب واحد = سطور «الاسم/الرقم»، أكثر من طالب = جدول صغير
function coverInfo(W, D, info, ps, o) {
  const fam = o.fam, cx = PW / 2;
  const fl = fontOf(fam, 13.5, true), fv = fontOf(fam, 13.5, false);
  let y = o.y;
  const groupRows = ps.length > 1 ? ps : [];
  const tch = teacher(D);
  const block = (ps.length > 1 ? 34 + groupRows.length * 22 : 0) + info.length * 28;
  y = Math.min(y, PH - 120 - block);
  if (o.grid) {
    // عصري: عنوان صغير رمادي وتحته القيمة
    const items = ps.length > 1 ? [[D.tpl === "report" ? "إعداد" : "إعداد الطلاب", ps.map((p) => p.n + (p.id ? `  ·  ${p.id}` : ""))]] : info.map(([l, val]) => [l, [val]]);
    if (ps.length > 1 && tch) items.push(["إشراف", [tch]]);
    const colW = W.cw / 2; let col = 0, rowY = y, maxY = y;
    items.forEach(([l, vals]) => {
      const x = W.x1 - col * colW;
      W.text(l, x, rowY, fontOf(fam, 10.5, false), { c: SOFT });
      vals.forEach((val, i) => W.text(val, x, rowY + 20 + i * 19, fontOf(fam, 13, true)));
      maxY = Math.max(maxY, rowY + 20 + vals.length * 19);
      if (vals.length > 1) { col = 0; rowY = maxY + 14; } else if (++col > 1) { col = 0; rowY = maxY + 14; }
    });
    return;
  }
  if (o.stacked) {
    const items = ps.length > 1 ? [["إعداد", ps.map((p) => [p.n, p.id])]] : ps.length ? [["إعداد", [[ps[0].n, ps[0].id]]]] : [];
    if (tch) items.push([D.tpl === "report" ? "مقدَّم إلى" : "إشراف", [[tch, ""]]]);
    items.forEach(([l, rows]) => {
      W.text(l, cx, y, fontOf(fam, 10.5, false), { a: "center", c: SOFT }); y += 21;
      rows.forEach(([n, id]) => { W.text(n + (id ? `   ${id}` : ""), cx, y, fontOf(fam, 13.5, true), { a: "center" }); y += 20; });
      y += 12;
    });
    return;
  }
  // كلاسيكي: «التسمية: القيمة» في عمود متوسّط
  if (ps.length > 1) {
    W.text(D.tpl === "report" ? "إعداد:" : "إعداد الطلاب:", cx, y, fl, { a: "center" }); y += 14;
    const nW = Math.max(150, ...ps.map((p) => mw(fv, p.n))), iW = Math.max(80, ...ps.map((p) => mw(fv, p.id || ""))) + 16;
    const tw = nW + iW + 24, x1 = cx + tw / 2;
    ps.forEach((p, i) => {
      const top = y + i * 22;
      if (i % 2 === 0) W.fill(x1 - tw, top, tw, 22, "#F2F2F2");
      W.text(p.n, x1 - 8, top + 15.5, fv); W.text(p.id || "", x1 - tw + 8, top + 15.5, fv, { a: "left", d: "ltr" });
    });
    W.rect(x1 - tw, y, tw, ps.length * 22, .5, RULE);
    y += ps.length * 22 + 28;
    if (tch) { const r = [["إشراف", tch]]; info = r; } else info = [];
  }
  const lw = Math.max(0, ...info.map((r) => mw(fl, r[0] + ":"))), vw = Math.max(110, ...info.map((r) => mw(fv, r[1])));
  const x1 = cx + (lw + 16 + vw) / 2;
  info.forEach(([l, val]) => { W.text(l + ":", x1, y, fl); W.text(val, x1 - lw - 16, y, fv); y += 28; });
}

/* ================= الفهرس ================= */
function tocPage(W, D, S, pageOf) {
  W.newPage("toc");
  const th = D.theme, size = +D.size, fam = S.head;
  W.para("فهرس المحتويات", { fam, size: 21, bold: true, lh: 1.5, align: th === "modern" ? "start" : "center", after: 22, ...(th === "modern" ? { indent: 13, bar: true, barW: 4.5, barGap: 13 } : {}) });
  const fe = fontOf(D.font, size, false), fh = fontOf(D.font, size, true), lh = size * 2.15;
  D._secs.forEach((s, i) => {
    if (!s.h.trim()) return;
    W.room(lh);
    const base = W.y + lh / 2 + size * .36, t = secTitle(D, i), n = pageOf[i] != null ? String(pageOf[i]) : "";
    W.text(t, W.x1, base, fh);
    W.text(n, W.x0, base, fe, { a: "left", d: "ltr" });
    const a = W.x0 + mw(fe, n) + 8, b = W.x1 - mw(fh, t) - 8;
    if (b > a) W.p.ops.push({ k: "d", x1: a, x2: b, y: base - 2, c: "#9A9A9A" });
    W.y += lh;
  });
}
function secTitle(D, i) {
  const h = D._secs[i].h.trim();
  if (!D.opts.num || isRefs(h)) return h;
  const k = D._secs.slice(0, i + 1).filter((s) => s.h.trim() && !isRefs(s.h)).length - 1;
  return `${ORD[k] || k + 1}: ${h}`;
}

/* ================= الترويسة والتذييل ================= */
function decorate(W, D, o = {}) {
  const th = D.theme, body = W.pages.filter((p) => p.kind === "body"), N = body.length, mode = D.opts.pages || "center";
  const f = (s, b) => fontOf(o.fam || "plex", s, b);
  const title = o.title ?? v(D, "title");
  body.forEach((p, i) => {
    const n = String(i + 1), ops = p.ops;
    const T = (s, x, y, font, a, c, d) => ops.push({ k: "t", s, x, y, f: font, a, c: c || SOFT, d: d || (W.rtl ? "rtl" : "ltr") });
    if (o.header !== false && th === "classic" && title && W.rtl) {
      T(title.length > 70 ? title.slice(0, 68) + "…" : title, W.x1, 44, fontOf(D.font, 9.5, false), "right", "#6A6A6A", "rtl");
      ops.push({ k: "l", x1: W.x0, y1: 52, x2: W.x1, y2: 52, w: .5, c: RULE });
    }
    if (mode === "none" || (o.single && N === 1)) return;
    const label = mode === "xofy" ? (W.rtl ? `صفحة ${n} من ${N}` : `Page ${n} of ${N}`) : n;
    if (th === "modern") {
      ops.push({ k: "l", x1: W.x0, y1: PH - 54, x2: W.x1, y2: PH - 54, w: .5, c: RULE });
      T(label, W.rtl ? W.x0 : W.x1, PH - 38, f(10, true), W.rtl ? "left" : "right", INK);
      if (title && o.footTitle !== false) T(title.length > 60 ? title.slice(0, 58) + "…" : title, W.rtl ? W.x1 : W.x0, PH - 38, f(9.5), W.rtl ? "right" : "left");
    } else if (th === "calm") T(mode === "xofy" ? label : `— ${n} —`, PW / 2, PH - 38, f(10), "center");
    else T(label, PW / 2, PH - 38, fontOf(D.font, 11, false), "center", "#444");
  });
}

/* ================= بحث / تقرير / غلاف فقط ================= */
function buildAcademic(D, ctx) {
  const tpl = TPL[D.tpl];
  const W = new Writer({ rtl: true, margins: { t: 78, b: 80, l: 68, r: 68 } });
  const S = styles(D);
  cover(W, D, v(D, "kind") || tpl.kind);
  if (tpl.content === false) return W;
  if (D.opts.toc) tocPage(W, D, S, ctx.pageOf || {});
  W.newPage();
  const marks = {};
  D._secs.forEach((s, i) => {
    const bl = blocks(s.t, { clean: D.opts.clean });
    if (s.h.trim()) { S.h2(W, secTitle(D, i)); marks[i] = W.pages.length - 1; }
    else marks[i] = W.pages.length - 1;
    if (isRefs(s.h)) {
      let n = 0;
      bl.forEach((b) => {
        if (b.k === "gap") return;
        if (b.k === "h2" || b.k === "h3") return S.h3(W, b.s);
        n++; W.para(b.s, { ...S.body, size: S.body.size - 1, align: "start", indent: 24, label: `${n}.`, labelAt: 0, after: 5 });
      });
    } else flow(W, bl, S);
  });
  decorate(W, D, {});
  W.marks = marks;
  return W;
}

/* ================= واجب ================= */
function buildHomework(D) {
  const W = new Writer({ rtl: true, margins: { t: 60, b: 72, l: 64, r: 64 } });
  const S = styles(D, { qa: true });
  const th = D.theme, ps = people(D), fam = th === "classic" ? D.font : "plex";
  const name = ps.map((p) => p.n).filter(Boolean).join("، "), sid = ps.map((p) => p.id).filter(Boolean).join("، ");
  const cells = [["الاسم", name], ["الرقم الجامعي", sid], ["المقرر", v(D, "course")], ["الأستاذ", teacher(D)]];
  const fb = fontOf(fam, 11.5, true), fr = fontOf(fam, 11.5, false);
  if (th === "classic") {
    const top = 56, h = 62, mid = PW / 2;
    W.rect(W.x0, top, W.cw, h, .9);
    W.line(mid, top + 8, mid, top + h - 8, .5, RULE);
    const cell = (l, val, x, y) => { W.text(l + ":", x, y, fb); W.text(val || "—", x - mw(fb, l + ":") - 6, y, fr); };
    cell(...cells[0], W.x1 - 12, top + 24); cell(...cells[1], W.x1 - 12, top + 46);
    cell(...cells[2], mid - 12, top + 24); cell(...cells[3], mid - 12, top + 46);
    W.y = top + h + 20;
    W.para(v(D, "title") || "الواجب", { fam, size: 20, bold: true, lh: 1.5, align: "center", after: 0 });
    if (v(D, "term")) W.para(`تاريخ التسليم: ${v(D, "term")}`, { fam, size: 11, lh: 1.5, align: "center", c: SOFT });
    W.y += 8; W.line(W.x0, W.y, W.x1, W.y, .6, RULE); W.y += 14;
  } else if (th === "modern") {
    W.y = 52;
    W.para(v(D, "title") || "الواجب", { fam: "plex", size: 22, bold: true, lh: 1.4, align: "start", indent: 13, bar: true, barW: 5, barGap: 13, after: 0 });
    const sub = [v(D, "course"), v(D, "term") ? `التسليم: ${v(D, "term")}` : ""].filter(Boolean).join("  ·  ");
    if (sub) W.para(sub, { fam: "plex", size: 11.5, lh: 1.5, align: "start", indent: 13, c: SOFT });
    W.y += 10;
    const items = cells.filter((c) => c[1]); const cw = W.cw / Math.max(1, items.length), top = W.y;
    W.fill(W.x0, top, W.cw, 46, "#F1F1F1", 6);
    items.forEach(([l, val], i) => {
      const x = W.x1 - i * cw - 12;
      W.text(l, x, top + 17, fontOf("plex", 9.5, false), { c: SOFT });
      let t = val; const fv = fontOf("plex", 11.5, true); while (mw(fv, t) > cw - 20 && t.length > 3) t = t.slice(0, -2) + "…";
      W.text(t, x, top + 35, fv);
      if (i) W.line(x + 12, top + 10, x + 12, top + 36, .5, "#C9C9C9");
    });
    W.y = top + 46 + 22;
  } else {
    W.y = 54;
    W.para(v(D, "title") || "الواجب", { fam: "plex", size: 21, bold: true, lh: 1.4, align: "center", after: 2 });
    const line = [name, sid, v(D, "course"), teacher(D), v(D, "term")].filter(Boolean).join("   ·   ");
    if (line) W.para(line, { fam: "plex", size: 10.5, lh: 1.6, align: "center", c: SOFT });
    W.y += 10; W.line(PW / 2 - 30, W.y, PW / 2 + 30, W.y, .8); W.y += 18;
  }
  D._secs.forEach((s) => {
    const bl = blocks(s.t, { clean: D.opts.clean });
    if (s.h.trim()) {
      if (W.y > W.M.t + 120) W.y += S.body.size * .5;
      if (th === "classic") W.para(s.h, { fam, size: S.body.size + 2, bold: true, lh: 1.5, align: "start", after: 2, keepAfter: S.body.size * 4 });
      else if (th === "modern") { const top = W.y; W.para(s.h, { fam: "plex", size: S.body.size + 1.5, bold: true, lh: 1.6, align: "start", indent: 10, bg: "#F1F1F1", bgPad: 0, after: 6, keepAfter: S.body.size * 4 }); }
      else W.para(s.h, { fam: "plex", size: S.body.size + 1.5, bold: true, lh: 1.5, align: "start", after: 2, keepAfter: S.body.size * 4 });
    }
    flow(W, bl, S);
  });
  decorate(W, D, { header: false, footTitle: false, single: true });
  return W;
}

/* ================= ملخص مذاكرة ================= */
function buildSummary(D) {
  const W = new Writer({ rtl: true, margins: { t: 56, b: 66, l: 56, r: 56 } });
  const S = styles(D, { term: true });
  const th = D.theme, ps = people(D);
  const sub = [v(D, "course"), ps[0]?.n].filter(Boolean).join("  ·  ");
  if (th === "modern") {
    W.y = 48;
    W.para(v(D, "title") || "ملخص", { fam: "plex", size: 24, bold: true, lh: 1.35, align: "start", indent: 14, bar: true, barW: 6, barGap: 14 });
    if (sub) W.para(sub, { fam: "plex", size: 11.5, lh: 1.6, align: "start", indent: 14, c: SOFT });
    W.y += 12;
  } else if (th === "classic") {
    W.y = 46;
    W.para(v(D, "title") || "ملخص", { fam: D.font, size: 23, bold: true, lh: 1.5, align: "center" });
    if (sub) W.para(sub, { fam: D.font, size: 12, lh: 1.5, align: "center", c: SOFT });
    W.y += 6; W.line(W.x0, W.y, W.x1, W.y, 1.4); W.line(W.x0, W.y + 3, W.x1, W.y + 3, .5); W.y += 18;
  } else {
    W.y = 50;
    W.para(v(D, "title") || "ملخص", { fam: "plex", size: 23, bold: true, lh: 1.4, align: "center" });
    if (sub) W.para(sub, { fam: "plex", size: 11, lh: 1.6, align: "center", c: SOFT });
    W.y += 16;
  }
  D._secs.forEach((s) => { const bl = blocks(s.t, { clean: D.opts.clean }); if (s.h.trim()) S.h2(W, s.h.trim()); flow(W, bl, S); });
  decorate(W, D, { header: false, title: v(D, "title"), single: true });
  return W;
}

/* ================= خطاب رسمي ================= */
function buildLetter(D) {
  const W = new Writer({ rtl: true, margins: { t: 60, b: 72, l: 68, r: 68 } });
  const S = styles(D);
  const th = D.theme, fam = D.font, hf = th === "classic" ? fam : "plex";
  // الترويسة
  let y = 74;
  if (v(D, "org")) { W.text(v(D, "org"), W.x1, y, fontOf(hf, 15, true)); y += 21; }
  if (v(D, "dept")) W.text(v(D, "dept"), W.x1, y, fontOf(hf, 11.5, false), { c: SOFT });
  if (D.logo) W.image(D.logo, W.x0, 40, 76, 76);
  if (th === "classic") { W.line(W.x0, 126, W.x1, 126, 1.6); W.line(W.x0, 130, W.x1, 130, .5); }
  else if (th === "modern") W.fill(W.x0, 124, W.cw, 5, INK);
  else W.line(W.x0, 126, W.x1, 126, .6, RULE);
  // التاريخ والرقم يسار
  const meta = [["التاريخ", v(D, "date")], ["الرقم", v(D, "ref")], ["المرفقات", v(D, "att")]].filter((r) => r[1]);
  const fm = fontOf(hf, 11, false); let my = 154;
  meta.forEach(([l, val]) => { W.text(`${l}: ${val}`, W.x0, my, fm, { a: "left", d: "rtl", c: "#333" }); my += 18; });
  W.y = Math.max(168, my - 6);
  // المرسل إليه
  const fb = fontOf(fam, +D.size + 1, true);
  if (v(D, "to")) {
    W.room(40); const base = W.y + 20;
    W.text(`${v(D, "salute") || "سعادة"} / ${v(D, "to")}`, W.x1, base, fb);
    W.text(v(D, "honor") || "المحترم", W.x0, base, fb, { a: "left", d: "rtl" });
    W.y += 34;
  }
  if (D.opts.greet !== false) W.para("السلام عليكم ورحمة الله وبركاته، وبعد:", { ...S.body, align: "start", after: 8 });
  if (v(D, "subject")) {
    W.para(`الموضوع: ${v(D, "subject")}`, { fam, size: +D.size + 1, bold: true, lh: 1.6, align: "center", after: 10 });
  }
  D._secs.forEach((s) => { if (s.h.trim()) S.h3(W, s.h.trim()); flow(W, blocks(s.t, { clean: D.opts.clean }), S); });
  W.y += 10;
  W.para(v(D, "closing") || "وتقبلوا وافر التحية والتقدير،", { ...S.body, align: "center", after: 24 });
  // التوقيع يسار
  const sw = 200, sx = W.x0 + sw / 2, rows = [[v(D, "signerTitle"), true], [v(D, "signer"), false]].filter((r) => r[0]);
  W.room(rows.length * 22 + 50);
  let sy = W.y + 14;
  rows.forEach(([t, b]) => { W.text(t, sx, sy, fontOf(fam, +D.size, b), { a: "center" }); sy += 22; });
  W.text("التوقيع:", sx + sw / 2 - 30, sy + 18, fontOf(fam, 11.5, false), { a: "right", c: SOFT });
  W.line(sx - sw / 2 + 20, sy + 20, sx + sw / 2 - 80, sy + 20, .6, RULE, [2, 3]);
  W.y = sy + 30;
  decorate(W, D, { header: false, single: true, footTitle: false });
  return W;
}

/* ================= السيرة الذاتية (عربي / إنجليزي) ================= */
function buildCV(D) {
  const rtl = TPL[D.tpl].rtl, th = D.theme;
  const fam = rtl ? D.font : "plex", hf = rtl && th === "classic" ? fam : "plex";
  const W = new Writer({ rtl, margins: { t: 46, b: 50, l: 50, r: 50 } });
  const size = +D.size;
  const S = styles(D, { fam, headFam: hf, term: true, align: "start" });
  S.body.lh = LH[fam] * (rtl ? 1 : .98); S.body.after = size * .25;
  S.li = { after: size * .1, indent: 14 };
  // الرأس
  const photo = D.photo, ph = 76;
  const indE = photo ? ph + 18 : 0;
  if (photo) W.image(photo, rtl ? W.x0 : W.x1 - ph, W.M.t - 4, ph, ph, true);
  const name = v(D, "name") || (rtl ? "اسمك الكامل" : "Your Name");
  W.para(name, { fam: hf, size: 25, bold: true, lh: 1.3, align: th === "calm" && !photo ? "center" : "start", indentEnd: indE });
  if (v(D, "headline")) W.para(v(D, "headline"), { fam: hf, size: size + 2.5, lh: 1.5, c: SOFT, align: th === "calm" && !photo ? "center" : "start", indentEnd: indE });
  const contact = ["phone", "email", "city", "link"].map((k) => v(D, k)).filter(Boolean);
  if (contact.length) {
    const tk = []; contact.forEach((c, i) => { if (i) tk.push({ s: "·", b: false, d: "n" }); tokens(c).forEach((t) => tk.push(t)); });
    W.para(tk, { fam: "plex", size: size - .5, lh: 1.6, c: "#3A3A3A", align: th === "calm" && !photo ? "center" : "start", indentEnd: indE });
  }
  W.y = Math.max(W.y, photo ? W.M.t + ph + 2 : 0) + 6;
  if (th === "modern") W.fill(W.x0, W.y, W.cw, 3, INK); else if (th === "classic") { W.line(W.x0, W.y, W.x1, W.y, 1.3); W.line(W.x0, W.y + 3, W.x1, W.y + 3, .4); } else W.line(W.x0, W.y, W.x1, W.y, .6, RULE);
  W.y += 14;
  const secHead = (s) => {
    W.y += size * .55;
    if (th === "modern") W.para(rtl ? s : s.toUpperCase(), { fam: "plex", size: size + 1.5, bold: true, lh: 1.5, align: "start", indent: 11, bar: true, barW: 4, barGap: 11, after: 3, keepAfter: size * 4 });
    else if (th === "classic") { W.para(rtl ? s : s.toUpperCase(), { fam: hf, size: size + 2, bold: true, lh: 1.5, align: "start", after: 0, keepAfter: size * 4 }); W.line(W.x0, W.y + 1, W.x1, W.y + 1, .5, RULE); W.y += 6; }
    else { W.para(rtl ? s : s.toUpperCase(), { fam: "plex", size: size + .5, bold: true, lh: 1.5, align: "start", c: SOFT, after: 2, keepAfter: size * 4 }); }
  };
  D._secs.forEach((s) => {
    const bl = blocks(s.t, { clean: D.opts.clean }); if (!s.h.trim() && !bl.length) return;
    if (s.h.trim()) secHead(s.h.trim());
    bl.forEach((b) => {
      const m = (b.k === "p" || b.k === "h3") && b.s.match(/^(.+?)\s+\|\s+(.+)$/);
      if (m || b.k === "h3") {
        const segs = (m ? b.s : b.s).split(/\s+\|\s+/), date = segs.length > 1 ? segs.pop() : "", title = segs.join(" — ");
        const fd = fontOf(fam, size - .5, false), lh = size * 1.75;
        W.room(lh * 2); W.y += 2;
        const dw = date ? mw(fd, date) + 14 : 0;
        if (date) W.text(date, W.ex(0), W.y + lh / 2 + size * .36, fd, { a: rtl ? "left" : "right", c: SOFT });
        W.para(`**${title}**`, { ...S.body, size: size + .5, align: "start", indentEnd: dw, after: 1 });
        return;
      }
      flow(W, [b], S);
    });
  });
  decorate(W, D, { header: false, single: true, footTitle: false });
  return W;
}


/* ================= مستند حر (الجوكر) ================= */
function buildGeneral(D) {
  const W = new Writer({ rtl: true, margins: { t: 72, b: 78, l: 66, r: 66 } });
  const S = styles(D), th = D.theme;
  const title = v(D, "title"), sub = v(D, "subtitle"), meta = [v(D, "author"), v(D, "date")].filter(Boolean).join("   ·   ");
  if (D.opts.cover) {
    const Dc = { ...D, tpl: "general", f: { ...D.f, kind: sub, term: v(D, "date"), uni: v(D, "org"), college: "", course: "", teacher: "" }, people: v(D, "author") ? [{ n: v(D, "author"), id: "" }] : [] };
    cover(W, Dc, sub || " ");
    W.newPage();
  } else {
    const fam = th === "classic" ? D.font : "plex";
    if (D.logo) { W.image(D.logo, th === "calm" ? PW / 2 - 28 : W.x0, 40, 56, 56); }
    if (v(D, "org")) W.text(v(D, "org"), th === "calm" ? PW / 2 : W.x1, 58, fontOf(fam, 11.5, true), { a: th === "calm" ? "center" : "right", c: SOFT });
    W.y = D.logo || v(D, "org") ? (th === "calm" ? 112 : 92) : 64;
    const al = th === "calm" || th === "classic" ? "center" : "start";
    if (title) W.para(title, { fam, size: 24, bold: true, lh: 1.4, align: al, after: 2, ...(th === "modern" ? { indent: 14, bar: true, barW: 6, barGap: 14 } : {}) });
    if (sub) W.para(sub, { fam, size: 13.5, lh: 1.6, align: al, c: SOFT, ...(th === "modern" ? { indent: 14 } : {}) });
    if (meta) W.para(meta, { fam, size: 11, lh: 1.7, align: al, c: SOFT, ...(th === "modern" ? { indent: 14 } : {}) });
    W.y += 8;
    if (title || sub) {
      if (th === "classic") { W.line(W.x0, W.y, W.x1, W.y, 1.4); W.line(W.x0, W.y + 3, W.x1, W.y + 3, .5); W.y += 16; }
      else if (th === "calm") { W.line(PW / 2 - 24, W.y, PW / 2 + 24, W.y, .8); W.y += 18; }
      else W.y += 8;
    }
  }
  D._secs.forEach((s) => { const bl = blocks(s.t, { clean: D.opts.clean }); if (s.h.trim()) S.h2(W, s.h.trim()); flow(W, bl, S); });
  decorate(W, D, { header: false, title, single: true });
  return W;
}

/* ================= إعلان (صفحة وحدة) ================= */
function buildPoster(D) {
  const W = new Writer({ rtl: true, margins: { t: 60, b: 60, l: 60, r: 60 } });
  const th = D.theme, fam = th === "classic" ? D.font : "plex", cx = PW / 2, size = +D.size;
  if (th === "classic") { W.rect(24, 24, PW - 48, PH - 48, 2.2); W.rect(30, 30, PW - 60, PH - 60, .6); }
  if (th === "modern") W.fill(0, 0, PW, 14, INK);
  let y = 78;
  if (D.logo) { W.image(D.logo, cx - 42, 58, 84, 84); y = 170; }
  if (v(D, "org")) { W.text(v(D, "org"), cx, y, fontOf(fam, 14, true), { a: "center", c: "#333" }); y += 10; }
  W.y = Math.max(y + 40, 210);
  W.para(v(D, "title") || "عنوان الإعلان", { fam, size: 44, bold: true, lh: 1.3, align: "center", after: 10 });
  if (v(D, "subtitle")) W.para(v(D, "subtitle"), { fam, size: 19, lh: 1.5, align: "center", c: "#333", after: 6 });
  W.line(cx - 36, W.y + 14, cx + 36, W.y + 14, th === "calm" ? .8 : 2.2); W.y += 40;
  const body = { fam: D.font, size: size + 4, lh: LH[D.font] * 1.15, align: "center", after: size * .6, c: INK };
  D._secs.forEach((s) => { const bl = blocks(s.t, { clean: D.opts.clean }); flow(W, bl, { body, gap: size * .4, li: { align: "center" }, table: { headBg: FILL }, quote: { ...body, bold: true, bg: "#F1F1F1", bgPad: 0 }, term: true, head: fam }); });
  // تفاصيل: التاريخ والوقت والمكان
  const det = [["التاريخ", v(D, "date")], ["الوقت", v(D, "time")], ["المكان", v(D, "place")]].filter((r) => r[1]);
  if (det.length) {
    const rowH = 40, h = det.length * rowH + 20, top = Math.max(W.y + 20, PH - 110 - h - (v(D, "contact") ? 40 : 0));
    W.y = top;
    if (th === "modern") W.fill(W.x0, top, W.cw, h, "#F1F1F1", 10); else W.rect(W.x0 + 40, top, W.cw - 80, h, .8, th === "calm" ? "#C9C9C9" : INK, 10);
    det.forEach(([l, val], i) => {
      const by = top + 10 + i * rowH + rowH / 2 + 6;
      W.text(l, cx + 120, by, fontOf("plex", 13, false), { a: "right", c: SOFT });
      W.text(val, cx + 40, by, fontOf(fam, 17, true), { a: "right" });
    });
    W.y = top + h;
  }
  if (v(D, "contact")) W.text(v(D, "contact"), cx, PH - 74, fontOf("plex", 13, false), { a: "center", c: "#333" });
  return W;
}


/* ================= أدوات مشتركة للقوالب الجديدة ================= */
const lines = (t) => String(t || "").replace(/\r/g, "").split("\n").map((s) => s.trim()).filter(Boolean);
// كم سطر يحتاج النص في عرض معيّن
function countLines(text, fam, size, bold, width) {
  const f = fontOf(fam, size, bold), sp = mw(f, " ");
  let n = 1, w = 0;
  tokens(text).forEach((t) => { const tw = mw(t.b || bold ? fontOf(fam, size, true) : f, t.s); if (w && w + sp + tw > width) { n++; w = tw; } else w += (w ? sp : 0) + tw; });
  return n;
}
// نص داخل مربع: نصغّر الخط لين يدخل، ونوسّطه عموديًا
function boxText(W, text, x0, x1, top, h, st) {
  let size = st.size; const lh = st.lh || 1.45;
  while (size > (st.min || 8) && countLines(text, st.fam, size, st.bold, x1 - x0) * size * lh > h) size -= .5;
  const n = countLines(text, st.fam, size, st.bold, x1 - x0);
  const M = { ...W.M }; W.M.l = x0; W.M.r = W.pw - x1; W.M.b = 0;
  W.y = top + Math.max(0, (h - n * size * lh) / 2);
  W.para(text, { ...st, size, lh, align: st.align || "center", keepLines: 0 });
  W.M = M;
}
const cutLine = (W, x1, y1, x2, y2) => W.line(x1, y1, x2, y2, .6, "#9A9A9A", [4, 3]);

/* ================= شهادة شكر وتقدير (صفحة لكل اسم) ================= */
function buildCertificate(D) {
  const W = new Writer({ rtl: true, land: true, margins: { t: 50, b: 50, l: 60, r: 60 } });
  const th = D.theme, fam = th === "calm" ? "plex" : D.font, hf = th === "modern" ? "plex" : fam;
  const names = lines(v(D, "names")).slice(0, 300);
  const list = names.length ? names : ["الاسم"];
  const pw = W.pw, ph = W.ph, cx = pw / 2;
  list.forEach((name, i) => {
    if (i) W.newPage();
    if (th === "classic") {
      W.rect(18, 18, pw - 36, ph - 36, 3); W.rect(26, 26, pw - 52, ph - 52, .7);
      [[18, 18], [pw - 18, 18], [18, ph - 18], [pw - 18, ph - 18]].forEach(([x, y]) => { W.fill(x - 9, y - 9, 18, 18, INK); W.fill(x - 4, y - 4, 8, 8, "#fff"); });
    } else if (th === "modern") {
      W.fill(0, 0, 22, ph, INK); W.fill(pw - 22, 0, 22, ph, INK);
      W.fill(22, 0, 8, ph, "#DADADA"); W.fill(pw - 30, 0, 8, ph, "#DADADA");
    } else W.rect(30, 30, pw - 60, ph - 60, .6, "#BDBDBD", 4);
    let y = 78;
    if (D.logo) { W.image(D.logo, cx - 40, 50, 80, 80); y = 150; }
    if (v(D, "org")) { W.text(v(D, "org"), cx, y, fontOf(hf, 15, true), { a: "center", c: "#333" }); }
    W.y = y + (D.logo ? 22 : 40);
    W.para(v(D, "title") || "شهادة شكر وتقدير", { fam: hf, size: th === "calm" ? 40 : 46, bold: true, lh: 1.3, align: "center", after: 6 });
    W.line(cx - 56, W.y + 4, cx + 56, W.y + 4, th === "calm" ? .8 : 2); W.y += 34;
    const intro = v(D, "intro") || (v(D, "org") ? `يسرّ ${v(D, "org")} أن تتقدم بخالص الشكر والتقدير إلى` : "نتقدم بخالص الشكر والتقدير إلى");
    W.para(intro, { fam, size: 18, lh: 1.6, align: "center", c: "#333", after: 14 });
    W.para(name, { fam: hf, size: 36, bold: true, lh: 1.4, align: "center", after: 14 });
    if (v(D, "reason")) W.para(v(D, "reason"), { fam, size: 17, lh: 1.75, align: "center", c: "#333" });
    // التوقيعات
    const sig = [[v(D, "s1"), v(D, "s1t")], [v(D, "s2"), v(D, "s2t")]].filter((s) => s[0] || s[1]);
    const sy = ph - 112;
    sig.forEach(([n, t], k) => {
      const x = sig.length === 1 ? cx : k === 0 ? pw - 190 : 190;
      if (t) W.text(t, x, sy, fontOf(fam, 13, true), { a: "center" });
      if (n) W.text(n, x, sy + 22, fontOf(fam, 13, false), { a: "center", c: "#333" });
      W.line(x - 70, sy + 48, x + 70, sy + 48, .6, RULE, [2, 3]);
    });
    if (v(D, "date")) W.text(v(D, "date"), cx, ph - 60, fontOf(fam, 12, false), { a: "center", c: SOFT });
  });
  return W;
}

/* ================= ورقة عمل / اختبار ================= */
function buildWorksheet(D) {
  const W = new Writer({ rtl: true, margins: { t: 46, b: 64, l: 50, r: 50 } });
  const S = styles(D, { qa: false, align: "start" }), th = D.theme, size = +D.size, hf = th === "classic" ? D.font : "plex";
  // الرأس: الجهة يمين، الشعار يسار، والعنوان بالنص
  let y = 62;
  [v(D, "org"), v(D, "subject") ? `المادة: ${v(D, "subject")}` : "", v(D, "grade") ? `الصف: ${v(D, "grade")}` : ""].filter(Boolean).forEach((s, i) => { W.text(s, W.x1, y, fontOf(hf, i ? 11.5 : 12.5, !i), { c: i ? "#333" : INK }); y += 18; });
  let ly = 62;
  [v(D, "date") ? `التاريخ: ${v(D, "date")}` : "", v(D, "duration") ? `الزمن: ${v(D, "duration")}` : "", v(D, "teacher") ? `المعلم/ة: ${v(D, "teacher")}` : ""].filter(Boolean).forEach((s) => { W.text(s, W.x0, ly, fontOf(hf, 11.5, false), { a: "left", d: "rtl", c: "#333" }); ly += 18; });
  if (D.logo) W.image(D.logo, PW / 2 - 28, 36, 56, 56);
  W.y = Math.max(y, ly, D.logo ? 100 : 0) + 4;
  W.para(v(D, "title") || "ورقة عمل", { fam: hf, size: 19, bold: true, lh: 1.4, align: "center", after: 6 });
  // خانة الطالب
  const top = W.y, hBox = 34, total = v(D, "total");
  if (th === "modern") W.fill(W.x0, top, W.cw, hBox, "#F1F1F1", 6); else W.rect(W.x0, top, W.cw, hBox, .8, th === "calm" ? "#BDBDBD" : INK, 4);
  const fb = fontOf(hf, 12, true), base = top + 22;
  W.text("اسم الطالب/ـة:", W.x1 - 12, base, fb);
  W.line(W.x1 - 12 - mw(fb, "اسم الطالب/ـة:") - 6, base + 3, W.x0 + (total ? 170 : 110), base + 3, .6, "#9A9A9A", [2, 3]);
  if (total) {
    W.text("الدرجة:", W.x0 + 150, base, fb);
    W.rect(W.x0 + 46, top + 7, 50, 20, .7, INK, 3); W.text(`/ ${total}`, W.x0 + 40, base, fontOf(hf, 12, false), { a: "right", d: "rtl" });
  } else { W.text("الفصل:", W.x0 + 100, base, fb); W.line(W.x0 + 100 - mw(fb, "الفصل:") - 6, base + 3, W.x0 + 12, base + 3, .6, "#9A9A9A", [2, 3]); }
  W.y = top + hBox + 14;
  if (v(D, "instructions")) { W.para(v(D, "instructions"), { ...S.body, size: size - 1, c: "#333", align: "start", bg: "#F4F4F4", indent: 8, indentEnd: 8, after: 10 }); }
  // الأسئلة
  const OPT = /^(\(?[أبجدهو]\)|[أبجدهو][.)\-])\s*/;
  D._secs.forEach((s) => {
    const bl = blocks(s.t, { clean: D.opts.clean });
    if (s.h.trim()) {
      W.y += size * .5;
      if (th === "modern") W.para(s.h, { fam: "plex", size: size + 1.5, bold: true, lh: 1.6, align: "start", indent: 10, bg: "#EDEDED", after: 6, keepAfter: size * 4 });
      else { W.para(s.h, { fam: hf, size: size + 1.5, bold: true, lh: 1.55, align: "start", after: 3, keepAfter: size * 4 }); if (th === "classic") { W.line(W.sx(0), W.y, W.sx(60), W.y, 1.2); W.y += 6; } }
    }
    for (let i = 0; i < bl.length; i++) {
      const b = bl[i];
      // سطور فاضية للإجابة: [سطور 3] أو ____
      const m = b.k === "p" && b.s.match(/^\[(?:سطور|سطر|lines?)\s*([0-9٠-٩]*)\]$|^(?:_{3,}|\.{4,})$/);
      if (m) {
        const n = Math.min(20, +((m[1] || "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))) || 1), gap = size * 2.1;
        for (let k = 0; k < n; k++) { W.room(gap); W.y += gap; W.line(W.x0 + 4, W.y - 6, W.x1 - 22, W.y - 6, .5, "#9A9A9A", [1.5, 2.5]); }
        W.y += 6; continue;
      }
      // خيارات (أ) (ب) (ج) (د): نجمعها في سطر واحد لو تكفي
      if (b.k === "ol" && /^[أبجدهو]/.test(b.n)) {
        const opts = []; let j = i;
        while (j < bl.length && bl[j].k === "ol" && /^[أبجدهو]/.test(bl[j].n)) { opts.push(bl[j]); j++; }
        i = j - 1;
        const f = fontOf(S.body.fam, size, false), fb2 = fontOf(S.body.fam, size, true);
        const ws = opts.map((o) => mw(fb2, o.n + ")") + 8 + mw(f, o.s) + 24);
        const avail = W.cw - 26, perRow = ws.reduce((a, b2) => a + b2, 0) <= avail ? opts.length : Math.max(1, opts.length >= 4 && Math.max(...ws) * 2 <= avail ? 2 : 1);
        const colW = avail / perRow, lh = size * 2;
        for (let r = 0; r < opts.length; r += perRow) {
          W.room(lh); const by = W.y + lh / 2 + size * .36;
          opts.slice(r, r + perRow).forEach((o, k) => {
            const x = W.x1 - 26 - k * colW;
            W.rect(x - 11, by - size * .62, size * .72, size * .72, .7, INK, size * .36);
            W.text(`${o.n.replace(/[.)\-(]/g, "")})`, x - 16, by, fb2);
            W.text(o.s, x - 22 - mw(fb2, o.n.replace(/[.)\-(]/g, "") + ")"), by, f);
          });
          W.y += lh;
        }
        W.y += 4; continue;
      }
      if (b.k === "ol") { W.para(b.s, { ...S.body, align: "start", indent: 26, label: `${b.n}`, labelAt: 2, labelBold: true, before: size * .35, after: 2, keepAfter: size * 2 }); continue; }
      flow(W, [b], S);
    }
  });
  if (v(D, "end") !== "-") { W.y += 14; W.para(v(D, "end") || "انتهت الأسئلة، مع تمنياتي لك بالتوفيق", { fam: hf, size: size - 1, lh: 1.6, align: "center", c: SOFT }); }
  decorate(W, D, { header: false, footTitle: false, single: true });
  return W;
}

/* ================= بطاقات مراجعة (فلاش كاردز) ================= */
function buildFlashcards(D) {
  const W = new Writer({ rtl: true, margins: { t: 30, b: 30, l: 30, r: 30 } });
  const cards = lines(v(D, "cards")).map((l) => {
    const m = l.match(/^(.+?)\s*(?:\||؛|=|:)\s+(.+)$/) || l.match(/^(.+?)\s*[:：]\s*(.+)$/);
    return m ? [m[1].replace(/^(س|سؤال)\s*[:：]\s*/, ""), m[2].replace(/^(ج|جواب)\s*[:：]\s*/, "")] : [l, ""];
  });
  const list = cards.length ? cards : [["السؤال", "الجواب"]];
  const cols = 2, rows = 4, per = cols * rows, cw = W.cw / cols, ch = (W.ph - 60) / rows, duplex = D.opts.duplex !== false;
  const th = D.theme, fam = D.font, title = v(D, "title");
  const grid = (items, mode) => {
    for (let r = 0; r <= rows; r++) cutLine(W, 30, 30 + r * ch, W.pw - 30, 30 + r * ch);
    for (let c = 0; c <= cols; c++) cutLine(W, 30 + c * cw, 30, 30 + c * cw, W.ph - 30);
    const back = mode === "back";
    items.forEach((it, k) => {
      // الظهر معكوس أفقيًا عشان يطابق الوجه لما ينطبع على الوجهين
      const r = Math.floor(k / cols), c = back ? k % cols : cols - 1 - (k % cols);
      const x0 = 30 + c * cw, top = 30 + r * ch, qf = th === "classic" ? fam : "plex";
      if (!back && th === "modern") W.fill(x0 + 10, top + 10, 4, ch - 20, INK);
      if (!back && title) W.text(title, x0 + cw - 14, top + 20, fontOf("plex", 8.5, false), { c: "#8A8A8A" });
      W.text(String(it.n), x0 + 14, top + 20, fontOf("plex", 8.5, false), { a: "left", d: "ltr", c: "#8A8A8A" });
      const H = ch - 46;
      if (mode === "both") {
        boxText(W, it.q, x0 + 24, x0 + cw - 24, top + 26, H * .5, { fam: qf, size: 15, bold: true, lh: 1.45, min: 8, c: INK });
        W.line(x0 + cw * .3, top + 30 + H * .5, x0 + cw * .7, top + 30 + H * .5, .5, "#C9C9C9");
        boxText(W, it.a, x0 + 24, x0 + cw - 24, top + 34 + H * .5, H * .5 - 8, { fam, size: 12.5, lh: 1.45, min: 7.5, c: "#333" });
      } else boxText(W, back ? it.a : it.q, x0 + 24, x0 + cw - 24, top + 26, H, { fam: back ? fam : qf, size: back ? 14 : 17, bold: !back, lh: 1.5, min: 8, c: INK });
    });
  };
  const items = list.map(([q, a], i) => ({ q, a, n: i + 1 }));
  for (let p = 0; p < items.length; p += per) {
    if (p) W.newPage();
    const chunk = items.slice(p, p + per);
    if (duplex) { grid(chunk, "front"); W.newPage(); grid(chunk, "back"); }
    else grid(chunk, "both");
  }
  return W;
}

/* ================= جداول جاهزة: أسبوعي، مهام، كشف ================= */
const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
function buildPlanner(D) {
  const kind = v(D, "kind") || "week", th = D.theme, fam = th === "classic" ? D.font : "plex";
  const land = kind === "week";
  const W = new Writer({ rtl: true, land, margins: { t: 44, b: 44, l: 44, r: 44 } });
  const head = (title, sub) => {
    W.para(title, { fam, size: 22, bold: true, lh: 1.35, align: th === "modern" ? "start" : "center", after: 0, ...(th === "modern" ? { indent: 13, bar: true, barW: 5, barGap: 13 } : {}) });
    if (sub) W.para(sub, { fam, size: 11.5, lh: 1.6, align: th === "modern" ? "start" : "center", c: SOFT, ...(th === "modern" ? { indent: 13 } : {}) });
    W.y += 12;
  };
  const headBg = th === "calm" ? "#F4F4F4" : th === "modern" ? "#222" : "#E6E6E6", headC = th === "modern" ? "#fff" : INK, border = th === "calm" ? "#C9C9C9" : "#8C8C8C";
  const table = (cols, widths, rows, rowH, opts = {}) => {
    const x1 = W.x1; let y = W.y;
    const hh = 28; let x = x1;
    cols.forEach((c, i) => { W.fill(x - widths[i], y, widths[i], hh, headBg); W.rect(x - widths[i], y, widths[i], hh, .6, border); if (c) boxText(W, c, x - widths[i] + 4, x - 4, y, hh, { fam, size: 11.5, bold: true, lh: 1.3, min: 7, c: headC }); x -= widths[i]; });
    y += hh;
    rows.forEach((r, ri) => {
      if (y + rowH > W.ph - W.M.b) { W.newPage(); y = W.M.t; x = x1; cols.forEach((c, i) => { W.fill(x - widths[i], y, widths[i], hh, headBg); W.rect(x - widths[i], y, widths[i], hh, .6, border); if (c) boxText(W, c, x - widths[i] + 4, x - 4, y, hh, { fam, size: 11.5, bold: true, lh: 1.3, min: 7, c: headC }); x -= widths[i]; }); y += hh; }
      x = x1;
      if (opts.zebra && ri % 2) W.fill(W.x0, y, W.cw, rowH, "#F6F6F6");
      r.forEach((c, i) => { W.rect(x - widths[i], y, widths[i], rowH, .6, border); if (c) boxText(W, String(c), x - widths[i] + 5, x - 5, y, rowH, { fam, size: i === 0 && opts.firstBold ? 11.5 : 11, bold: i === 0 && opts.firstBold, lh: 1.3, min: 7, c: i === 0 && opts.firstBold ? INK : "#333", align: opts.align?.[i] || "center" }); x -= widths[i]; });
      y += rowH;
    });
    W.y = y;
  };
  if (kind === "week") {
    head(v(D, "title") || "الجدول الأسبوعي", v(D, "sub"));
    const days = DAYS.slice(0, D.opts.weekend ? 7 : 5), n = Math.max(1, Math.min(12, +v(D, "periods") || 7));
    const labels = lines(v(D, "times")); const first = 70, w = (W.cw - first) / n;
    const cols = ["", ...Array.from({ length: n }, (_, i) => labels[i] || `${i + 1}`)];
    const rowH = Math.min(66, (W.ph - W.y - W.M.b - 30) / days.length);
    table(cols, [first, ...Array(n).fill(w)], days.map((d) => [d, ...Array(n).fill("")]), rowH, { firstBold: true });
  } else if (kind === "todo") {
    head(v(D, "title") || "قائمة المهام", v(D, "sub"));
    const items = lines(v(D, "items")), n = Math.max(items.length, Math.min(40, +v(D, "periods") || 18)), lh = 30;
    for (let i = 0; i < n; i++) {
      W.room(lh); const by = W.y + lh / 2 + 4;
      W.rect(W.x1 - 14, by - 11, 13, 13, .9, INK, 2.5);
      if (items[i]) W.text(items[i], W.x1 - 26, by, fontOf(fam, 13, false));
      W.line(W.x0, W.y + lh - 2, W.x1 - 26, W.y + lh - 2, .5, "#C9C9C9");
      W.y += lh;
    }
  } else {
    head(v(D, "title") || "كشف", v(D, "sub"));
    const extra = (v(D, "columns") || "الحضور، ملاحظات").split(/[,،]/).map((s) => s.trim()).filter(Boolean).slice(0, 10);
    const names = lines(v(D, "items")), n = Math.max(names.length, Math.min(60, +v(D, "periods") || 20));
    const numW = 34, nameW = Math.min(200, W.cw * .38), ew = (W.cw - numW - nameW) / Math.max(1, extra.length);
    table(["م", "الاسم", ...extra], [numW, nameW, ...Array(extra.length).fill(ew)], Array.from({ length: n }, (_, i) => [i + 1, names[i] || "", ...Array(extra.length).fill("")]), 26, { zebra: th !== "classic", align: ["center", "start"] });
  }
  decorate(W, D, { header: false, footTitle: false, single: true });
  return W;
}

/* ================= لوحة باركود (رابط، واي فاي، أو أي نص) ================= */
function wifiText(D) { const e = (s) => s.replace(/([\;,:"])/g, "\\$1"); return `WIFI:T:${v(D, "pass") ? "WPA" : "nopass"};S:${e(v(D, "ssid"))};P:${e(v(D, "pass"))};;`; }
function buildQR(D) {
  const W = new Writer({ rtl: true, margins: { t: 50, b: 50, l: 50, r: 50 } });
  const th = D.theme, fam = th === "classic" ? D.font : "plex", kind = v(D, "kind") || "link";
  const data = kind === "wifi" ? (v(D, "ssid") ? wifiText(D) : "") : v(D, "link");
  const title = v(D, "title") || (kind === "wifi" ? "اتصل بالواي فاي" : "امسح الباركود");
  const four = D.opts.four;
  const cell = (x, y, w, h, s) => {
    if (th === "classic") { W.rect(x + 8 * s, y + 8 * s, w - 16 * s, h - 16 * s, 2 * s); W.rect(x + 14 * s, y + 14 * s, w - 28 * s, h - 28 * s, .6 * s); }
    else if (th === "modern") { W.fill(x + 8 * s, y + 8 * s, w - 16 * s, 64 * s, INK); }
    else W.rect(x + 10 * s, y + 10 * s, w - 20 * s, h - 20 * s, .6, "#C9C9C9", 10 * s);
    const cx = x + w / 2; let yy = y + 64 * s;
    if (D.logo && !four) { W.image(D.logo, cx - 30, y + 84 * s - 40, 60, 60); }
    if (v(D, "org")) { W.text(v(D, "org"), cx, y + (th === "modern" ? 46 : 60) * s, fontOf(fam, 14 * s, true), { a: "center", c: th === "modern" ? "#fff" : "#333" }); }
    W.M.l = x + 30 * s; W.M.r = W.pw - (x + w - 30 * s); W.M.b = 0;
    W.y = y + (D.logo && !four ? 150 : 104) * s;
    W.para(title, { fam, size: 34 * s, bold: true, lh: 1.3, align: "center", after: 2 });
    if (v(D, "sub")) W.para(v(D, "sub"), { fam, size: 15 * s, lh: 1.55, align: "center", c: "#333" });
    const qs = Math.min(w - 120 * s, h - (W.y - y) - 150 * s), qx = cx - qs / 2, qy = W.y + 16 * s;
    if (!TF.qr(W, data || "https://tabaety.com", qx, qy, qs)) W.rect(qx, qy, qs, qs, 1, "#C9C9C9");
    if (!data) W.text("اكتب الرابط عشان يطلع الباركود", cx, qy + qs / 2, fontOf("plex", 12 * s, false), { a: "center", c: SOFT });
    yy = qy + qs + 26 * s;
    if (kind === "wifi") {
      [["الشبكة", v(D, "ssid")], ["كلمة المرور", v(D, "pass")]].filter((r) => r[1]).forEach(([l, val]) => {
        W.text(`${l}: `, cx + 4, yy, fontOf(fam, 13 * s, false), { a: "left", d: "rtl", c: SOFT });
        W.text(val, cx - 4, yy, fontOf("plex", 14 * s, true), { a: "right", d: "ltr" });
        yy += 22 * s;
      });
    } else if (data && D.opts.showLink !== false) W.text(data.replace(/^https?:\/\//, "").slice(0, 60), cx, yy, fontOf("plex", 12 * s, false), { a: "center", d: "ltr", c: "#333" });
    if (v(D, "foot")) W.text(v(D, "foot"), cx, y + h - 30 * s, fontOf(fam, 12 * s, false), { a: "center", c: SOFT });
  };
  if (four) {
    const w = W.pw / 2, h = W.ph / 2;
    for (let k = 0; k < 4; k++) cell((k % 2) * w, Math.floor(k / 2) * h, w, h, .5);
    cutLine(W, W.pw / 2, 0, W.pw / 2, W.ph); cutLine(W, 0, W.ph / 2, W.pw, W.ph / 2);
  } else cell(0, 0, W.pw, W.ph, 1);
  return W;
}

/* ================= تعريف القوالب ================= */
const TPL = {
  research: {
    name: "بحث", group: "uni", desc: "غلاف رسمي، فهرس تلقائي، ومراجع مرقّمة", rtl: true, kind: "بحث بعنوان", people: true, logo: true,
    fields: [["uni", "الجامعة", "جامعة الملك سعود"], ["college", "الكلية / القسم", "كلية التربية"], ["title", "عنوان البحث", "", 1], ["course", "المقرر"], ["teacher", "أستاذ المقرر", "د. "], ["term", "الفصل الدراسي", "الفصل الدراسي الأول 1448هـ"]],
    secs: ["المقدمة", "المبحث الأول", "المبحث الثاني", "الخاتمة", "المراجع"], d: { theme: "classic", font: "naskh", size: 14, toc: true }, build: buildAcademic,
  },
  report: {
    name: "تقرير", group: "work", desc: "للشغل أو الدراسة: غلاف وعناوين واضحة", rtl: true, kind: "تقرير عن", people: true, logo: true,
    fields: [["uni", "الجهة / الجامعة / الشركة"], ["college", "الإدارة / القسم"], ["title", "عنوان التقرير", "", 1], ["course", "المشروع / المقرر"], ["teacher", "مقدَّم إلى"], ["term", "التاريخ"]],
    secs: ["المقدمة", "محتوى التقرير", "النتائج والتوصيات", "الخاتمة"], d: { theme: "modern", font: "naskh", size: 14, toc: false }, build: buildAcademic,
  },
  homework: {
    name: "واجب", group: "uni", desc: "ترويسة ببياناتك وأسئلة وأجوبة مرتبة", rtl: true, people: true,
    fields: [["title", "عنوان الواجب", "الواجب الأول", 1], ["course", "المقرر"], ["teacher", "أستاذ المقرر", "د. "], ["term", "تاريخ التسليم"]],
    secs: ["السؤال الأول", "السؤال الثاني"], d: { theme: "modern", font: "naskh", size: 14 }, build: buildHomework,
  },
  summary: {
    name: "ملخص مذاكرة", group: "uni", desc: "تعريفات بارزة، ملاحظات، وجداول", rtl: true, people: false,
    fields: [["title", "عنوان الملخص", "", 1], ["course", "المقرر"], ["name", "اسمك (اختياري)"]],
    secs: ["", ""], d: { theme: "modern", font: "plex", size: 12, spacing: "1" }, build: buildSummary,
  },
  cover: {
    name: "غلاف فقط", group: "uni", desc: "صفحة غلاف تحطها قبل ملفك", rtl: true, kind: "بحث بعنوان", people: true, logo: true, content: false,
    fields: [["kind", "نوع العمل", "بحث بعنوان"], ["uni", "الجامعة"], ["college", "الكلية / القسم"], ["title", "العنوان", "", 1], ["course", "المقرر"], ["teacher", "أستاذ المقرر", "د. "], ["term", "الفصل الدراسي"]],
    secs: [], d: { theme: "classic", font: "naskh", size: 14 }, build: buildAcademic,
  },
  letter: {
    name: "خطاب رسمي", group: "work", desc: "ترويسة، تاريخ ورقم، وتوقيع", rtl: true, logo: true,
    fields: [["org", "الجهة المرسِلة", "", 1], ["dept", "الإدارة / القسم"], ["to", "إلى", ""], ["salute", "اللقب", "سعادة"], ["subject", "الموضوع", "", 1], ["date", "التاريخ"], ["ref", "رقم الخطاب"], ["att", "المرفقات"], ["signer", "اسم الموقّع"], ["signerTitle", "صفة الموقّع"]],
    secs: [""], d: { theme: "classic", font: "naskh", size: 14, greet: true }, build: buildLetter,
  },
  general: {
    name: "مستند حر", group: "any", desc: "أي نص: مذكرة، دليل، سياسة، محضر… نرتّبه لك", rtl: true, logo: true,
    fields: [["title", "العنوان", "", 1], ["subtitle", "عنوان فرعي (اختياري)", "", 1], ["author", "إعداد (اختياري)"], ["date", "التاريخ (اختياري)"], ["org", "الجهة (اختياري)", "", 1]],
    secs: ["", ""], d: { theme: "modern", font: "naskh", size: 14 }, build: buildGeneral,
  },
  poster: {
    name: "إعلان", group: "any", desc: "صفحة وحدة بعنوان كبير وتفاصيل الموعد", rtl: true, logo: true,
    fields: [["org", "الجهة", "", 1], ["title", "عنوان الإعلان", "", 1], ["subtitle", "سطر تحت العنوان", "", 1], ["date", "التاريخ"], ["time", "الوقت"], ["place", "المكان", "", 1], ["contact", "للتواصل", "", 1]],
    secs: [""], d: { theme: "classic", font: "naskh", size: 14 }, build: buildPoster,
  },
  certificate: {
    name: "شهادة شكر", group: "any", desc: "اكتب الأسماء وتطلع شهادة لكل اسم", rtl: true, logo: true, content: false, land: true,
    fields: [["org", "الجهة", "", 1], ["title", "عنوان الشهادة", "شهادة شكر وتقدير", 1], ["names", "الأسماء (كل اسم في سطر)", "", 1, "area"], ["intro", "العبارة قبل الاسم (اختياري)", "", 1], ["reason", "سبب الشكر", "", 1, "area"], ["date", "التاريخ"], ["s1t", "صفة الموقّع الأول"], ["s1", "اسم الموقّع الأول"], ["s2t", "صفة الموقّع الثاني"], ["s2", "اسم الموقّع الثاني"]],
    secs: [], d: { theme: "classic", font: "amiri", size: 14 }, build: buildCertificate,
  },
  planner: {
    name: "جداول وكشوف", group: "any", desc: "جدول أسبوعي، قائمة مهام، أو كشف أسماء", rtl: true, content: false,
    fields: [["kind", "النوع", "week", 1, "select", [["week", "جدول أسبوعي"], ["todo", "قائمة مهام"], ["sheet", "كشف أسماء"]]], ["title", "العنوان", "", 1], ["sub", "سطر تحت العنوان (اختياري)", "", 1], ["periods", "عدد الحصص / الأسطر", "7"], ["times", "عناوين الحصص أو الأوقات (كل واحد في سطر)", "", 1, "area", null, "week"], ["items", "الأسماء أو المهام (كل واحد في سطر)", "", 1, "area", null, "todo,sheet"], ["columns", "أعمدة الكشف (افصلها بفاصلة)", "الحضور، الواجبات، ملاحظات", 1, null, null, "sheet"]],
    secs: [], d: { theme: "modern", font: "plex", size: 12 }, build: buildPlanner,
  },
  qr: {
    name: "لوحة باركود", group: "any", desc: "رابط، منيو، أو واي فاي بباركود واضح", rtl: true, logo: true, content: false,
    fields: [["kind", "النوع", "link", 1, "select", [["link", "رابط أو نص"], ["wifi", "شبكة واي فاي"]]], ["org", "اسم المحل / الجهة", "", 1], ["title", "العنوان الكبير", "", 1], ["sub", "سطر تحت العنوان", "", 1], ["link", "الرابط أو النص", "", 1, null, null, "link"], ["ssid", "اسم الشبكة", "", 0, null, null, "wifi"], ["pass", "كلمة المرور", "", 0, null, null, "wifi"], ["foot", "سطر في الأسفل (اختياري)", "", 1]],
    secs: [], d: { theme: "modern", font: "plex", size: 14 }, build: buildQR,
  },
  worksheet: {
    name: "ورقة عمل واختبار", group: "uni", desc: "للمعلمين: خانة الاسم والدرجة، وخيارات مرتبة", rtl: true, logo: true,
    fields: [["org", "المدرسة / الجهة"], ["title", "عنوان الورقة", "ورقة عمل", 1], ["subject", "المادة"], ["grade", "الصف / الشعبة"], ["teacher", "المعلم/ة"], ["date", "التاريخ"], ["duration", "الزمن (اختياري)"], ["total", "الدرجة الكاملة (اختياري)"], ["instructions", "التعليمات (اختياري)", "", 1, "area"]],
    secs: ["السؤال الأول", "السؤال الثاني"], d: { theme: "classic", font: "naskh", size: 13, spacing: "1" }, build: buildWorksheet,
  },
  flashcards: {
    name: "بطاقات مراجعة", group: "uni", desc: "سؤال وجواب على الوجهين، مع خطوط القص", rtl: true, content: false,
    fields: [["title", "المادة / الموضوع (يطلع صغير على البطاقة)", "", 1], ["cards", "البطاقات: كل بطاقة في سطر (السؤال | الجواب)", "", 1, "area"]],
    secs: [], d: { theme: "modern", font: "naskh", size: 14, duplex: true }, build: buildFlashcards,
  },
  cvar: {
    name: "سيرة ذاتية", group: "work", desc: "بالعربي، مع صورة اختيارية", rtl: true, photo: true,
    fields: [["name", "الاسم الكامل", "", 1], ["headline", "المسمى / التخصص"], ["phone", "الجوال", "05"], ["email", "الإيميل"], ["city", "المدينة"], ["link", "LinkedIn أو موقع"]],
    secs: ["نبذة", "التعليم", "الخبرات", "المهارات", "الدورات والشهادات", "اللغات"], d: { theme: "modern", font: "plex", size: 11 }, build: buildCV,
  },
  cven: {
    name: "CV بالإنجليزي", group: "work", desc: "Clean one-page resume", rtl: false, photo: true,
    fields: [["name", "الاسم بالإنجليزي", "", 1], ["headline", "المسمى بالإنجليزي"], ["phone", "الجوال", "+966 5"], ["email", "الإيميل"], ["city", "المدينة", "Riyadh, Saudi Arabia"], ["link", "LinkedIn أو موقع"]],
    secs: ["Summary", "Education", "Experience", "Skills", "Projects", "Certifications"], d: { theme: "classic", font: "plex", size: 10 }, build: buildCV,
  },
};

/* ================= أمثلة واقعية (تظهر في المعرض وزر «جرّب بمثال») ================= */
const SAMPLE = {
  research: {
    f: { title: "أثر الذكاء الاصطناعي على جودة التعليم الجامعي", course: "مهارات البحث العلمي", teacher: "د. خالد العتيبي", uni: "جامعة الملك سعود", college: "كلية التربية" },
    people: [{ n: "سارة عبدالله القحطاني", id: "443106521" }],
    secs: [
      "يشهد التعليم الجامعي اليوم تحولًا واسعًا بفضل تقنيات **الذكاء الاصطناعي**، التي أصبحت حاضرة في القاعات الدراسية ومنصات التعلم الإلكتروني. ويهدف هذا البحث إلى استعراض أبرز تطبيقاتها، وبيان أثرها على الطالب وعضو هيئة التدريس، مع مناقشة التحديات المرتبطة بها.\nوتنبع أهمية الموضوع من الحاجة إلى فهم هذه التقنيات قبل تبنيها، حتى يكون استخدامها مدروسًا ويخدم أهداف العملية التعليمية.",
      "### مفهوم الذكاء الاصطناعي\nالذكاء الاصطناعي (Artificial Intelligence) فرع من علوم الحاسب يهتم ببناء أنظمة قادرة على أداء مهام تتطلب عادةً ذكاءً بشريًا، مثل الفهم والتعلم واتخاذ القرار.\n### تطبيقاته في التعليم\n- أنظمة التعلم التكيفي التي تراعي مستوى كل طالب.\n- التصحيح الآلي للاختبارات الموضوعية.\n- المساعدات الذكية التي تجيب عن أسئلة الطلاب في أي وقت.\n> التقنية لا تغني عن المعلم، لكنها تمنحه وقتًا أطول للتوجيه والإرشاد.",
      "تواجه هذه التقنيات تحديات مهمة، أبرزها حماية خصوصية بيانات الطلاب وضمان عدالة الخوارزميات.\n| التحدي | أثره | الحل المقترح |\n|---|---|---|\n| الخصوصية | تسرب بيانات الطلاب | سياسات واضحة للبيانات |\n| الاعتماد المفرط | ضعف مهارات التفكير | توظيف متوازن للأدوات |\n| الفجوة الرقمية | تفاوت الفرص | تدريب الطلاب والمعلمين |",
      "خلص البحث إلى أن الذكاء الاصطناعي أداة فعالة لتحسين جودة التعليم إذا استُخدم بوعي، وأن نجاحه يعتمد على تكامله مع دور المعلم لا على استبداله.",
      "الشهري، محمد. (2023). التقنيات الحديثة في التعليم. الرياض: دار الكتاب الجامعي.\nالعمري، نورة. (2024). الذكاء الاصطناعي والتعلم الإلكتروني. مجلة العلوم التربوية، 12(3)، 45–67.\nHolmes, W. (2019). Artificial Intelligence in Education. Boston: Center for Curriculum Redesign.",
    ],
  },
  report: {
    f: { title: "زيارة ميدانية لمركز البيانات", course: "شبكات الحاسب", teacher: "د. ماجد الشمري", uni: "جامعة الإمام عبدالرحمن بن فيصل", college: "كلية علوم الحاسب" },
    people: [{ n: "فهد ناصر الدوسري", id: "442118930" }, { n: "عبدالرحمن سعد المطيري", id: "442117215" }],
    secs: ["قمنا بزيارة ميدانية لمركز البيانات في الجامعة بهدف التعرف على مكوناته وطريقة إدارته وإجراءات الأمان المتبعة فيه.",
      "### البنية التحتية\nيتكون المركز من صفوف خوادم مبردة بنظام **الممرات الباردة والساخنة**، مع مراقبة مستمرة لدرجة الحرارة والرطوبة.\n- مصدر طاقة احتياطي يعمل تلقائيًا عند انقطاع الكهرباء.\n- نظام إطفاء بالغاز لا يضر الأجهزة.\n- دخول بالبطاقة والبصمة للموظفين المصرح لهم فقط.",
      "- رفع كفاءة التبريد بإعادة ترتيب بعض الصفوف.\n- توثيق إجراءات الطوارئ وتدريب الفريق عليها دوريًا.", "كانت الزيارة مفيدة، وربطت ما درسناه في المقرر بالواقع العملي."],
  },
  homework: {
    f: { title: "الواجب الثاني", course: "تحليل الخوارزميات", teacher: "د. أحمد الزهراني", term: "12 ربيع الأول 1448هـ" },
    people: [{ n: "ريم سعد العنزي", id: "444200117" }],
    secs: ["س: ما الفرق بين التعقيد الزمني O(n) و O(n²)؟\nالجواب: في O(n) يزيد الوقت بشكل خطي مع حجم المدخلات، بينما في O(n²) يتضاعف الوقت تقريبًا أربع مرات عند مضاعفة حجم المدخلات.",
      "س: قارن بين خوارزميتين للترتيب.\n| الخوارزمية | أفضل حالة | أسوأ حالة |\n|---|---|---|\n| Merge Sort | O(n log n) | O(n log n) |\n| Quick Sort | O(n log n) | O(n²) |"],
  },
  summary: {
    f: { title: "ملخص الفصل الثالث: الخلية", course: "أحياء 101", name: "نوف" },
    secs: ["## مكونات الخلية\nالغشاء البلازمي: يحيط بالخلية وينظّم دخول المواد وخروجها.\nالنواة: مركز التحكم وتحتوي على المادة الوراثية DNA.\nالميتوكوندريا: مصنع الطاقة في الخلية.\n> **احفظها:** الخلية النباتية فيها جدار خلوي وبلاستيدات خضراء، والحيوانية لا.",
      "## مقارنة سريعة\n| الصفة | الخلية النباتية | الخلية الحيوانية |\n|---|---|---|\n| الجدار الخلوي | موجود | غير موجود |\n| الشكل | منتظم | غير منتظم |\n| الفجوات | كبيرة | صغيرة أو معدومة |\n## أسئلة متوقعة\n1. عدّد وظائف الغشاء البلازمي.\n2. لماذا تسمى الميتوكوندريا مصنع الطاقة؟"],
  },
  cover: {
    f: { title: "تصميم نظام لإدارة المكتبة الجامعية", course: "تحليل وتصميم النظم", teacher: "د. هند السبيعي", uni: "جامعة الأميرة نورة بنت عبدالرحمن", college: "كلية علوم الحاسب والمعلومات", term: "الفصل الدراسي الأول 1448هـ", kind: "مشروع بعنوان" },
    people: [{ n: "لمى خالد الحربي", id: "443200345" }, { n: "جود فيصل العتيبي", id: "443201190" }, { n: "رهف محمد القرني", id: "443202876" }],
  },
  letter: {
    f: { org: "نادي الحاسب الآلي", dept: "جامعة الملك سعود", to: "عميد شؤون الطلاب", subject: "طلب حجز قاعة لإقامة ورشة عمل", date: "15/3/1448هـ", ref: "ن ح/27", signer: "عبدالله محمد الحربي", signerTitle: "رئيس النادي" },
    secs: ["نتقدم لسعادتكم بطلب حجز القاعة الكبرى في مبنى الطلاب يوم الأربعاء الموافق 22/3/1448هـ من الساعة الرابعة إلى السادسة مساءً، لإقامة ورشة عمل بعنوان «مقدمة في تحليل البيانات» يقدمها نخبة من أعضاء النادي.\nوتستهدف الورشة نحو (80) طالبًا وطالبة، وتتضمن جانبًا تطبيقيًا يتطلب توفر جهاز عرض وشبكة إنترنت.\nشاكرين لكم حسن تعاونكم ودعمكم المستمر لأنشطة الطلاب."],
  },
  general: {
    f: { title: "دليل الموظف الجديد", subtitle: "كل اللي تحتاجه في أسبوعك الأول", author: "إدارة الموارد البشرية", date: "1448هـ", org: "شركة المثال للتجارة" },
    secs: ["## مرحبًا بك\nيسعدنا انضمامك إلى فريقنا. جمعنا لك في هذا الدليل أهم المعلومات التي تساعدك على البداية بثقة.\n## أوقات الدوام\n- من الأحد إلى الخميس، من 8 صباحًا إلى 4 مساءً.\n- الحضور بالبصمة عند المدخل الرئيسي.\n> **مهم:** بلّغ مديرك المباشر قبل الساعة 8 في حال التأخر أو الغياب.",
      "## جهات التواصل\n| الحاجة | الجهة | التحويلة |\n|---|---|---|\n| الإجازات والرواتب | الموارد البشرية | 210 |\n| الأجهزة والبريد | الدعم التقني | 330 |\n| بطاقة الدخول | الأمن | 100 |"],
  },
  poster: {
    f: { org: "جامع الحي", title: "درس أسبوعي", subtitle: "في تفسير جزء عمّ", date: "كل خميس", time: "بعد صلاة المغرب", place: "جامع الحي، القاعة الملحقة", contact: "للاستفسار: 0550000000" },
    secs: ["يسرّنا دعوتكم لحضور الدرس الأسبوعي\nالدعوة عامة للجميع، ويوجد مصلى للنساء"],
  },
  certificate: {
    f: { org: "مدرسة الرواد الأهلية", names: "عبدالله محمد الحربي\nسارة خالد العتيبي\nفيصل ناصر الدوسري", reason: "لتميزه وتفوقه الدراسي خلال الفصل الدراسي الأول، متمنين له دوام النجاح والتوفيق", date: "الفصل الدراسي الأول 1448هـ", s1t: "قائد المدرسة", s1: "أ. سعد بن عبدالرحمن القحطاني", s2t: "رائد النشاط", s2: "أ. ماجد العنزي" },
  },
  planner: {
    f: { kind: "sheet", title: "كشف حضور حلقة التحفيظ", sub: "الأسبوع الأول · شهر ربيع الأول", items: "عبدالرحمن سعد\nمحمد فهد\nيوسف خالد\nعمر ناصر\nإبراهيم علي\nسلمان عبدالله", columns: "الأحد، الاثنين، الثلاثاء، الأربعاء، الخميس، ملاحظات", periods: "14" },
  },
  qr: {
    f: { kind: "wifi", org: "مقهى الركن", title: "اتصل بالواي فاي", sub: "امسح الباركود بكاميرا الجوال", ssid: "AlRukn-Guest", pass: "coffee2026", foot: "نتمنى لك وقتًا ممتعًا" },
  },
  worksheet: {
    f: { org: "مدرسة الرواد الأهلية", title: "اختبار قصير", subject: "العلوم", grade: "الثالث المتوسط", teacher: "أ. نورة السبيعي", date: "1448/3/20هـ", duration: "20 دقيقة", total: "10", instructions: "اقرأ الأسئلة جيدًا، وأجب عنها جميعًا في نفس الورقة." },
    secs: ["1. الوحدة الأساسية لبناء الكائن الحي هي:\nأ) النسيج\nب) الخلية\nج) العضو\nد) الجهاز\n2. أي مما يلي يوجد في الخلية النباتية فقط؟\nأ) النواة\nب) الغشاء البلازمي\nج) الجدار الخلوي\nد) الميتوكوندريا",
      "1. اشرح وظيفة الميتوكوندريا في الخلية. (درجتان)\n[سطور 3]\n2. قارن بين الخلية النباتية والحيوانية من حيث الشكل. (درجتان)\n[سطور 3]"],
  },
  flashcards: {
    f: { title: "أحياء 101", cards: "ما الوحدة الأساسية لبناء الكائن الحي؟ | الخلية\nما وظيفة الميتوكوندريا؟ | إنتاج الطاقة للخلية\nأين توجد المادة الوراثية DNA؟ | في النواة\nما الذي يميز الخلية النباتية؟ | الجدار الخلوي والبلاستيدات الخضراء\nما وظيفة الغشاء البلازمي؟ | ينظم دخول المواد وخروجها\nما البناء الضوئي؟ | تحويل ضوء الشمس إلى طاقة كيميائية\nما الريبوسوم؟ | مكان بناء البروتين\nما الفجوة العصارية؟ | مخزن للماء والمواد في الخلية" },
  },
  cvar: {
    f: { name: "عبدالله محمد الحربي", headline: "طالب علوم حاسب · مطوّر ويب", phone: "0550000000", email: "abdullah@example.com", city: "الرياض", link: "linkedin.com/in/abdullah" },
    secs: ["طالب في السنة الأخيرة بتخصص علوم الحاسب، لدي خبرة عملية في تطوير الويب وتحليل البيانات، وأبحث عن فرصة تدريب صيفي في هندسة البرمجيات.",
      "بكالوريوس علوم الحاسب، جامعة الملك سعود | 2022 – 2026\n- المعدل التراكمي 4.6 من 5\n- قائمة الشرف لثلاثة فصول دراسية",
      "متدرب هندسة برمجيات، شركة الاتصالات السعودية | يونيو – أغسطس 2025\n- بناء لوحات متابعة داخلية يستخدمها أكثر من 40 مهندسًا.\n- تقليل وقت إعداد التقارير 60% بأتمتة استعلامات SQL.",
      "البرمجة: Python، JavaScript، SQL، React\nالأدوات: Git، Figma، Power BI", "شهادة Google لتحليل البيانات | 2024\nدورة أساسيات الأمن السيبراني، أكاديمية طويق | 2023", "العربية: اللغة الأم\nالإنجليزية: متقدم"],
  },
  cven: {
    f: { name: "Abdullah Al-Harbi", headline: "Computer Science Student · Web Developer", phone: "+966 55 000 0000", email: "abdullah@example.com", link: "linkedin.com/in/abdullah" },
    secs: ["Final-year computer science student with hands-on experience in web development and data analysis. Looking for a summer internship in software engineering.",
      "B.Sc. Computer Science, King Saud University | 2022 – 2026\n- GPA 4.6 / 5\n- Dean's list, three semesters",
      "Software Engineering Intern, STC | Jun 2025 – Aug 2025\n- Built internal dashboards used by 40+ engineers.\n- Cut report preparation time by 60% by automating SQL pipelines.",
      "Languages: Python, JavaScript, SQL, React\nTools: Git, Figma, Power BI\nSpoken: Arabic (native), English (fluent)",
      "Campus Print Kiosk | 2025\n- Self-service printing web app with QR codes and online payment.", "Google Data Analytics Certificate | 2024"],
  },
};

function fresh(tpl, sample) {
  const T = TPL[tpl], f = {};
  T.fields.forEach(([k, , def]) => { f[k] = def || ""; });
  const D = { v: 2, tpl, theme: T.d.theme, font: T.d.font, size: T.d.size, spacing: T.d.spacing || "1.5",
    opts: { toc: !!T.d.toc, num: false, pages: "center", clean: true, greet: T.d.greet !== false, cover: false, duplex: T.d.duplex !== false, weekend: false, four: false, showLink: true },
    f, people: T.people ? [{ n: "", id: "" }] : [], logo: "", photo: "", mode: "parts", secs: T.secs.map((h) => ({ h, t: "" })), full: "" };
  if (sample && SAMPLE[tpl]) {
    const S = SAMPLE[tpl]; Object.assign(D.f, S.f);
    if (S.people) D.people = S.people.map((p) => ({ ...p }));
    if (S.secs) D.secs = T.secs.map((h, i) => ({ h, t: S.secs[i] || "" }));
    if (["summary", "general", "poster"].includes(tpl) && S.secs) D.secs = S.secs.map((t) => ({ h: "", t }));
  }
  return D;
}

// يبني الملف كامل: تمريرتين للفهرس عشان أرقام الصفحات تطلع صحيحة
function build(D) {
  const T = TPL[D.tpl];
  D._secs = D.mode === "full" && T.content !== false ? window.TF.splitSections(D.full || "") : D.secs;
  if (D.tpl === "summary" && D.f.name) D.people = [{ n: D.f.name, id: "" }];
  let W = T.build(D, {});
  if ((D.tpl === "research" || D.tpl === "report") && D.opts.toc) {
    const first = W.pages.findIndex((p) => p.kind === "body"), pageOf = {};
    Object.entries(W.marks || {}).forEach(([i, pg]) => { pageOf[i] = pg - first + 1; });
    W = T.build(D, { pageOf });
  }
  return W;
}

window.TFT = { TPL, THEMES, FONTS, SAMPLE, fresh, build };
})();
