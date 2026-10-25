(() => {
  'use strict';
  const form = document.getElementById('tk-planner');
  const out = document.getElementById('tk-planner-result');
  if (!form || !out) return;
  const ACT = { read: 'read reports and results', draft: 'create draft campaigns and ads', launch: 'switch campaigns or ads on', pause: 'pause ads', budget: 'change budgets' };
  const render = () => {
    const v = k => form.elements.namedItem(k).value;
    const limit = Math.max(0, Number(v('limit')) || 0);
    const may = [], ask = [], never = [];
    Object.keys(ACT).forEach(k => {
      const s = v(k), text = ACT[k];
      if (s === 'auto') may.push(k === 'budget' ? `${text}, up to OMR ${limit} a day per campaign` : text);
      else if (s === 'ask') ask.push(text); else never.push(text);
    });
    const lines = [];
    if (may.length) lines.push(`You may ${may.join('; ')} without asking.`);
    if (ask.length) lines.push(`Before you ${ask.join(' or ')}, describe the change and wait for written approval.`);
    if (never.length) lines.push(`Never ${never.join(' or ')}.`);
    lines.push(`Never set any campaign above OMR ${limit} a day.`);
    lines.push('After every change, report what you changed, why, and how to undo it.');
    const risky = v('launch') === 'auto' || v('budget') === 'auto';
    out.innerHTML = '<div class="fe-out"><div><span>Risk level</span><strong></strong><p></p></div></div><div class="tk-policy"><b>Your AI agent policy</b><ul></ul><button type="button" class="tk-copy">Copy policy</button></div>';
    out.querySelector('strong').textContent = risky ? 'Higher' : ask.length ? 'Controlled' : 'Low';
    out.querySelector('p').textContent = risky ? 'The agent can spend without asking. Set an account spending limit in TikTok Ads Manager too.' : ask.length ? 'Money moves only after a person approves. A good balance for most teams.' : 'The agent can only read and draft. Safe for a first month.';
    const ul = out.querySelector('ul');
    lines.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
    out.querySelector('.tk-copy').addEventListener('click', e => {
      const b = e.currentTarget, text = lines.join('\n');
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => { b.textContent = 'Copied ✓'; setTimeout(() => { b.textContent = 'Copy policy'; }, 1800); }, () => { b.textContent = 'Select the text to copy'; });
      else b.textContent = 'Select the text to copy';
    });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
