(() => {
  'use strict';
  const form = document.getElementById('ca-builder');
  const out = document.getElementById('ca-preview');
  if (!form || !out) return;
  // Character limits as reported for ChatGPT ad cards in 2026: headline 50, description 100. Check Ads Manager for current specs.
  const LIMITS = { headline: 50, description: 100 };
  const val = name => form.elements.namedItem(name).value.trim();
  const render = () => {
    const brand = val('brand') || 'Your brand', headline = val('headline'), description = val('description'), url = val('url');
    Object.entries(LIMITS).forEach(([name, max]) => {
      const n = form.elements.namedItem(name).value.length, el = form.querySelector(`[data-count="${name}"]`);
      el.textContent = `${n} / ${max}`; el.classList.toggle('over', n > max);
    });
    out.innerHTML = '<div class="ca-card"><div class="ca-img" aria-hidden="true"></div><div><small>Sponsored</small><strong></strong><span></span><em></em></div></div><div class="ca-tips"></div>';
    out.querySelector('.ca-img').textContent = brand.charAt(0).toUpperCase();
    out.querySelector('strong').textContent = headline || 'Your headline appears here';
    out.querySelector('span').textContent = description || 'A short description that answers the question the person just asked.';
    out.querySelector('em').textContent = (url || 'yourbrand.om') + ' · ' + brand;
    const tips = [];
    const tip = (ok, text) => tips.push([ok, text]);
    tip(headline.length > 0 && headline.length <= LIMITS.headline, headline.length > LIMITS.headline ? `Headline is ${headline.length - LIMITS.headline} characters too long.` : headline ? 'Headline fits the reported limit.' : 'Add a headline.');
    tip(description.length > 0 && description.length <= LIMITS.description, description.length > LIMITS.description ? `Description is ${description.length - LIMITS.description} characters too long.` : description ? 'Description fits the reported limit.' : 'Add a description.');
    tip(/\d/.test(headline + description), /\d/.test(headline + description) ? 'Includes a concrete number (price, time, size). Good: answers beat slogans.' : 'Add a concrete detail: a price, a delivery time or a size.');
    tip(!/best|no\.? ?1|number one|#1/i.test(headline + description), /best|no\.? ?1|number one|#1/i.test(headline + description) ? 'Avoid “best” or “number one”: claims like these need proof and rarely help next to an AI answer.' : 'No unproven superlatives.');
    tip(/oman|muscat|salalah|sohar|nizwa|omr|rial/i.test(headline + description), /oman|muscat|salalah|sohar|nizwa|omr|rial/i.test(headline + description) ? 'Local detail included, so it reads as relevant to people in Oman.' : 'Add a local detail (Muscat, OMR, delivery across Oman) if it is true.');
    const box = out.querySelector('.ca-tips');
    tips.forEach(([ok, text]) => { const d = document.createElement('div'); d.className = ok ? 'ok' : 'warn'; d.textContent = (ok ? '✓ ' : '! ') + text; box.append(d); });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', event => event.preventDefault());
  render();
})();
