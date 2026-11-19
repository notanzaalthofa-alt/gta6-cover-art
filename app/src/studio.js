// Neon Coast studio: wires the editor UI to the cover engine.
// Photos come from the person's own files or the bundled samples;
// nothing is uploaded anywhere, and the app makes no network request.
import { LAYOUTS, GRADES, SIZES, layoutPanels, renderCover, coverCanvas } from "./render.js";

const SAMPLES = [
  { file: "samples/boulevard.jpg", name: "Boulevard" },
  { file: "samples/rooftop.jpg", name: "Rooftop" },
  { file: "samples/neon-street.jpg", name: "Neon street" },
  { file: "samples/pier.jpg", name: "Pier" },
];

const state = {
  layout: "hero",
  grade: "sunset",
  size: "square",
  title: "Neon Shore",
  subtitle: "Vice City nights, your story.",
  photos: [], // { img, name }
  panels: [], // { photo, zoom, px, py }
  selected: 0,
};

const $ = (id) => document.getElementById(id);
const preview = $("preview");
const pctx = preview.getContext("2d");

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function addPhoto(img, name) {
  state.photos.push({ img, name });
  return state.photos.length - 1;
}

function panelCount() {
  return layoutPanels(state.layout, 100, 100).length;
}

// Keep the panel list in step with the layout: keep each panel's photo
// where it fits, fill new panels from the photos in turn.
function applyLayout() {
  const n = panelCount();
  const next = [];
  for (let i = 0; i < n; i++) {
    const old = state.panels[i];
    next.push(old || {
      photo: state.photos.length ? i % state.photos.length : -1,
      zoom: 1, px: 0, py: 0,
    });
  }
  state.panels = next;
  if (state.selected >= n) state.selected = 0;
}

function coverState() {
  return {
    layout: state.layout,
    grade: state.grade,
    title: state.title,
    subtitle: state.subtitle,
    panels: state.panels.map((p) => ({
      img: p.photo >= 0 ? state.photos[p.photo].img : null,
      zoom: p.zoom, px: p.px, py: p.py,
    })),
  };
}

function previewSize() {
  const s = SIZES[state.size];
  const maxW = 620, maxH = 560;
  const k = Math.min(maxW / s.w, maxH / s.h);
  return { w: Math.round(s.w * k), h: Math.round(s.h * k) };
}

function drawPreview() {
  const { w, h } = previewSize();
  if (preview.width !== w) preview.width = w;
  if (preview.height !== h) preview.height = h;
  renderCover(pctx, coverState(), w, h);
  // outline the selected panel so the person sees which one they edit
  const rects = layoutPanels(state.layout, w, h);
  const r = rects[state.selected];
  if (r) {
    pctx.save();
    pctx.strokeStyle = "#ffd166";
    pctx.lineWidth = 3;
    pctx.setLineDash([10, 6]);
    pctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    pctx.setLineDash([]);
    pctx.fillStyle = "#ffd166";
    pctx.font = "bold 15px system-ui, sans-serif";
    pctx.fillText(`Panel ${state.selected + 1}`, r.x + 8, r.y + 22);
    pctx.restore();
  }
  const sel = state.panels[state.selected];
  $("panelLabel").textContent = sel
    ? `Panel ${state.selected + 1} · ${sel.photo >= 0 ? state.photos[sel.photo].name : "no photo"} · zoom ${sel.zoom.toFixed(2)}`
    : "";
}

function refreshTray() {
  const tray = $("photoTray");
  tray.querySelectorAll("button[data-photo]").forEach((b) => b.remove());
  state.photos.forEach((p, i) => {
    const b = document.createElement("button");
    b.dataset.photo = i;
    b.className = "thumb";
    b.title = p.name;
    const im = document.createElement("img");
    im.src = p.img.src;
    im.alt = p.name;
    b.appendChild(im);
    b.addEventListener("click", () => {
      state.panels[state.selected].photo = i;
      drawPreview();
    });
    tray.appendChild(b);
  });
}

function buttonRow(el, items, current, onPick) {
  el.innerHTML = "";
  for (const [key, label] of Object.entries(items)) {
    const b = document.createElement("button");
    b.textContent = label;
    b.className = key === current ? "on" : "";
    b.addEventListener("click", () => {
      onPick(key);
      buttonRow(el, items, key, onPick);
      drawPreview();
    });
    el.appendChild(b);
  }
}

