// Run: node test/converter.test.js
['lib/units.js', 'lib/standards.js', 'lib/engine.js', 'lib/profile.js', 'lib/converter.js'].forEach((f) => require(require('path').join(__dirname, '..', f)));
const F = globalThis.FitID, C = F.converter, IN = 2.54;
let pass = 0, fail = 0;
const expect = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got ${JSON.stringify(got)}${ok ? '' : ', want ' + JSON.stringify(want)}`); ok ? pass++ : fail++; };
const row = (g, c, key, val) => C.GROUPS[g].cats[c].rows.find((r) => String(r[key]) === String(val));

// Every table: each row has a value for every column
for (const [g, gr] of Object.entries(C.GROUPS)) for (const [c, t] of Object.entries(gr.cats)) {
  const bad = t.rows.filter((r) => t.cols.some((k) => r[k] == null || r[k] === '' || Number.isNaN(r[k])));
  expect(`${g}/${c}: ${t.rows.length} rows complete`, bad.length, 0);
}
// Known conversions
const w8 = row('women', 'clothing', 'US', 8);
expect('Women US 8 = UK 12 = EU 40', [w8.UK, w8.EU], [12, 40]);
const m8 = row('men', 'shoes', 'UK', 8);
expect('Men shoe UK 8 = US 9 = EU 42', [m8.US, m8.EU], [9, 42]);
const ws5 = row('women', 'shoes', 'UK', 5);
expect('Women shoe UK 5 = US 7 = EU 38', [ws5.US, ws5.EU], [7, 38]);
const mm = row('men', 'tops', 'INTL', 'M');
expect('Men M = UK 38 = EU 48 = India shirt 40', [mm.UK, mm.EU, mm.IN], [38, 48, 40]);
const mj = row('men', 'bottoms', 'US', 32);
expect('Men waist 32 = EU 48 = M', [mj.EU, mj.INTL], [48, 'M']);
const b = row('women', 'bra', 'UK', '34DD');
expect('Bra UK 34DD = US 34DD/E = EU 75E = FR 90E', [b.US, b.EU, b.FR], ['34DD/E', '75E', '90E']);
const k = row('kids', 'clothing', 'EU', 128);
expect('Kids EU 128 = 7–8 years = UK 7-8 Y', [k.AGE, k.UK], ['7–8 years', '7-8 Y']);

// "You" row from a profile
const man = F.profile.effective({ gender: 'men', height: 170, weight: 73, chest: 38.5 * IN, waist: 32 * IN, foot: 26.3 });
const woman = F.profile.effective({ gender: 'women', height: 160, weight: 55, chest: 86, underbust: 76, waist: 70, hips: 94, foot: 23.5 });
const mine = (g, c, p) => { const t = C.GROUPS[g].cats[c]; const i = C.myRow(t, g, p); return i < 0 ? null : t.rows[i][t.cols[0]]; };
expect('Man: tops row', mine('men', 'tops', man), 'M');
expect('Man: jeans row', mine('men', 'bottoms', man), 'M');
expect('Man: shoe row', mine('men', 'shoes', man), 8);
expect('Man: no "you" in women tables', mine('women', 'clothing', man), null);
expect('Woman: dress row (UK 10 → letter)', C.GROUPS.women.cats.clothing.rows[C.myRow(C.GROUPS.women.cats.clothing, 'women', woman)].UK, 10);
expect('Woman: bra row', mine('women', 'bra', woman), '30D');
expect('Woman: shoe row', mine('women', 'shoes', woman), 5);
expect('Kids: never marked (no kids profile)', C.myRow(C.GROUPS.kids.cats.clothing, 'kids', woman), -1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
