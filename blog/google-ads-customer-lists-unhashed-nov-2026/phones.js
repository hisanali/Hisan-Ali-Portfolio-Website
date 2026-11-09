(() => {
  'use strict';
  const form = document.getElementById('gl-form');
  const out = document.getElementById('gl-result');
  if (!form || !out) return;
  // Omani numbers: 8 digits. Mobiles start with 7 or 9, landlines with 2.
  const normalise = (raw) => {
    let d = String(raw).replace(/[^\d+]/g, '');
    if (!d) return null;
    d = d.replace(/^\+/, '').replace(/^00/, '');
    if (d.length === 11 && d.startsWith('968')) d = d.slice(3);
    if (d.length !== 8 || !/^[279]/.test(d)) return { ok: false, raw: String(raw).trim() };
    return { ok: true, value: '+968' + d, landline: d.startsWith('2') };
  };
  const render = () => {
    const lines = String(form.elements.namedItem('text').value || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const seen = new Set(); const good = []; const bad = []; let dupes = 0; let land = 0;
    lines.forEach((line) => {
      const r = normalise(line);
      if (!r) return;
      if (!r.ok) { bad.push(r.raw); return; }
      if (seen.has(r.value)) { dupes += 1; return; }
      seen.add(r.value); good.push(r.value); if (r.landline) land += 1;
    });
    out.innerHTML = '<textarea class="gl-out" readonly aria-label="Formatted numbers"></textarea><div class="gl-actions"><button type="button" class="gl-copy">Copy numbers</button><span class="gl-status" aria-live="polite"></span></div><p class="gl-bad"></p><div class="ed-result"><span class="big"></span><div><strong></strong><p></p></div></div>';
    out.querySelector('.gl-out').value = good.join('\n');
    out.querySelector('.gl-bad').textContent = bad.length ? 'Not recognised as Omani numbers: ' + bad.join(', ') : '';
    const box = out.querySelector('.ed-result');
    const share = lines.length ? good.length / lines.length : 0;
    box.classList.add(share >= 0.9 ? 'hi' : share >= 0.6 ? 'mid' : 'lo');
    box.querySelector('.big').textContent = String(good.length);
    box.querySelector('strong').textContent = `${good.length} upload-ready number${good.length === 1 ? '' : 's'}`;
    box.querySelector('p').textContent = `${dupes} duplicate${dupes === 1 ? '' : 's'} removed, ${bad.length} not recognised${land ? `, ${land} landline${land === 1 ? '' : 's'} (these rarely match ad accounts)` : ''}.`;
    out.querySelector('.gl-copy').addEventListener('click', async () => {
      const status = out.querySelector('.gl-status');
      try { await navigator.clipboard.writeText(good.join('\n')); status.textContent = 'Copied'; } catch (e) { out.querySelector('.gl-out').select(); status.textContent = 'Select and copy'; }
    });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  render();
})();
