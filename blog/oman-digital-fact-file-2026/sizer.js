(() => {
  'use strict';
  const form = document.getElementById('ff-sizer');
  const out = document.getElementById('ff-sizer-result');
  if (!form || !out) return;
  // NCSI, end of May 2026. National rates: Omani share Sept 2026 (NCSI), internet 95.3% and social media 62.1% (DataReportal Digital 2026), age 15+ 75.7% (UN WPP).
  const population = { muscat: 1538312, nbatinah: 945647, sbatinah: 589152, dakhiliyah: 574354, dhofar: 535623, ssharqiyah: 377701, nsharqiyah: 322914, dhahirah: 248813, buraimi: 135629, wusta: 64566, musandam: 55802 };
  const share = { all: 1, omani: 0.566, expat: 0.434 };
  const fmt = v => Math.round(v).toLocaleString('en-US');
  const render = () => {
    const picked = [...form.querySelectorAll('input[name="gov"]:checked')].map(box => box.value);
    const base = picked.reduce((sum, key) => sum + population[key], 0);
    if (!picked.length) { out.innerHTML = '<p class="fe-error">Pick at least one governorate.</p>'; return; }
    const people = base * share[form.elements.namedItem('who').value] * (form.elements.namedItem('age').value === 'adults' ? 0.757 : 1);
    const cells = [
      ['Residents', fmt(people), `${(base / 5388513 * 100).toFixed(1)}% of Oman’s residents live in the ${picked.length === 1 ? 'governorate' : picked.length + ' governorates'} you picked.`],
      ['Likely online', fmt(people * 0.953), 'At the national internet rate of 95.3%.'],
      ['On social media', fmt(people * 0.621), 'At the national rate of 62.1% social media identities.']
    ];
    out.innerHTML = '<div class="fe-out">' + cells.map(() => '<div><span></span><strong></strong><p></p></div>').join('') + '</div>';
    out.querySelectorAll('.fe-out > div').forEach((cell, i) => {
      cell.querySelector('span').textContent = cells[i][0];
      cell.querySelector('strong').textContent = cells[i][1];
      cell.querySelector('p').textContent = cells[i][2];
    });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', event => { event.preventDefault(); render(); });
  render();
})();
