(() => {
  'use strict';
  const form = document.getElementById('av-plan');
  const out = document.getElementById('av-plan-result');
  if (!form || !out) return;
  const v = k => form.elements.namedItem(k).value;
  const TOOL = { meta: 'Meta Advantage+ image-to-video', tiktok: 'TikTok Symphony', google: 'Google Gemini Omni in Asset Studio' };
  const render = () => {
    const ch = v('ch'), have = v('have'), lang = v('lang');
    out.innerHTML = '<div class="av-rows"></div><div class="ed-result hi"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const steps = [['Start with', TOOL[ch], ch === 'meta' ? 'Turn your best product photos into short videos inside the ad.' : ch === 'tiktok' ? 'Generate a few 15–30 second versions from references; compare with a phone-shot video.' : 'Generate and refine a video in Asset Studio, then export to YouTube and Demand Gen.'],
      ['Feed it', have === 'photos' ? 'Your product photos' : have === 'video' ? 'Your existing clips' : 'Five clean product photos first', have === 'none' ? 'Shoot simple, well-lit photos on a plain background before using any tool.' : 'Better inputs give better outputs.'],
      ['Language', lang === 'en' ? 'English' : 'Add Arabic yourself', lang === 'en' ? 'Check spelling and claims in every version.' : 'Generate in English or without text, then add accurate Arabic captions.']];
    const list = out.querySelector('.av-rows');
    steps.forEach(([a, b, c]) => { const d = document.createElement('div'); d.className = 'av-row'; d.innerHTML = '<b></b><strong></strong><span></span>'; d.querySelector('b').textContent = a; d.querySelector('strong').textContent = b; d.querySelector('span').textContent = c; list.append(d); });
    const box = out.querySelector('.ed-result');
    box.querySelector('.big').textContent = ch === 'meta' ? 'Meta' : ch === 'tiktok' ? 'TikTok' : 'Google';
    box.querySelector('strong').textContent = 'Test AI against real footage';
    box.querySelector('p').textContent = 'Run two AI versions and one simple real video for two weeks, then keep the winner.';
    const ul = box.querySelector('ul'); ['Review prices, claims and Arabic text before publishing.', 'Never generate a real person’s face or voice.'].forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
