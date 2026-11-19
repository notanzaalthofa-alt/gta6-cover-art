# Neon Coast Cover Studio

A GTA-style cover art maker that runs entirely offline in a desktop browser.
It turns your photos and a caption into a multi-panel poster in the Vice City
neon-sunset style, and exports it as a PNG to share.

Built for the make.fun bounty **gta6-cover-art-01** ("Make GTA 6 Cover Art").

## What it does

- **Any photo** — load the bundled sample scenes or add your own photos from
  your machine. Every photo stays on your machine; nothing is uploaded.
- **Multi-panel posters** — six layouts: Hero + three, four squares, wide + two,
  side by side, three columns, and full bleed. Click a panel to select it, drag
  inside it to position its photo, and use the zoom slider to crop it.
- **Sunset grades** — Sunset, Neon night, Teal dusk, Noir and Golden hour colour
  grades, plus grain and a vignette for the poster finish.
- **Bold lettering** — an Anton title with a dark outline and a Pacifico neon
  script subtitle, drawn over a fading band at the foot of the cover.
- **Fast export** — one click exports a PNG in the common post sizes:
  1080 × 1080, 1080 × 1350 and 1920 × 1080.

## Try it

Serve `app/` with any static file server and open it in desktop Chrome:

```sh
cd app && python3 -m http.server 8080
# open http://localhost:8080
```

No build step, no network request: every script, font and image is a file
under `app/`.

## Layout of this repository

- `app/index.html`, `app/styles.css` — the studio page and its styling.
- `app/src/render.js` — the cover engine: panel layouts, photo drawing,
  colour grades, lettering, grain and vignette.
- `app/src/studio.js` — the editor: photos, layout and grade controls,
  caption editing, drag-to-position, PNG export and screenshot mode.
- `app/samples/` — four original sunset/neon scenes drawn for this studio.
- `app/fonts/` — Anton and Pacifico under the SIL Open Font License.
- `screenshots/` — the cover and the editor at work.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json` with the kit's vendored library.
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged.

## Originality

Everything in this entry is its maker's own: the layouts, the render engine,
the editor and the sample scenes were written and drawn for this bounty. No
Rockstar Games logo, wordmark, official artwork, character or font is used
anywhere, and no photo shows a real person. The two fonts are open-licensed
(Anton and Pacifico, SIL Open Font License 1.1; see `app/fonts/`).
