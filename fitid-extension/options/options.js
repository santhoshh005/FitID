(function () {
  const F = globalThis.FitID;
  const U = F.units;
  const $ = (s) => document.querySelector(s);
  const form = $('#form');
  const measureInputs = Array.from(document.querySelectorAll('[data-m]'));

  const radio = (name) => (form.querySelector(`input[name="${name}"]:checked`) || {}).value;
  const setRadio = (name, v) => { const r = form.querySelector(`input[name="${name}"][value="${v}"]`); if (r) r.checked = true; };
  const num = (v) => { const n = parseFloat(String(v || '').replace(',', '.')); return isNaN(n) ? null : n; };

  function parseHeight(text) {
    const s = String(text || '').trim().toLowerCase();
    if (!s) return null;
    const ft = s.match(/^(\d)\s*(?:'|ft|feet|’)\s*(\d{1,2}(?:\.\d)?)?/);
    if (ft) return Math.round((Number(ft[1]) * 12 + Number(ft[2] || 0)) * U.IN);
    const n = num(s);
    if (n == null) return null;
    if (n < 8) {
      // "5.7" means 5 ft 7 in, "5.11" means 5 ft 11 in
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

  function refresh() {
    const p = read();
    const unit = p.unit;
    document.body.classList.toggle('women', p.gender === 'women');
    document.querySelectorAll('[data-men]').forEach((el) => { el.textContent = p.gender === 'women' ? el.dataset.women : el.dataset.men; });
    document.querySelectorAll('.suffix.u').forEach((el) => { el.textContent = unit; });
    // Placeholders show what we'd estimate
    const est = F.standards.estimate(p);
    for (const el of measureInputs) {
      const e = est[el.dataset.m];
      el.placeholder = e ? `≈ ${Math.round(U.fromCm(e, unit) * 10) / 10} (estimated)` : '';
    }
    $('#foot').placeholder = est.foot ? `≈ ${Math.round(est.foot * 10) / 10} (estimated)` : '26';
    $('#summary').innerHTML = F.profile.isComplete(p) ? F.renderSummary(p) : '<p class="est">Enter your height, chest and waist (or weight) to see your sizes.</p>';
  }

  // Switching units converts what's already typed
  form.querySelectorAll('input[name="unit"]').forEach((r) => r.addEventListener('change', () => {
    const to = radio('unit'), from = to === 'cm' ? 'in' : 'cm';
    for (const el of measureInputs) {
      const v = num(el.value);
      if (v != null) el.value = Math.round(U.fromCm(U.toCm(v, from), to) * 10) / 10;
    }
    refresh();
  }));

  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const p = read();
    const status = $('#status');
    status.classList.remove('err');
    if (!p.height || p.height < 100 || p.height > 230) { status.textContent = 'Enter your height (e.g. 170 cm or 5\'7).'; status.classList.add('err'); return; }
    if (!(p.chest && p.waist) && !p.weight) { status.textContent = 'Enter your chest and waist (or your weight, so FitID can estimate them).'; status.classList.add('err'); return; }
    if (p.weight && (p.weight < 25 || p.weight > 250)) { status.textContent = 'Enter your weight in kg.'; status.classList.add('err'); return; }
    await F.profile.save(p);
    status.textContent = 'Saved ✓ Open any product page to see your size.';
    refresh();
  });

  F.profile.load().then((p) => { fill(p); refresh(); });
})();
