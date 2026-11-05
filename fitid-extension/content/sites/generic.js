// FitID — any other store: finds a size-guide table on the page (including one that appears when
// you open "Size guide") and shows your size. Also used by the popup's "Find my size on this page".
// On H&M, Zara, Nike and U.S. Polo Assn. it can fall back to the brand's official chart built into FitID.
(function (g) {
  const F = g.FitID;
  let lastSig = null;
  let timer = null;
  let nudgedFor = null;

  function signature(scan) {
    return location.href.split('#')[0] + '|' + scan.sizes.map((s) => s.label).join(',');
  }

  function pageContext() {
    const h1 = document.querySelector('h1');
    const crumbs = Array.from(document.querySelectorAll('nav[aria-label*="read" i] a, .breadcrumb a, [class*="breadcrumb"] a')).map((a) => a.textContent.trim()).join(' ');
    return {
      brand: F.metaBrand(),
      product: h1 ? h1.innerText.trim() : document.title,
      hint: [crumbs, h1 && h1.innerText, document.title, location.pathname.replace(/[\/\-_.]/g, ' ')].filter(Boolean).join(' '),
    };
  }

  function sizeGuideButton() {
    const els = document.querySelectorAll('button, a, [role="button"], span, div');
    for (const el of els) {
      if (el.closest('#fitid-size-card-host')) continue;
      const t = (el.textContent || '').trim();
      if (t.length < 25 && /^(size guide|size chart|size charts|sizing guide|find your size|product measurements|size & fit|size and fit)$/i.test(t) && el.offsetParent !== null) {
        return el.closest('button, a, [role="button"]') || el;
      }
    }
    return null;
  }

  function isProductPage() {
    return !!(document.querySelector('meta[property="og:type"][content*="product" i]') ||
      document.querySelector('script[type="application/ld+json"]') && /"@type"\s*:\s*"Product"/.test(Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => s.textContent).join(' ')) ||
      /\/(p|product|products|productpage|dp)[\/.]/i.test(location.pathname) || /-p\d{6,}\.html/.test(location.pathname));
  }

  async function scanAndShow(manual) {
    const ctx = pageContext();
    const scans = F.table.scan(document, document.title);
    const usable = scans.filter((s) => s.sizes.some((x) => Object.keys(x.m).length) || s.sizes.some((x) => Object.keys(x.alt).length));
    let scan = usable[0] || null;
    // Some brands (Levi's) publish product measurements without labelling them as such
    if (scan && F.brands && F.brands.hostType(location.hostname) === 'garment' && scan.ctx.type !== 'body') {
      scan.sizes.forEach((s) => Object.entries(s.m).forEach(([k, m]) => { if (k !== 'foot') m.type = 'garment'; }));
    }

    // Built-in official chart for this brand's own site (used when the page shows only part of it)
    const gender = F.engine.detectGender(ctx.hint);
    const category = F.engine.detectCategory({ hint: ctx.hint, sizes: scan ? scan.sizes : [] });
    const builtIn = F.brands ? F.brands.forHost(location.hostname, category, gender === 'women' ? 'women' : gender === 'men' ? 'men' : null) : null;
    const partial = scan && builtIn && scan.sizes.length < Math.min(5, builtIn.sizes.length);

    if (!scan || partial) {
      if (builtIn && isProductPage()) {
        const sig = location.href.split('#')[0] + '|builtin';
        if (!manual && sig === lastSig) return true;
        lastSig = sig;
        const chart = Object.assign({}, builtIn, { product: ctx.product, url: location.href, hint: ctx.hint + ' ' + builtIn.note, viaBuiltIn: true });
        await F.present(chart, { quietOnFail: !manual });
        return true;
      }
      if (!scan) {
        const btn = sizeGuideButton();
        if (manual) {
          F.ui.message('No size chart found yet', 'Open the store’s “Size guide” on this product, then click “Find my size on this page” again.', btn ? { label: 'Open size guide', run: () => btn.click() } : null);
        } else if (btn && isProductPage() && nudgedFor !== location.href) {
          nudgedFor = location.href;
          const profile = await F.profile.load();
          if (F.profile.isComplete(profile)) {
            F.ui.message('See your size', 'Open this product’s size guide and FitID will match it to your profile.', { label: 'Open size guide', run: () => btn.click() });
          }
        }
        return false;
      }
    }

    const sig = signature(scan);
    if (!manual && sig === lastSig) return true;
    lastSig = sig;
    const chart = F.chartFromScan(scan, Object.assign({}, ctx, { chart: { site: location.hostname.replace(/^www\./, '') } }));
    await F.present(chart, { quietOnFail: !manual });
    return true;
  }

  function watch() {
    const obs = new MutationObserver((muts) => {
      // ignore our own card
      if (muts.every((m) => m.target && m.target.closest && m.target.closest('#fitid-size-card-host'))) return;
      clearTimeout(timer);
      timer = setTimeout(() => scanAndShow(false), 700);
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  F._rerun = () => scanAndShow(true);
  F.generic = { scanAndShow };
  if (!g.__FITID_TEST__ && !g.__FITID_MANUAL__) {
    F.onUrlChange(() => { lastSig = null; setTimeout(() => scanAndShow(false), 1200); });
    watch();
  }
})(globalThis);
