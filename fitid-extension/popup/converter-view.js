// FitID popup — "Converter" tab: US / UK / EU / IN / letter sizes for men, women and kids.
(function () {
  const F = globalThis.FitID;
  const C = F.converter;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CAT_LABEL = { tops: 'Tops', bottoms: 'Jeans & trousers', shoes: 'Shoes', clothing: 'Clothing', jeans: 'Jeans', bra: 'Bra' };

  let state = { group: 'men', cat: 'tops', sys: null, row: -1 };
  let profile = null;
  const saved = (() => { try { return JSON.parse(localStorage.getItem('fitid-conv') || 'null'); } catch (e) { return null; } })();
  if (saved && C.GROUPS[saved.group] && C.GROUPS[saved.group].cats[saved.cat]) state = Object.assign(state, saved);

  const table = () => C.GROUPS[state.group].cats[state.cat];

  function persist() { try { localStorage.setItem('fitid-conv', JSON.stringify({ group: state.group, cat: state.cat, sys: state.sys })); } catch (e) { /* ignore */ } }

  function render() {
    const t = table();
    if (!t.cols.includes(state.sys)) state.sys = t.cols[0];
    const mine = C.myRow(t, state.group, profile);
    if (state.row < 0 || state.row >= t.rows.length) state.row = mine >= 0 ? mine : Math.floor(t.rows.length / 2);
    const row = t.rows[state.row];

    const groups = Object.entries(C.GROUPS).map(([k, gr]) => `<button data-group="${k}" aria-pressed="${k === state.group}">${esc(gr.label)}</button>`).join('');
    const cats = Object.keys(C.GROUPS[state.group].cats).map((k) => `<button data-cat="${k}" aria-pressed="${k === state.cat}">${esc(CAT_LABEL[k] || k)}</button>`).join('');
    const sysOpts = t.cols.map((c) => `<option value="${c}" ${c === state.sys ? 'selected' : ''}>${esc(t.colNames[c])}</option>`).join('');
    const sizeOpts = t.rows.map((r, i) => `<option value="${i}" ${i === state.row ? 'selected' : ''}>${esc(r[state.sys])}${i === mine ? '  (you)' : ''}</option>`).join('');
    const tiles = t.cols.filter((c) => c !== state.sys).map((c) => `<div class="tile"><div class="t-title">${esc(t.colNames[c])}</div><div class="t-big">${esc(row[c])}</div></div>`).join('');
    const head = t.cols.map((c) => `<th>${esc(t.colNames[c])}</th>`).join('');
    const body = t.rows.map((r, i) => `<tr data-row="${i}" class="${i === state.row ? 'sel' : ''}">${t.cols.map((c, ci) => `<td>${esc(r[c])}${ci === 0 && i === mine ? '<span class="you">YOU</span>' : ''}</td>`).join('')}</tr>`).join('');

    $('#converter').innerHTML = `
      <div class="seg" aria-label="Group">${groups}</div>
      <div class="seg" aria-label="Category">${cats}</div>
      <div class="pick">
        <label>I know the size in<select id="c-sys">${sysOpts}</select></label>
        <label>Size<select id="c-size">${sizeOpts}</select></label>
      </div>
      <div class="result">${tiles}</div>
      <div class="measure">${esc(row.measure || '')}</div>
      <div class="tbl-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
      <p class="small">${mine >= 0 ? 'YOU = from your size profile. ' : ''}Typical chart conversions. Brands vary, so on product pages FitID uses the brand’s own chart.</p>`;

    $('#converter').querySelectorAll('[data-group]').forEach((b) => (b.onclick = () => {
      state.group = b.dataset.group; state.cat = Object.keys(C.GROUPS[state.group].cats)[0]; state.row = -1; persist(); render();
    }));
    $('#converter').querySelectorAll('[data-cat]').forEach((b) => (b.onclick = () => { state.cat = b.dataset.cat; state.row = -1; persist(); render(); }));
    $('#c-sys').onchange = (e) => { state.sys = e.target.value; persist(); render(); };
    $('#c-size').onchange = (e) => { state.row = Number(e.target.value); render(); };
    $('#converter').querySelectorAll('tr[data-row]').forEach((tr) => (tr.onclick = () => { state.row = Number(tr.dataset.row); render(); }));
    const sel = $('#converter tr.sel');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  function select(which) {
    const conv = which === 'conv';
    $('#tab-sizes').setAttribute('aria-selected', String(!conv));
    $('#tab-conv').setAttribute('aria-selected', String(conv));
    $('#content').hidden = conv;
    $('#converter').hidden = !conv;
    if (conv) render();
  }

  $('#tab-sizes').onclick = () => select('sizes');
  $('#tab-conv').onclick = () => select('conv');

  F.profile.load().then((p) => {
    profile = F.profile.isComplete(p) ? F.profile.effective(p) : null;
    if (!saved && profile) state.group = profile.gender === 'women' ? 'women' : 'men';
    if (!saved && state.group === 'women') state.cat = 'clothing';
  });
})();
