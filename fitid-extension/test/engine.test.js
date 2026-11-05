// Run: node test/engine.test.js   (uses real size data captured from Myntra / AJIO product pages)
globalThis.__FITID_TEST__ = true;
globalThis.location = { href: 'https://example.test/product', hostname: 'example.test', pathname: '/product' };
const path = require('path');
const root = path.join(__dirname, '..');
['lib/units.js', 'lib/standards.js', 'lib/engine.js', 'lib/profile.js'].forEach((f) => require(path.join(root, f)));
const F = globalThis.FitID;
// site readers reference UI helpers only at run time
F.onUrlChange = () => {};
require(path.join(root, 'content/sites/myntra.js'));
require(path.join(root, 'content/sites/ajio.js'));

let pass = 0, fail = 0;
function expect(name, got, want) {
  const ok = Array.isArray(want) ? want.includes(got) : got === want;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got ${JSON.stringify(got)}${ok ? '' : ', want ' + JSON.stringify(want)}`);
  ok ? pass++ : fail++;
}
const IN = 2.54;
const man = { gender: 'men', height: 170, weight: 73, fitPref: 'regular', unit: 'in' };

// --- Myntra: Levi's tee, garment measurements (inches) ---
const m = (name, v, type = 'GARMENT', unit = 'Inches') => ({ name, value: String(v), minValue: String(v), maxValue: String(v), type, measurementType: type, unit });
const leviStyle = {
  name: 'Levis Men Soft Pure Cotton Round Neck Half Sleeve Tshirt',
  brand: { name: 'Levis' },
  analytics: { articleType: 'Lounge Tshirts', gender: 'Men', subCategory: 'Loungewear and Nightwear' },
  articleAttributes: { 'Body or Garment Size': 'Garment Measurements in', Type: 'Regular' },
  sizes: [
    ['S', 38.18, 16.53], ['M', 40.14, 17.32], ['L', 42.1, 18.11], ['XL', 44.06, 18.9],
  ].map(([label, chest, sh]) => ({ label, available: true, allSizesList: [], measurements: [m('Chest', chest), m('Across Shoulder', sh), m('Front Length', 27)] })),
};
const levi = F.myntra.toChart(leviStyle);
expect('Myntra parse: Levi chest M in cm', Math.round(levi.sizes[1].m.chest.min), 102);
expect('Levi tee, chest estimated from 170cm/73kg', F.engine.recommend(levi, man).size.label, 'M');
expect('Levi tee, chest 38in', F.engine.recommend(levi, Object.assign({}, man, { chest: 38 * IN })).size.label, 'M');
const r41 = F.engine.recommend(levi, Object.assign({}, man, { chest: 41 * IN }));
expect('Levi tee, chest 41in -> L or XL', r41.size.label, ['L', 'XL']);
expect('Levi tee, chest 41in -> flagged between sizes', !!r41.between, true);
expect('Levi tee, chest 36in', F.engine.recommend(levi, Object.assign({}, man, { chest: 36 * IN })).size.label, 'S');
const big = F.engine.recommend(levi, Object.assign({}, man, { chest: 48 * IN }));
expect('Levi tee, chest 48in -> largest + warning', big.size.label + '|' + big.confidence, 'XL|low');

// --- Myntra: Highlander jeans, "To Fit Waist" body sizes + garment hips ---
const jeansStyle = {
  name: 'HIGHLANDER Men Straight Fit Heavy Fade Stretchable Jeans', brand: { name: 'HIGHLANDER' },
  analytics: { articleType: 'Jeans', gender: 'Men' }, articleAttributes: { Fit: 'Straight Fit' },
  sizes: [[30, 39], [32, 41], [34, 43], [36, 45], [38, 47]].map(([w, h]) => ({ label: String(w), allSizesList: [], measurements: [m('To Fit Waist', w, 'BODY'), m('Hips', h), m('Inseam Length', 29.25)] })),
};
const jeans = F.myntra.toChart(jeansStyle);
expect('Jeans waist 32in', F.engine.recommend(jeans, Object.assign({}, man, { waist: 32 * IN, hips: 38 * IN })).size.label, '32');
expect('Jeans waist 33in -> rounds up', F.engine.recommend(jeans, Object.assign({}, man, { waist: 33 * IN, hips: 39 * IN })).size.label, '34');
expect('Jeans category', F.engine.recommend(jeans, man).category, 'bottom');

// --- M&S jeans: odd "Hips" data must not override waist ---
const msStyle = {
  name: 'Marks & Spencer Slim Fit Stretch Jeans', brand: { name: 'Marks & Spencer' }, analytics: { articleType: 'Jeans', gender: 'Men' }, articleAttributes: { Fit: 'Slim Fit' },
  sizes: [30, 32, 34, 36, 38].map((w) => ({ label: String(w), allSizesList: [], measurements: [m('To Fit Waist', w, 'BODY'), m('Hips', w + 2)] })),
};
expect('M&S jeans waist 34, hips 40 (bad hips data ignored)', F.engine.recommend(F.myntra.toChart(msStyle), Object.assign({}, man, { waist: 34 * IN, hips: 40 * IN })).size.label, '34');

// --- Myntra shoes: brand-specific foot length + UK/US/EU ---
const shoe = (uk, us, eu, foot) => ({ label: String(uk), allSizesList: [{ scaleCode: 'uk_size', sizeValue: String(uk) }, { scaleCode: 'us_size', sizeValue: String(us) }, { scaleCode: 'euro_size', sizeValue: String(eu) }], measurements: [m('To Fit Foot Length', foot, 'BODY', 'cm')] });
const uspa = F.myntra.toChart({ name: 'U.S. Polo Assn. Men Colourblocked Sneakers', brand: { name: 'U.S. Polo Assn.' }, analytics: { articleType: 'Casual Shoes', gender: 'Men' }, articleAttributes: {}, sizes: [shoe(6, 7, 40, 26.68), shoe(7, 8, 41, 27.35), shoe(8, 9, 42, 28.01), shoe(9, 10, 43, 28.68)] });
const hrx = F.myntra.toChart({ name: 'HRX Unisex Shoes', brand: { name: 'HRX by Hrithik Roshan' }, analytics: { articleType: 'Sports Shoes', gender: 'Unisex' }, articleAttributes: {}, sizes: [shoe(5, 6, 38, 25.2), shoe(6, 7, 39, 26.0), shoe(7, 8, 40, 26.8), shoe(8, 9, 41, 27.6)] });
const foot = Object.assign({}, man, { foot: 26.3 });
const r1 = F.engine.recommend(uspa, foot), r2 = F.engine.recommend(hrx, foot);
expect('Shoes: USPA, 26.3cm foot', r1.size.label, '6');
expect('Shoes: USPA alt sizes', `${r1.size.alt.US}/${r1.size.alt.EU}`, '7/40');
expect('Shoes: HRX, same foot -> different UK size', r2.size.label, '7');
expect('Shoes category', r1.category, 'shoe');

// --- AJIO: size guide JSON string (inches + converted cm) ---
const guide = {
  fittingType: 'Slim Fit',
  sizechart: [{
    measurementType: 'Garment Measurement', gender: 'Men', brickName: 'Tshirts', brandName: 'THE BEAR HOUSE',
    brickBrandSizes: [['S', 38.5, 16], ['M', 40.5, 16.75], ['L', 42.5, 17.5], ['XL', 44.5, 18.25]].map(([n, c, s]) => ({
      sizeName: n,
      sizeChartAttributes: [
        { attributeName: 'Shoulder_attribute', attributeValue: String(s), convertedAttributeValue: String(s * IN) },
        { attributeName: 'Chest_attribute', attributeValue: String(c), convertedAttributeValue: String(c * IN) },
        { attributeName: 'Length_attribute', attributeValue: '27.6', convertedAttributeValue: '70.1' },
      ],
    })),
  }],
};
const ajioJson = { name: 'Men Regular Fit T-Shirt', brandName: 'THE BEAR HOUSE', baseOptions: [{ options: [{ sizeGuideDesktop: JSON.stringify(JSON.stringify(guide)) }] }] };
const aj = F.ajio.toChart(ajioJson);
expect('AJIO parse: sizes', aj.sizes.map((s) => s.label).join(','), 'S,M,L,XL');
expect('AJIO parse: slim fit', aj.fit, 'slim');
expect('AJIO slim tee, chest 38in', F.engine.recommend(aj, Object.assign({}, man, { chest: 38 * IN })).size.label, ['S', 'M']);
expect('AJIO slim tee, chest 39in', F.engine.recommend(aj, Object.assign({}, man, { chest: 39 * IN })).size.label, 'M');

// --- Labels only (no measurements): fall back to standard charts ---
const labelsOnly = { brand: 'X', hint: 'Men T-shirt', sizes: ['S', 'M', 'L', 'XL'].map((l) => ({ label: l, alt: {}, m: {} })) };
expect('Labels only, chest 39in -> M', F.engine.recommend(labelsOnly, Object.assign({}, man, { chest: 39 * IN })).size.label, 'M');
const shoeLabels = { brand: 'Y', hint: 'Men sneakers', sizes: [6, 7, 8, 9, 10].map((l) => ({ label: 'UK ' + l, alt: { UK: l }, m: {} })) };
expect('Shoe labels only, 26cm foot -> UK 8', F.engine.recommend(shoeLabels, Object.assign({}, man, { foot: 26 })).size.label, 'UK 8');

// --- Women: dress / bra / shoe summary ---
const woman = { gender: 'women', height: 160, weight: 55, chest: 86, underbust: 72, waist: 70, hips: 94, foot: 23.5 };
const sum = F.standards.summary(F.profile.effective(woman));
expect('Women: dress UK', sum.dress.UK, 10);
expect('Women: bra (underbust 72cm, bust 86cm)', sum.bra.UK, '28E');
const sum2 = F.standards.summary(F.profile.effective(Object.assign({}, woman, { underbust: 76 })));
expect('Women: bra (underbust 76cm, bust 86cm)', `${sum2.bra.UK}/${sum2.bra.EU}`, '30D/65D');
expect('Women: shoe UK', sum.shoe.UK, 5);
expect('Women: top letter', sum.topLetter, 'M');
const mansum = F.standards.summary(F.profile.effective(Object.assign({}, man, { foot: 26 })));
expect('Men summary: top M, waist 34, UK 8', `${mansum.topLetter}/${mansum.waist.even}/${mansum.shoe.UK}`, 'M/34/8');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
