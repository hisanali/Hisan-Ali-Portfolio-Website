(() => {
  'use strict';
  const form = document.getElementById('sc-sorter');
  const out = document.getElementById('sc-sorter-result');
  if (!form || !out) return;
  // Heuristics only: Search Console does not label AI Mode queries.
  const FOLLOW = /^(yes|no|ok|okay|sure|thanks|thank you|more|tell me more|go on|continue|why|how|which one|and\b|also\b|what about\b|how about\b|what if\b|compare\b|show me\b|and for\b|but\b|cheaper|the first one|the second one)/i;
  const LABEL = { follow: 'Likely AI follow-up', conv: 'Conversational', brand: 'Branded', std: 'Normal search' };
  const classify = (q, brands) => {
    const words = q.split(/\s+/).filter(Boolean).length;
    if (brands.some(b => q.includes(b))) return 'brand';
    if (FOLLOW.test(q) && words <= 6) return 'follow';
    if (words <= 2 && !/\d/.test(q) && /^(yes|no|ok|more|why|how)$/i.test(q)) return 'follow';
    if (words >= 8 || /^(how|what|why|which|can|should|is|are|do|does|where|when|who)\b/i.test(q) && words >= 6) return 'conv';
    return 'std';
  };
  const render = () => {
    const brands = form.elements.namedItem('brand').value.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    const qs = form.elements.namedItem('q').value.split('\n').map(s => s.trim().toLowerCase()).filter(Boolean).slice(0, 500);
    if (!qs.length) { out.innerHTML = '<p class="fe-error">Paste at least one query.</p>'; return; }
    const rows = qs.map(q => [q, classify(q, brands)]);
    const count = t => rows.filter(r => r[1] === t).length;
    out.innerHTML = '<div class="fe-out"><div><span>AI follow-ups</span><strong></strong><p>Short replies inside an AI Mode conversation.</p></div><div><span>Conversational</span><strong></strong><p>Long, question-style queries, typical of AI use.</p></div><div><span>Branded</span><strong></strong><p>Contain your brand name.</p></div><div><span>Normal</span><strong></strong><p>Everything else.</p></div></div><div class="sc-list"></div>';
    const s = out.querySelectorAll('.fe-out strong');
    ['follow', 'conv', 'brand', 'std'].forEach((t, i) => { s[i].textContent = count(t); });
    const list = out.querySelector('.sc-list');
    rows.slice(0, 60).forEach(([q, t]) => {
      const r = document.createElement('div'); r.className = 'sc-row t-' + t;
      r.innerHTML = '<span></span><em></em>'; r.children[0].textContent = q; r.children[1].textContent = LABEL[t];
      list.append(r);
    });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
