(() => {
  'use strict';
  const form = document.getElementById('lt-form');
  const out = document.getElementById('lt-result');
  if (!form || !out) return;
  const AR = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
  const EN = /[A-Za-z]/;
  const render = () => {
    const page = form.elements.namedItem('page').value;
    const lines = form.elements.namedItem('text').value.split(/\n/).map((l) => l.trim()).filter(Boolean);
    let en = 0, ar = 0; const mixed = [];
    lines.forEach((l) => { const a = AR.test(l), e = EN.test(l); if (a && e) mixed.push(l); else if (a) ar += 1; else if (e) en += 1; });
    const total = en + ar + mixed.length;
    out.innerHTML = '';
    if (!total) { out.innerHTML = '<p class="ed-fine"></p>'; out.firstChild.textContent = 'Paste some keywords or ad text to check.'; return; }
    const bar = document.createElement('div'); bar.className = 'lt-bar';
    [['en', en], ['ar', ar], ['mx', mixed.length]].forEach(([c, v]) => { if (v) { const i = document.createElement('i'); i.className = c; i.style.width = (v / total * 100) + '%'; bar.append(i); } });
    const legend = document.createElement('p'); legend.className = 'lt-legend';
    const n = (v, one, many) => v + ' ' + (v === 1 ? one : many);
    [n(en, 'English line', 'English lines'), n(ar, 'Arabic line', 'Arabic lines'), n(mixed.length, 'mixed line', 'mixed lines')].forEach((t) => { const s = document.createElement('span'); s.textContent = t; legend.append(s); });
    out.append(bar, legend);
    if (mixed.length) {
      const ul = document.createElement('ul'); ul.className = 'lt-flags';
      mixed.forEach((l) => { const li = document.createElement('li'); li.textContent = l; ul.append(li); });
      out.append(ul);
    }
    const main = en >= ar ? 'en' : 'ar';
    const share = Math.round(Math.max(en, ar) / total * 100);
    const box = document.createElement('div'); box.className = 'ed-result';
    box.innerHTML = '<span class="big"></span><div><strong></strong><p></p></div>';
    box.querySelector('.big').textContent = share + '%';
    const note = document.createElement('p'); note.className = 'lt-legend';
    note.textContent = share + '% of lines are in ' + (main === 'en' ? 'English' : 'Arabic') + '.';
    out.append(note);
    const strong = box.querySelector('strong'); const p = box.querySelector('p');
    if (mixed.length || (en && ar)) {
      box.classList.add('lo');
      strong.textContent = 'This campaign mixes Arabic and English';
      p.textContent = 'Without a language setting, mixed text sends Google mixed signals. Split it into one Arabic and one English campaign, and fix or remove the flagged lines.';
    } else if (main !== page) {
      box.classList.add('mid');
      strong.textContent = 'Your ads and landing page are in different languages';
      p.textContent = main === 'en' ? 'English ads lead to an Arabic page. Send them to the English version, or write Arabic ads for this page.' : 'Arabic ads lead to an English page. Send them to the Arabic version, or write English ads for this page.';
    } else {
      box.classList.add('hi');
      strong.textContent = 'One language, matching the landing page';
      p.textContent = 'This is the clearest signal you can give Google now. Keep watching the search terms report for the first few weeks.';
    }
    out.append(box);
  };
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  render();
})();
