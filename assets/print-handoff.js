/* طابعتي — «اطبعه في طابعتي»: يختار العميل الطابعة، ونحفظ الملف في المتصفح، ونفتح صفحة الطابعة وهو جاهز للدفع.
   يستخدمه السكانر (/s/). */
(function () {
"use strict";
const SB = "https://dloicztspjligjjowhps.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsb2ljenRzcGpsaWdqam93aHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDkxNTIsImV4cCI6MjEwMTMyNTE1Mn0.uxb31-8o4dBF09sTAXpb4whQ6h_NZwpe0bD43Ucye9M";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const css = `
.tp-modal{position:fixed;inset:0;z-index:80;background:rgba(10,20,24,.45);display:grid;place-items:center;padding:16px;animation:tpf .2s}
@keyframes tpf{from{opacity:0}}
.tp-sheet{background:#fff;border-radius:18px;width:min(520px,100%);max-height:min(680px,92dvh);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.25);font-family:inherit;color:#14181B}
.tp-h{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid #DCE2E5}.tp-h b{flex:1;font-size:17px}
.tp-x{width:36px;height:36px;border-radius:10px;border:1px solid #DCE2E5;background:#fff;color:#8A959C;font-size:15px;cursor:pointer}
.tp-b{padding:14px 18px;overflow:auto;display:flex;flex-direction:column;gap:10px}
.tp-f{padding:14px 18px;border-top:1px solid #DCE2E5;display:flex}
.tp-go{flex:1;border:0;border-radius:12px;padding:12px 18px;font:700 15px inherit;font-family:inherit;background:#0A6B74;color:#fff;cursor:pointer}.tp-go[disabled]{opacity:.55;cursor:not-allowed}
.tp-row{display:flex;align-items:center;gap:12px;border:1.5px solid #DCE2E5;border-radius:13px;padding:10px 12px;background:#fff;text-align:start;width:100%;font-family:inherit;cursor:pointer;color:inherit}
.tp-row[aria-pressed="true"]{border-color:#0A6B74;background:#E1F0F1}.tp-row[disabled]{opacity:.55;cursor:not-allowed}
.tp-row .c{font:600 15px ui-monospace,Menlo,monospace;background:#E1F0F1;color:#0A6B74;border-radius:8px;padding:4px 8px;direction:ltr}
.tp-row div{flex:1;min-width:0}.tp-row b{display:block;font-size:14.5px}.tp-row span{font-size:12.5px;color:#5E6A73}
.tp-pill{font-size:11.5px;font-weight:600;border-radius:99px;padding:3px 9px;white-space:nowrap;color:#5E6A73;background:#EBEFF1}.tp-pill.ok{color:#1D7F48;background:#E3F3E9}
.tp-q{width:100%;border:1px solid #DCE2E5;border-radius:11px;padding:10px 12px;font:inherit;font-size:15px}
.tp-bar{height:6px;border-radius:3px;background:#EBEFF1;overflow:hidden}.tp-bar i{display:block;height:100%;width:0;background:#0A6B74;transition:width .2s}`;
let KS = null;
function idbPut(v) {
  return new Promise((res, rej) => {
    const r = indexedDB.open("tabaety", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("handoff");
    r.onerror = () => rej(r.error);
    r.onsuccess = () => { const tx = r.result.transaction("handoff", "readwrite"); tx.objectStore("handoff").put(v, "file"); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); };
  });
}
async function open({ makeBlob, name, pagesLabel, kiosk, from = "f", onSend }) {
  if (!document.getElementById("tp-css")) { const st = document.createElement("style"); st.id = "tp-css"; st.textContent = css; document.head.appendChild(st); }
  const m = document.createElement("div"); m.className = "tp-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
  m.innerHTML = `<div class="tp-sheet"><div class="tp-h"><b>اطبعه في طابعتي</b><button class="tp-x" type="button" aria-label="إغلاق">✕</button></div><div class="tp-b"><p style="margin:30px 0;text-align:center;color:#5E6A73">نجيب الطابعات…</p></div><div class="tp-f"><button class="tp-go" type="button" disabled>أرسل الملف للطابعة</button></div></div>`;
  document.body.appendChild(m);
  const close = () => { m.remove(); removeEventListener("keydown", key); };
  const key = (e) => { if (e.key === "Escape") close(); };
  addEventListener("keydown", key);
  m.querySelector(".tp-x").onclick = close; m.onclick = (e) => { if (e.target === m) close(); };
  m.querySelector(".tp-x").focus();
  const body = m.querySelector(".tp-b"), go = m.querySelector(".tp-go");
  if (!KS) {
    try {
      const r = await fetch(`${SB}/rest/v1/rpc/web_public_kiosks`, { method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" }, body: "{}" });
      if (!r.ok) throw 0; KS = await r.json();
    } catch { body.innerHTML = `<p style="margin:0;color:#B83A26">ما قدرنا نجيب الطابعات. تأكد من الإنترنت وجرّب مرة ثانية.</p>`; return; }
  }
  let pick = kiosk || "";
  const sorted = KS.slice().sort((a, b) => (b.kiosk_id === kiosk) - (a.kiosk_id === kiosk) || (b.status === "ok") - (a.status === "ok"));
  const row = (k) => { const ok = k.status === "ok"; return `<button type="button" class="tp-row" data-k="${esc(k.kiosk_id)}" aria-pressed="${pick === k.kiosk_id}" ${k.status === "soon" || k.status === "disabled" ? "disabled" : ""}><span class="c">${esc(k.kiosk_id)}</span><div><b>${esc(k.location)}</b><span>${esc([k.area, k.city].filter(Boolean).join("، "))}</span></div><span class="tp-pill ${ok ? "ok" : ""}">${ok ? "متاحة" : k.status === "soon" ? "قريبًا" : "مشغولة"}</span></button>`; };
  body.innerHTML = `<p style="margin:0 0 4px;font-size:14px;color:#5E6A73;line-height:1.7">ملفك (${esc(pagesLabel)}) يروح للطابعة اللي تختارها، وتكمل الدفع وتطبعه وأنت عندها.</p>${KS.length > 5 ? `<input class="tp-q" placeholder="ابحث بالمدينة أو المكان أو رقم الطابعة" aria-label="ابحث عن طابعة">` : ""}<div class="tp-list" style="display:flex;flex-direction:column;gap:8px">${sorted.map(row).join("")}</div>`;
  go.disabled = !pick;
  const bind = () => body.querySelectorAll(".tp-row").forEach((b) => b.onclick = () => { pick = b.dataset.k; body.querySelectorAll(".tp-row").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); go.disabled = false; });
  bind();
  body.querySelector(".tp-q")?.addEventListener("input", (e) => { const q = e.target.value.trim(); body.querySelector(".tp-list").innerHTML = sorted.filter((k) => !q || [k.kiosk_id, k.location, k.area, k.city].join(" ").includes(q)).map(row).join("") || `<p style="margin:0;color:#5E6A73">ما لقينا طابعة بهالاسم.</p>`; bind(); });
  go.onclick = async () => {
    go.disabled = true; body.insertAdjacentHTML("beforeend", `<div class="tp-bar"><i></i></div>`);
    const bar = body.querySelector(".tp-bar i");
    try {
      const blob = await makeBlob((p) => { bar.style.width = Math.round(p * 90) + "%"; go.textContent = `نجهّز الملف ${Math.round(p * 100)}%`; });
      await idbPut({ blob, name, at: Date.now() });
      bar.style.width = "100%";
      onSend?.();
      location.href = `/p/?k=${encodeURIComponent(pick)}&from=${encodeURIComponent(from)}`;
    } catch (e) { console.error(e); go.disabled = false; go.textContent = "أرسل الملف للطابعة"; alert("ما قدرنا نجهّز الملف للإرسال. جرّب «تحميل PDF» وارفعه من صفحة الطابعة."); }
  };
}
window.TPrint = { open };
})();
