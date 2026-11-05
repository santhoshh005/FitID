// FitID — Amazon: reads the brand size chart Amazon embeds on fashion product pages.
(function (g) {
  const F = g.FitID;
  let lastAsin = null;

  function asin() {
    const m = location.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i);
    return m ? m[1].toUpperCase() : null;
  }

  function measureType() {
    const text = Array.from(document.querySelectorAll('#productOverview_feature_div, .prodDetTable, #detailBullets_feature_div, #productFactsDesktop_feature_div, [id*="sizechart"]'))
      .map((e) => e.innerText || '').join(' ').toLowerCase();
    if (/garment size|garment measurement/.test(text)) return 'garment';
    if (/body size|body measurement|to fit/.test(text)) return 'body';
    return null;
  }

  function brand() {
    const b = document.querySelector('#bylineInfo');
    if (b) {
      const t = b.innerText.replace(/^visit the\s+/i, '').replace(/\s+store$/i, '').replace(/^brand:\s*/i, '').trim();
      if (t) return t;
    }
    return F.metaBrand();
  }

  function findTables() {
    const roots = document.querySelectorAll('[id^="fit-sizechartv2"], #sizeChartV2Data, [id*="a-popover-sizeChart"], [data-csa-c-content-id*="sizechart" i]');
    for (const r of roots) {
      const s = F.table.scan(r.tagName === 'TABLE' ? r.parentElement : r);
      if (s.length) return s;
    }
    return [];
  }

  async function run(force) {
    const id = asin();
    if (!id) { lastAsin = null; F.ui.hide(); return; }
    if (id === lastAsin && !force) return;
    let scans = [];
    for (let i = 0; i < 16 && !scans.length; i++) { scans = findTables(); if (!scans.length) await F.wait(500); }
    const hasSizeSelector = document.querySelector('#variation_size_name, #native_dropdown_selected_size_name, [id*="size_name"]');
    if (!scans.length) {
      if (hasSizeSelector) F.ui.message(brand(), 'No size chart with measurements on this listing. Open “Size Chart” on the page and FitID will read it.');
      // Watch for the user opening the size chart popover
      const obs = new MutationObserver(() => { if (findTables().length) { obs.disconnect(); lastAsin = null; run(true); } });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => obs.disconnect(), 60000);
      return;
    }
    lastAsin = id;
    const type = measureType();
    const scan = scans[0];
    // Amazon lists "Garment Size" in product details when the chart is product measurements
    if (type === 'garment' && scan.ctx.type !== 'body') {
      scan.sizes.forEach((s) => Object.entries(s.m).forEach(([k, m]) => { if (k !== 'foot') m.type = 'garment'; }));
    }
    const title = ((document.querySelector('#productTitle') || {}).innerText || document.title).trim();
    const crumbs = ((document.querySelector('#wayfinding-breadcrumbs_feature_div') || {}).innerText || '').replace(/\s+/g, ' ');
    const details = ((document.querySelector('#productOverview_feature_div, .prodDetTable') || {}).innerText || '').slice(0, 400);
    const chart = F.chartFromScan(scan, { brand: brand(), product: title, hint: [crumbs, title, details].join(' '), chart: { site: 'amazon' } });
    await F.present(chart);
  }

  F._rerun = () => { lastAsin = null; run(true); };
  if (!g.__FITID_TEST__) F.onUrlChange(() => run(false));
})(globalThis);
