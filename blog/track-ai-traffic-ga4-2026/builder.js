(() => {
  'use strict';
  const form = document.getElementById('at-builder');
  const out = document.getElementById('at-builder-result');
  if (!form || !out) return;
  // Source names and domains as they appear in GA4's Session source dimension.
  const PAT = {
    chatgpt: 'chatgpt|openai', gemini: 'gemini', perplexity: 'perplexity', claude: 'claude', copilot: 'copilot',
    deepseek: 'deepseek', grok: 'grok', meta: 'meta\\.ai', mistral: 'mistral', you: 'you\\.com'
  };
  const render = () => {
    const picked = [...form.querySelectorAll('input:checked')].map(i => PAT[i.value]);
    if (!picked.length) { out.innerHTML = '<p class="fe-error">Pick at least one assistant.</p>'; return; }
    const regex = `.*(${picked.join('|')}).*`;
    out.innerHTML = '<div class="at-code"></div><button type="button" class="at-copy">Copy regex</button><p class="at-meta"></p>';
    out.querySelector('.at-code').textContent = regex;
    out.querySelector('.at-meta').textContent = `${picked.length} assistant${picked.length > 1 ? 's' : ''} · paste into Session source → matches regex.`;
    out.querySelector('.at-copy').addEventListener('click', e => {
      const b = e.currentTarget;
      const done = () => { b.textContent = 'Copied ✓'; setTimeout(() => { b.textContent = 'Copy regex'; }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(regex).then(done, () => { b.textContent = 'Select and copy the text above'; });
      else b.textContent = 'Select and copy the text above';
    });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
