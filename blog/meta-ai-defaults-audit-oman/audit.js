(() => {
  'use strict';
  // Countdown to the reported 28 October 2026 product browsing default.
  const cd = document.getElementById('md-countdown');
  if (cd) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days = Math.round((new Date('2026-10-28T00:00:00') - today) / 86400000);
    cd.innerHTML = days > 0 ? '<b></b><span>until product browsing is reported to switch on in existing ads (28 October 2026)</span>' : '<b>Now</b><span>The reported 28 October date has passed: check whether product browsing is on in your ads.</span>';
    if (days > 0) cd.querySelector('b').textContent = days + (days === 1 ? ' day' : ' days');
  }
  const form = document.getElementById('md-audit');
  const out = document.getElementById('md-audit-result');
  if (!form || !out) return;
  const boxes = [...form.querySelectorAll('input[type="checkbox"]')];
  const render = () => {
    const done = boxes.filter(b => b.checked).length;
    const left = boxes.filter(b => !b.checked).map(b => b.closest('label').querySelector('strong').textContent);
    out.innerHTML = '<div class="md-progress" aria-hidden="true"><i></i></div><p><strong></strong></p><p class="fe-small"></p>';
    out.querySelector('i').style.width = (done / boxes.length * 100) + '%';
    out.querySelector('strong').textContent = `${done} of ${boxes.length} checks done`;
    out.querySelector('.fe-small').textContent = left.length ? 'Next: ' + left.slice(0, 2).join(' · ') : 'All done. Repeat the audit monthly, or whenever Meta announces a new default.';
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', event => event.preventDefault());
  render();
})();
