// Run: node test/paste.test.js — pasted size-chart text -> chart -> recommended size
const path = require('path');
['units', 'standards', 'engine', 'profile', 'table'].forEach((f) => require(path.join(__dirname, '..', 'lib', f + '.js')));
require(path.join(__dirname, '..', 'js', 'paste.js'));
const F = globalThis.FitID, P = globalThis.FitIDPaste, IN = 2.54;
let pass = 0, fail = 0;
const expect = (name, got, want) => { const ok = Array.isArray(want) ? want.includes(got) : got === want; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got ${JSON.stringify(got)}${ok ? '' : ', want ' + JSON.stringify(want)}`); ok ? pass++ : fail++; };

const man = { gender: 'men', height: 175, weight: 75, chest: 39 * IN, waist: 33 * IN, shoulder: 18 * IN, foot: 26.4, fitPref: 'regular', unit: 'in' };
const rec = (text, opts, p) => {
  const r = P.parse(text, opts);
  if (!r.sizes) return null;
  const out = F.engine.recommend(Object.assign({ hint: (opts && opts.hint) || '', gender: (p || man).gender, sizes: r.sizes }, opts && opts.category ? { category: opts.category } : {}), p || man);
  return out.ok ? out.size.label : 'not ok: ' + out.reason;
};

const tabbed = 'Size\tTo Fit Chest (in)\tTo Fit Waist (in)\nS\t36-38\t30-32\nM\t38-40\t32-34\nL\t40-42\t34-36\nXL\t42-44\t36-38';
expect('tab-separated (copied from a web table)', rec(tabbed), 'M');

const spaced = 'Size  Chest (cm)  Waist (cm)\nS  92  78\nM  98  84\nL  104  90\nXL  110  96';
expect('2+ spaces, cm', rec(spaced), ['M', 'L']);

const single = 'Size To Fit Chest (in) Across Shoulder (in)\nS 36 16.5\nM 38 17\nL 40 18\nXL 42 18.5\nXXL 44 19';
const g1 = P.textToGrid(single);
expect('single spaces: header merged into 3 columns', g1[0].length, 3);
expect('single spaces: header[1]', g1[0][1], 'To Fit Chest (in)');
expect('single spaces -> size', rec(single), ['L', 'M']);

const cols = 'Size S M L XL\nChest (in) 38 40 42 44\nWaist (in) 32 34 36 38';
expect('sizes as columns (single spaces)', rec(cols), ['M', 'L']);

const perLine = 'Size\nChest (in)\nWaist (in)\nS\n36\n30\nM\n38\n32\nL\n40\n34\nXL\n42\n36';
expect('one cell per line (app copy)', P.textToGrid(perLine).length, 5);
expect('one cell per line -> size', rec(perLine), ['L', 'XL']);

const piped = '| Size | Chest | Waist |\n|---|---|---|\n| S | 36 | 30 |\n| M | 38 | 32 |\n| L | 40 | 34 |';
expect('markdown / pipes', rec(piped), ['L']);

const shoes = 'UK\tUS\tEU\tFoot Length (cm)\n6\t7\t40\t24.5\n7\t8\t41\t25.4\n8\t9\t42\t26.2\n9\t10\t43\t27.1\n10\t11\t44\t27.9';
expect('shoe chart, 26.4 cm foot (between UK 8 26.2 and UK 9 27.1)', rec(shoes, { hint: 'sneakers' }), ['8', '9']);

const garment = 'Size\tChest\tShoulder\nS\t40\t17\nM\t42\t17.5\nL\t44\t18\nXL\t46\t18.5';
expect('garment chest (needs ease) -> M or L', rec(garment, { type: 'garment', unit: 'in' }), ['M', 'L']);

expect('junk text -> no chart', P.parse('hello world\nthis is not a chart').sizes, null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
