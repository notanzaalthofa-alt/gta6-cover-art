// Neon Coast cover engine: draws a GTA-style multi-panel poster to a canvas.
// Panels, colour grades, bold lettering, frame, grain and vignette.
// No network, no dependencies; every asset is a file under app/.

export const LAYOUTS = {
  hero: "Hero + three",
  quad: "Four squares",
  trio: "Wide + two",
  duo: "Side by side",
  strip: "Three columns",
  full: "Full bleed",
};

export const GRADES = {
  sunset: "Sunset",
  neon: "Neon night",
  teal: "Teal dusk",
  noir: "Noir",
  gold: "Golden hour",
};

export const SIZES = {
  square: { label: "Square · 1080 × 1080", w: 1080, h: 1080 },
  portrait: { label: "Portrait · 1080 × 1350", w: 1080, h: 1350 },
  wide: { label: "Wide · 1920 × 1080", w: 1920, h: 1080 },
};

// Panel rectangles as fractions of the cover, with gutters between them.
export function layoutPanels(name, w, h) {
  const g = 0.014; // gutter, fraction of the short side
  const m = 0.018; // outer frame margin
  const x0 = w * m, y0 = h * m, x1 = w * (1 - m), y1 = h * (1 - m);
  const gw = w * g, gh = h * g;
  const full = [{ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }];
  const midX = x0 + (x1 - x0) * 0.62;
  const midY = y0 + (y1 - y0) * 0.55;
  const thirdH = (y1 - y0 - gh * 2) / 3;
  const halfW = (x1 - x0 - gw) / 2;
  const thirdW = (x1 - x0 - gw * 2) / 3;
  switch (name) {
    case "hero":
      return [
        { x: x0, y: y0, w: midX - x0 - gw, h: y1 - y0 },
        { x: midX, y: y0, w: x1 - midX, h: thirdH },
        { x: midX, y: y0 + thirdH + gh, w: x1 - midX, h: thirdH },
        { x: midX, y: y0 + (thirdH + gh) * 2, w: x1 - midX, h: thirdH },
      ];
    case "quad":
      return [
        { x: x0, y: y0, w: halfW, h: (y1 - y0 - gh) / 2 },
        { x: x0 + halfW + gw, y: y0, w: halfW, h: (y1 - y0 - gh) / 2 },
        { x: x0, y: y0 + (y1 - y0 - gh) / 2 + gh, w: halfW, h: (y1 - y0 - gh) / 2 },
        { x: x0 + halfW + gw, y: y0 + (y1 - y0 - gh) / 2 + gh, w: halfW, h: (y1 - y0 - gh) / 2 },
      ];
    case "trio":
      return [
        { x: x0, y: y0, w: x1 - x0, h: midY - y0 - gh },
        { x: x0, y: midY, w: halfW, h: y1 - midY },
        { x: x0 + halfW + gw, y: midY, w: halfW, h: y1 - midY },
      ];
    case "duo":
      return [
        { x: x0, y: y0, w: halfW, h: y1 - y0 },
        { x: x0 + halfW + gw, y: y0, w: halfW, h: y1 - y0 },
      ];
    case "strip":
      return [
        { x: x0, y: y0, w: thirdW, h: y1 - y0 },
        { x: x0 + thirdW + gw, y: y0, w: thirdW, h: y1 - y0 },
        { x: x0 + (thirdW + gw) * 2, y: y0, w: thirdW, h: y1 - y0 },
      ];
    default:
      return full;
  }
}

