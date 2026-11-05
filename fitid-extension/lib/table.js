// FitID — reads an HTML size-guide <table> (any store) into a chart.
// Handles both layouts: sizes as rows (S, M, L down the side) or sizes as columns.
(function (g) {
  const F = (g.FitID = g.FitID || {});
  const U = F.units;

  function grid(table) {
    const out = [];
    const rows = table.rows ? Array.from(table.rows) : [];
    for (const tr of rows) {
      const row = [];
      for (const c of Array.from(tr.cells)) {
        const t = (c.innerText != null ? c.innerText : c.textContent || '').replace(/\s+/g, ' ').trim();
        const span = Math.min(Number(c.colSpan) || 1, 12);
        for (let i = 0; i < span; i++) row.push(t);
      }
      if (row.some((x) => x)) out.push(row);
    }
    return out;
  }

  function isLabelHeader(t) {
    return t === '' || /^(size|sizes|brand size|tag size|int|international|label|product label|standard size|your size|size chart|to fit|area|measurements?|measure|body part|in cm|in inches|cm|inches)$/i.test(t.trim()) ||
      /\bsize\b/i.test(t) && !U.measureKey(t) && !U.systemKey(t);
  }

  function fieldInfo(name) {
    const key = U.measureKey(name);
    const sys = key ? null : U.systemKey(name);
    const s = String(name).toLowerCase();
    let type = null;
    if (/garment|product|actual|flat|across|pit to pit|half/.test(s)) type = 'garment';
    if (/to fit|body|your/.test(s)) type = 'body';
    const half = /half|flat|pit to pit|1\/2/.test(s) && key === 'chest';
    // A bare "cm" / "foot length" column in a shoe table
    const footish = !key && !sys && /^(cm|mm|length|length cm|insole length|in cm)$/.test(s.trim());
    return { name, key: footish ? 'foot' : key, sys, type, half, footish, unit: U.detectUnit(name) };
  }

  // A bare "Length" / "cm" column only means foot length in a shoe table (one with UK/US/EU columns)
  function fixFootish(fields) {
    const shoeTable = fields.some((f) => f.sys);
    if (!shoeTable) fields.forEach((f) => { if (f.footish) f.key = null; });
    return fields;
  }

  function guessUnit(key, values, declared) {
    const max = Math.max.apply(null, values.filter((v) => v != null));
    if (!isFinite(max)) return declared || 'cm';
    const cmFloor = { chest: 55, underbust: 50, waist: 45, hips: 55, shoulder: 25, inseam: 40, foot: 15, height: 100 }[key] || 50;
    const looksCm = max > cmFloor;
    if (declared === 'cm' && !looksCm && key !== 'foot' && max < cmFloor * 0.8) return 'in';
    if (declared === 'in' && looksCm) return 'cm';
    if (declared) return declared;
    return looksCm ? 'cm' : 'in';
  }

  function addMeasure(size, info, text, ctx) {
    const r = U.parseRange(text);
    if (!r) return;
    size._raw = size._raw || [];
    // Units written in the cell itself ("34\"", "92 cm") beat any guess
    const cellUnit = /\d\s*("|”|in\b|inch)/i.test(text) ? 'in' : /\d\s*cm\b/i.test(text) ? 'cm' : null;
    if (cellUnit) info.cellUnit = cellUnit;
    size._raw.push({ info, r });
  }

  function finalize(sizes, fields, ctx) {
    // Decide units per field using all values in that field
    for (const f of fields) {
      if (!f.key) continue;
      const vals = [];
      sizes.forEach((s) => (s._raw || []).forEach((x) => { if (x.info === f) vals.push(x.r[1]); }));
      f.finalUnit = f.cellUnit || guessUnit(f.key, vals, f.unit || ctx.unit);
    }
    // Flat ("half") measurements: an adult chest/hips can't be under ~65 cm around, so a
    // chart whose chest values are 30–65 cm is measured flat across the garment (Zara does this).
    const adult = sizes.some((s) => /^(x*s|m|x*l|\d?xl)$/i.test(String(s.label).trim()));
    for (const f of fields) {
      if (!adult || !['chest', 'hips', 'waist'].includes(f.key) || f.half) continue;
      const vals = [];
      sizes.forEach((s) => (s._raw || []).forEach((x) => { if (x.info === f) vals.push(U.toCm(x.r[1], f.finalUnit)); }));
      const max = Math.max.apply(null, vals);
      const limit = f.key === 'waist' ? 50 : 66;
      if (vals.length && max >= 25 && max < limit) { f.half = true; f.type = 'garment'; }
    }
    for (const s of sizes) {
      s.m = {};
      for (const x of s._raw || []) {
        const f = x.info;
        if (!f.key || s.m[f.key]) continue;
        let [a, b] = x.r;
        if (f.half) { a *= 2; b *= 2; }
        s.m[f.key] = {
          min: U.toCm(a, f.finalUnit),
          max: U.toCm(b, f.finalUnit),
          type: f.half ? 'garment' : f.type || (f.key === 'foot' ? 'body' : ctx.type || 'body'),
        };
      }
      delete s._raw;
    }
    return sizes.filter((s) => s.label);
  }

  // Layout 1: header row of field names, each following row is a size
  function sizesAsRows(G, ctx) {
    for (let h = 0; h < Math.min(3, G.length - 2); h++) {
      const header = G[h];
      const fields = fixFootish(header.map(fieldInfo));
      if (!fields.some((f) => f.key || f.sys)) continue;
      // Prefer the label column holding letter sizes (S, M, L) over a numeric "brand size" one
      const labelCols = header.map((t, i) => i).filter((i) => !fields[i].key && !fields[i].sys && isLabelHeader(header[i]));
      const letters = (i) => G.slice(h + 1).filter((r) => /^[a-z0-9]*x?[sml]$|^x+[sl]$|^\d?xl$/i.test(String(r[i] || '').trim())).length;
      labelCols.sort((a, b) => letters(b) - letters(a));
      let labelCol = labelCols.length ? labelCols[0] : -1;
      if (labelCol < 0) {
        const pref = ['UK', 'IN', 'EU', 'US'];
        for (const p of pref) { const i = fields.findIndex((f) => f.sys === p); if (i >= 0) { labelCol = i; break; } }
      }
      if (labelCol < 0) labelCol = 0;
      const body = G.slice(h + 1).filter((r) => r[labelCol] && U.isSizeLabel(r[labelCol].replace(/^(uk|us|eu|ind?)\s*/i, '')) );
      if (body.length < 2) continue;
      const sizes = body.map((row) => {
        const s = { label: row[labelCol], alt: {}, m: {} };
        if (fields[labelCol].sys && !/^[a-z]{2}\s/i.test(row[labelCol])) s.labelSys = fields[labelCol].sys;
        row.forEach((cell, i) => {
          if (i === labelCol && !fields[i].sys) return;
          const f = fields[i];
          if (f.sys) s.alt[f.sys] = cell;
          else if (f.key) addMeasure(s, f, cell, ctx);
        });
        return s;
      });
      return finalize(sizes, fields, ctx);
    }
    return null;
  }

  // Layout 2: first row lists sizes, each following row is a field
  function sizesAsColumns(G, ctx) {
    for (let h = 0; h < Math.min(3, G.length - 1); h++) {
      const header = G[h];
      const cand = header.slice(1).filter((t) => U.isSizeLabel(t.replace(/^(uk|us|eu|ind?)\s*/i, '')));
      if (cand.length < 2) continue;
      const head0 = header[0] || '';
      const headSys = U.systemKey(head0);
      if (!isLabelHeader(head0) && !headSys) continue;
      // every other row is a field — including rows above the size row (Adidas puts "Heel-toe" first)
      const rows = G.filter((_, i) => i !== h);
      const fields = fixFootish(rows.map((r) => fieldInfo(r[0] || '')));
      if (headSys) fields.forEach((f) => { if (f.footish) f.key = 'foot'; });
      if (!fields.some((f) => f.key || f.sys) && !headSys) continue;
      const sizes = [];
      for (let c = 1; c < header.length; c++) {
        if (!header[c]) continue;
        const s = { label: header[c], alt: {}, m: {} };
        if (headSys) { s.alt[headSys] = header[c]; s.labelSys = headSys; }
        rows.forEach((r, ri) => {
          const f = fields[ri];
          if (f.sys) s.alt[f.sys] = r[c];
          else if (f.key) addMeasure(s, f, r[c], ctx);
        });
        sizes.push(s);
      }
      return finalize(sizes, fields, ctx);
    }
    return null;
  }

  function parseTable(table, ctx) {
    ctx = ctx || {};
    const G = grid(table);
    if (G.length < 2 || Math.max.apply(null, G.map((r) => r.length)) < 2) return null;
    const a = sizesAsRows(G, ctx);
    const b = sizesAsColumns(G, ctx);
    const score = (s) => (s ? s.filter((x) => Object.keys(x.m).length || Object.keys(x.alt).length).length * 10 + s.reduce((n, x) => n + Object.keys(x.m).length, 0) : -1);
    const best = score(a) >= score(b) ? a : b;
    if (!best || score(best) <= 0) return null;
    // de-duplicate labels
    const seen = new Set();
    return best.filter((s) => { const k = s.label.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  }

  // Context text near a table tells us cm vs inches and body vs garment
  function contextFor(table, extra) {
    let t = '';
    let el = table;
    for (let i = 0; i < 4 && el; i++) { el = el.parentElement; }
    if (el) t = (el.innerText || el.textContent || '').slice(0, 1500);
    t += ' ' + (extra || '');
    const s = t.toLowerCase();
    let type = null;
    if (/garment measure|product measure|garment size|measurements of the (garment|product)|flat measure/.test(s)) type = 'garment';
    else if (/body measure|to fit|measure (around )?(your|the) body|body size|around the body/.test(s)) type = 'body';
    let unit = null;
    const head = Array.from(table.querySelectorAll('th, tr:first-child td')).map((x) => x.textContent).join(' ');
    unit = U.detectUnit(head) || (/\b(in cm|cm)\b/.test(s) && !/\binch/.test(s) ? 'cm' : /\binch/.test(s) && !/\bcm\b/.test(s) ? 'in' : null);
    return { type, unit, text: t };
  }

  function scan(root, extraHint) {
    const tables = Array.from((root || document).querySelectorAll('table'));
    const results = [];
    for (const t of tables) {
      const ctx = contextFor(t, extraHint);
      const sizes = parseTable(t, ctx);
      if (sizes && sizes.length >= 2) {
        const measured = sizes.filter((s) => Object.keys(s.m).length).length;
        const hasSys = sizes.some((s) => Object.keys(s.alt).length);
        const visible = t.offsetParent !== null || (t.getClientRects && t.getClientRects().length > 0);
        if (measured || hasSys) results.push({ table: t, sizes, ctx, visible, score: measured * 10 + sizes.length + (hasSys ? 3 : 0) + (visible ? 1000 : 0) + (ctx.type === 'body' ? 40 : 0) });
      }
    }
    results.sort((a, b) => b.score - a.score);
    return results;
  }

  F.table = { parseTable, scan, grid, contextFor };
})(globalThis);
