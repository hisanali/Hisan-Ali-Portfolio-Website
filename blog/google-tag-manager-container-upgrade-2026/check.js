(() => {
  'use strict';
  const form = document.getElementById('gt-check');
  const out = document.getElementById('gt-check-result');
  if (!form || !out) return;
  const SETUP = {
    gtag: ['Find your Google tag ID (starts with G- or AW-) and open it in Tag Manager.', 'Use Tag Assistant to check it loads once on every page.', 'Test a purchase or lead and confirm it shows in Google Ads.'],
    gtm: ['Little changes for you; review container users and versions.', 'Look for a separate gtag.js snippet that duplicates your container.', 'Test key conversions in Preview mode.'],
    plugin: ['Check the plugin and any theme code don’t both add the Google tag.', 'Confirm the plugin is up to date before January.', 'Test a purchase and confirm it is counted once.'],
    unsure: ['Open your site and run Tag Assistant to see which tags fire.', 'Ask whoever built the site which accounts the tags belong to.', 'Test a purchase or lead and confirm it is counted once.']
  };
  const WHO = { agency: 'Make sure your business owns the accounts, and the agency is a user, not the owner.', team: 'Write down who has access and keep at least two admins.', unknown: 'Find out who owns the Google accounts before anything changes; this is the biggest risk.' };
  const render = () => {
    const s = form.elements.namedItem('setup').value, w = form.elements.namedItem('who').value;
    const risky = w === 'unknown' || s === 'unsure';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(risky ? 'lo' : s === 'gtm' ? 'hi' : 'mid');
    box.querySelector('.big').textContent = risky ? 'Check now' : s === 'gtm' ? 'Low effort' : '30 min';
    box.querySelector('strong').textContent = 'Your checklist';
    box.querySelector('p').textContent = WHO[w];
    const ul = box.querySelector('ul'); SETUP[s].forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
