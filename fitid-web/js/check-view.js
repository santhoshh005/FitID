// FitID web — "Check a size chart": paste a chart copied from a shopping app, or type the sizes in,
// then run the extension's engine (FitID.engine.recommend) on it.
(function () {
  const F = globalThis.FitID;
  const W = globalThis.FitIDWeb;
  const P = globalThis.FitIDPaste;
  const U = F.units;
  const esc = W.esc;
  const root = document.querySelector('#check');

  const COLS = {
    top: [['chest', 'Chest'], ['shoulder', 'Shoulder'], ['waist', 'Waist']],
    bottom: [['waist', 'Waist'], ['hips', 'Hips']],
    dress: [['chest', 'Bust'], ['waist', 'Waist'], ['hips', 'Hips']],
    shoe: [['foot', 'Foot cm']],
  };
  const DEFAULT_LABELS = { clothing: ['S', 'M', 'L', 'XL'], shoe: ['6', '7', '8', '9', '10'] };
  const EXAMPLE = 'Size\tTo Fit Chest (in)\tTo Fit Waist (in)\tAcross Shoulder (in)\nS\t36-38\t30-32\t16.5\nM\t38-40\t32-34\t17.5\nL\t40-42\t34-36\t18.5\nXL\t42-44\t36-38\t19.5\nXXL\t44-46\t38-40\t20.5';

  const state = {
    mode: 'paste', cat: 'auto', gridCat: 'top', type: 'auto', unit: 'auto', fit: 'auto', product: '', text: '',
    rows: DEFAULT_LABELS.clothing.map((label) => ({ label, v: {} })),
  };
  let profile = null;
  let result = '';

  const seg = (name, value, opts) => `<div class="seg" role="radiogroup" data-seg="${name}">${opts.map(([v, l]) =>
    `<button type="button" data-v="${v}" aria-pressed="${v === value}">${esc(l)}</button>`).join('')}</div>`;
  const catOf = () => state.gridCat; // typed grid always has an explicit category

  function gridHtml() {
    const cat = catOf();
    const cols = COLS[cat];
    const u = state.unit === 'cm' ? 'cm' : state.unit === 'in' ? 'in' : 'in/cm';
    const head = `<tr><th>${cat === 'shoe' ? 'UK size' : 'Size'}</th>${cols.map(([, n]) => `<th>${esc(n)}${n.endsWith('cm') ? '' : ' (' + u + ')'}</th>`).join('')}<th></th></tr>`;
    const body = state.rows.map((r, i) => `<tr data-i="${i}"><td><input data-k="label" value="${esc(r.label)}" aria-label="Size ${i + 1}" autocapitalize="characters"></td>${cols.map(([k, n]) =>
      `<td><input data-k="${k}" value="${esc(r.v[k] || '')}" inputmode="text" placeholder="${k === 'foot' ? '26.2' : '38-40'}" aria-label="${esc(n)} for size ${i + 1}"></td>`).join('')}<td><button type="button" class="del" data-del="${i}" aria-label="Remove row">×</button></td></tr>`).join('');
    return `<table class="grid-in"><thead>${head}</thead><tbody>${body}</tbody></table>
      <button type="button" class="btn ghost" id="addrow" style="margin-top:4px;font-size:13px;padding:8px 12px">+ Add size</button>
      <p class="hint" style="margin:8px 0 0">Type a single number (38) or a range (38-40). Leave a column empty if the store doesn’t list it.</p>`;
  }

  function render() {
    const paste = state.mode === 'paste';
    const cats = [['top', 'Top'], ['bottom', 'Bottom'], ['dress', 'Dress'], ['shoe', 'Shoes']];
    root.innerHTML = `
      ${profile ? '' : `<div class="card"><p style="margin:0"><b>First, your profile.</b> FitID compares the chart with your measurements. <a href="#profile">Enter them once →</a></p></div>`}
      <div class="card">
        ${seg('mode', state.mode, [['paste', 'Paste a chart'], ['type', 'Type it in']])}
        <div style="margin-top:14px">${paste ? `
          <label class="field"><span class="label">Size chart text</span>
            <textarea id="paste" placeholder="Open the product’s Size Chart in the app, select the table, Copy, then paste here." spellcheck="false">${esc(state.text)}</textarea>
          </label>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="btn ghost" id="clip" style="font-size:13px;padding:8px 12px">Paste from clipboard</button>
            <button type="button" class="btn ghost" id="example" style="font-size:13px;padding:8px 12px">Try an example</button>
          </div>` : gridHtml()}
        </div>
      </div>
      <div class="card opts">
        <div class="field" style="margin:0"><span class="label">What is it?</span>${seg('cat', paste ? state.cat : state.gridCat, (paste ? [['auto', 'Auto']] : []).concat(cats))}</div>
        <label class="field" style="margin:0"><span class="label">Product name <span class="badge">optional</span></span>
          <div class="inp"><input id="product" value="${esc(state.product)}" placeholder="e.g. Slim fit cotton shirt"></div>
          <span class="hint">Words like slim, oversized or relaxed help FitID allow for the fit.</span></label>
        <div class="field" style="margin:0"><span class="label">Measurements are</span>${seg('type', state.type, [['auto', 'Not sure'], ['body', 'Body (to fit)'], ['garment', 'Garment']])}</div>
        <div class="field" style="margin:0"><span class="label">Units</span>${seg('unit', state.unit, [['auto', 'Auto'], ['in', 'Inches'], ['cm', 'cm']])}</div>
        <button type="button" class="btn primary block" id="go">Find my size</button>
      </div>
      <div id="answer">${result}</div>
      <div class="card promo">
        <h2>On a laptop or PC? Get the extension</h2>
        <p style="margin:0">The FitID extension for Microsoft Edge (and Chrome) reads the size chart on Myntra, AJIO, Flipkart, Amazon and about 50 other stores by itself and shows your size right on the product page. Same profile, no copy-paste.</p>
        <p style="margin:10px 0 0"><a href="demo/" target="_blank" rel="noopener"><b>See how it works →</b></a> A step-by-step demo with real screenshots.</p>
        <ol>
          <li><a href="downloads/fitid-extension.zip" download><b>Download the extension</b></a> (zip, about 50 KB), then unzip it. Source: <a href="https://github.com/santhoshh005/FitID/tree/main/fitid-extension" target="_blank" rel="noopener">GitHub</a>.</li>
          <li>Open <code>edge://extensions</code>, turn on <b>Developer mode</b>.</li>
          <li>Click <b>Load unpacked</b> and pick the unzipped folder.</li>
        </ol>
      </div>`;
    bind();
  }

  function bind() {
    root.querySelectorAll('[data-seg]').forEach((g) => g.querySelectorAll('button').forEach((b) => (b.onclick = () => {
      const name = g.dataset.seg, v = b.dataset.v;
      if (name === 'cat' && state.mode === 'type') {
        const wasShoe = catOf() === 'shoe';
        state.gridCat = v;
        if ((v === 'shoe') !== wasShoe) state.rows = DEFAULT_LABELS[v === 'shoe' ? 'shoe' : 'clothing'].map((label) => ({ label, v: {} }));
      } else state[name] = v;
      render();
    })));
    const ta = root.querySelector('#paste');
    if (ta) ta.oninput = () => { state.text = ta.value; };
    const ex = root.querySelector('#example');
    if (ex) ex.onclick = () => { state.text = EXAMPLE; state.product = 'Regular fit cotton T-shirt'; render(); };
    const clip = root.querySelector('#clip');
    if (clip) {
      clip.hidden = !(navigator.clipboard && navigator.clipboard.readText);
      clip.onclick = async () => {
        try { state.text = await navigator.clipboard.readText(); render(); } catch (e) { W.toast('Long-press the box and tap Paste instead.'); }
      };
    }
    root.querySelector('#product').oninput = (e) => { state.product = e.target.value; };
    root.querySelectorAll('.grid-in input').forEach((inp) => (inp.oninput = () => {
      const r = state.rows[Number(inp.closest('tr').dataset.i)];
      if (inp.dataset.k === 'label') r.label = inp.value; else r.v[inp.dataset.k] = inp.value;
    }));
    root.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { state.rows.splice(Number(b.dataset.del), 1); render(); }));
    const add = root.querySelector('#addrow');
    if (add) add.onclick = () => {
      const last = state.rows[state.rows.length - 1];
      const order = U.LETTER_ORDER;
      let label = '';
      if (last) {
        const i = order.indexOf(U.normLetter(last.label));
        if (i >= 0 && order[i + 1]) label = order[i + 1].toUpperCase().replace(/^XXX+L$/, (m) => (m.length - 1) + 'XL');
        else if (!isNaN(parseFloat(last.label))) label = String(parseFloat(last.label) + 1);
      }
      state.rows.push({ label, v: {} });
      render();
      const inputs = root.querySelectorAll('.grid-in tbody tr:last-child input');
      if (inputs[1]) inputs[1].focus();
    };
    root.querySelector('#go').onclick = run;
  }

  // --------- typed grid -> chart sizes ---------
  function gridSizes() {
    const cat = catOf();
    const type = state.type === 'garment' ? 'garment' : 'body';
    const keys = COLS[cat].map(([k]) => k);
    const unitFor = (k) => {
      if (k === 'foot') return 'cm';
      if (state.unit !== 'auto') return state.unit;
      const vals = state.rows.map((r) => U.parseRange(r.v[k])).filter(Boolean).map((x) => x[1]);
      const floor = { chest: 55, waist: 45, hips: 55, shoulder: 25 }[k] || 50;
      return vals.length && Math.max.apply(null, vals) > floor ? 'cm' : 'in';
    };
    const units = Object.fromEntries(keys.map((k) => [k, unitFor(k)]));
    return state.rows.filter((r) => String(r.label).trim()).map((r) => {
      const label = String(r.label).trim();
      const s = { label, alt: {}, m: {} };
      if (cat === 'shoe') { s.labelSys = 'UK'; s.alt.UK = label.replace(/^uk\s*/i, ''); s.label = s.alt.UK; }
      for (const k of keys) {
        const rg = U.parseRange(r.v[k]);
        if (rg) s.m[k] = { min: U.toCm(rg[0], units[k]), max: U.toCm(rg[1], units[k]), type: k === 'foot' ? 'body' : type };
      }
      return s;
    });
  }

  function run() {
    if (!profile) { result = `<div class="card"><p class="err-box" style="margin:0">Add your measurements first. <a href="#profile">Go to Profile →</a></p></div>`; return show(); }
    let sizes, parsed = null;
    if (state.mode === 'paste') {
      if (!state.text.trim()) { result = errCard('Paste a size chart first, or tap “Try an example”.'); return show(); }
      parsed = P.parse(state.text, { unit: state.unit, type: state.type });
      sizes = parsed.sizes;
      if (!sizes) {
        result = errCard('Couldn’t read a size chart from that text. It needs the size names (S, M, L… or UK 7, 8…) and a header such as Chest, Waist or Foot length. You can also switch to “Type it in”.');
        return show();
      }
    } else {
      sizes = gridSizes();
      if (sizes.length < 1) { result = errCard('Add at least one size with a measurement.'); return show(); }
    }
    const cat = state.mode === 'type' ? state.gridCat : state.cat;
    const chart = { brand: 'This product', hint: state.product, gender: profile.gender === 'women' ? 'women' : 'men', sizes };
    if (cat !== 'auto') chart.category = cat;
    if (state.fit !== 'auto') chart.fit = state.fit;
    let rec = F.engine.recommend(chart, profile);
    if (!rec.ok && chart.category && state.mode === 'paste') { // picked type doesn't match the chart: let FitID detect it
      delete chart.category;
      rec = F.engine.recommend(chart, profile);
    }
    result = rec.ok ? answerCard(rec, sizes) : errCard(rec.reason || 'No match.');
    show();
  }

  function show() {
    const el = root.querySelector('#answer');
    el.innerHTML = result;
    if (result) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const errCard = (msg) => `<div class="card"><p class="err-box" style="margin:0">${esc(msg)}</p></div>`;

  function answerCard(rec, sizes) {
    const lab = (s) => (s.labelSys ? s.labelSys + ' ' : '') + s.label;
    const shown = lab(rec.size);
    const conf = { high: 'Best fit', medium: 'Good match', low: 'Rough match' }[rec.confidence];
    const CAT = W.CAT;
    const unit = profile.unit === 'cm' ? 'cm' : 'in';
    const keys = Array.from(new Set([].concat(...sizes.map((s) => Object.keys(s.m)))));
    const alts = Array.from(new Set([].concat(...sizes.map((s) => Object.keys(s.alt || {}))))).filter((k) => !sizes.every((s) => s.labelSys === k));
    const fmtR = (m, k) => { if (!m) return '—'; const u = k === 'foot' ? 'cm' : unit; const d = k === 'foot' ? 1 : undefined; return m.min === m.max ? U.fmt(m.min, u, d) : U.fmt(m.min, u, d).replace(/ (in|cm)$/, '') + '–' + U.fmt(m.max, u, d); };
    const NAMES = { chest: profile.gender === 'women' ? 'Bust' : 'Chest', waist: 'Waist', hips: 'Hips', shoulder: 'Shoulder', underbust: 'Underbust', inseam: 'Inseam', foot: 'Foot', height: 'Height' };
    const types = new Set([].concat(...sizes.map((s) => Object.values(s.m).map((m) => m.type))));
    const table = `<div class="tbl-wrap"><table><thead><tr><th>Size</th>${alts.map((a) => `<th>${esc(a)}</th>`).join('')}${keys.map((k) => `<th>${esc(NAMES[k] || k)}</th>`).join('')}</tr></thead><tbody>${sizes.map((s) =>
      `<tr class="${s === rec.size ? 'sel' : ''}"><td>${esc(lab(s))}${s === rec.size ? '<span class="you">YOU</span>' : ''}</td>${alts.map((a) => `<td>${esc(s.alt[a] == null ? '—' : s.alt[a])}</td>`).join('')}${keys.map((k) => `<td>${esc(fmtR(s.m[k], k))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return `<div class="card">
      <div class="answer"><span class="sz${shown.length > 4 ? ' long' : ''}">${esc(shown)}</span>
        <div><div class="small">Your size</div><div class="what">${esc(CAT[rec.category] || 'Clothing')}${rec.between ? ' · or ' + esc(lab(rec.between)) : ''}</div>
        <span class="conf ${esc(rec.confidence)}">${esc(conf)}</span></div></div>
      ${rec.note ? `<p class="note">${esc(rec.note)}</p>` : ''}
      <ul class="reasons">${rec.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}${rec.fit && rec.fit !== 'regular' ? `<li>Allowed for a ${esc(rec.fit)} fit.</li>` : ''}</ul>
      <div class="sec-title" style="margin-top:16px"><span>What FitID read</span><span>${esc([...types].map((t) => (t === 'garment' ? 'garment' : 'body')).join(' + '))}</span></div>
      ${table}
      <p class="small">Wrong column or units? Set “Units” or “Measurements are” above and tap Find my size again.</p>
    </div>`;
  }

  W.onProfile((p) => { profile = W.ready(p) ? p : null; result = ''; render(); });
})();
