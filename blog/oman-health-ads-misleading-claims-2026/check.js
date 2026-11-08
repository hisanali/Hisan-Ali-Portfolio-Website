(() => {
  'use strict';
  const form = document.getElementById('hc-check');
  const out = document.getElementById('hc-check-result');
  if (!form || !out) return;
  // Phrases named in the ministry's advisory (English and common Arabic forms), with safer wording.
  const RULES = [
    [/\b100\s?%\s*(guaranteed|results)|guaranteed results|نتائج مضمونة|مضمون(ة)?\s*100/i, '“100% guaranteed results”', 'Say what most patients can expect, and how many sessions it usually takes.'],
    [/guaranteed success|success guaranteed|نجاح مضمون/i, '“Guaranteed success”', 'Describe the treatment and typical outcome instead of a guarantee.'],
    [/\b(the )?best\b|الأفضل|افضل/i, '“The best”', 'Show proof instead: qualifications, years of practice, verified reviews.'],
    [/\b(the )?safest\b|الأكثر أمان|الأكثر أماناً|الأكثر أمانًا/i, '“The safest”', 'Explain the safety steps you follow, such as licensed staff and approved devices.'],
    [/\bthe only (one|clinic|centre|center)\b|\bonly clinic\b|الوحيد(ة)?/i, '“The only one”', 'Name what is specific about your service without claiming to be the only one.'],
    [/\bmiracle|\bmiraculous|معجز(ة|ه)?/i, '“Miracle”', 'Describe the actual treatment and how it works.'],
    [/\bmagic(al)?\b|سحري(ة)?/i, '“Magical”', 'Use plain, specific language about the result.'],
    [/instant(ly)? results?|results? instantly|نتائج فورية|نتيجة فورية/i, '“Instant results”', 'Give a realistic timeline, including any recovery time.'],
    [/permanent(ly)?\s*(cure|results?|removal)?|cured? forever|علاج نهائي|شفاء (تام|دائم|نهائي)|نتائج دائمة/i, '“Permanent cure” or permanent results', 'Say “long-lasting for most patients” and mention maintenance if needed.'],
    [/no side[ -]?effects?|without side[ -]?effects?|بدون آثار جانبية|بلا آثار جانبية|دون آثار جانبية/i, '“No side effects”', 'Mention common, mild effects honestly, for example “mild redness for a day”.']
  ];
  const render = () => {
    const text = String(form.elements.namedItem('text').value || '');
    const hits = RULES.filter(([re]) => re.test(text));
    out.innerHTML = '<ul class="hc-flags"></ul><div class="ed-result"><span class="big"></span><div><strong></strong><p></p></div></div>';
    const list = out.querySelector('.hc-flags');
    hits.forEach(([, label, tip]) => {
      const li = document.createElement('li');
      li.innerHTML = '<b></b><span></span>';
      li.querySelector('b').textContent = label;
      li.querySelector('span').textContent = tip;
      list.append(li);
    });
    const box = out.querySelector('.ed-result');
    box.classList.add(hits.length === 0 ? 'hi' : hits.length <= 2 ? 'mid' : 'lo');
    box.querySelector('.big').textContent = String(hits.length);
    box.querySelector('strong').textContent = hits.length === 0 ? 'No risky phrases found' : hits.length === 1 ? '1 phrase to rewrite' : `${hits.length} phrases to rewrite`;
    box.querySelector('p').textContent = hits.length === 0
      ? 'Nothing from the advisory’s list. Still check that every claim is true and the service has any approvals it needs.'
      : 'These match wording the ministry named as possibly misleading. Replace them with specific facts a patient can check.';
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  render();
})();
