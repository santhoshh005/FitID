// FitID — Myntra: reads per-size measurements from Myntra's product API (same data as its size chart).
(function (g) {
  const F = g.FitID;
  const U = F.units;
  let lastId = null;

  function productId() {
    const m = location.pathname.match(/\/(\d{5,})\/buy\/?$/);
    return m ? m[1] : null;
  }

  function toChart(style) {
    const attrs = style.articleAttributes || {};
    const an = style.analytics || {};
    const gender = F.engine.detectGender(an.gender || '') || (/unisex/i.test(an.gender || '') ? 'unisex' : null);
    const hint = [an.articleType, an.subCategory, an.masterCategory, style.name].filter(Boolean).join(' ');
    const fitText = [attrs.Fit, attrs['Fit Type'], attrs.Type, style.name].filter(Boolean).join(' ');
    const bodyOrGarment = String(attrs['Body or Garment Size'] || '').toLowerCase();
    const sizes = (style.sizes || []).map((s) => {
      const alt = {};
      (s.allSizesList || []).forEach((a) => {
        const k = U.systemKey(String(a.scaleCode || '').replace(/_size$/, ''));
        if (k) alt[k] = a.sizeValue;
      });
      const m = {};
      (s.measurements || []).forEach((x) => {
        const key = U.measureKey(x.name);
        if (!key || m[key]) return;
        const unit = /inch/i.test(x.unit) ? 'in' : /cm|centi/i.test(x.unit) ? 'cm' : 'in';
        const lo = parseFloat(x.minValue != null ? x.minValue : x.value);
        const hi = parseFloat(x.maxValue != null ? x.maxValue : x.value);
        if (isNaN(lo)) return;
        let type = String(x.type || x.measurementType || '').toUpperCase() === 'BODY' ? 'body' : 'garment';
        if (!x.type && !x.measurementType) type = /to-?fit|body/.test(bodyOrGarment) ? 'body' : 'garment';
        m[key] = { min: U.toCm(lo, unit), max: U.toCm(isNaN(hi) ? lo : hi, unit), type };
      });
      return { label: s.label, available: s.available !== false, alt, m };
    });
    return {
      site: 'myntra',
      brand: (style.brand && style.brand.name) || an.brand,
      product: style.name,
      hint,
      gender: gender === 'unisex' ? null : gender,
      fit: F.engine.detectFit(fitText),
      url: location.href.split('?')[0],
      sizes,
    };
  }

  const findButton = (label) => {
    const scope = document.querySelector('.size-buttons-size-container, .size-buttons-container, [class*="size-buttons"]');
    return F.findSizeButton(label, scope || document);
  };

  async function run(force) {
    const id = productId();
    if (!id) { lastId = null; F.ui.hide(); return; }
    if (id === lastId && !force) return;
    lastId = id;
    F.ui.loading();
    try {
      const res = await fetch('/gateway/v2/product/' + id, { credentials: 'include', headers: { accept: 'application/json' } });
      const json = await res.json();
      const style = json.style || (g.__myx && g.__myx.pdpData);
      if (!style) throw new Error('no product data');
      await F.present(toChart(style), { findButton });
    } catch (e) {
      F.ui.message('Myntra', 'Couldn’t read this product’s size chart. Try reloading the page.');
    }
  }

  F._rerun = () => run(true);
  F.myntra = { toChart };
  if (!g.__FITID_TEST__) F.onUrlChange(() => run(false));
})(globalThis);
