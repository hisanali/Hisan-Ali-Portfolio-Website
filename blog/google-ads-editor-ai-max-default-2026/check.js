(() => {
  'use strict';
  const form = document.getElementById('ax-check');
  const out = document.getElementById('ax-check-result');
  if (!form || !out) return;
  const v = k => form.elements.namedItem(k).value;
  const render = () => {
    const conv = v('conv'), claims = v('claims'), pages = v('pages');
    const rows = [['AI Max', conv === 'yes'], ['Text asset automation', claims === 'no'], ['Final URL expansion', pages === 'yes']];
    const kept = rows.filter(r => r[1]).length;
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const r = out.querySelector('.ed-result'); r.classList.add(kept === 3 ? 'hi' : kept ? 'mid' : 'lo');
    r.querySelector('.big').textContent = kept + '/3';
    r.querySelector('strong').textContent = kept === 3 ? 'Keep all three defaults' : kept ? 'Keep some, switch some off' : 'Switch the defaults off for now';
    r.querySelector('p').textContent = 'Settings to keep on for this campaign:';
    const ul = r.querySelector('ul');
    rows.forEach(([name, keep]) => { const li = document.createElement('li'); li.textContent = `${name}: ${keep ? 'keep on' : 'switch off'}${!keep && name === 'AI Max' ? ' until conversion tracking works' : !keep && name === 'Final URL expansion' ? ' or exclude old pages' : !keep ? ' and write approved text yourself' : ''}.`; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
