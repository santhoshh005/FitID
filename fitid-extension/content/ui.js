// FitID — the floating "Your size" card shown on product pages (Shadow DOM, so store CSS can't break it).
(function (g) {
  const F = (g.FitID = g.FitID || {});
  if (F.ui) return;
  const HOST_ID = 'fitid-size-card-host';
  let state = { minimized: false, dismissedFor: null, key: null };

  const CSS = `
  :host { all: initial; }
  * { box-sizing: border-box; font-family: "Segoe UI", system-ui, -apple-system, Roboto, sans-serif; }
  .wrap { position: fixed; right: 18px; bottom: 18px; z-index: 2147483646; color: #f4f4f5; }
  .card { width: 300px; background: #0b0b0c; border: 1px solid #2a2a2e; border-radius: 16px; padding: 14px 14px 12px; box-shadow: 0 12px 40px rgba(0,0,0,.45); animation: in .22s ease-out; }
  @keyframes in { from { transform: translateY(10px); opacity: 0 } to { transform: none; opacity: 1 } }
  .top { display: flex; align-items: center; gap: 8px; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #a1a1aa; }
  .logo { width: 20px; height: 20px; border-radius: 6px; background: #fff; color: #000; display: grid; place-items: center; font-weight: 800; font-size: 11px; letter-spacing: 0; }
  .x { margin-left: auto; background: none; border: 0; color: #71717a; cursor: pointer; font-size: 16px; line-height: 1; padding: 2px 4px; border-radius: 6px; }
  .x:hover { color: #fff; background: #1f1f23; }
  .row { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
  .size { min-width: 64px; height: 64px; padding: 0 10px; border-radius: 12px; background: #fff; color: #000; display: grid; place-items: center; font-weight: 800; font-size: 26px; }
  .size.long { font-size: 18px; }
  .meta { flex: 1; min-width: 0; }
  .brand { font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sub { font-size: 12px; color: #a1a1aa; margin-top: 2px; }
  .alt { font-size: 12px; color: #e4e4e7; margin-top: 4px; }
  .pill { display: inline-block; font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 999px; margin-top: 6px; letter-spacing: .03em; }
  .high { background: #14532d; color: #bbf7d0; } .medium { background: #3f3a12; color: #fde68a; } .low { background: #4c1d1d; color: #fecaca; }
  .note { margin-top: 10px; font-size: 12.5px; color: #fafafa; background: #18181b; border-radius: 10px; padding: 8px 10px; line-height: 1.4; }
  details { margin-top: 8px; font-size: 12px; color: #a1a1aa; }
  summary { cursor: pointer; outline: none; }
  details ul { margin: 6px 0 0; padding-left: 16px; line-height: 1.5; }
  .actions { display: flex; gap: 8px; margin-top: 12px; }
  button.b { flex: 1; border: 0; border-radius: 10px; padding: 9px 10px; font-weight: 700; font-size: 13px; cursor: pointer; }
  .primary { background: #fff; color: #000; } .primary:hover { background: #e4e4e7; }
  .ghost { background: #1f1f23; color: #f4f4f5; } .ghost:hover { background: #2a2a2e; }
  .chip { position: fixed; right: 18px; bottom: 18px; z-index: 2147483646; display: flex; align-items: center; gap: 8px; background: #0b0b0c; color: #fff; border: 1px solid #2a2a2e; border-radius: 999px; padding: 8px 14px 8px 8px; cursor: pointer; font-weight: 700; font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,.4); }
  .chip .size { min-width: 30px; height: 30px; font-size: 13px; border-radius: 999px; padding: 0 8px; }
  .muted { color: #a1a1aa; font-size: 13px; line-height: 1.45; margin-top: 10px; }
  .spin { width: 16px; height: 16px; border: 2px solid #3f3f46; border-top-color: #fff; border-radius: 50%; animation: s 0.8s linear infinite; }
  @keyframes s { to { transform: rotate(360deg) } }
  `;

  function host() {
    let h = document.getElementById(HOST_ID);
    if (!h) {
      h = document.createElement('div');
      h.id = HOST_ID;
      (document.body || document.documentElement).appendChild(h);
      const root = h.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = CSS;
      root.appendChild(style);
      const mount = document.createElement('div');
      mount.className = 'mount';
      root.appendChild(mount);
    }
    return h.shadowRoot.querySelector('.mount');
  }

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function hide() {
    const h = document.getElementById(HOST_ID);
    if (h) h.remove();
  }

  function loading(text) {
    const m = host();
    m.innerHTML = `<div class="wrap"><div class="card"><div class="top"><span class="logo">F</span> FitID <button class="x" title="Close">×</button></div>
      <div class="row"><div class="spin"></div><div class="muted" style="margin:0">${esc(text || 'Reading this product’s size chart…')}</div></div></div></div>`;
    m.querySelector('.x').onclick = hide;
  }

  function message(title, body, action) {
    const m = host();
    m.innerHTML = `<div class="wrap"><div class="card"><div class="top"><span class="logo">F</span> FitID <button class="x" title="Close">×</button></div>
      <div class="brand" style="margin-top:10px">${esc(title)}</div><div class="muted">${esc(body)}</div>
      ${action ? `<div class="actions"><button class="b primary act">${esc(action.label)}</button></div>` : ''}</div></div>`;
    m.querySelector('.x').onclick = hide;
    if (action) m.querySelector('.act').onclick = action.run;
  }

  function altText(size, category) {
    const a = size.alt || {};
    const parts = ['UK', 'US', 'EU', 'IN'].filter((k) => a[k] != null && a[k] !== '' && k !== size.labelSys && String(a[k]) !== String(size.label)).map((k) => `${k} ${a[k]}`);
    if (category === 'shoe' && size.m && size.m.foot) parts.push(`${Math.round(size.m.foot.max * 10) / 10} cm foot`);
    return parts.join(' · ');
  }

  function show(rec, chart, opts) {
    opts = opts || {};
    const key = (chart.url || location.href) + '|' + rec.size.label;
    if (state.dismissedFor === (chart.url || location.href)) return;
    state.key = key;
    const m = host();
    const label = rec.size.label;
    // Show the size system when the label is a bare number from a UK/US/EU column (e.g. "US 9")
    const shown = rec.size.labelSys ? `${rec.size.labelSys} ${label}` : label;
    const catName = { top: 'Topwear', bottom: 'Bottomwear', dress: 'Dresses', bra: 'Lingerie', shoe: 'Footwear', unknown: 'Clothing' }[rec.category] || 'Clothing';
    const conf = { high: 'Great match', medium: 'Good match', low: 'Rough match' }[rec.confidence];
    const sizeBtn = opts.findButton ? opts.findButton(label) : null;

    if (state.minimized) {
      m.innerHTML = `<div class="chip" title="FitID — your size"><span class="size">${esc(shown)}</span> Your size</div>`;
      m.querySelector('.chip').onclick = () => { state.minimized = false; show(rec, chart, opts); };
      return;
    }

    const alt = altText(rec.size, rec.category);
    m.innerHTML = `<div class="wrap"><div class="card">
      <div class="top"><span class="logo">F</span> Your size profile <button class="x min" title="Minimise">–</button><button class="x close" title="Hide on this page">×</button></div>
      <div class="row">
        <div class="size ${shown.length > 3 ? 'long' : ''}">${esc(shown)}</div>
        <div class="meta">
          <div class="brand">${esc(chart.brand || 'This product')}</div>
          <div class="sub">${esc(catName)}${rec.fit && rec.fit !== 'regular' ? ' · ' + esc(rec.fit) + ' fit' : ''}</div>
          ${alt ? `<div class="alt">${esc(alt)}</div>` : ''}
          <span class="pill ${rec.confidence}">${conf}</span>
        </div>
      </div>
      ${rec.note ? `<div class="note">${esc(rec.note)}</div>` : ''}
      <details><summary>Why this size</summary><ul>${rec.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></details>
      <div class="actions">
        ${sizeBtn ? `<button class="b primary sel">Select ${esc(label)}</button>` : ''}
        <button class="b ghost prof">Edit profile</button>
      </div>
    </div></div>`;
    m.querySelector('.close').onclick = () => { state.dismissedFor = chart.url || location.href; hide(); };
    m.querySelector('.min').onclick = () => { state.minimized = true; show(rec, chart, opts); };
    m.querySelector('.prof').onclick = () => F.openOptions();
    const sel = m.querySelector('.sel');
    if (sel) sel.onclick = () => {
      const b = opts.findButton(label);
      if (!b) return;
      if (b.tagName === 'OPTION') {
        const s = b.parentElement.closest('select') || b.parentElement;
        s.value = b.value;
        s.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        b.scrollIntoView({ block: 'center', behavior: 'smooth' });
        b.click();
      }
      sel.textContent = 'Selected ✓';
    };
  }

  F.openOptions = function () {
    try { chrome.runtime.sendMessage({ type: 'fitid:openOptions' }); } catch (e) { /* extension reloaded */ }
  };

  // Generic size-button finder: matches visible buttons / list items / options whose text is the size label
  F.findSizeButton = function (label, root) {
    const want = String(label).trim().toLowerCase();
    const els = (root || document).querySelectorAll('button, [role="button"], [role="radio"], li, label, option, a, span, p, div');
    let best = null;
    for (const el of els) {
      if (el.closest('#' + HOST_ID)) continue;
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (!t || t.length > 24) continue;
      const first = t.split(/[\s(]/)[0];
      if (t === want || first === want || t === 'uk ' + want || t === 'size ' + want) {
        if (el.tagName === 'OPTION') return el;
        const clickable = el.closest('button, [role="button"], [role="radio"], li, label, a') || el;
        if (clickable.offsetParent === null) continue;
        if (!best || clickable.contains(best)) best = clickable;
      }
    }
    return best;
  };

  F.ui = { show, hide, loading, message };
})(globalThis);
