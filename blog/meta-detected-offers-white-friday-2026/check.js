(() => {
  'use strict';
  const form = document.getElementById('dt-check');
  const out = document.getElementById('dt-check-result');
  if (!form || !out) return;
  const v = k => form.elements.namedItem(k).value;
  const render = () => {
    const shop = v('shop'), site = v('site'), box = v('box');
    const level = box === 'off' || (shop === 'no' && site === 'no') ? 'hi' : box === 'on' ? 'lo' : 'mid';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const r = out.querySelector('.ed-result'); r.classList.add(level);
    r.querySelector('.big').textContent = level === 'hi' ? 'Low' : level === 'mid' ? 'Check' : 'High';
    r.querySelector('strong').textContent = level === 'hi' ? 'Low risk' : level === 'mid' ? 'Check the setting today' : 'Unapproved offers could appear';
    r.querySelector('p').textContent = box === 'off' ? 'Detected offers is off, so Meta shouldn’t add website discounts on its own.' : box === 'on' ? 'With Detected offers on, any discount on your site could show in your ads, including duplicated ones.' : 'You have a catalogue or website offers, so Meta may be able to pick them up.';
    const ul = r.querySelector('ul'); const add = t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); };
    if (box !== 'off') add('Commerce Manager → Settings → Offer merchandising → untick Detected offers.');
    if (site === 'yes') add('Remove expired codes and banners from your website.');
    add('Preview every duplicated sale ad before publishing.');
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
