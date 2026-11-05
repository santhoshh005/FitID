// FitID web — maps the extension's chrome.storage.sync/local API onto localStorage,
// so lib/profile.js (load / save / history) works unchanged. Must load before lib/*.js.
(function (g) {
  if (g.chrome && g.chrome.storage) return; // running inside the extension: keep the real thing
  const mem = {}; // fallback when localStorage is blocked (private mode, disabled storage)
  const read = (k) => {
    try { const v = g.localStorage.getItem(k); return v == null ? undefined : JSON.parse(v); } catch (e) { return mem[k]; }
  };
  const write = (k, v) => {
    mem[k] = v;
    try { g.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* quota or blocked: memory only */ }
  };
  function area(name) {
    const prefix = 'fitid:' + name + ':';
    return {
      get(keys, cb) {
        const list = keys == null ? [] : Array.isArray(keys) ? keys : typeof keys === 'string' ? [keys] : Object.keys(keys);
        const out = {};
        for (const k of list) { const v = read(prefix + k); if (v !== undefined) out[k] = v; }
        const p = Promise.resolve(out);
        if (cb) setTimeout(() => cb(out), 0);
        return p;
      },
      set(obj, cb) {
        for (const k of Object.keys(obj || {})) write(prefix + k, obj[k]);
        if (cb) setTimeout(cb, 0);
        return Promise.resolve();
      },
      remove(keys, cb) {
        for (const k of [].concat(keys)) { delete mem[prefix + k]; try { g.localStorage.removeItem(prefix + k); } catch (e) { /* ignore */ } }
        if (cb) setTimeout(cb, 0);
        return Promise.resolve();
      },
    };
  }
  g.chrome = g.chrome || {};
  g.chrome.storage = { sync: area('sync'), local: area('local') };
})(globalThis);
