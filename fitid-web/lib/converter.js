// Copied from fitid-extension/lib/converter.js by sync-lib.js. Do not edit here.
// FitID — size label converter (US / UK / EU / IN / international) for men, women and kids.
// Rows are common chart conventions; brands vary, which is why product pages use the brand's own chart.
(function (g) {
  const F = (g.FitID = g.FitID || {});
  const S = F.standards;
  const IN = 2.54;
  const r1 = (x) => Math.round(x * 10) / 10;
  const inch = (cm) => Math.round(cm / IN);

  // ---------- Men ----------
  const MEN_TOPS = {
    title: 'Shirts, T-shirts & jackets',
    cols: ['INTL', 'US', 'UK', 'EU', 'IN'],
    colNames: { INTL: 'Letter', US: 'US', UK: 'UK', EU: 'EU', IN: 'India shirt' },
    rows: [
      ['XS', 34, 34, 44, 36, '34–36'], ['S', 36, 36, 46, 38, '36–38'], ['M', 38, 38, 48, 40, '38–40'],
      ['L', 40, 40, 50, 42, '40–42'], ['XL', 42, 42, 52, 44, '42–44'], ['XXL', 44, 44, 54, 46, '44–46'],
      ['3XL', 46, 46, 56, 48, '46–48'], ['4XL', 48, 48, 58, 50, '48–50'],
    ].map(([INTL, US, UK, EU, INs, chest]) => ({ INTL, US, UK, EU, IN: INs, measure: `Chest ${chest} in` })),
    mine: (p) => S.letterFor(p.chest, 'men', 'top'),
    mineKey: 'INTL',
  };
  const MEN_BOTTOMS = {
    title: 'Jeans & trousers',
    cols: ['INTL', 'US', 'UK', 'EU', 'IN'],
    colNames: { INTL: 'Letter', US: 'US (waist)', UK: 'UK', EU: 'EU', IN: 'India' },
    rows: [[28, 'XS'], [30, 'S'], [32, 'M'], [34, 'L'], [36, 'XL'], [38, 'XXL'], [40, '3XL'], [42, '4XL']]
      .map(([w, L]) => ({ INTL: L, US: w, UK: w, EU: w + 16, IN: w, measure: `Waist ${w - 1}–${w} in` })),
    mine: (p) => p.waist ? S.waistNumber(p.waist).even : null,
    mineKey: 'US',
  };
  const shoeRows = (gender) => S.SHOE[gender].map(([uk, foot]) => {
    const s = S.shoeSystems(uk, gender);
    return { UK: uk, US: s.US, EU: s.EU, IN: uk, CM: r1(foot), measure: `Foot up to ${r1(foot)} cm` };
  });
  const MEN_SHOES = {
    title: 'Shoes', cols: ['UK', 'US', 'EU', 'IN', 'CM'], colNames: { UK: 'UK', US: 'US', EU: 'EU', IN: 'India', CM: 'Foot cm' },
    rows: shoeRows('men'), mine: (p) => p.foot ? Math.ceil(S.shoeFromFoot(p.foot, 'men').UK) : null, mineKey: 'UK',
  };

  // ---------- Women ----------
  const WOMEN_CLOTHING = {
    title: 'Dresses, tops & kurtas',
    cols: ['INTL', 'US', 'UK', 'EU', 'IT', 'IN'],
    colNames: { INTL: 'Letter', US: 'US', UK: 'UK', EU: 'EU / FR', IT: 'IT', IN: 'India' },
    rows: S.DRESS_UK.map(([uk, b, w, h]) => {
      const L = S.letterFor(b, 'women', 'top');
      return { INTL: L, US: uk - 4, UK: uk, EU: uk + 28, IT: uk + 32, IN: L, measure: `Bust ${inch(b)} · Waist ${inch(w)} · Hips ${inch(h)} in` };
    }),
    mine: (p) => { const d = S.dressFor(p); return d ? d.UK : null; },
    mineKey: 'UK',
  };
  const WOMEN_JEANS = {
    title: 'Jeans & trousers',
    cols: ['W', 'INTL', 'US', 'UK', 'EU'],
    colNames: { W: 'Waist size', INTL: 'Letter', US: 'US', UK: 'UK', EU: 'EU' },
    rows: [[24, 'XXS', '00'], [25, 'XS', 0], [26, 'XS', 2], [27, 'S', 4], [28, 'S', 6], [29, 'M', 8], [30, 'M', 10], [31, 'L', 12], [32, 'L', 14], [33, 'XL', 16], [34, 'XL', 18]]
      .map(([w, L, us]) => { const n = us === '00' ? -2 : us; return { W: w, INTL: L, US: us, UK: n + 4, EU: n + 32, measure: `Waist ${w} in` }; }),
    mine: (p) => p.waist ? Math.round(p.waist / IN) : null,
    mineKey: 'W',
  };
  const WOMEN_SHOES = {
    title: 'Shoes', cols: ['UK', 'US', 'EU', 'IN', 'CM'], colNames: { UK: 'UK', US: 'US', EU: 'EU', IN: 'India', CM: 'Foot cm' },
    rows: shoeRows('women'), mine: (p) => p.foot ? Math.ceil(S.shoeFromFoot(p.foot, 'women').UK) : null, mineKey: 'UK',
  };
  const ukCups = ['A', 'B', 'C', 'D', 'DD', 'E', 'F', 'FF', 'G'];
  const usCups = ['A', 'B', 'C', 'D', 'DD/E', 'DDD/F', 'G', 'H', 'I'];
  const euCups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  const WOMEN_BRA = {
    title: 'Bras',
    cols: ['UK', 'US', 'EU', 'FR', 'IN'],
    colNames: { UK: 'UK', US: 'US', EU: 'EU', FR: 'FR', IN: 'India' },
    rows: [].concat(...[30, 32, 34, 36, 38, 40].map((band) => ukCups.slice(0, 7).map((c, i) => {
      const eu = (band - 32) * 2.5 + 70;
      return { UK: band + c, US: band + usCups[i], EU: eu + euCups[i], FR: eu + 15 + euCups[i], IN: band + c, measure: `Underbust ≈ ${band - 2}–${band} in, bust − band ≈ ${i + 1} in` };
    }))),
    mine: (p) => { const b = S.braFor(p); return b ? b.UK : null; },
    mineKey: 'UK',
  };

  // ---------- Kids ----------
  const KIDS_CLOTHING = {
    title: 'Clothing (by age & height)',
    cols: ['AGE', 'US', 'UK', 'EU', 'IN'],
    colNames: { AGE: 'Age', US: 'US', UK: 'UK', EU: 'EU (cm)', IN: 'India' },
    rows: [
      ['0–3 months', '0-3M', '0-3 m', 56, '0-3M', '50–56'], ['3–6 months', '3-6M', '3-6 m', 62, '3-6M', '56–62'], ['6–12 months', '6-12M', '6-12 m', 74, '6-12M', '62–74'],
      ['12–18 months', '12-18M', '12-18 m', 80, '12-18M', '74–80'], ['18–24 months', '18-24M', '18-24 m', 86, '18-24M', '80–86'],
      ['2–3 years', '2T', '2-3 Y', 98, '2-3Y', '92–98'], ['3–4 years', '3T', '3-4 Y', 104, '3-4Y', '98–104'], ['4–5 years', '4T / XS', '4-5 Y', 110, '4-5Y', '104–110'],
      ['5–6 years', '5 / XS', '5-6 Y', 116, '5-6Y', '110–116'], ['6–7 years', '6 / S', '6-7 Y', 122, '6-7Y', '116–122'], ['7–8 years', '7 / S', '7-8 Y', 128, '7-8Y', '122–128'],
      ['8–9 years', '8 / M', '8-9 Y', 134, '8-9Y', '128–134'], ['9–10 years', '10 / M', '9-10 Y', 140, '9-10Y', '134–140'], ['10–11 years', '10–12 / L', '10-11 Y', 146, '10-11Y', '140–146'],
      ['11–12 years', '12 / L', '11-12 Y', 152, '11-12Y', '146–152'], ['12–13 years', '14 / XL', '12-13 Y', 158, '12-13Y', '152–158'], ['13–14 years', '16 / XL', '13-14 Y', 164, '13-14Y', '158–164'],
    ].map(([AGE, US, UK, EU, INs, h]) => ({ AGE, US, UK, EU, IN: INs, measure: `Height ${h} cm` })),
  };
  const KIDS_SHOES = {
    title: 'Shoes',
    cols: ['UK', 'US', 'EU', 'IN', 'CM'],
    colNames: { UK: 'UK', US: 'US', EU: 'EU', IN: 'India', CM: 'Foot cm' },
    rows: [
      ['2 (infant)', '3', 18, 10.8], ['3 (infant)', '4', 19, 11.6], ['4 (infant)', '5', 20, 12.4], ['5 (toddler)', '6', 22, 13.2],
      ['6 (toddler)', '7', 23, 14.0], ['7 (toddler)', '8', 24, 14.8], ['8 (kids)', '9', 26, 15.6], ['9 (kids)', '10', 27, 16.5],
      ['10 (kids)', '11', 28, 17.3], ['11 (kids)', '12', 29, 18.1], ['12 (kids)', '13', 31, 18.9], ['13 (kids)', '1Y', 32, 19.8],
      ['1 (youth)', '2Y', 33, 20.6], ['2 (youth)', '3Y', 34, 21.4], ['3 (youth)', '4Y', 35.5, 22.2], ['4 (youth)', '5Y', 37, 23.0], ['5 (youth)', '6Y', 38, 23.8],
    ].map(([UK, US, EU, cm]) => ({ UK, US, EU, IN: UK, CM: cm, measure: `Foot up to ${cm} cm` })),
  };

  const GROUPS = {
    men: { label: 'Men', cats: { tops: MEN_TOPS, bottoms: MEN_BOTTOMS, shoes: MEN_SHOES } },
    women: { label: 'Women', cats: { clothing: WOMEN_CLOTHING, jeans: WOMEN_JEANS, shoes: WOMEN_SHOES, bra: WOMEN_BRA } },
    kids: { label: 'Kids', cats: { clothing: KIDS_CLOTHING, shoes: KIDS_SHOES } },
  };

  // Which row is "mine" for this table (only for the group matching the profile)
  function myRow(table, group, profile) {
    if (!profile || !table.mine || group !== (profile.gender === 'women' ? 'women' : 'men')) return -1;
    const v = table.mine(profile);
    if (v == null) return -1;
    return table.rows.findIndex((r) => String(r[table.mineKey]) === String(v));
  }

  F.converter = { GROUPS, myRow };
})(globalThis);
