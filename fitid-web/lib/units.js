// Copied from fitid-extension/lib/units.js by sync-lib.js. Do not edit here.
// FitID — unit helpers and measurement-name normalisation.
// Everything inside FitID is stored in centimetres.
(function (g) {
  const F = (g.FitID = g.FitID || {});
  const IN = 2.54;

  function toCm(value, unit) {
    if (value == null || isNaN(value)) return null;
    const u = String(unit || 'cm').toLowerCase();
    if (u.startsWith('in') || u === '"' || u === 'inch' || u === 'inches') return value * IN;
    if (u === 'mm') return value / 10;
    return value;
  }

  function fromCm(cm, unit) {
    if (cm == null) return null;
    return unit === 'in' ? cm / IN : cm;
  }

  function fmt(cm, unit, digits) {
    if (cm == null) return '—';
    const v = fromCm(cm, unit);
    const d = digits != null ? digits : unit === 'in' ? 1 : 0;
    return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)) + (unit === 'in' ? ' in' : ' cm');
  }

  // Parses "38", "38.5", "38-40", "38 – 40", "38 to 40", "38½", "38 1/2" -> [min, max]
  function parseRange(text) {
    if (text == null) return null;
    let s = String(text)
      .replace(/½/g, '.5').replace(/¼/g, '.25').replace(/¾/g, '.75')
      .replace(/(\d+)\s+(\d{1,2})\/(\d{1,2})/g, (m, w, n, d) => String(Number(w) + Number(n) / Number(d))) // 9 11/16      .replace(/,(\d)/g, '.$1');
    const nums = (s.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    if (!nums.length) return null;
    if (nums.length >= 2 && /(\d)\s*(-|–|—|to|~)\s*(\d)/i.test(s)) {
      const a = nums[0], b = nums[1];
      return [Math.min(a, b), Math.max(a, b)];
    }
    return [nums[0], nums[0]];
  }

  function detectUnit(text) {
    if (!text) return null;
    const s = String(text).toLowerCase();
    if (/\bcm\b|centimet|\(cm\)|in cm/.test(s)) return 'cm';
    if (/\binch|\(in\)|\bin\b\.?\)|"|\bins?\b/.test(s)) return 'in';
    return null;
  }

  // Map a measurement / column name to a canonical key.
  // Keys: chest, underbust, waist, hips, shoulder, inseam, foot, height
  function measureKey(name) {
    if (!name) return null;
    const s = String(name).toLowerCase().replace(/_attribute/g, '').replace(/[_\-]+/g, ' ').trim();
    if (/sleeve|length\s*of\s*sleeve|cuff|neck|collar|thigh|knee|bottom|hem|rise|calf|arm|bicep|wrist/.test(s) && !/foot|feet/.test(s)) return null;
    if (/under\s*bust|underbust|rib\s*cage|band\s*size/.test(s)) return 'underbust';
    if (/foot|feet|insole|heel\s*(to\s*)?toe|brannock/.test(s)) return 'foot';
    if (/chest|bust/.test(s)) return 'chest';
    if (/waist/.test(s)) return 'waist';
    if (/hip|seat/.test(s)) return 'hips';
    if (/shoulder/.test(s)) return 'shoulder';
    if (/inseam|inside\s*leg|inner\s*leg|leg\s*length/.test(s)) return 'inseam';
    if (/^(body\s*)?height$|^to\s*fit\s*height/.test(s)) return 'height';
    return null;
  }

  // Map a column name to a shoe/size system key (UK, US, EU, IN, JP) or null.
  function systemKey(name) {
    if (!name) return null;
    const s = String(name).toLowerCase().replace(/\(.*?\)/g, '').replace(/size|_attribute/g, '').replace(/[^a-z ]/g, ' ').trim();
    if (/\b(women|womens|ladies|female|kids|youth|child)\b/.test(s)) return null; // "US - Women" rows alongside "US - Men"
    if (/^uk\b|united kingdom/.test(s)) return 'UK';
    if (/^us\b|^usa\b/.test(s)) return 'US';
    if (/^eu\b|^eur\b|^euro|^europe|^fr\b/.test(s)) return 'EU';
    if (/^ind\b|^india/.test(s)) return 'IN';
    if (/^jp\b|^japan|^mondo/.test(s)) return 'JP';
    return null;
  }

  const LETTER_RE = /^(xxxs|xxs|xs|[2-3]xs|s|m|l|xl|xxl|xxxl|xxxxl|[2-8]xl|[0-8]x|free\s*size|one\s*size|small|medium|large|x-large|xx-large)(\s*(tall|short|petite|long|regular|plus))?(\s*\([^)]{1,12}\))?$/i;
  const LETTER_ORDER = ['xxxs', 'xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'xxxxl', '5xl', '6xl', '7xl', '8xl'];

  function normLetter(label) {
    let s = String(label || '').trim().toLowerCase().replace(/\s+/g, '');
    s = s.replace(/\(.*\)$/, '').replace(/(tall|short|petite|long|regular|plus)$/, '');
    const map = { small: 's', medium: 'm', large: 'l', 'x-large': 'xl', 'xx-large': 'xxl', '2xl': 'xxl', '3xl': 'xxxl', '4xl': 'xxxxl', '2x': 'xxl', '3x': 'xxxl', '4x': 'xxxxl', '2xs': 'xxs', '3xs': 'xxxs' };
    return map[s] || s;
  }

  function isSizeLabel(text) {
    const s = String(text || '').trim();
    if (!s || s.length > 18) return false;
    if (LETTER_RE.test(s)) return true;
    if (/^(uk|us|eu|ind?)\s*\d{1,2}(\.5)?$/i.test(s)) return true;
    if (/^\d{1,2}(\.5)?$/.test(s)) return true; // 28, 30, 7, 8.5
    if (/^\d{2,3}$/.test(s)) return true; // EU 42 / dress 38
    if (/^(xs|s|m|l|xl|xxl|[2-6]xl)\s*[\/(]\s*\d{2}\s*\)?$/i.test(s)) return true; // M/40, L (42)
    if (/^\d{2}[a-h]{1,3}$/i.test(s)) return true; // bra 34B
    return false;
  }

  F.units = { IN, toCm, fromCm, fmt, parseRange, detectUnit, measureKey, systemKey, isSizeLabel, normLetter, LETTER_ORDER };
})(globalThis);
