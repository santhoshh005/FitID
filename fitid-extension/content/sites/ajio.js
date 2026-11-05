// FitID — AJIO: reads the structured size guide embedded in AJIO's product API.
(function (g) {
  const F = g.FitID;
  const U = F.units;
  let lastCode = null;

  function productCode() {
    const m = location.pathname.match(/\/p\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : null;
  }

  function findKey(obj, key, depth) {
    if (!obj || typeof obj !== 'object' || (depth || 0) > 8) return null;
    if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key]) return obj[key];
    for (const k of Object.keys(obj)) {
      const v = findKey(obj[k], key, (depth || 0) + 1);
      if (v) return v;
    }
    return null;
  }

  function parseGuide(raw) {
    let v = raw;
    for (let i = 0; i < 3 && typeof v === 'string'; i++) {
      try { v = JSON.parse(v); } catch (e) { return null; }
    }
    return v && typeof v === 'object' ? v : null;
  }

  function valueCm(attr, key) {
    const r = U.parseRange(attr.attributeValue);
    if (!r) return null;
    const conv = U.parseRange(attr.convertedAttributeValue);
    let unit;
    if (conv && r[1]) {
      const ratio = conv[1] / r[1];
      unit = ratio > 2 ? 'in' : ratio < 0.6 ? 'cm' : null;
    }
    if (!unit) {
      const floor = { foot: 15, shoulder: 25, inseam: 40 }[key] || 55;
      unit = r[1] > floor ? 'cm' : 'in';
    }
    return [U.toCm(r[0], unit), U.toCm(r[1], unit)];
  }

  function toChart(json) {
    const guide = parseGuide(findKey(json, 'sizeGuideDesktop') || findKey(json, 'sizeGuideMobile'));
    const charts = (guide && guide.sizechart) || [];
    // Prefer body measurements; otherwise the chart with the most measured sizes
    const ranked = charts.slice().sort((a, b) => {
      const body = (c) => (/body/i.test(c.measurementType || '') ? 1 : 0);
      return body(b) - body(a) || (b.brickBrandSizes || []).length - (a.brickBrandSizes || []).length;
    });
    const sc = ranked[0];
    const brand = json.brandName || (sc && sc.brandName) || (json.fnlProductData && json.fnlProductData.brandName);
    const hint = [sc && sc.brickName, json.brickName, json.brickSubCategory, json.brickCategory, json.name, sc && sc.gender].filter(Boolean).join(' ');
    const type = sc && /garment|product/i.test(sc.measurementType || '') ? 'garment' : 'body';
    const fit = F.engine.detectFit([guide && guide.fittingType, json.name].filter(Boolean).join(' '));

    let sizes = [];
    if (sc) {
      sizes = (sc.brickBrandSizes || []).map((s) => {
        const m = {}, alt = {};
        (s.sizeChartAttributes || []).forEach((a) => {
          const name = String(a.attributeName || '').replace(/_attribute$/i, '');
          const sys = U.systemKey(name);
          if (sys) { alt[sys] = a.attributeValue; return; }
          const key = U.measureKey(name) || (/^(cm|length)$/i.test(name.trim()) && /foot|shoe|sneaker|sandal|slipper|boot|loafer/i.test(hint) ? 'foot' : null);
          if (!key || m[key]) return;
          const v = valueCm(a, key);
          if (v) m[key] = { min: v[0], max: v[1], type: /to.?fit|body/i.test(name) || key === 'foot' ? 'body' : type };
        });
        return { label: s.sizeName, alt, m };
      });
    }
    // Fall back to just the size labels on the page
    if (!sizes.length) {
      const opts = findKey(json, 'variantOptions') || [];
      const labels = (Array.isArray(opts) ? opts : []).map((o) => o.scDisplaySize || (o.variantOptionQualifiers || []).find((q) => q.qualifier === 'size')?.value).filter(Boolean);
      sizes = labels.map((l) => ({ label: l, alt: {}, m: {} }));
    }
    const gender = F.engine.detectGender((sc && sc.gender) || hint);
    return { site: 'ajio', brand, product: json.name, hint, gender, fit, url: location.href.split('?')[0], sizes };
  }

  async function run(force) {
    const code = productCode();
    if (!code) { lastCode = null; F.ui.hide(); return; }
    if (code === lastCode && !force) return;
    lastCode = code;
    F.ui.loading();
    try {
      const res = await fetch('/api/p/' + encodeURIComponent(code), { credentials: 'include', headers: { accept: 'application/json' } });
      const json = await res.json();
      await F.present(toChart(json));
    } catch (e) {
      F.ui.message('AJIO', 'Couldn’t read this product’s size guide. Try reloading the page.');
    }
  }

  F._rerun = () => run(true);
  F.ajio = { toChart, parseGuide };
  if (!g.__FITID_TEST__) F.onUrlChange(() => run(false));
})(globalThis);
