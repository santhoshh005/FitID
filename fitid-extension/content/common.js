// FitID — shared runner for every store: profile -> engine -> card -> history.
(function (g) {
  const F = (g.FitID = g.FitID || {});
  if (F.present) return;

  // Show a recommendation for a chart read from the page.
  F.present = async function (chart, opts) {
    opts = opts || {};
    const profile = await F.profile.load();
    if (!F.profile.isComplete(profile)) {
      F.ui.message('Find your size instantly', 'Enter your measurements once. FitID then shows your size on every product page.', {
        label: 'Create my size profile', run: () => F.openOptions(),
      });
      return null;
    }
    const rec = F.engine.recommend(chart, profile);
    if (!rec.ok) {
      if (opts.quietOnFail) { F.ui.hide(); return rec; }
      F.ui.message(chart.brand || 'FitID', rec.reason);
      return rec;
    }
    F.ui.show(rec, chart, { findButton: opts.findButton || ((l) => F.findSizeButton(l)) });
    try {
      await F.profile.remember({
        brand: chart.brand || location.hostname.replace(/^www\./, ''),
        site: location.hostname.replace(/^www\./, ''),
        category: rec.category,
        size: rec.size.labelSys ? rec.size.labelSys + ' ' + rec.size.label : rec.size.label,
        alt: rec.size.alt || {},
        confidence: rec.confidence,
        product: chart.product || document.title.slice(0, 80),
        url: location.href.split('#')[0],
      });
    } catch (e) { /* storage unavailable */ }
    return rec;
  };

  // Call fn whenever the URL changes (stores are single-page apps)
  F.onUrlChange = function (fn) {
    let last = location.href;
    fn();
    setInterval(() => {
      if (location.href !== last) { last = location.href; fn(); }
    }, 800);
  };

  // Re-run when the profile is edited
  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.profile && F._rerun) F._rerun();
    });
  } catch (e) { /* not in extension context */ }

  // Build a chart from a scanned table plus page context
  F.chartFromScan = function (scan, extra) {
    extra = extra || {};
    return Object.assign({
      brand: extra.brand || null,
      product: extra.product || document.title,
      hint: [extra.hint, document.title, scan.ctx.text.slice(0, 300)].filter(Boolean).join(' '),
      url: location.href,
      sizes: scan.sizes,
    }, extra.chart || {});
  };

  F.metaBrand = function () {
    const sel = ['meta[property="product:brand"]', 'meta[itemprop="brand"]', 'meta[name="brand"]'];
    for (const s of sel) { const m = document.querySelector(s); if (m && m.content) return m.content; }
    try {
      for (const s of document.querySelectorAll('script[type="application/ld+json"]')) {
        const j = JSON.parse(s.textContent);
        const items = Array.isArray(j) ? j : j['@graph'] || [j];
        for (const it of items) {
          if (it && it.brand) return typeof it.brand === 'string' ? it.brand : it.brand.name;
        }
      }
    } catch (e) { /* ignore */ }
    const og = document.querySelector('meta[property="og:site_name"]');
    return og ? og.content : location.hostname.replace(/^www\./, '').split('.')[0];
  };

  F.wait = (ms) => new Promise((r) => setTimeout(r, ms));
})(globalThis);
