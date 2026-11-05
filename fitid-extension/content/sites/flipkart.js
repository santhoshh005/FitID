// FitID — Flipkart: loads the product's own size-chart page (/rv/sizechart?pid=…) in a hidden frame and reads its table.
(function (g) {
  const F = g.FitID;
  let lastPid = null;

  function pid() {
    const p = new URLSearchParams(location.search).get('pid');
    if (p) return p;
    const a = document.querySelector('a[href*="sizechart?pid="]');
    return a ? new URL(a.href, location.href).searchParams.get('pid') : null;
  }

  async function tableFromFrame(id) {
    const f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.tabIndex = -1;
    f.style.cssText = 'position:fixed;left:-10000px;top:0;width:900px;height:700px;opacity:0;pointer-events:none;border:0';
    f.src = '/rv/sizechart?pid=' + encodeURIComponent(id);
    document.body.appendChild(f);
    try {
      for (let i = 0; i < 30; i++) {
        await F.wait(400);
        let doc;
        try { doc = f.contentDocument; } catch (e) { return null; }
        if (!doc || !doc.body) continue;
        const scans = F.table.scan(doc, doc.body.innerText.slice(0, 2000));
        if (scans.length) return scans[0];
      }
      return null;
    } finally {
      f.remove();
    }
  }

  function isProductPage() {
    return /\/p\/itm/.test(location.pathname) || /\/rv\/sizechart/.test(location.pathname);
  }

  function hasSizes() {
    // only clothing / shoes have a size chart link
    return !!document.querySelector('a[href*="sizechart"]') || /\/rv\/sizechart/.test(location.pathname);
  }

  async function run(force) {
    if (!isProductPage()) { lastPid = null; F.ui.hide(); return; }
    // wait for the page to render its size selector
    for (let i = 0; i < 10 && !hasSizes(); i++) await F.wait(500);
    if (!hasSizes()) { F.ui.hide(); return; }
    const id = pid();
    if (!id || (id === lastPid && !force)) return;
    lastPid = id;
    F.ui.loading();
    let scan = null;
    if (/\/rv\/sizechart/.test(location.pathname)) {
      for (let i = 0; i < 20 && !scan; i++) { scan = F.table.scan(document, document.body.innerText.slice(0, 2000))[0]; if (!scan) await F.wait(400); }
    } else {
      scan = await tableFromFrame(id);
    }
    if (!scan) { F.ui.message('Flipkart', 'This product has no size chart with measurements.'); return; }
    const title = (document.querySelector('h1') || {}).innerText || document.title.split(' - ')[0];
    const chart = F.chartFromScan(scan, {
      brand: F.metaBrand() !== 'Flipkart' ? F.metaBrand() : title.split(' ')[0],
      product: title,
      hint: title,
      chart: { site: 'flipkart', type: scan.ctx.type || 'body' },
    });
    await F.present(chart);
  }

  F._rerun = () => run(true);
  if (!g.__FITID_TEST__) F.onUrlChange(() => run(false));
})(globalThis);
