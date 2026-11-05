// FitID web — app shell: tab routing, profile form (mirrors fitid-extension/options/options.js),
// and the "My sizes" screen (mirrors the popup).
(function () {
  const F = globalThis.FitID;
  const U = F.units;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CAT = { top: 'Topwear', bottom: 'Bottomwear', dress: 'Dresses', bra: 'Lingerie', shoe: 'Footwear', unknown: 'Clothing' };
  const TABS = ['profile', 'sizes', 'convert', 'check'];

  // The extension needs height + weight (so it can estimate the rest). On the website the pitch is
  // "height, chest, waist, shoulders", so height plus either weight or a real chest/waist is enough.
  const ready = (p) => !!(p && p.height && p.gender && (p.weight || p.chest || p.waist));

  let profile = null;
  const listeners = [];
  const App = (globalThis.FitIDWeb = {
    esc, CAT, ready,
    get profile() { return profile; },
    onProfile(cb) { listeners.push(cb); if (profile !== undefined) cb(profile); },
    go(tab) { location.hash = '#' + tab; },
    toast,
  });

  function toast(msg) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2600);
  }

  // ---------------- routing ----------------
  function route() {
    let tab = location.hash.replace('#', '');
    if (!TABS.includes(tab)) tab = ready(profile) ? 'sizes' : 'profile';
    TABS.forEach((t) => { $('#s-' + t).hidden = t !== tab; });
    $$('.tabbar a').forEach((a) => (a.dataset.tab === tab ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    document.title = 'FitID – ' + $('#s-' + tab).dataset.title;
    if (tab === 'sizes') renderSizes();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------------- profile form ----------------
  const form = $('#form');
  const measureInputs = $$('[data-m]', form);
  const radio = (name) => (form.querySelector(`input[name="${name}"]:checked`) || {}).value;
  const setRadio = (name, v) => { const r = form.querySelector(`input[name="${name}"][value="${v}"]`); if (r) r.checked = true; };
  const num = (v) => { const n = parseFloat(String(v || '').replace(',', '.')); return isNaN(n) ? null : n; };

  function parseHeight(text) {
    const s = String(text || '').trim().toLowerCase();
    if (!s) return null;
    const ft = s.match(/^(\d)\s*(?:'|ft|feet|’|foot)\s*(\d{1,2}(?:\.\d)?)?/);
    if (ft) return Math.round((Number(ft[1]) * 12 + Number(ft[2] || 0)) * U.IN);
    const n = num(s);
    if (n == null) return null;
    if (n < 8) { // "5.7" = 5 ft 7 in, "5.11" = 5 ft 11 in
      const [f, i] = s.replace(',', '.').split('.');
      return Math.round((Number(f) * 12 + Number(i || 0)) * U.IN);
    }
    return n;
  }

  function read() {
    const unit = radio('unit');
    const p = {
      gender: radio('gender'),
      fitPref: radio('fitPref'),
      unit,
      height: parseHeight($('#height').value),
      weight: num($('#weight').value),
      foot: num($('#foot').value),
      shoeUK: num($('#shoeUK').value),
    };
    for (const el of measureInputs) {
      const v = num(el.value);
      p[el.dataset.m] = v == null ? null : U.toCm(v, unit);
    }
    if (p.gender !== 'women') p.underbust = null;
    return p;
  }

  function fill(p) {
    if (!p) return;
    setRadio('gender', p.gender || 'men');
    setRadio('fitPref', p.fitPref || 'regular');
    setRadio('unit', p.unit || 'in');
    if (p.height) $('#height').value = Math.round(p.height);
    if (p.weight) $('#weight').value = p.weight;
    if (p.foot) $('#foot').value = p.foot;
    if (p.shoeUK != null) $('#shoeUK').value = p.shoeUK;
    for (const el of measureInputs) {
      const v = p[el.dataset.m];
      el.value = v == null ? '' : Math.round(U.fromCm(v, p.unit || 'in') * 10) / 10;
    }
  }

  function refreshForm() {
    const p = read();
    const unit = p.unit;
    document.body.classList.toggle('women', p.gender === 'women');
    $$('[data-men]').forEach((el) => { el.textContent = p.gender === 'women' ? el.dataset.women : el.dataset.men; });
    $$('.suffix.u', form).forEach((el) => { el.textContent = unit; });
    // Placeholders + "estimated" badges show what FitID will assume for blank fields
    const eff = F.profile.effective(p);
    for (const el of measureInputs) {
      const k = el.dataset.m;
      const e = eff._estimated[k] ? eff[k] : null;
      el.placeholder = e ? `≈ ${Math.round(U.fromCm(e, unit) * 10) / 10}` : '';
    }
    $('#foot').placeholder = eff._estimated.foot ? `≈ ${Math.round(eff.foot * 10) / 10}` : p.shoeUK ? `≈ ${Math.round(eff.foot * 10) / 10} from shoe size` : '26';
    $$('[data-est]', form).forEach((b) => { b.hidden = !eff._estimated[b.dataset.est]; });
  }

  form.querySelectorAll('input[name="unit"]').forEach((r) => r.addEventListener('change', () => {
    const to = radio('unit'), from = to === 'cm' ? 'in' : 'cm';
    for (const el of measureInputs) {
      const v = num(el.value);
      if (v != null) el.value = Math.round(U.fromCm(U.toCm(v, from), to) * 10) / 10;
    }
    refreshForm();
  }));
  form.addEventListener('input', refreshForm);
  form.addEventListener('change', refreshForm);
  // Enter on a phone keyboard moves to the next field instead of submitting
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT' || e.target.type === 'radio') return;
    const fields = $$('input:not([type="radio"])', form).filter((x) => x.offsetParent !== null);
    const next = fields[fields.indexOf(e.target) + 1];
    if (next) { e.preventDefault(); next.focus(); }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const p = read();
    const status = $('#status');
    status.classList.remove('err');
    const fail = (msg, el) => { status.textContent = msg; status.classList.add('err'); if (el) el.focus(); };
    if (!p.height || p.height < 100 || p.height > 230) return fail('Enter your height, e.g. 170 cm or 5\'7.', $('#height'));
    if (p.weight != null && (p.weight < 25 || p.weight > 250)) return fail('Weight should be in kg (25–250).', $('#weight'));
    if (!p.weight && !p.chest && !p.waist) return fail('Add your chest or waist (or your weight, and FitID estimates them).', $('[data-m="chest"]'));
    await F.profile.save(p);
    setProfile(p);
    status.textContent = 'Saved ✓';
    App.go('sizes');
  });

  // ---------------- My sizes ----------------
  function chipList(p) {
    const eff = F.profile.effective(p);
    const u = p.unit === 'cm' ? 'cm' : 'in';
    const items = [['Height', U.fmt(p.height, 'cm')]];
    if (p.weight) items.push(['Weight', p.weight + ' kg']);
    const W = p.gender === 'women';
    for (const [k, n] of [['chest', W ? 'Bust' : 'Chest'], ['waist', 'Waist'], ['shoulder', 'Shoulders'], ['hips', 'Hips']]) {
      if (eff[k] != null) items.push([n, U.fmt(eff[k], u), eff._estimated[k]]);
    }
    return items.map(([n, v, e]) => `<span class="${e ? 'e' : ''}">${esc(n)} ${esc(v)}${e ? ' · est.' : ''}</span>`).join('');
  }

  function brandCards(p) {
    const top = F.brands.mySizes(p);
    if (!top.length) return '<p class="small">No brand charts match your profile yet.</p>';
    return `<div class="brandgrid">${top.map(({ chart, rec }) => {
      const a = rec.size.alt || {};
      const alt = ['UK', 'US', 'EU'].filter((k) => a[k] != null && k !== rec.size.labelSys && String(a[k]) !== String(rec.size.label)).map((k) => k + ' ' + a[k]).join(' · ');
      const shown = rec.size.labelSys ? rec.size.labelSys + ' ' + rec.size.label : rec.size.label;
      const conf = { high: 'Best fit', medium: 'Good match', low: 'Rough match' }[rec.confidence];
      const between = rec.between ? `or ${rec.between.labelSys ? rec.between.labelSys + ' ' : ''}${rec.between.label}` : '';
      return `<a class="bcard" href="${esc(chart.source)}" target="_blank" rel="noopener">
        <div class="top"><span class="nm">${esc(chart.brand)}</span><span class="conf ${esc(rec.confidence)}">${esc(conf)}</span></div>
        <span class="sz${shown.length > 4 ? ' long' : ''}">${esc(shown)}</span>
        <div><div class="cat">${esc(CAT[chart.category] || 'Clothing')}${between ? ' · ' + esc(between) : ''}</div>
        <div class="sub">${esc(chart.note || '')}${alt ? ' · ' + esc(alt) : ''}</div></div></a>`;
    }).join('')}</div>`;
  }

  function shareText(p) {
    const top = F.brands.mySizes(p).map(({ chart, rec }) => `${chart.brand} ${CAT[chart.category] === 'Footwear' ? 'shoes ' : ''}${rec.size.labelSys ? rec.size.labelSys + ' ' : ''}${rec.size.label}`);
    const s = F.standards.summary(F.profile.effective(p));
    const std = [s.topLetter && 'Tops ' + s.topLetter, s.waist && 'Jeans ' + s.waist.even, s.shoe && 'Shoes UK ' + s.shoe.UK].filter(Boolean);
    return `My FitID sizes: ${top.join(', ')}${std.length ? '. ' + std.join(', ') : ''}.`;
  }

  function renderSizes() {
    const el = $('#s-sizes');
    if (!ready(profile)) {
      el.innerHTML = `<div class="empty"><h1>Enter it once.</h1><p class="lead">Add your height, chest, waist and shoulders. FitID shows your size at Zara, H&amp;M, Nike and more, plus your standard sizes.</p>
        <a class="btn primary" href="#profile" style="display:inline-block;text-decoration:none">Create my size profile</a></div>`;
      return;
    }
    el.innerHTML = `
      <h1>Your size, every brand.</h1>
      <div class="me">${chipList(profile)}</div>
      <div class="sec-title"><span>My size at top brands</span><a href="#profile" class="small">Edit</a></div>
      ${brandCards(profile)}
      <p class="small" style="margin-top:8px">From each brand’s official size chart. Tap a brand to open its store.</p>
      <div class="sec-title"><span>Standard sizes</span></div>
      ${F.renderSummary(profile)}
      <div class="actions">
        <button class="btn primary" id="share">Share my sizes</button>
        <a class="btn ghost" href="#check" style="text-align:center;text-decoration:none">Check a chart</a>
      </div>`;
    $('#share').onclick = async () => {
      const text = shareText(profile);
      try {
        if (navigator.share) return await navigator.share({ title: 'My FitID sizes', text });
        await navigator.clipboard.writeText(text);
        toast('Copied to clipboard');
      } catch (e) { if (e && e.name !== 'AbortError') toast(text); }
    };
  }

  function setProfile(p) {
    profile = p;
    listeners.forEach((cb) => { try { cb(p); } catch (e) { console.error(e); } });
  }

  // ---------------- install + offline ----------------
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; $('#install').hidden = false; });
  $('#install').onclick = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice.catch(() => null);
    deferred = null; $('#install').hidden = true;
  };
  window.addEventListener('appinstalled', () => { $('#install').hidden = true; });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW not registered', e)));
  }

  // ---------------- start ----------------
  F.profile.load().then((p) => {
    fill(p);
    refreshForm();
    setProfile(p || null);
    route();
  });
})();
