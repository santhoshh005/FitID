(function () {
  const F = globalThis.FitID;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CAT = { top: 'Topwear', bottom: 'Bottomwear', dress: 'Dresses', bra: 'Lingerie', shoe: 'Footwear', unknown: 'Clothing' };
  const FILES = ['lib/units.js', 'lib/standards.js', 'lib/engine.js', 'lib/profile.js', 'lib/table.js', 'lib/brands.js', 'content/ui.js', 'content/common.js', 'content/sites/generic.js'];

  $('#edit').onclick = () => chrome.runtime.openOptionsPage();

  async function scanThisPage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !/^https?:/.test(tab.url || '')) return;
    try {
      const [{ result: hasRunner }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => !!(globalThis.FitID && globalThis.FitID._rerun),
      });
      if (!hasRunner) {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => { globalThis.__FITID_MANUAL__ = true; } });
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: FILES });
      }
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => (globalThis.FitID.generic ? globalThis.FitID.generic.scanAndShow(true) : globalThis.FitID._rerun()),
      });
      window.close();
    } catch (e) {
      $('#scanmsg').textContent = 'FitID can’t run on this page.';
    }
  }

  async function render() {
    const profile = await F.profile.load();
    const c = $('#content');
    if (!F.profile.isComplete(profile)) {
      c.innerHTML = `<div class="empty"><h1>Enter it once.</h1><p>Create your size profile and FitID shows your size on every product page, from Myntra and AJIO to Flipkart and Amazon.</p><button class="btn primary" id="create">Create my size profile</button></div>`;
      $('#create').onclick = () => chrome.runtime.openOptionsPage();
      return;
    }
    const hist = Object.values(await F.profile.history()).sort((a, b) => b.date - a.date).slice(0, 12);
    const brands = hist.length
      ? `<div class="brands">${hist.map((h) => {
          const alt = h.category === 'shoe' && h.alt ? ['UK', 'US', 'EU'].filter((k) => h.alt[k] != null && String(h.alt[k]) !== String(h.size)).map((k) => k + ' ' + h.alt[k]).join(' · ') : '';
          return `<a class="b" href="${esc(h.url)}" target="_blank" rel="noopener"><span class="sz">${esc(h.size)}</span><span><div class="nm">${esc(h.brand)}</div><div class="sub">${esc(CAT[h.category] || '')} · ${esc(h.site)}${alt ? ' · ' + esc(alt) : ''}</div></span></a>`;
        }).join('')}</div><p class="small" style="margin-top:8px"><button class="link" id="clear">Clear history</button></p>`
      : `<p class="small">Open a product on Myntra, AJIO, Flipkart or Amazon. Your size for each brand will be listed here.</p>`;
    const top = F.brands.mySizes(profile);
    const topHtml = top.length ? `<div class="brands">${top.map(({ chart, rec }) => {
      const a = rec.size.alt || {};
      const alt = ['UK', 'US', 'EU'].filter((k) => a[k] != null && k !== rec.size.labelSys && String(a[k]) !== String(rec.size.label)).map((k) => k + ' ' + a[k]).join(' · ');
      const conf = { high: '', medium: ' · good match', low: ' · rough match' }[rec.confidence];
      const shown = rec.size.labelSys ? rec.size.labelSys + ' ' + rec.size.label : rec.size.label;
      return `<a class="b" href="${esc(chart.source)}" target="_blank" rel="noopener"><span class="sz">${esc(shown)}</span><span><div class="nm">${esc(chart.brand)}</div><div class="sub">${esc(chart.note)}${alt ? ' · ' + esc(alt) : ''}${esc(conf)}</div></span></a>`;
    }).join('')}</div><p class="small" style="margin-top:6px">From each brand’s official size chart.</p>` : '';
    c.innerHTML = `
      <h2>My size at top brands</h2>${topHtml}
      <h2>My sizes</h2>${F.renderSummary(profile)}
      <div class="actions"><button class="btn primary" id="scan">Find my size on this page</button></div>
      <p class="small" id="scanmsg">For any other store: open its size guide, then click the button above.</p>
      <h2>My size by brand</h2>${brands}`;
    $('#scan').onclick = scanThisPage;
    const clr = $('#clear');
    if (clr) clr.onclick = async () => { await F.profile.clearHistory(); render(); };
  }

  render();
})();
