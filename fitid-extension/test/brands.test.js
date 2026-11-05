// Run: node test/brands.test.js — "my size at top brands" from the official charts in lib/brands.js
globalThis.location = { href: 'https://example.test/', hostname: 'example.test', pathname: '/' };
['lib/units.js', 'lib/standards.js', 'lib/engine.js', 'lib/profile.js', 'lib/brands.js'].forEach((f) => require(require('path').join(__dirname, '..', f)));
const F = globalThis.FitID, IN = 2.54;
let pass = 0, fail = 0;
const expect = (name, got, want) => { const ok = Array.isArray(want) ? want.includes(got) : got === want; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got ${JSON.stringify(got)}${ok ? '' : ', want ' + JSON.stringify(want)}`); ok ? pass++ : fail++; };
const table = (p) => F.brands.mySizes(p).map(({ chart, rec }) => `${chart.brand} ${chart.category}: ${rec.size.label} (${rec.confidence}${rec.between ? ', or ' + rec.between.label : ''})`);

const man = { gender: 'men', height: 175, weight: 75, chest: 39 * IN, waist: 33 * IN, foot: 26.4, fitPref: 'regular', unit: 'in' };
console.log('Man, chest 39in, waist 33in, foot 26.4cm:\n  ' + table(man).join('\n  '));
const get = (p, brand, cat) => F.brands.mySizes(p).find((x) => x.chart.brand === brand && x.chart.category === cat).rec;
expect('H&M men top (chest 99cm sits between M 94–98 and L 102–106)', get(man, 'H&M', 'top').size.label, ['M', 'L']);
expect('Nike men top (S 88–96, M 96–104)', get(man, 'Nike', 'top').size.label, 'M');
expect('Zara basic tee runs big -> S or M', get(man, 'Zara', 'top').size.label, ['S', 'M']);
expect('U.S. Polo slim tee', get(man, 'U.S. Polo Assn.', 'top').size.label, ['M', 'L']);
expect('Nike shoes, 26.4cm foot -> UK 8.5', get(man, 'Nike', 'shoe').size.label, '8.5');
expect('U.S. Polo shoes (big-running) -> UK 6', get(man, 'U.S. Polo Assn.', 'shoe').size.label, '6');

const woman = { gender: 'women', height: 162, weight: 58, chest: 88, waist: 72, hips: 97, foot: 24.0, fitPref: 'regular', unit: 'in' };
console.log('\nWoman, bust 88, waist 72, hips 97, foot 24cm:\n  ' + table(woman).join('\n  '));
expect('H&M women top (S 82–90)', get(woman, 'H&M', 'top').size.label, 'S');
expect('Nike women top (S 83–90, waist M 74–81? no: 67–74 S)', get(woman, 'Nike', 'top').size.label, 'S');
expect('Nike women shoe, 24cm -> UK 5', get(woman, 'Nike', 'shoe').size.label, '5');
expect('Women get no men-only brands', F.brands.mySizes(woman).some((x) => x.chart.brand === 'Zara'), false);

// Adidas, Puma, Levi's
expect('Adidas men top (M 93–100)', get(man, 'Adidas', 'top').size.label, 'M');
expect('Adidas shoes, 26.4cm -> UK 9 (8.5 is made for 26.3)', get(man, 'Adidas', 'shoe').size.label, ['8.5', '9']);
expect('Puma men (M chest 38–41 in)', get(man, 'Puma', 'top').size.label, 'M');
expect('Puma shoes, 26.4cm -> UK 8.5', get(man, 'Puma', 'shoe').size.label, '8.5');
expect('Levi’s jeans, waist 33in -> 33', get(man, 'Levi’s', 'bottom').size.label, ['32', '33']);
const man32 = Object.assign({}, man, { waist: 32 * IN, hips: 39 * IN });
expect('Levi’s jeans, waist 32in -> 32 (garment waist 34)', get(man32, 'Levi’s', 'bottom').size.label, '32');
expect('Levi’s tee runs big (US cut) -> S or M', get(man, 'Levi’s', 'top').size.label, ['S', 'M']);
expect('Adidas women top (S 83–88)', get(woman, 'Adidas', 'top').size.label, 'S');
expect('Puma women (S 34–35 in bust = 86–89cm)', get(woman, 'Puma', 'top').size.label, ['S', 'M']);
expect('Levi’s women jeans, waist 72cm (28.3in)', get(woman, 'Levi’s', 'bottom').size.label, ['27', '28']);
expect('Puma women shoes 24cm -> UK 5.5', get(woman, 'Puma', 'shoe').size.label, '5.5');
expect('hostType levi.in', F.brands.hostType('levi.in'), 'garment');

// Built-in chart on the brand's own site
expect('forHost: www2.hm.com men top', (F.brands.forHost('www2.hm.com', 'top', 'men') || {}).brand, 'H&M');
expect('forHost: nike.in women shoe', (F.brands.forHost('www.nike.in', 'shoe', 'women') || {}).note, 'Women’s shoes');
expect('forHost: zara not used as site fallback', F.brands.forHost('www.zara.com', 'top', 'men'), null);

// Fractions in size charts ("9 11/16 in")
expect('parse 9 11/16', Math.round(F.units.parseRange('9 11/16')[0] * 1000) / 1000, 9.688);
expect('parse 33¾-35½', F.units.parseRange('33¾-35½').join('-'), '33.75-35.5');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
