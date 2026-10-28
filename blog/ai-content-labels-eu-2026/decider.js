(() => {
  'use strict';
  const form = document.getElementById('al-decide');
  const out = document.getElementById('al-decide-result');
  if (!form || !out) return;
  const v = k => form.elements.namedItem(k).value;
  const render = () => {
    const type = v('type'), real = v('real') === 'yes', made = v('made'), topic = v('topic');
    let cls, head, body, notes = [];
    if (type === 'chat') {
      cls = 'yes'; head = 'Yes: say it is AI'; body = 'People must be told they are interacting with an AI system, unless it is obvious from the context. Put it at the start of the conversation.';
    } else if (type === 'text') {
      if (made === 'human') { cls = 'no'; head = 'No label needed'; body = 'Text written by people, with AI used only for minor help, is not AI-generated text under Article 50.'; }
      else if (topic === 'public' && made === 'gen') { cls = 'yes'; head = 'Yes: label it, or add real editorial oversight'; body = 'AI-generated text that informs the public on matters of public interest must be labelled, unless a human editor exercised genuine editorial responsibility for it.'; notes.push('A named editor who reviewed and takes responsibility can replace the label.'); }
      else if (topic === 'public') { cls = 'maybe'; head = 'Probably not, if the editing is real'; body = 'AI-assisted text with meaningful human editing can fall under the editorial-oversight exception. Make sure the oversight is genuine and documented.'; }
      else { cls = 'no'; head = 'No label required by the Act'; body = 'Commercial copy such as product descriptions and brand content is not text that informs the public on matters of public interest.'; notes.push('Platform rules and advertising codes may still apply.'); }
    } else {
      if (made === 'human') { cls = 'no'; head = 'No label needed'; body = 'Real photos, video or audio with only minor AI retouching are not deepfakes.'; notes.push('Substantial AI alteration changes the answer.'); }
      else if (real) { cls = 'yes'; head = 'Yes: disclose it visibly'; body = `AI-${made === 'gen' ? 'generated' : 'altered'} ${type} that could be mistaken for real people, places or events is a deepfake under the Act. The deployer who publishes it must disclose that, in a way people can see, near the content.`; notes.push('The tool’s watermark is not enough on its own.'); if (type === 'audio') notes.push('Cloned or imitated voices need disclosure even with the person’s consent.'); }
      else { cls = 'maybe'; head = 'Usually no, but platforms may ask'; body = 'Clearly stylised or obviously artificial content is generally outside the deepfake rule. Meta, TikTok and YouTube may still require an AI label on synthetic media.'; }
    }
    if (made !== 'human' && type !== 'chat') notes.push('Keep the provider’s metadata and watermark intact when you export.');
    out.innerHTML = '<div class="al-verdict"><i aria-hidden="true"></i><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.al-verdict'); box.classList.add(cls);
    box.querySelector('i').textContent = cls === 'yes' ? '!' : cls === 'no' ? '✓' : '?';
    box.querySelector('strong').textContent = head; box.querySelector('p').textContent = body;
    const ul = box.querySelector('ul'); notes.forEach(n => { const li = document.createElement('li'); li.textContent = n; ul.append(li); }); if (!notes.length) ul.remove();
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