function wireControls() {
  buttonRow($("layoutRow"), LAYOUTS, state.layout, (k) => {
    state.layout = k;
    applyLayout();
  });
  buttonRow($("gradeRow"), GRADES, state.grade, (k) => { state.grade = k; });
  const sizeLabels = Object.fromEntries(
    Object.entries(SIZES).map(([k, v]) => [k, v.label]));
  buttonRow($("sizeRow"), sizeLabels, state.size, (k) => { state.size = k; });
  $("titleInput").value = state.title;
  $("subInput").value = state.subtitle;
  $("titleInput").addEventListener("input", (e) => {
    state.title = e.target.value;
    drawPreview();
  });
  $("subInput").addEventListener("input", (e) => {
    state.subtitle = e.target.value;
    drawPreview();
  });
  $("zoomRange").addEventListener("input", (e) => {
    const p = state.panels[state.selected];
    if (!p) return;
    p.zoom = parseFloat(e.target.value);
    drawPreview();
  });
  $("fileInput").addEventListener("change", async (e) => {
    for (const f of e.target.files) {
      const url = URL.createObjectURL(f);
      const img = await loadImage(url);
      await addPhoto(img, f.name.replace(/\.[^.]+$/, ""));
    }
    applyLayout();
    refreshTray();
    drawPreview();
  });
  // drag on the preview pans the selected panel's photo
  let drag = null;
  preview.addEventListener("pointerdown", (e) => {
    const r = preview.getBoundingClientRect();
    const x = (e.clientX - r.left) * (preview.width / r.width);
    const y = (e.clientY - r.top) * (preview.height / r.height);
    const rects = layoutPanels(state.layout, preview.width, preview.height);
    const hit = rects.findIndex((q) => x >= q.x && x <= q.x + q.w && y >= q.y && y <= q.y + q.h);
    if (hit >= 0) {
      state.selected = hit;
      drag = { x, y, px: state.panels[hit].px, py: state.panels[hit].py };
      drawPreview();
    }
  });
  preview.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const r = preview.getBoundingClientRect();
    const x = (e.clientX - r.left) * (preview.width / r.width);
    const y = (e.clientY - r.top) * (preview.height / r.height);
    const p = state.panels[state.selected];
    const rects = layoutPanels(state.layout, preview.width, preview.height);
    const q = rects[state.selected];
    p.px = Math.max(-0.5, Math.min(0.5, drag.px + (x - drag.x) / q.w));
    p.py = Math.max(-0.5, Math.min(0.5, drag.py + (y - drag.y) / q.h));
    drawPreview();
  });
  const endDrag = () => { drag = null; };
  preview.addEventListener("pointerup", endDrag);
  preview.addEventListener("pointerleave", endDrag);
  // export buttons: one PNG per post size
  for (const [key, s] of Object.entries(SIZES)) {
    const b = document.createElement("button");
    b.textContent = `Export ${s.label}`;
    b.addEventListener("click", () => {
      const c = coverCanvas(coverState(), key);
      c.toBlob((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `neon-coast-${key}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }, "image/png");
    });
    $("exportRow").appendChild(b);
  }
}

// Screenshot mode, driven by the page URL so covers are reproducible:
// ?shot=cover&size=square&layout=hero&grade=sunset&photo=0&title=Neon%20Shore
// renders just the cover, full-bleed; ?shot=editor presets the editor.
async function runShotMode() {
  const q = new URLSearchParams(location.search);
  const shot = q.get("shot");
  if (!shot) return false;
  if (q.get("layout") && LAYOUTS[q.get("layout")]) state.layout = q.get("layout");
  if (q.get("grade") && GRADES[q.get("grade")]) state.grade = q.get("grade");
  if (q.get("size") && SIZES[q.get("size")]) state.size = q.get("size");
  if (q.get("title")) state.title = q.get("title");
  if (q.get("subtitle")) state.subtitle = q.get("subtitle");
  applyLayout();
  const photoIdx = parseInt(q.get("photo") || "0", 10);
  state.panels.forEach((p, i) => { p.photo = (photoIdx + i) % state.photos.length; });
  if (shot === "cover") {
    document.body.classList.add("shot");
    const s = SIZES[state.size];
    const c = $("shotCanvas");
    c.width = s.w;
    c.height = s.h;
    renderCover(c.getContext("2d"), coverState(), s.w, s.h);
    document.title = "cover";
  }
  drawPreview();
  return true;
}

async function start() {
  await document.fonts.load('100px Anton');
  await document.fonts.load('40px Pacifico');
  await document.fonts.ready;
  for (const s of SAMPLES) {
    const img = await loadImage(s.file);
    await addPhoto(img, s.name);
  }
  applyLayout();
  // Apply any ?shot= preset first, so the control buttons are built
  // from the state the screenshot actually shows.
  await runShotMode();
  wireControls();
  refreshTray();
  drawPreview();
}

start().catch((err) => {
  document.body.insertAdjacentHTML("beforeend",
    `<p style="color:#ff6b81;padding:12px">Could not start the studio: ${err.message}</p>`);
});
