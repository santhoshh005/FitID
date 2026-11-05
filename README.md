# FitID: one size profile, every brand

Clothing sizes don't match across brands: a Medium at Zara doesn't fit like a Medium at H&M. With FitID you enter your measurements once (height, chest, waist, shoulders), and its size-matching engine recommends the right size for each brand. That means fewer returns.

| Folder | What it is |
|---|---|
| [`fitid-extension/`](fitid-extension) | Microsoft Edge / Chrome extension. It reads the size chart on Myntra, AJIO, Flipkart, Amazon and about 50 other stores and shows your size on the product page. |
| [`fitid-web/`](fitid-web) | Mobile website (installable PWA) for shopping on your phone: your sizes at top brands, a size converter, and a checker for pasted size charts. It's deployed on Vercel with Root Directory `fitid-web`. |

The website reuses the extension's libraries. After changing anything in `fitid-extension/lib/`, run:

```bash
node fitid-web/sync-lib.js
```

Then commit and push. Vercel redeploys the site.

Tests:

```bash
node fitid-extension/test/engine.test.js && node fitid-extension/test/brands.test.js && node fitid-extension/test/converter.test.js && node fitid-web/test/paste.test.js
```
