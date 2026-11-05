// FitID — official size charts collected from top brands' own websites (Nov 2026).
// Used for "My size at top brands" in the popup, and as a fallback on the brand's own site
// when its size guide shows only part of the chart.
(function (g) {
  const F = (g.FitID = g.FitID || {});

  // rows: [label, {chest:[lo,hi], waist:[lo,hi], hips:[lo,hi], shoulder:[lo,hi], foot:[lo,hi]}, alt]
  function chart(meta, rows) {
    return Object.assign({ type: 'body' }, meta, {
      sizes: rows.map(([label, m, alt, labelSys]) => ({
        label,
        labelSys,
        alt: alt || {},
        m: Object.fromEntries(Object.entries(m).map(([k, v]) => {
          const [lo, hi] = Array.isArray(v) ? v : [v, v];
          return [k, { min: lo, max: hi, type: meta.type || 'body' }];
        })),
      })),
    });
  }

  const I = (a, b) => [a * 2.54, b * 2.54]; // inches -> cm range
  const shoes = (rows) => rows.map(([uk, us, eu, foot]) => [String(uk), { foot }, { UK: uk, US: us, EU: eu }, 'UK']);

  const BRANDS = [
    // ---------- H&M (www2.hm.com/en_in, product size guide, body measurements) ----------
    chart({ brand: 'H&M', gender: 'men', category: 'top', hosts: ['hm.com'], source: 'https://www2.hm.com/en_in', note: 'Men’s tops' }, [
      ['XXS', { chest: [74, 78], waist: [62, 66] }, { UK: '28', EU: '38' }],
      ['XS', { chest: [78, 86], waist: [66, 74] }, { UK: '30-32', EU: '40-42' }],
      ['S', { chest: [86, 90], waist: [74, 78] }, { UK: '34-36', EU: '44-46' }],
      ['M', { chest: [94, 98], waist: [82, 86] }, { UK: '38-40', EU: '48-50' }],
      ['L', { chest: [102, 106], waist: [90, 94] }, { UK: '42-44', EU: '52-54' }],
      ['XL', { chest: [110, 114], waist: [98.5, 103] }, { UK: '46-48', EU: '56-58' }],
      ['XXL', { chest: [118, 122], waist: [107.5, 112] }, { UK: '50-52', EU: '60-62' }],
      ['3XL', { chest: [126, 130], waist: [116.5, 121] }, { UK: '54-56', EU: '64-66' }],
    ]),
    chart({ brand: 'H&M', gender: 'women', category: 'top', hosts: ['hm.com'], source: 'https://www2.hm.com/en_in', note: 'Women’s tops' }, [
      ['XXS', { chest: [74, 78], waist: [62, 64] }, { UK: '4', EU: '32' }],
      ['XS', { chest: [78, 82], waist: [64, 66] }, { UK: '6', EU: '34' }],
      ['S', { chest: [82, 90], waist: [66, 74] }, { UK: '8-10', EU: '36-38' }],
      ['M', { chest: [90, 98], waist: [74, 82.5] }, { UK: '12-14', EU: '40-42' }],
      ['L', { chest: [98, 107], waist: [82.5, 93] }, { UK: '16-18', EU: '44-46' }],
      ['XL', { chest: [107, 119], waist: [93, 105] }, { UK: '20-22', EU: '48-50' }],
      ['XXL', { chest: [119, 131], waist: [105, 117.5] }, { UK: '24-26', EU: '52-54' }],
      ['3XL', { chest: [131, 143], waist: [117.5, 131.5] }, { UK: '28-30', EU: '56-58' }],
    ]),

    // ---------- Zara (zara.com/in, "Product measurements" of Basic T-shirt; chest measured flat ×2) ----------
    chart({ brand: 'Zara', gender: 'men', category: 'top', type: 'garment', fit: 'regular', hosts: ['zara.com'], siteFallback: false, source: 'https://www.zara.com/in/en/', note: 'Basic T-shirt (product measurements)' }, [
      ['S', { chest: 106, shoulder: 46 }], ['M', { chest: 110, shoulder: 48 }], ['L', { chest: 114, shoulder: 50 }],
      ['XL', { chest: 118, shoulder: 52 }], ['XXL', { chest: 122, shoulder: 54 }],
    ]),

    // ---------- Nike (nike.com/size-fit, body measurements) ----------
    chart({ brand: 'Nike', gender: 'men', category: 'top', hosts: ['nike.com', 'nike.in'], source: 'https://www.nike.com/size-fit/mens_tops_alpha', note: 'Men’s tops & tees' }, [
      ['XXS', { chest: [72, 80], waist: [57, 65] }], ['XS', { chest: [80, 88], waist: [65, 73] }], ['S', { chest: [88, 96], waist: [73, 81] }],
      ['M', { chest: [96, 104], waist: [81, 89] }], ['L', { chest: [104, 112], waist: [89, 97] }], ['XL', { chest: [112, 124], waist: [97, 109] }],
      ['XXL', { chest: [124, 136], waist: [109, 121] }], ['3XL', { chest: [136, 148], waist: [121, 133] }],
    ]),
    chart({ brand: 'Nike', gender: 'women', category: 'top', hosts: ['nike.com', 'nike.in'], source: 'https://www.nike.com/size-fit/womens-tops-alpha', note: 'Women’s tops & tees' }, [
      ['XXS', { chest: [70, 76], waist: [54, 60], hips: [78, 84] }, { US: '0', UK: '2' }],
      ['XS', { chest: [76, 83], waist: [60, 67], hips: [84, 91] }, { US: '0-2', UK: '4-6' }],
      ['S', { chest: [83, 90], waist: [67, 74], hips: [91, 98] }, { US: '4-6', UK: '8-10' }],
      ['M', { chest: [90, 97], waist: [74, 81], hips: [98, 105] }, { US: '8-10', UK: '12-14' }],
      ['L', { chest: [97, 104], waist: [81, 88], hips: [105, 112] }, { US: '12-14', UK: '16-18' }],
      ['XL', { chest: [104, 114], waist: [88, 98], hips: [112, 120] }, { US: '16-18', UK: '20-22' }],
      ['XXL', { chest: [114, 124], waist: [98, 108], hips: [120, 128] }, { US: '20-22', UK: '24-26' }],
    ]),
    chart({ brand: 'Nike', gender: 'men', category: 'shoe', hosts: ['nike.com', 'nike.in'], source: 'https://www.nike.com/size-fit/mens-footwear', note: 'Men’s shoes' }, shoes([
      [6, 7, 40, 24.6], [6.5, 7.5, 40.5, 24.9], [7, 8, 41, 25.4], [7.5, 8.5, 42, 25.9], [8, 9, 42.5, 26.2], [8.5, 9.5, 43, 26.7],
      [9, 10, 44, 27.1], [9.5, 10.5, 44.5, 27.5], [10, 11, 45, 27.9], [10.5, 11.5, 45.5, 28.4], [11, 12, 46, 28.7], [12, 13, 47.5, 29.7],
    ])),
    chart({ brand: 'Nike', gender: 'women', category: 'shoe', hosts: ['nike.com', 'nike.in'], source: 'https://www.nike.com/size-fit/womens-footwear', note: 'Women’s shoes' }, shoes([
      [2.5, 5, 35.5, 22.0], [3, 5.5, 36, 22.4], [3.5, 6, 36.5, 22.9], [4, 6.5, 37.5, 23.3], [4.5, 7, 38, 23.7], [5, 7.5, 38.5, 24.1],
      [5.5, 8, 39, 24.5], [6, 8.5, 40, 25.0], [6.5, 9, 40.5, 25.4], [7, 9.5, 41, 25.8], [7.5, 10, 42, 26.2], [8, 10.5, 42.5, 26.7],
    ])),

    // ---------- U.S. Polo Assn. (uspoloassn.in, T-shirt size chart, garment cm, slim fit) ----------
    chart({ brand: 'U.S. Polo Assn.', gender: 'men', category: 'top', type: 'garment', fit: 'slim', hosts: ['uspoloassn.in'], siteFallback: false, source: 'https://uspoloassn.in', note: 'T-shirts (garment measurements)' }, [
      ['S', { chest: 96.5, shoulder: 40.6 }], ['M', { chest: 102, shoulder: 43.2 }], ['L', { chest: 107, shoulder: 45.7 }],
      ['XL', { chest: 112, shoulder: 48.3 }], ['XXL', { chest: 119, shoulder: 50.8 }],
    ]),
    // U.S. Polo Assn. sneakers, from its Myntra listing (brand "to fit foot length")
    chart({ brand: 'U.S. Polo Assn.', gender: 'men', category: 'shoe', hosts: ['uspoloassn.in'], siteFallback: false, source: 'https://www.myntra.com', note: 'Sneakers' }, shoes([
      [6, 7, 40, 26.68], [7, 8, 41, 27.35], [8, 9, 42, 28.01], [9, 10, 43, 28.68], [10, 11, 44, 29.35],
    ])),

    // ---------- Adidas (adidas.co.in product size guide, body measurements cm) ----------
    chart({ brand: 'Adidas', gender: 'men', category: 'top', hosts: ['adidas.co.in', 'adidas.com'], source: 'https://www.adidas.co.in', note: 'Men’s tops' }, [
      ['XS', { chest: [83, 86], waist: [71, 74], hips: [82, 85] }], ['S', { chest: [87, 92], waist: [75, 80], hips: [86, 91] }],
      ['M', { chest: [93, 100], waist: [81, 88], hips: [92, 99] }], ['L', { chest: [101, 108], waist: [89, 96], hips: [100, 107] }],
      ['XL', { chest: [109, 118], waist: [97, 106], hips: [108, 116] }], ['2XL', { chest: [119, 130], waist: [107, 119], hips: [117, 125] }],
      ['3XL', { chest: [131, 142], waist: [120, 132], hips: [126, 135] }],
    ]),
    chart({ brand: 'Adidas', gender: 'women', category: 'top', hosts: ['adidas.co.in', 'adidas.com'], source: 'https://www.adidas.co.in', note: 'Women’s tops' }, [
      ['2XS', { chest: [73, 76], waist: [57, 60], hips: [82, 85] }], ['XS', { chest: [77, 82], waist: [61, 66], hips: [86, 91] }],
      ['S', { chest: [83, 88], waist: [67, 72], hips: [92, 97] }], ['M', { chest: [89, 94], waist: [73, 78], hips: [98, 103] }],
      ['L', { chest: [95, 101], waist: [79, 85], hips: [104, 110] }], ['XL', { chest: [102, 109], waist: [86, 94], hips: [111, 117] }],
      ['2XL', { chest: [110, 118], waist: [95, 104], hips: [118, 125] }],
    ]),
    chart({ brand: 'Adidas', gender: 'men', category: 'shoe', hosts: ['adidas.co.in', 'adidas.com'], source: 'https://www.adidas.co.in', note: 'Shoes' }, shoes([
      [6, 6.5, '39 1/3', 24.2], [6.5, 7, 40, 24.6], [7, 7.5, '40 2/3', 25.0], [7.5, 8, '41 1/3', 25.5], [8, 8.5, 42, 25.9], [8.5, 9, '42 2/3', 26.3],
      [9, 9.5, '43 1/3', 26.7], [9.5, 10, 44, 27.1], [10, 10.5, '44 2/3', 27.6], [10.5, 11, '45 1/3', 28.0], [11, 11.5, 46, 28.4], [12, 12.5, '47 1/3', 29.3],
    ])),
    chart({ brand: 'Adidas', gender: 'women', category: 'shoe', hosts: ['adidas.co.in', 'adidas.com'], source: 'https://www.adidas.co.in', note: 'Shoes' }, shoes([
      [3.5, 5, 36, 22.1], [4, 5.5, '36 2/3', 22.5], [4.5, 6, '37 1/3', 22.9], [5, 6.5, 38, 23.3], [5.5, 7, '38 2/3', 23.8], [6, 7.5, '39 1/3', 24.2],
      [6.5, 8, 40, 24.6], [7, 8.5, '40 2/3', 25.0], [7.5, 9, '41 1/3', 25.5], [8, 9.5, 42, 25.9],
    ])),

    // ---------- Puma (in.puma.com product size guide, body measurements in inches) ----------
    chart({ brand: 'Puma', gender: 'men', category: 'top', hosts: ['puma.com'], source: 'https://in.puma.com', note: 'Men’s clothing' }, [
      ['XXS', { chest: I(29, 32), waist: I(24, 26), hips: I(28, 31) }], ['XS', { chest: I(32, 35), waist: I(27, 30), hips: I(32, 34) }],
      ['S', { chest: I(35, 38), waist: I(30, 33), hips: I(35, 37) }], ['M', { chest: I(38, 41), waist: I(33, 36), hips: I(38, 40) }],
      ['L', { chest: I(41, 45), waist: I(36, 39), hips: I(41, 44) }], ['XL', { chest: I(45, 48), waist: I(40, 43), hips: I(44, 48) }],
      ['XXL', { chest: I(49, 52), waist: I(44, 48), hips: I(48, 52) }],
    ]),
    chart({ brand: 'Puma', gender: 'women', category: 'top', hosts: ['puma.com'], source: 'https://in.puma.com', note: 'Women’s clothing' }, [
      ['XXS', { chest: I(30, 31), waist: I(23, 25), hips: I(33, 34) }], ['XS', { chest: I(32, 33), waist: I(25, 27), hips: I(35, 36) }],
      ['S', { chest: I(34, 35), waist: I(27, 29), hips: I(37, 39) }], ['M', { chest: I(36, 39), waist: I(30, 32), hips: I(39, 42) }],
      ['L', { chest: I(39, 42), waist: I(33, 35), hips: I(42, 45) }], ['XL', { chest: I(42, 45), waist: I(36, 39), hips: I(45, 48) }],
      ['2XL', { chest: I(45, 48), waist: I(39, 42), hips: I(48, 51) }], ['3XL', { chest: I(48, 51), waist: I(43, 46), hips: I(52, 55) }],
    ]),
    chart({ brand: 'Puma', gender: 'men', category: 'shoe', hosts: ['puma.com'], source: 'https://in.puma.com', note: 'Shoes' }, shoes([
      [6, 7, 39, 24.5], [6.5, 7.5, 40, 25.0], [7, 8, 40.5, 25.4], [7.5, 8.5, 41, 25.8], [8, 9, 42, 26.2], [8.5, 9.5, 42.5, 26.7],
      [9, 10, 43, 27.1], [9.5, 10.5, 44, 27.5], [10, 11, 44.5, 27.9], [10.5, 11.5, 45, 28.3], [11, 12, 46, 28.8], [12, 13, 47, 29.6],
    ])),
    chart({ brand: 'Puma', gender: 'women', category: 'shoe', hosts: ['puma.com'], source: 'https://in.puma.com', note: 'Shoes' }, shoes([
      [3, null, 35.5, 21.8], [3.5, null, 36, 22.3], [4, null, 37, 22.8], [4.5, null, 37.5, 23.2], [5, null, 38, 23.7], [5.5, null, 38.5, 24.1],
      [6, null, 39, 24.5], [6.5, null, 40, 25.0], [7, null, 40.5, 25.4], [7.5, null, 41, 25.8], [8, null, 42, 26.2],
    ])),

    // ---------- Levi's (levi.in product size guide, GARMENT measurements) ----------
    chart({ brand: 'Levi’s', gender: 'men', category: 'bottom', type: 'garment', hosts: ['levi.in'], siteFallback: false, source: 'https://levi.in', note: 'Jeans (garment measurements)' },
      [[28, 30, 37.5], [29, 31, 38.5], [30, 32, 39.5], [31, 33, 40.5], [32, 34, 41.5], [33, 35, 42.5], [34, 36, 43.5], [36, 38, 45.5], [38, 40, 47.13], [40, 42, 48.75], [42, 44, 50.38]]
        .map(([s, w, h]) => [String(s), { waist: w * 2.54, hips: h * 2.54 }])),
    chart({ brand: 'Levi’s', gender: 'men', category: 'top', type: 'garment', hosts: ['levi.in'], siteFallback: false, source: 'https://levi.in', note: 'T-shirts (garment, US cut)' }, [
      ['XS', { chest: 97.79, shoulder: 41.28 }], ['S', { chest: 104.14, shoulder: 43.82 }], ['M', { chest: 110.49, shoulder: 46.36 }],
      ['L', { chest: 116.84, shoulder: 48.9 }], ['XL', { chest: 123.19, shoulder: 51.44 }], ['XXL', { chest: 129.54, shoulder: 53.98 }],
    ]),
    chart({ brand: 'Levi’s', gender: 'women', category: 'bottom', type: 'garment', fit: 'relaxed', hosts: ['levi.in'], siteFallback: false, source: 'https://levi.in', note: 'Jeans (garment measurements)' },
      [[24, 26.75, 37], [25, 27.75, 38], [26, 28.75, 39], [27, 29.75, 40], [28, 30.75, 41], [29, 31.75, 42], [30, 32.75, 43], [31, 34.25, 44.5], [32, 35.75, 46], [33, 37.25, 47.5], [34, 39.25, 49.5]]
        .map(([s, w, h]) => [String(s), { waist: w * 2.54, hips: h * 2.54 }])),
  ];

  // Stores whose on-page size charts are garment (product) measurements without saying so
  const HOST_TYPES = { 'levi.in': 'garment' };
  function hostType(host) {
    const h = String(host || '').replace(/^www\d*\./, '');
    const k = Object.keys(HOST_TYPES).find((x) => h === x || h.endsWith('.' + x));
    return k ? HOST_TYPES[k] : null;
  }

  // Your size at every brand we have a chart for (matching the profile's sizing)
  function mySizes(profile) {
    if (!profile) return [];
    const gender = profile.gender === 'women' ? 'women' : 'men';
    return BRANDS.filter((b) => b.gender === gender).map((b) => {
      const rec = F.engine.recommend(Object.assign({ hint: b.note }, b), profile);
      return { chart: b, rec };
    }).filter((x) => x.rec.ok);
  }

  function forHost(host, category, gender) {
    const h = String(host || '').replace(/^www\d*\./, '');
    return BRANDS.find((b) => b.siteFallback !== false && b.hosts.some((x) => h === x || h.endsWith('.' + x)) && b.category === category && (!gender || b.gender === gender)) || null;
  }

  F.brands = { BRANDS, mySizes, forHost, hostType };
})(globalThis);
