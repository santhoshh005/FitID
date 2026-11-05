// FitID — profile + history storage (chrome.storage works in Edge too).
(function (g) {
  const F = (g.FitID = g.FitID || {});
  const KEYS = ['chest', 'underbust', 'waist', 'hips', 'shoulder', 'inseam', 'foot'];
  const api = g.chrome && g.chrome.storage ? g.chrome.storage : null;

  function get(area, key) {
    return new Promise((resolve) => {
      if (!api) return resolve(null);
      api[area].get(key, (v) => resolve(v ? v[key] : null));
    });
  }
  function set(area, key, value) {
    return new Promise((resolve) => {
      if (!api) return resolve();
      api[area].set({ [key]: value }, () => resolve());
    });
  }

  // Fill in missing measurements from height + weight, and remember which were estimated.
  function effective(p) {
    if (!p) return null;
    const out = Object.assign({}, p, { _estimated: {} });
    if (out.foot == null && p.shoeUK != null && p.shoeUK !== '') {
      out.foot = F.standards.footFromUK(Number(p.shoeUK), p.gender);
    }
    const est = F.standards.estimate(p);
    for (const k of KEYS) {
      if (out[k] == null && est[k] != null) {
        if (k === 'underbust' && p.gender !== 'women') continue;
        out[k] = est[k];
        out._estimated[k] = true;
      }
    }
    return out;
  }

  function isComplete(p) {
    return !!(p && p.height && p.gender && (p.weight || (p.chest && p.waist)));
  }

  async function load() { return get('sync', 'profile'); }
  async function save(p) { p.updated = Date.now(); return set('sync', 'profile', p); }

  async function history() { return (await get('local', 'history')) || {}; }
  async function remember(entry) {
    const h = await history();
    const key = (entry.brand || entry.site || '?').toLowerCase() + '|' + entry.category;
    h[key] = Object.assign({}, entry, { date: Date.now() });
    // keep the 60 most recent
    const items = Object.entries(h).sort((a, b) => b[1].date - a[1].date).slice(0, 60);
    await set('local', 'history', Object.fromEntries(items));
  }
  async function clearHistory() { return set('local', 'history', {}); }

  F.profile = { KEYS, effective, isComplete, load, save, history, remember, clearHistory };
})(globalThis);
