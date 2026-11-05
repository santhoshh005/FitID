// Copied from fitid-extension/lib/standards.js by sync-lib.js. Do not edit here.
// FitID — standard size systems used when a store shows only size labels,
// and for the "My sizes" summary. All body measurements in cm.
// These are common Indian / international conventions; individual brands differ,
// which is why a product's own size chart always takes priority.
(function (g) {
  const F = (g.FitID = g.FitID || {});
  const IN = 2.54;
  const inch = (a, b) => [a * IN, b * IN];

  // Letter sizes by body measurement (inches converted to cm)
  const LETTER = {
    men: {
      top: { key: 'chest', rows: [['XS', inch(34, 36)], ['S', inch(36, 38)], ['M', inch(38, 40)], ['L', inch(40, 42)], ['XL', inch(42, 44)], ['XXL', inch(44, 46)], ['3XL', inch(46, 48)], ['4XL', inch(48, 50)], ['5XL', inch(50, 52)]] },
      bottom: { key: 'waist', rows: [['XS', inch(26, 28)], ['S', inch(28, 30)], ['M', inch(30, 32)], ['L', inch(32, 34)], ['XL', inch(34, 36)], ['XXL', inch(36, 38)], ['3XL', inch(38, 40)], ['4XL', inch(40, 42)]] },
    },
    women: {
      top: { key: 'chest', rows: [['XS', inch(30, 32)], ['S', inch(32, 34)], ['M', inch(34, 36)], ['L', inch(36, 38)], ['XL', inch(38, 40)], ['XXL', inch(40, 42)], ['3XL', inch(42, 44)], ['4XL', inch(44, 46)]] },
      bottom: { key: 'waist', rows: [['XS', inch(24, 26)], ['S', inch(26, 28)], ['M', inch(28, 30)], ['L', inch(30, 32)], ['XL', inch(32, 34)], ['XXL', inch(34, 36)], ['3XL', inch(36, 38)], ['4XL', inch(38, 40)]] },
    },
  };

  // Women's dress sizes (UK numbering): bust / waist / hips in cm
  const DRESS_UK = [
    [4, 76, 58, 82], [6, 80, 62, 86], [8, 84, 66, 90], [10, 88, 70, 94], [12, 93, 75, 99],
    [14, 98, 80, 104], [16, 103, 85, 109], [18, 109, 91, 115], [20, 115, 97, 121], [22, 121, 103, 127],
  ];

  // Shoes: [UK size, max foot length in cm that fits]
  const SHOE = {
    men: [[5, 23.8], [6, 24.6], [7, 25.4], [8, 26.2], [9, 27.1], [10, 27.9], [11, 28.8], [12, 29.6], [13, 30.4]],
    women: [[2, 21.3], [3, 22.1], [4, 22.9], [5, 23.7], [6, 24.6], [7, 25.4], [8, 26.2], [9, 27.1]],
  };
  const SHOE_EU = {
    men: { 5: 38, 6: 39.5, 7: 41, 8: 42, 9: 43, 10: 44.5, 11: 45.5, 12: 46.5, 13: 48 },
    women: { 2: 35, 3: 36, 4: 37, 5: 38, 6: 39, 7: 40.5, 8: 42, 9: 43 },
  };

  function shoeFromFoot(footCm, gender) {
    const t = SHOE[gender === 'women' ? 'women' : 'men'];
    let row = t.find((r) => r[1] >= footCm - 0.3) || t[t.length - 1];
    const uk = row[0];
    // Half sizes: if the foot is well inside the previous size gap, suggest the .5
    const prev = t[t.indexOf(row) - 1];
    let ukHalf = uk;
    if (prev && footCm <= (prev[1] + row[1]) / 2 - 0.3) ukHalf = uk - 0.5;
    return shoeSystems(ukHalf, gender);
  }

  function shoeSystems(uk, gender) {
    const w = gender === 'women';
    const base = Math.floor(uk);
    const eu = (SHOE_EU[w ? 'women' : 'men'][base] || Math.round(uk * 1.27 + 33)) + (uk - base > 0 ? 0.5 : 0);
    return { UK: uk, US: uk + (w ? 2 : 1), EU: Math.round(eu * 2) / 2, IN: uk };
  }

  // Foot length (cm) a given shoe size is made for, used when user only knows a UK size
  function footFromUK(uk, gender) {
    const t = SHOE[gender === 'women' ? 'women' : 'men'];
    const lo = t.filter((r) => r[0] <= uk).pop() || t[0];
    const hi = t.find((r) => r[0] >= uk) || t[t.length - 1];
    const f = lo === hi ? lo[1] : lo[1] + ((uk - lo[0]) / (hi[0] - lo[0])) * (hi[1] - lo[1]);
    return f - 0.4;
  }

  function letterFor(cm, gender, part) {
    const t = LETTER[gender === 'women' ? 'women' : 'men'][part];
    if (cm == null) return null;
    const row = t.rows.find((r) => cm >= r[1][0] - 0.5 && cm < r[1][1] - 0.5) ||
      (cm < t.rows[0][1][0] ? t.rows[0] : t.rows[t.rows.length - 1]);
    return row[0];
  }

  function waistNumber(waistCm) {
    if (waistCm == null) return null;
    const w = waistCm / IN;
    const even = Math.ceil(w / 2 - 0.15) * 2; // 31.8 -> 32, 32.4 -> 34? no: tolerance
    return { exact: Math.round(w), even: Math.max(24, even) };
  }

  function dressFor(p) {
    if (!p.chest) return null;
    let best = null, bestScore = Infinity;
    for (const [uk, b, w, h] of DRESS_UK) {
      let s = 0, n = 0;
      const add = (user, std, wt) => { if (user) { const d = user - std; s += (d > 0 ? d * 1.3 : -d) * wt; n += wt; } };
      add(p.chest, b, 1); add(p.waist, w, 0.8); add(p.hips, h, 0.8);
      if (n && s / n < bestScore) { bestScore = s / n; best = uk; }
    }
    return best == null ? null : { UK: best, US: best - 4, EU: best + 28, IT: best + 32 };
  }

  function braFor(p) {
    if (!p.underbust || !p.chest) return null;
    const ub = p.underbust / IN;
    let band = Math.round(ub);
    if (band % 2) band += 1;
    const diff = Math.round(p.chest / IN - band);
    const ukCups = ['AA', 'A', 'B', 'C', 'D', 'DD', 'E', 'F', 'FF', 'G', 'GG', 'H'];
    const euCups = ['AA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    const i = Math.max(0, Math.min(ukCups.length - 1, diff));
    const euBand = Math.round(((band - 32) * 2.5 + 70) / 5) * 5;
    return { UK: band + ukCups[i], IN: band + ukCups[i], US: band + ukCups[i].replace('E', 'DDD').replace('DDDDD', 'DDD'), EU: euBand + euCups[i] };
  }

  // Rough body estimates from height (cm) + weight (kg) when the user skips a field.
  function estimate(p) {
    const h = p.height, w = p.weight;
    if (!h || !w) return {};
    const bmi = w / Math.pow(h / 100, 2);
    const hd = h - (p.gender === 'women' ? 160 : 172);
    if (p.gender === 'women') {
      return {
        chest: 60 + 1.45 * bmi + 0.2 * hd,
        underbust: 52 + 1.2 * bmi + 0.15 * hd,
        waist: 30 + 1.95 * bmi + 0.15 * hd,
        hips: 60 + 1.6 * bmi + 0.3 * hd,
        shoulder: 0.236 * h,
        inseam: 0.45 * h,
        foot: 0.151 * h,
      };
    }
    return {
      chest: 62 + 1.4 * bmi + 0.2 * hd,
      waist: 30 + 2.15 * bmi + 0.12 * hd,
      hips: 62 + 1.3 * bmi + 0.3 * hd,
      shoulder: 0.26 * h,
      inseam: 0.455 * h,
      foot: 0.152 * h,
    };
  }

  // Summary of a profile in every common size system
  function summary(p) {
    const gender = p.gender === 'women' ? 'women' : 'men';
    const out = {
      topLetter: letterFor(p.chest, gender, 'top'),
      bottomLetter: letterFor(p.waist, gender, 'bottom'),
      waist: waistNumber(p.waist),
      shoe: p.foot ? shoeFromFoot(p.foot, gender) : null,
    };
    if (gender === 'women') {
      out.dress = dressFor(p);
      out.bra = braFor(p);
    }
    return out;
  }

  F.standards = { LETTER, DRESS_UK, SHOE, shoeFromFoot, shoeSystems, footFromUK, letterFor, waistNumber, dressFor, braFor, estimate, summary };
})(globalThis);
