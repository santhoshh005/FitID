// FitID web — Converter screen. Port of fitid-extension/popup/converter-view.js.
(function () {
  const F = globalThis.FitID;
  const W = globalThis.FitIDWeb;
  const C = F.converter;
  const esc = W.esc;
  const root = document.querySelector('#converter');
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

    const groups = Object.entries(C.GROUPS).map(([k, gr]) => `<button type="button" data-group="${k}" aria-pressed="${k === state.group}">${esc(gr.label)}</button>`).join('');
    const cats = Object.keys(C.GROUPS[state.group].cats).map((k) => `<button type="button" data-cat="${k}" aria-pressed="${k === state.cat}">${esc(CAT_LABEL[k] || k)}</button>`).join('');
    const sysOpts = t.cols.map((c) => `<option value="${c}" ${c === state.sys ? 'selected' : ''}>${esc(t.colNames[c])}</option>`).join('');
    const sizeOpts = t.rows.map((r, i) => `<option value="${i}" ${i === state.row ? 'selected' : ''}>${esc(r[state.sys])}${i === mine ? '  (you)' : ''}</option>`).join('');
    const tiles = t.cols.filter((c) => c !== state.sys).map((c) => `<div class="tile"><div class="t-title">${esc(t.colNames[c])}</div><div class="t-big">${esc(row[c])}</div></div>`).join('');
    const head = t.cols.map((c) => `<th>${esc(t.colNames[c])}</th>`).join('');
    const body = t.rows.map((r, i) => `<tr data-row="${i}" class="${i === state.row ? 'sel' : ''}">${t.cols.map((c, ci) => `<td>${esc(r[c])}${ci === 0 && i === mine ? '<span class="you">YOU</span>' : ''}</td>`).join('')}</tr>`).join('');

    root.innerHTML = `
      <div class="seg" aria-label="Group">${groups}</div>
      <div class="pills" aria-label="Category">${cats}</div>
      <div class="pick">
        <label>I know the size in<select id="c-sys">${sysOpts}</select></label>
        <label>Size<select id="c-size">${sizeOpts}</select></label>
      </div>
      <div class="sec-title"><span>${esc(t.title)} · equivalents</span></div>
      <div class="result" style="margin-top:0">${tiles}</div>
      <div class="measure">${esc(row.measure || '')}</div>
      <div class="tbl-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
      <p class="small">${mine >= 0 ? 'YOU = from your size profile. ' : profile ? '' : '<a href="#profile">Add your profile</a> to see your row. '}Typical chart conversions. Brands vary, so use “Check chart” with the product’s own size chart when you can.</p>`;

    root.querySelectorAll('[data-group]').forEach((b) => (b.onclick = () => {
      state.group = b.dataset.group; state.cat = Object.keys(C.GROUPS[state.group].cats)[0]; state.row = -1; persist(); render();
    }));
    root.querySelectorAll('[data-cat]').forEach((b) => (b.onclick = () => { state.cat = b.dataset.cat; state.row = -1; persist(); render(); }));
    root.querySelector('#c-sys').onchange = (e) => { state.sys = e.target.value; persist(); render(); };
    root.querySelector('#c-size').onchange = (e) => { state.row = Number(e.target.value); render(); };
    root.querySelectorAll('tr[data-row]').forEach((tr) => (tr.onclick = () => { state.row = Number(tr.dataset.row); render(); }));
    const sel = root.querySelector('tr.sel');
    const wrap = root.querySelector('.tbl-wrap');
    if (sel && wrap) wrap.scrollTop = Math.max(0, sel.offsetTop - wrap.clientHeight / 2); // no page jump on phones
  }

  let first = true;
  W.onProfile((p) => {
    const hadProfile = !!profile;
    profile = W.ready(p) ? F.profile.effective(p) : null;
    if (first && !saved && profile) {
      state.group = profile.gender === 'women' ? 'women' : 'men';
      state.cat = Object.keys(C.GROUPS[state.group].cats)[0];
    }
    if (!first || !hadProfile) state.row = -1;
    first = false;
    render();
  });
})();
