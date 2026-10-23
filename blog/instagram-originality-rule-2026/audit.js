(() => {
  'use strict';
  const form = document.getElementById('ig-audit');
  const out = document.getElementById('ig-audit-result');
  if (!form || !out) return;
  // Instagram has said accounts posting mostly unoriginal content lose recommendation eligibility. "Mostly" is read here as over half.
  const n = name => Math.max(0, Number(form.elements.namedItem(name).value) || 0);
  const render = () => {
    const own = n('own'), transformed = n('transformed'), reposts = n('reposts'), total = own + transformed + reposts;
    if (!total) { out.innerHTML = '<p class="fe-error">Enter how many posts you published in the last 30 days.</p>'; return; }
    const original = (own + transformed) / total * 100;
    const verdict = original > 70 ? ['Safe zone', 'Most of your feed is original. Keep reposts in Stories or the repost feature.']
      : original > 50 ? ['Borderline', 'Original content is only a small majority. A few more reposts could tip the balance. Replace them with your own photos, videos or commentary.']
      : ['At risk', 'Most of your recent posts are not original. Instagram may stop recommending your account to non-followers. Check Account Status in Settings and shift to original content.'];
    out.innerHTML = '<div class="ig-meter" aria-hidden="true"><i></i></div><div class="ig-meter-l" aria-hidden="true"><span>0% original</span><span>50%</span><span>70%</span><span>100%</span></div><div class="fe-out"><div><span>Original share</span><strong></strong><p></p></div><div><span>Status</span><strong></strong><p></p></div><div><span>To reach 70%</span><strong></strong><p>Original posts needed instead of reposts, at the same total.</p></div></div>';
    out.querySelector('i').style.left = original.toFixed(1) + '%';
    const s = out.querySelectorAll('.fe-out strong'), p = out.querySelectorAll('.fe-out p');
    s[0].textContent = Math.round(original) + '%'; p[0].textContent = `${own + transformed} of ${total} posts are your own or meaningfully transformed.`;
    s[1].textContent = verdict[0]; p[1].textContent = verdict[1];
    const need = Math.max(0, Math.ceil(total * 0.7) - (own + transformed));
    s[2].textContent = need ? `${Math.min(need, reposts)} more` : 'Done';
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
