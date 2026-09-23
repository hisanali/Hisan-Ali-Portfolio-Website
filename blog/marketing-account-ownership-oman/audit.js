(() => {
  'use strict';
  const form = document.getElementById('own-audit-form');
  if (!form) return;
  const results = document.getElementById('own-audit-results');
  const assets = [
    { name: 'domain', label: 'Domain name', weight: 5, fix: 'Move the registration into the business’s name, in a registrar account on a company email. Record the expiry date and switch on auto-renew.' },
    { name: 'website', label: 'Website and hosting', weight: 4, fix: 'Get an admin login on a company email, put the hosting account in the business’s name and download a recent backup.' },
    { name: 'gbp', label: 'Google Business Profile', weight: 4, fix: 'Make a company Google account the primary owner and keep your agency as a manager.' },
    { name: 'meta', label: 'Facebook, Instagram and Meta ads', weight: 4, fix: 'Put your Page, Instagram account, ad account and dataset in your own business portfolio, give two trusted staff full control and add your agency as a partner.' },
    { name: 'whatsapp', label: 'WhatsApp Business number', weight: 4, fix: 'Run WhatsApp Business on a company-owned number, and record who holds the phone and the two-step verification PIN.' },
    { name: 'googleAds', label: 'Google Ads', weight: 3, fix: 'Ask for Admin access for a company email directly on the account before anyone changes the manager-account link.' },
    { name: 'ga4', label: 'Google Analytics 4', weight: 3, fix: 'Hold Administrator on the Analytics account that contains your property, or ask your agency to move the property into your own account.' },
    { name: 'gtm', label: 'Google Tag Manager', weight: 2, fix: 'Become Admin of the Tag Manager account and give your agency Publish access to the container.' },
    { name: 'gsc', label: 'Search Console', weight: 2, fix: 'Verify ownership yourself, then remove former owners and their verification tokens.' },
    { name: 'social', label: 'Other social accounts', weight: 2, fix: 'Make sure each login uses a company email and phone number, and that two staff can get in.' }
  ];
  const statusLabel = { other: 'Held by others', unsure: 'Not sure' };
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const listNames = names => names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];

  form.addEventListener('submit', event => {
    event.preventDefault();
    const answers = assets.map(asset => ({ ...asset, status: form.elements.namedItem(asset.name).value }));
    const used = answers.filter(asset => asset.status !== 'na');
    if (!used.length) {
      results.replaceChildren(element('p', '', 'Choose at least one asset your business uses, then score again.'));
      return;
    }

    const totalWeight = used.reduce((sum, asset) => sum + asset.weight, 0);
    const secured = used.filter(asset => asset.status === 'own');
    const others = used.filter(asset => asset.status === 'other');
    const unsure = used.filter(asset => asset.status === 'unsure');
    const score = Math.round(secured.reduce((sum, asset) => sum + asset.weight, 0) / totalWeight * 100);
    const priority = asset => asset.weight * (asset.status === 'other' ? 1 : 0.8);
    const risks = [...others, ...unsure].sort((a, b) => priority(b) - priority(a) || assets.indexOf(a) - assets.indexOf(b));

    const grid = element('div', 'own-result-grid');
    const items = [
      [score === 100 ? 'is-good' : score >= 50 ? 'is-unsure' : 'is-risk', 'Ownership score', `${score}%`],
      ['is-good', 'Secured', `${secured.length} of ${used.length}`],
      ['is-risk', 'Held by others', String(others.length)],
      ['is-unsure', 'Not sure', String(unsure.length)]
    ];
    for (const [className, label, value] of items) {
      const item = element('div', className);
      item.append(element('span', '', label), element('strong', '', value));
      grid.append(item);
    }

    if (!risks.length) {
      results.replaceChildren(grid, element('p', '', 'Every asset you use is held by your business. Keep it that way with the offboarding checklist below.'));
      return;
    }

    const list = element('ol', 'own-fix-list');
    for (const asset of risks.slice(0, 3)) {
      const item = element('li');
      item.append(element('b', '', asset.label), element('span', `own-tag ${asset.status === 'other' ? 'is-risk' : 'is-unsure'}`, statusLabel[asset.status]), document.createElement('br'), document.createTextNode(asset.fix));
      list.append(item);
    }
    const nodes = [grid, element('span', 'own-fix-title', 'Fix first'), list];
    if (risks.length > 3) nodes.push(element('p', '', `Then review: ${listNames(risks.slice(3).map(asset => asset.label))}.`));
    results.replaceChildren(...nodes);
  });
})();
