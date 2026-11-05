// FitID — renders "My sizes in every system" (used by the popup and the profile page).
(function (g) {
  const F = (g.FitID = g.FitID || {});
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function tile(title, big, sub) {
    return `<div class="tile"><div class="t-title">${esc(title)}</div><div class="t-big">${esc(big)}</div>${sub ? `<div class="t-sub">${esc(sub)}</div>` : ''}</div>`;
  }

  F.renderSummary = function (rawProfile) {
    const p = F.profile.effective(rawProfile);
    if (!p) return '';
    const s = F.standards.summary(p);
    const tiles = [];
    const w = p.gender === 'women';
    tiles.push(tile(w ? 'Tops & kurtas' : 'T-shirts & shirts', s.topLetter || '—', p.chest ? `${w ? 'Bust' : 'Chest'} ${F.units.fmt(p.chest, 'in')}` : ''));
    tiles.push(tile('Bottoms (letter)', s.bottomLetter || '—', p.waist ? `Waist ${F.units.fmt(p.waist, 'in')}` : ''));
    if (s.waist) tiles.push(tile('Jeans / trousers', String(s.waist.even), `Waist size ${s.waist.exact}${s.waist.exact !== s.waist.even ? ' – ' + s.waist.even : ''}`));
    if (w && s.dress) tiles.push(tile('Dresses', 'UK ' + s.dress.UK, `US ${s.dress.US} · EU ${s.dress.EU} · IT ${s.dress.IT}`));
    if (w && s.bra) tiles.push(tile('Bra', s.bra.UK, `UK/IN ${s.bra.UK} · US ${s.bra.US} · EU ${s.bra.EU}`));
    if (s.shoe) tiles.push(tile('Shoes', 'UK ' + s.shoe.UK, `US ${s.shoe.US} · EU ${s.shoe.EU} · IND ${s.shoe.IN} · ${Math.round(p.foot * 10) / 10} cm`));
    const est = Object.keys(p._estimated || {}).filter((k) => p._estimated[k]);
    const note = est.length ? `<p class="est">Estimated from height &amp; weight: ${esc(est.join(', '))}. Add real measurements for better accuracy.</p>` : '';
    return `<div class="tiles">${tiles.join('')}</div>${note}<p class="est">Standard sizes. On product pages FitID uses that brand’s own size chart, which can differ.</p>`;
  };
})(globalThis);