// Draw one photo into a panel rect, cover-fit, with zoom and pan.
// px, py are pan offsets as fractions of the panel size (-0.5 .. 0.5).
export function drawPanelPhoto(ctx, img, rect, zoom, px, py) {
  if (!img || !img.width) return;
  const s = Math.max(rect.w / img.width, rect.h / img.height) * (zoom || 1);
  const dw = img.width * s;
  const dh = img.height * s;
  const dx = rect.x + (rect.w - dw) / 2 + (px || 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (py || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// --- Colour grades: overlays drawn over the panels, before the lettering. ---
function gradeOverlay(ctx, name, w, h) {
  const apply = (mode, alpha, fill) => {
    ctx.save();
    ctx.globalCompositeOperation = mode;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };
  const linear = (stops) => {
    const g = ctx.createLinearGradient(0, 0, w * 0.35, h);
    for (const [p, c] of stops) g.addColorStop(p, c);
    return g;
  };
  switch (name) {
    case "neon": {
      apply("screen", 0.5, linear([[0, "rgba(255,45,150,0.34)"], [0.55, "rgba(120,40,200,0.10)"], [1, "rgba(40,220,255,0.30)"]]));
      apply("multiply", 0.28, "rgba(90,10,80,1)");
      break;
    }
    case "teal": {
      apply("overlay", 0.55, linear([[0, "rgba(20,90,110,0.5)"], [1, "rgba(255,170,80,0.35)"]]));
      apply("multiply", 0.18, "rgba(10,60,70,1)");
      break;
    }
    case "noir": {
      apply("saturation", 1, "rgba(128,128,128,1)");
      apply("overlay", 0.5, linear([[0, "rgba(255,255,255,0.28)"], [1, "rgba(0,0,0,0.34)"]]));
      break;
    }
    case "gold": {
      apply("soft-light", 0.85, linear([[0, "rgba(255,190,80,0.7)"], [1, "rgba(200,90,20,0.5)"]]));
      apply("screen", 0.22, "rgba(255,210,120,1)");
      break;
    }
    default: { // sunset
      apply("overlay", 0.6, linear([[0, "rgba(255,120,40,0.42)"], [0.6, "rgba(255,80,120,0.20)"], [1, "rgba(90,20,90,0.34)"]]));
      apply("screen", 0.16, "rgba(255,180,90,1)");
    }
  }
}

let noiseTile = null;
function grainTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement("canvas");
  c.width = 140;
  c.height = 140;
  const g = c.getContext("2d");
  const im = g.createImageData(140, 140);
  for (let i = 0; i < im.data.length; i += 4) {
    const v = 118 + Math.floor(Math.random() * 40);
    im.data[i] = v; im.data[i + 1] = v; im.data[i + 2] = v; im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  noiseTile = c;
  return c;
}

function vignette(ctx, w, h) {
  const r = Math.hypot(w, h) / 2;
  const g = ctx.createRadialGradient(w / 2, h / 2, r * 0.42, w / 2, h / 2, r);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(8,2,14,0.42)");
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// Bold poster lettering: Anton title with a dark outline, Pacifico subtitle.
function drawLettering(ctx, title, subtitle, w, h) {
  const pad = w * 0.045;
  const bandH = h * 0.21;
  const bandY = h - bandH;
  const fade = ctx.createLinearGradient(0, bandY - h * 0.07, 0, h);
  fade.addColorStop(0, "rgba(10,4,16,0)");
  fade.addColorStop(1, "rgba(10,4,16,0.78)");
  ctx.save();
  ctx.fillStyle = fade;
  ctx.fillRect(0, bandY - h * 0.07, w, bandH + h * 0.07);
  ctx.restore();

  const titleSize = Math.min(w * 0.105, (bandH * 0.52));
  const subSize = Math.max(18, h * 0.026);
  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  // subtitle in neon script, above the title
  ctx.font = `${subSize}px Pacifico, cursive`;
  ctx.fillStyle = "#ffd166";
  ctx.shadowColor = "rgba(255,60,150,0.85)";
  ctx.shadowBlur = titleSize * 0.22;
  ctx.fillText(subtitle || "", pad, bandY + subSize * 1.5);
  ctx.shadowBlur = 0;
  // title in condensed bold caps with a dark outline
  ctx.font = `${titleSize}px Anton, "Arial Narrow", sans-serif`;
  try { ctx.letterSpacing = `${Math.round(titleSize * 0.02)}px`; } catch (e) { /* older canvas */ }
  const ty = bandY + subSize * 1.5 + titleSize * 1.02;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(16,6,20,0.92)";
  ctx.lineWidth = Math.max(3, titleSize * 0.09);
  ctx.strokeText((title || "").toUpperCase(), pad, ty);
  ctx.fillStyle = "#ffffff";
  ctx.fillText((title || "").toUpperCase(), pad, ty);
  // accent underline bar
  const barW = Math.min(w * 0.42, ctx.measureText((title || "").toUpperCase()).width);
  ctx.fillStyle = "#ff2d96";
  ctx.fillRect(pad, ty + titleSize * 0.16, barW, Math.max(4, h * 0.006));
  ctx.restore();
}

// Render a whole cover to ctx at (w, h). state: { layout, grade, title,
// subtitle, panels: [{ img, zoom, px, py }] }.
export function renderCover(ctx, state, w, h) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#f6efe6";
  ctx.fillRect(0, 0, w, h);
  const rects = layoutPanels(state.layout || "hero", w, h);
  rects.forEach((r, i) => {
    const p = (state.panels || [])[i] || {};
    drawPanelPhoto(ctx, p.img, r, p.zoom || 1, p.px || 0, p.py || 0);
  });
  gradeOverlay(ctx, state.grade || "sunset", w, h);
  // frame lines around each panel
  ctx.strokeStyle = "rgba(246,239,230,0.95)";
  ctx.lineWidth = Math.max(2, w * 0.004);
  for (const r of rects) ctx.strokeRect(r.x, r.y, r.w, r.h);
  vignette(ctx, w, h);
  // film grain
  ctx.save();
  ctx.globalAlpha = 0.05;
  const pat = ctx.createPattern(grainTile(), "repeat");
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  drawLettering(ctx, state.title, state.subtitle, w, h);
  ctx.restore();
}

// Draw the current cover into a fresh canvas at the named size.
export function coverCanvas(state, sizeName) {
  const s = SIZES[sizeName] || SIZES.square;
  const c = document.createElement("canvas");
  c.width = s.w;
  c.height = s.h;
  renderCover(c.getContext("2d"), state, s.w, s.h);
  return c;
}
