// Copied from fitid-extension/lib/engine.js by sync-lib.js. Do not edit here.
// FitID — size-matching engine.
//
// Input: a "chart" read from a store page:
//   { brand, product, hint, gender, fit, sizes: [{ label, available, alt:{UK,US,EU}, m: { chest:{min,max,type:'body'|'garment'} } }] }
//   (all measurements in cm)
// and the user's profile (cm). Output: the best size, a runner-up when the user is
// between sizes, a confidence level and human-readable reasons.
(function (g) {
  const F = (g.FitID = g.FitID || {});
  const U = F.units;

  // Garment measurement minus body measurement, by fit (cm)
  const EASE = {
    chest: { slim: 3, regular: 5, relaxed: 11, oversized: 20 },
    waist: { slim: 3, regular: 4, relaxed: 5, oversized: 7 }, // jeans are cut ~1.5 in bigger than the body waist they fit
    hips: { slim: 3, regular: 5, relaxed: 9, oversized: 14 },
    shoulder: { slim: 0, regular: 1, relaxed: 3, oversized: 7 },
    underbust: { slim: 0, regular: 0, relaxed: 0, oversized: 0 },
    inseam: { slim: 0, regular: 0, relaxed: 0, oversized: 0 },
    foot: { slim: 0, regular: 0, relaxed: 0, oversized: 0 },
    height: { slim: 0, regular: 0, relaxed: 0, oversized: 0 },
  };

  const WEIGHTS = {
    top: { chest: 1, shoulder: 0.35, waist: 0.1 },
    bottom: { waist: 1, hips: 0.45 },
    dress: { chest: 1, waist: 0.8, hips: 0.8, shoulder: 0.2 },
    bra: { underbust: 1, chest: 0.7 },
    shoe: { foot: 1 },
    unknown: { chest: 1, waist: 1, hips: 0.5, shoulder: 0.3, foot: 1 },
  };

  const LABELS = { chest: 'Chest', underbust: 'Underbust', waist: 'Waist', hips: 'Hips', shoulder: 'Shoulder', inseam: 'Inseam', foot: 'Foot length', height: 'Height' };

  function detectCategory(chart) {
    const h = String(chart.hint || '').toLowerCase();
    const keys = new Set();
    chart.sizes.forEach((s) => Object.keys(s.m || {}).forEach((k) => keys.add(k)));
    if (/shoe|sneaker|sandal|slipper|flip.?flop|boot|loafer|heel|footwear|flats|moccasin|clog|mules|stiletto|floaters|crocs/.test(h) || keys.has('foot')) return 'shoe';
    if (/\bbra\b|bralette|brassiere/.test(h) || keys.has('underbust')) return 'bra';
    if (/dress|gown|jumpsuit|playsuit|romper|co-?ord|saree blouse|kurta set|lehenga/.test(h)) return 'dress';
    if (/jean|trouser|pant|short|chino|jogger|track|legging|jegging|skirt|palazzo|pyjama|pajama|brief|boxer|trunk|bottom|cargo|capri|salwar|churidar|dhoti|patiala/.test(h)) return 'bottom';
    if (/t-?shirt|tee|shirt|top|tunic|kurta|kurti|sweat|hood|jacket|blazer|coat|sweater|cardigan|vest|polo|jersey|blouse|tank|camisole|shrug|waistcoat|sherwani|nehru|innerwear|thermal/.test(h)) return 'top';
    if (keys.has('chest')) return 'top';
    if (keys.has('waist')) return 'bottom';
    return 'unknown';
  }

  function detectFit(text) {
    const s = String(text || '').toLowerCase();
    if (/oversize|over-size|drop.?shoulder|boxy|baggy/.test(s)) return 'oversized';
    if (/relaxed|loose|comfort fit|wide|straight|boyfriend|mom fit/.test(s)) return 'relaxed';
    if (/slim|skinny|muscle|fitted|bodycon|tapered|super skinny|athletic|compression/.test(s)) return 'slim';
    return 'regular';
  }

  function detectGender(text) {
    const s = String(text || '').toLowerCase();
    if (/\b(boys?|girls?|kids?|infants?|baby|toddler|junior)\b/.test(s)) return 'kids';
    if (/\b(women|womens|women's|ladies|woman|female|her|girl)\b/.test(s)) return 'women';
    if (/\b(men|mens|men's|man|male|him)\b/.test(s)) return 'men';
    if (/unisex/.test(s)) return 'unisex';
    return null;
  }

  function median(arr) {
    if (!arr.length) return null;
    const a = arr.slice().sort((x, y) => x - y);
    const m = Math.floor(a.length / 2);
    return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
  }

  // Shift the user's measurement by fit preference
  function adjusted(key, value, pref) {
    if (value == null) return null;
    if (key === 'foot') return value + (pref === 'loose' ? 0.3 : pref === 'snug' ? -0.2 : 0);
    if (key === 'inseam' || key === 'height') return value;
    const f = pref === 'snug' ? -0.015 : pref === 'loose' ? 0.025 : 0;
    return value * (1 + f);
  }

  // For one measurement key, return per-size implied body ranges and the typical step between sizes
  function bodyRanges(chart, key, fit) {
    const ranges = chart.sizes.map((s) => {
      const mm = s.m && s.m[key];
      if (!mm || mm.min == null) return null;
      const ease = mm.type === 'garment' ? (EASE[key] || {})[fit] || 0 : 0;
      return { lo: mm.min - ease, hi: mm.max - ease, type: mm.type, raw: mm };
    });
    const centers = ranges.filter(Boolean).map((r) => (r.lo + r.hi) / 2).sort((a, b) => a - b);
    const diffs = [];
    for (let i = 1; i < centers.length; i++) if (centers[i] - centers[i - 1] > 0.05) diffs.push(centers[i] - centers[i - 1]);
    const step = Math.max(key === 'foot' ? 0.5 : 1.5, median(diffs) || (key === 'foot' ? 0.8 : 5));
    return { ranges, step, count: centers.length };
  }

  // Distance of the user from a size, in "size steps". Too small hurts more than too big.
  function distance(user, r, step, key, secondary) {
    if (!r) return null;
    const tolerance = key === 'foot' ? 0.1 : 0;
    if (user >= r.lo - tolerance && user <= r.hi + tolerance) {
      // inside a range: tiny preference towards the middle
      return r.hi > r.lo ? Math.abs(user - (r.lo + r.hi) / 2) / (r.hi - r.lo) * 0.2 : 0;
    }
    if (user > r.hi) return ((user - r.hi - tolerance) / step) * (key === 'foot' ? 4 : 1.4); // garment / shoe too small
    return ((r.lo - user) / step) * (secondary ? 0.3 : 1.0); // garment too big (roomy hips/shoulders matter little)
  }

  function recommendFromMeasurements(chart, profile, category, fit, pref) {
    const weights = WEIGHTS[category] || WEIGHTS.unknown;
    const used = [];
    const keys = Object.keys(weights).filter((k) => profile[k] != null);
    const info = {};
    for (const k of keys) {
      const br = bodyRanges(chart, k, fit);
      if (br.count >= 1) info[k] = br;
    }
    const present = Object.keys(info);
    if (!present.length) return null;

    // primary = highest-weight measurement available
    present.sort((a, b) => weights[b] - weights[a]);
    const primary = present[0];
    const scoreWith = (ks) => chart.sizes.map((s, i) => {
      let tot = 0, wsum = 0;
      for (const k of ks) {
        const d = distance(adjusted(k, profile[k], pref), info[k].ranges[i], info[k].step, k, k !== primary);
        if (d == null) continue;
        tot += d * weights[k]; wsum += weights[k];
      }
      return wsum ? tot / wsum : null;
    });

    // Drop secondary measurements that look like bad data (e.g. flat/half measurements)
    const primaryScores = scoreWith([primary]);
    const pBest = primaryScores.reduce((b, s, i) => (s != null && (b < 0 || s < primaryScores[b]) ? i : b), -1);
    const keep = [primary];
    for (const k of present.slice(1)) {
      if (profile._estimated && profile._estimated[k]) continue; // estimates only guide the main measurement
      const r = info[k].ranges[pBest];
      if (!r) continue;
      const mid = (r.lo + r.hi) / 2;
      if (Math.abs(mid - profile[k]) <= Math.max(3 * info[k].step, 12)) keep.push(k);
    }
    const scores = scoreWith(keep);
    keep.forEach((k) => used.push(k));
    return { scores, used, info };
  }

  // Charts that only have labels: map labels onto standard size systems
  function recommendFromLabels(chart, profile, category, gender) {
    const S = F.standards;
    const g2 = gender === 'women' ? 'women' : 'men';
    const labels = chart.sizes.map((s) => s.label);
    const scores = chart.sizes.map(() => null);
    let used = [];
    if (category === 'shoe' && profile.foot) {
      const target = S.shoeFromFoot(adjusted('foot', profile.foot, profile.fitPref), g2);
      chart.sizes.forEach((s, i) => {
        const uk = s.alt && s.alt.UK != null ? Number(s.alt.UK) : parseFloat(String(s.label).replace(/[^\d.]/g, ''));
        if (!isNaN(uk)) scores[i] = Math.abs(uk - target.UK) * (uk < target.UK ? 2 : 1);
      });
      used = ['foot'];
    } else {
      const part = category === 'bottom' ? 'bottom' : 'top';
      const key = part === 'bottom' ? 'waist' : 'chest';
      if (!profile[key]) return null;
      const want = S.letterFor(adjusted(key, profile[key], profile.fitPref), g2, part);
      const order = U.LETTER_ORDER;
      const wi = order.indexOf(U.normLetter(want));
      const wNum = profile.waist ? profile.waist / U.IN : null;
      chart.sizes.forEach((s, i) => {
        const L = U.normLetter(String(s.label).replace(/\(.*\)|\/.*$/g, ''));
        const li = order.indexOf(L);
        if (li >= 0 && wi >= 0) scores[i] = Math.abs(li - wi) * (li < wi ? 1.4 : 1);
        else if (part === 'bottom' && /^\d{2}$/.test(String(s.label).trim()) && wNum) {
          const n = Number(String(s.label).trim());
          if (n >= 22 && n <= 50) scores[i] = n >= wNum ? (n - wNum) / 2 : ((wNum - n) / 2) * 1.4;
        }
      });
      used = [key];
    }
    if (scores.every((s) => s == null)) return null;
    return { scores, used, info: {}, labelsOnly: true, labels };
  }

  function recommend(chart, rawProfile) {
    if (!chart || !chart.sizes || !chart.sizes.length) return { ok: false, reason: 'No sizes found on this page.' };
    const profile = F.profile ? F.profile.effective(rawProfile) : rawProfile;
    const pref = profile.fitPref || 'regular';
    const category = chart.category || detectCategory(chart);
    const gender = chart.gender || detectGender(chart.hint) || profile.gender || 'men';
    if (gender === 'kids') return { ok: false, reason: 'Kids’ sizing isn’t supported yet.' };
    const fit = chart.fit || detectFit(chart.hint);

    let res = recommendFromMeasurements(chart, profile, category, fit, pref);
    if (!res || res.scores.every((s) => s == null)) res = recommendFromLabels(chart, profile, category, gender);
    if (!res) return { ok: false, reason: 'This size chart doesn’t include measurements from your profile.', category };

    const order = res.scores.map((s, i) => [s, i]).filter((x) => x[0] != null).sort((a, b) => a[0] - b[0]);
    const [bestScore, bi] = order[0];
    const best = chart.sizes[bi];
    const second = order[1];
    let between = null;
    if (second && second[0] - bestScore < 0.3 && bestScore > 0.05) between = chart.sizes[second[1]];

    const estimatedUsed = res.used.filter((k) => profile._estimated && profile._estimated[k]);
    let confidence = bestScore < 0.35 ? 'high' : bestScore < 0.9 ? 'medium' : 'low';
    if (res.labelsOnly && confidence === 'high') confidence = 'medium';
    if (estimatedUsed.length && confidence === 'high') confidence = 'medium';

    // Edge of the chart?
    let edge = null;
    const primary = res.used[0];
    if (!res.labelsOnly && primary && res.info[primary]) {
      const r = res.info[primary].ranges[bi];
      const u = adjusted(primary, profile[primary], pref);
      const step = res.info[primary].step;
      if (r && u > r.hi + step * 0.6 && bi === indexOfExtreme(res.info[primary].ranges, 'max')) edge = 'small';
      if (r && u < r.lo - step * 0.6 && bi === indexOfExtreme(res.info[primary].ranges, 'min')) edge = 'large';
      if (edge) confidence = 'low';
    }

    const unit = rawProfile.unit === 'cm' ? 'cm' : 'in';
    const reasons = [];
    if (!res.labelsOnly) {
      for (const k of res.used) {
        const r = res.info[k].ranges[bi];
        if (!r) continue;
        const u = k === 'foot' ? 'cm' : unit;
        const dg = k === 'foot' ? 1 : undefined;
        const sizeVal = r.raw.min === r.raw.max ? U.fmt(r.raw.min, u, dg) : U.fmt(r.raw.min, u, dg) + '–' + U.fmt(r.raw.max, u, dg);
        const yours = U.fmt(profile[k], u, dg);
        const kind = r.type === 'garment' ? 'garment' : 'fits body';
        reasons.push(`${LABELS[k]}: ${best.label} is ${sizeVal} (${kind}) · you ${yours}${profile._estimated && profile._estimated[k] ? ' (estimated)' : ''}`);
      }
    } else {
      reasons.push('Matched using standard size charts (this store gave no measurements).');
    }
    if (estimatedUsed.length) reasons.push(`Add your real ${estimatedUsed.map((k) => LABELS[k].toLowerCase()).join(' & ')} in your profile for a sharper match.`);

    let note = null;
    if (edge === 'small') note = `Even the largest size (${best.label}) may be tight on you.`;
    else if (edge === 'large') note = `Even the smallest size (${best.label}) may be loose on you.`;
    else if (between) {
      const bigger = res.scores[bi] != null && chart.sizes.indexOf(between) > bi;
      note = `You’re between ${best.label} and ${between.label}. ${bigger ? `Pick ${between.label} for a roomier fit.` : `Pick ${between.label} for a closer fit.`}`;
    }
    if (best.available === false) note = (note ? note + ' ' : '') + `${best.label} looks out of stock right now.`;

    return {
      ok: true,
      size: best,
      between,
      confidence,
      category,
      fit,
      gender,
      reasons,
      note,
      score: bestScore,
      used: res.used,
      labelsOnly: !!res.labelsOnly,
    };
  }

  function indexOfExtreme(ranges, which) {
    let idx = -1, v = which === 'max' ? -Infinity : Infinity;
    ranges.forEach((r, i) => {
      if (!r) return;
      const c = (r.lo + r.hi) / 2;
      if (which === 'max' ? c > v : c < v) { v = c; idx = i; }
    });
    return idx;
  }

  F.engine = { recommend, detectCategory, detectFit, detectGender, EASE, WEIGHTS };
})(globalThis);
