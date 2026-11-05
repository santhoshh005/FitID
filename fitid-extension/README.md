# FitID: your universal size profile (Microsoft Edge extension)

> "A Medium at Zara doesn't fit like a Medium at H&M."

Enter your measurements once. On a product page, FitID reads that product's own size chart and shows **your size** in a small card. One click selects that size on the page.

## Build
```bash
powershell -ExecutionPolicy Bypass -File build.ps1
```
This creates `dist/fitid-extension/`, a clean copy with only the files the extension needs (it also checks that none are missing), and `dist/fitid-extension-<version>.zip`, the package to share or upload to Microsoft Edge Add-ons.

## Install in Microsoft Edge
1. Open `edge://extensions`
2. Turn on **Developer mode** (bottom-left)
3. Click **Load unpacked** and choose `dist/fitid-extension` (or this `fitid-extension` folder while developing). If someone sent you the zip, unzip it first and choose the unzipped folder.
4. The profile page opens. Enter height and weight (other measurements are optional) and click **Save profile**
5. Pin FitID from the puzzle-piece menu so you can open it from the toolbar

It also works in Chrome (`chrome://extensions`, same steps).

## Where it works
| Store | How FitID gets the size chart |
|---|---|
| **Myntra** | Product API: measurements for each size, plus UK/US/EU and foot length for shoes |
| **AJIO** | The size guide built into each product's data |
| **Flipkart** | Loads the product's `/rv/sizechart` page in the background and reads its table |
| **Amazon** (.in, .com, .co.uk, .ae and more) | The brand size-chart table on the product page |
| **About 50 other stores**: Meesho, Nykaa Fashion, Tata CLiQ, Zara, H&M, Uniqlo, Nike, Adidas, Puma, Bewakoof, Snitch, The Souled Store, Westside, Max, Lifestyle, Levi's, Bata, Campus, Decathlon, Zivame and others | Reads any size-guide table on the page, including when you open "Size guide" |
| **Any other site** | Open the size guide, click the FitID icon, then click **Find my size on this page** |

## My size at top brands
The popup lists your size at **H&M, Zara, Nike, U.S. Polo Assn., Adidas, Puma and Levi's** from each brand's official size chart, collected from the brand's own website in Nov 2026 (see `lib/brands.js`). It covers tops, jeans (Levi's) and shoes (Nike, Adidas, Puma, U.S. Polo) for men and women where the brand publishes them. Levi's publishes garment measurements (a size 32 jean measures 34 in at the waist), and FitID accounts for that on levi.in too. On hm.com and nike.com / nike.in, FitID also uses these charts on product pages when the page's size guide shows only part of the chart (H&M splits it into pages).

Stores that hide the size guide behind a button (Nykaa Fashion, Zara, U.S. Polo, H&M) get an **Open size guide** button on the FitID card. Once the guide is open, FitID reads it.

## Size converter (popup → Converter tab)
Converts between US / UK / EU / IT / India / letter sizes for **Men** (tops, jeans, shoes), **Women** (dresses & tops, jeans, shoes, bras) and **Kids** (clothing by age & height, shoes from infant to youth). When your profile matches the group, your own size is marked **YOU**.

## Size systems
- Letter sizes: XXS to 8XL
- Numeric waist sizes: 24 to 50 (jeans, trousers)
- Shoes: UK / US / EU / IND / foot length in cm (men's and women's)
- Women's dresses: UK / US / EU / IT
- Bras: UK/IN, US, EU (band and cup from underbust and bust)
- Garment measurements vs body ("to fit") measurements, with fit-type ease (slim / regular / relaxed / oversized)
- Your fit preference (snug / regular / loose), inches or cm, and height in "5'7" or cm

## How the matching works
1. Missing measurements are estimated from height and weight, and marked as estimated.
2. Garment measurements are converted to the body size they fit, using typical ease for the fit type.
3. Each size is scored on the important measurements. Chest counts most for tops, waist for bottoms, foot length for shoes. A size that's too small scores worse than one that's too big.
4. Bad chart data is ignored, for example a "hips" value that can't be right for that waist.
5. The card shows your size, how confident the match is, the measurements behind it, and any "between M and L" note.
6. Every brand you look at is saved, so the popup builds your **size by brand** list.

## Tests
```bash
node test/engine.test.js
```
```bash
node test/brands.test.js
```
```bash
node test/converter.test.js
```
`node test/serve.js` serves `test/demo.html` at http://localhost:8766/test/demo.html. That page runs the table reader and the size card on real Flipkart and Amazon tables.

## Privacy
Your profile is stored only in your browser's extension storage (synced through your Edge account if sync is on). Nothing is sent to any server. Size charts are read from the store page you're on.
