# FitID web

The phone version of the FitID browser extension. It's a static, installable website (PWA) with no build step.

- **Profile ("Enter it once")**: height, chest, waist and shoulders, plus optional weight, hips, underbust, inseam and feet. FitID estimates anything you leave blank and labels those values "estimated".
- **My sizes**: your size at H&M, Zara, Nike, Adidas, Puma, Levi's, U.S. Polo Assn. and more, taken from each brand's official chart, followed by your standard sizes.
- **Converter**: US, UK, EU, India and letter sizes for men, women and kids, with a YOU row.
- **Check chart**: paste a size chart copied from the Myntra, AJIO, Flipkart or Amazon app, or type the sizes in, and FitID picks your size.

Your profile is saved in the browser's `localStorage` on that phone. Nothing is uploaded.

## How it reuses the extension

The size engine, brand charts and converter tables come from `../fitid-extension/lib/`. `sync-lib.js` copies them into `lib/`:

```bash
node sync-lib.js
```

Run it again whenever the extension changes, for example after new brands are added to `lib/brands.js`. It also bumps the service-worker cache version so installed copies update. Don't edit the files in `lib/` directly.

`js/storage-shim.js` maps `chrome.storage.sync/local` onto `localStorage`, so the extension's `lib/profile.js` works unchanged.

## Run locally

```bash
node serve.js
```

Then open http://localhost:8780. To try it on your phone over the same Wi-Fi, open `http://<your-PC-IP>:8780`. Note that phones only register the service worker (offline mode and install) over HTTPS or on localhost.

Tests for the chart-pasting parser:

```bash
node test/paste.test.js
```

## Deploy to Vercel (free)

The folder is ready to deploy as-is. `vercel.json` sets no build step and adds the right headers: `sw.js` is never cached, `manifest.webmanifest` gets its proper content type, and the app files revalidate on each visit. `.vercelignore` keeps tests and dev scripts out of the upload.

**Option A: Vercel dashboard (Git).** The repo is https://github.com/santhoshh005/FitID, which holds both `fitid-extension/` and `fitid-web/`.
1. On vercel.com, click **Add New… → Project** and import `santhoshh005/FitID`.
2. Set **Root Directory** to `fitid-web` (click *Edit* next to it). Set **Framework Preset** to **Other**, and leave the build and output settings empty.
3. Click **Deploy**. You get `https://<name>.vercel.app`. Every later push to `main` redeploys automatically.

`fitid-web/lib/` is committed, so the site deploys without a build step.

**Option B: Vercel CLI (no Git)**

```bash
npm i -g vercel
```

```bash
cd fitid-web && vercel --prod
```

Accept the defaults: no build command, and output directory `.`.

**Updating brands later:** run `node sync-lib.js`, then push again (or run `vercel --prod`).

### Other free hosts

The site is plain static files, so these also work: **Netlify** (drag the `fitid-web` folder onto app.netlify.com/drop), **GitHub Pages** (publish the folder) or **Cloudflare Pages**. All asset paths are relative, so it also works from a sub-path such as `user.github.io/fitid/`.

## Install on a phone

- **Android (Chrome/Edge):** tap **Install app** in the top bar, or use the browser menu → *Install app*.
- **iPhone (Safari):** Share → *Add to Home Screen*.

## Files

| Path | What it is |
|---|---|
| `index.html` | App shell: four screens and the bottom tab bar |
| `css/app.css` | Mobile layout on top of `lib/shared.css` (the extension's tokens, light and dark) |
| `js/app.js` | Routing, profile form (mirrors `options/options.js`), My sizes |
| `js/converter-view.js` | Converter (port of `popup/converter-view.js`) |
| `js/paste.js` | Turns pasted chart text into rows for `lib/table.js` |
| `js/check-view.js` | Check-a-chart screen |
| `js/storage-shim.js` | `chrome.storage` to `localStorage` |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA: offline cache, install metadata, icons |
| `vercel.json`, `.vercelignore` | Vercel deployment config |
| `lib/` | Copied from the extension by `sync-lib.js` |
