(() => {
  'use strict';
  const form = document.getElementById('fp-check');
  const out = document.getElementById('fp-check-result');
  if (!form || !out) return;
  const on = k => form.elements.namedItem(k).checked;
  const render = () => {
    const todo = [];
    let risk = 0;
    if (on('packaged')) { risk += 2; todo.push('Confirm with the centre whether this product is one of the specified foods that need approval.'); }
    if (on('paid')) risk += 1;
    if (on('health')) { risk += 3; todo.push('Remove health-effect claims, or get them approved in writing before posting.'); }
    if (on('nutrition')) { risk += 2; todo.push('Match every nutrition claim to the approved label wording.'); }
    if (on('infant')) { risk += 3; todo.push('Infant and toddler foods need approval for any promotion: apply via Food.approval@mafwr.gov.om.'); }
    if (on('import')) { risk += 2; todo.push('Check the product is registered for sale in Oman before promoting it.'); }
    if (on('paid')) todo.push('Check the creator holds a commercial promotion licence and brief them in writing on the approved claims.');
    const approved = on('approved');
    if (approved) risk = Math.max(0, risk - 4);
    const cls = risk >= 5 ? 'lo' : risk >= 2 ? 'mid' : 'hi';
    const word = cls === 'lo' ? 'High' : cls === 'mid' ? 'Medium' : 'Low';
    const head = cls === 'lo' ? 'Get approval before this goes live' : cls === 'mid' ? 'Check before you post' : 'Low risk as described';
    const lead = approved ? 'You have written approval. Make sure the final post matches what was approved, word for word.' : cls === 'hi' ? 'A dish photo with price and location, with no claims, is the lowest-risk kind of food post.' : 'Based on what you ticked, this is the kind of post the centre has asked to see first.';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.firstChild; box.classList.add(cls);
    box.querySelector('.big').textContent = word;
    box.querySelector('strong').textContent = head;
    box.querySelector('p').textContent = lead;
    const ul = box.querySelector('ul'); (approved ? todo.filter(t => /creator/.test(t)) : todo).forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); }); if (!ul.children.length) ul.remove();
  };
  form.addEventListener('change', render);
  render();
})();
