// FitID web — turns size-chart text pasted from a shopping app/site into a chart
// using the extension's own table reader (lib/table.js). No DOM needed, so it also runs in Node tests.
(function (g) {
  const F = g.FitID;
  const U = F.units;

  const NUM = /^[<>~≈]?\d+(?:[.,]\d+)?(?:½|¼|¾)?(?:-\d+(?:[.,]\d+)?(?:½|¼|¾)?)?(?:cm|in|"|”)?$/i;
  const START = /^(size|sizes|chest|bust|waist|hip|hips|seat|shoulder|shoulders|inseam|length|foot|sleeve|neck|uk|us|usa|eu|euro|eur|india|ind|in\b|int|intl|international|brand|to|under|underbust|front|garment|body|height|jp)$/i;
  const JOINER = /^(to|fit|across|under|foot|brand|front|garment|body|inside|inner|tag|heel|insole|back|full|sleeve)$/i;
  const UNIT_TOK = /^\(?(cm|in|inch|inches|mm)\)?$|^\(/i;

  function splitWhitespace(line) {
    const s = line.replace(/(\d)\s*(?:-|–|—|to)\s*(\d)/gi, '$1-$2');
    const t = s.split(/\s+/).filter(Boolean);
    if (t.some((x) => NUM.test(x))) {
      // "To Fit Chest (in) 36 38 40" -> ["To Fit Chest (in)", "36", "38", "40"]
      let i = 0;
      while (i < t.length && !NUM.test(t[i]) && !U.isSizeLabel(t[i])) i++;
      return i > 1 ? [t.slice(0, i).join(' ')].concat(t.slice(i)) : t;
    }
    // Header row: "Size To Fit Chest (in) Waist (in)" -> ["Size", "To Fit Chest (in)", "Waist (in)"]
    const out = [];
    for (const tok of t) {
      const prev = out.length ? out[out.length - 1].split(' ').pop() : null;
      const afterUnit = prev && /\)$/.test(prev);
      const starts = !out.length || (afterUnit && !UNIT_TOK.test(tok)) || ((START.test(tok) || U.isSizeLabel(tok)) && !JOINER.test(prev) && !UNIT_TOK.test(tok));
      if (starts) out.push(tok); else out[out.length - 1] += ' ' + tok;
    }
    return out;
  }

  function textToGrid(text) {
    const lines = String(text || '').replace(/\r/g, '').replace(/ /g, ' ').split('\n')
      .map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim() && !/^[\s|:+-]+$/.test(l));
    if (!lines.length) return [];
    let rows;
    if (lines.some((l) => l.includes('\t'))) rows = lines.map((l) => l.split('\t').map((c) => c.trim()));
    else if (lines.some((l) => l.includes('|'))) rows = lines.map((l) => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim()));
    else if (lines.filter((l) => /[,;]/.test(l)).length >= lines.length * 0.6) rows = lines.map((l) => l.split(/\s*[;,]\s*/).map((c) => c.trim()));
    else if (lines.some((l) => /\S\s{2,}\S/.test(l))) rows = lines.map((l) => l.trim().split(/\s{2,}/));
    else rows = lines.map((l) => splitWhitespace(l.trim()));

    // Apps often copy one cell per line: "Size / Chest / Waist / S / 38 / 32 / M / …"
    if (rows.every((r) => r.length === 1) && rows.length >= 6) {
      const cells = rows.map((r) => r[0].trim());
      const k = cells.findIndex((c) => U.isSizeLabel(c) && !NUM.test(c));
      if (k >= 2 && cells.length % k === 0) {
        rows = [];
        for (let i = 0; i < cells.length; i += k) rows.push(cells.slice(i, i + k));
      }
    }
    while (rows.length && rows[0].length < 2) rows.shift(); // drop a title line like "Size chart"
    return rows;
  }

  function guessContext(text, unit, type) {
    const s = String(text || '').toLowerCase();
    const head = s.split('\n').slice(0, 3).join(' ');
    let u = unit && unit !== 'auto' ? unit : U.detectUnit(head) || (/\bcm\b/.test(s) && !/\binch/.test(s) ? 'cm' : /\binch/.test(s) && !/\bcm\b/.test(s) ? 'in' : null);
    let t = type && type !== 'auto' ? type : null;
    if (!t && /garment|product measure|flat measure|actual measure/.test(s)) t = 'garment';
    else if (!t && /to fit|body measure/.test(s)) t = 'body';
    return { unit: u, type: t };
  }

  // Fake <table> object: lib/table.js only reads table.rows[].cells[].textContent / colSpan
  function gridToSizes(G, ctx) {
    // Pad ragged rows: table.js expects every row to be as wide as the header
    const w = Math.max.apply(null, G.map((r) => r.length));
    G = G.map((r) => r.concat(Array(w - r.length).fill('')));
    const table = { rows: G.map((r) => ({ cells: r.map((c) => ({ textContent: c, colSpan: 1 })) })) };
    return F.table.parseTable(table, ctx || {});
  }

  function parse(text, opts) {
    opts = opts || {};
    const G = textToGrid(text);
    const ctx = guessContext(text, opts.unit, opts.type);
    const sizes = G.length >= 2 ? gridToSizes(G, ctx) : null;
    return { grid: G, ctx, sizes: sizes && sizes.length >= 2 ? sizes : null };
  }

  g.FitIDPaste = { textToGrid, gridToSizes, guessContext, parse };
})(globalThis);
