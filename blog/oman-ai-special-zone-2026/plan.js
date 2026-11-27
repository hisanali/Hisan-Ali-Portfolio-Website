(() => {
  'use strict';
  const form = document.getElementById('oz-pick');
  const out = document.getElementById('oz-pick-result');
  if (!form || !out) return;
  const TASK = {
    msgs: ['Draft replies to common WhatsApp and Instagram questions', 'Write 15 saved replies with AI, then edit them; a person still sends them'],
    content: ['Draft posts and ad variations in Arabic and English', 'Give AI your best past posts and ask for five options each time'],
    reports: ['Summarise sales, ads and reviews into one weekly note', 'Paste exported numbers into an AI assistant and ask for the three changes that matter']
  };
  const BIZ = { shop: 'Start with product questions and stock.', food: 'Start with menu, hours and booking questions.', service: 'Start with booking and pricing questions.', b2b: 'Start with proposals and follow-up emails.' };
  const render = () => {
    const t = form.elements.namedItem('type').value, p = form.elements.namedItem('pain').value;
    out.innerHTML = '<div class="ed-result hi"><span class="big">1</span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result');
    box.querySelector('strong').textContent = TASK[p][0];
    box.querySelector('p').textContent = BIZ[t];
    const ul = box.querySelector('ul');
    [TASK[p][1], 'Time it for two weeks before and after.', 'Don’t paste customer personal data into tools you haven’t checked.'].forEach(x => { const li = document.createElement('li'); li.textContent = x; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
