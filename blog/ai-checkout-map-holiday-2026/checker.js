(() => {
  'use strict';
  const form = document.getElementById('co-check');
  const out = document.getElementById('co-check-result');
  if (!form || !out) return;
  // Integrations as reported in October 2026; in-chat checkouts are US-first.
  const ROUTES = [
    { name: 'Google AI Mode & Gemini', need: ['gmc'], tip: 'Check the UCP hub in Merchant Center for cart transfer or native checkout.' },
    { name: 'Microsoft Copilot', any: ['paypal', 'shopify', 'stripe'], tip: 'Look for Copilot Checkout or agentic commerce settings in your PayPal, Shopify or Stripe account.' },
    { name: 'Meta Muse', any: ['shopify'], tip: 'Shopify stores are covered through Shop Pay; check Shopify’s agentic commerce settings.' },
    { name: 'Perplexity Instant Buy', any: ['paypal'], tip: 'Check PayPal’s agentic commerce options; incompatible stores are still shown but checkout happens on site.' },
    { name: 'ChatGPT', any: ['shopify', 'gmc', 'feed'], tip: 'Shoppers check out on your site. Make product data discoverable; Shopify stores are included via Shopify Catalog.', site: true }
  ];
  const render = () => {
    const on = k => form.elements.namedItem(k).checked;
    const us = on('us');
    out.innerHTML = '<div class="co-out"></div>';
    const list = out.querySelector('.co-out');
    let ready = 0;
    ROUTES.forEach(r => {
      const fits = r.need ? r.need.every(on) : r.any.some(on);
      const status = !fits ? 'no' : r.site ? 'ok' : us ? 'ok' : 'maybe';
      if (status === 'ok') ready++;
      const label = !fits ? 'Not yet' : r.site ? 'Discovery' : us ? 'Likely route' : 'US-only for now';
      const row = document.createElement('div'); row.className = 'co-route ' + status;
      row.innerHTML = '<b></b><em></em><span></span>';
      row.children[0].textContent = r.name; row.children[1].textContent = label; row.children[2].textContent = r.tip;
      list.append(row);
    });
    const sum = document.createElement('p'); sum.className = 'fe-small';
    sum.textContent = `${ready} of ${ROUTES.length} assistants can likely reach your store today.` + (on('feed') ? '' : ' Fix stock, shipping and returns data first: every route depends on it.');
    list.prepend(sum);
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
