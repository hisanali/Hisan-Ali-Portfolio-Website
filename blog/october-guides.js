(() => {
 'use strict';
 const readiness = document.querySelector('[data-readiness]');
 if (readiness) {
  const update = () => {
   const inputs = [...readiness.querySelectorAll('input')];
   const complete = inputs.filter(input => input.checked).length;
   const critical = inputs.filter(input => input.hasAttribute('data-critical')).every(input => input.checked);
   document.querySelector('[data-ready-result]').textContent = `${complete} of ${inputs.length} checks complete. ` +
    (!critical ? 'First resolve campaign inventory, conversion quality and destination control.' : complete < inputs.length ? 'The core controls are covered. Finish the evidence and ownership checks before planning the transition.' : 'Your preparation checklist is complete. Confirm account eligibility and agree a controlled review plan; this is not a performance guarantee.');
  };
  readiness.addEventListener('change', update); update();
 }
 const scenarios = {
  hours: ['Are you open on Friday evening?', 'Use the approved branch schedule, mention any known holiday exception, and offer directions.', 'AI can answer if the opening-hours source is current. Never invent a branch schedule.'],
  stock: ['Can you deliver this exact sofa to Seeb tomorrow?', 'Explain the product, then check live stock and delivery capacity or hand over to the team before confirming.', 'Verification required. Catalogue availability does not prove that a particular delivery slot is available.'],
  complaint: ['My order arrived damaged. I want to speak to someone.', 'Acknowledge the problem, request only the necessary order reference, and route the conversation to the responsible staff member.', 'Human ownership. Preserve the conversation and do not invent a refund decision or ask for payment-card details.']
 };
 document.querySelectorAll('[data-scenario]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-scenario]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  const values = scenarios[button.dataset.scenario];
  ['customer', 'reply', 'rule'].forEach((key, index) => { document.querySelector(`[data-${key}]`).textContent = values[index]; });
 }));
 const margin = document.querySelector('[data-margin]');
 if (margin) {
  const update = () => {
   const inputs = [...margin.querySelectorAll('input')];
   const out = document.querySelector('[data-margin-result]');
   if (inputs.some(input => input.value.trim() === '' || !input.validity.valid || !Number.isFinite(Number(input.value)))) {
    out.textContent = 'Enter valid non-negative amounts and a discount between 0% and 100%.'; return;
   }
   const values = Object.fromEntries(inputs.map(input => [input.name, Number(input.value)]));
   const revenue = values.price * (1 - values.discount / 100);
   const before = revenue - values.cost - values.other;
   const after = before - values.cac;
   out.textContent = `After discount: OMR ${revenue.toFixed(3)}. Contribution after advertising: OMR ${after.toFixed(3)} per order, before fixed costs. ` +
    (after < 0 ? 'This order loses money before fixed costs. Rework the offer or acquisition cost before scaling.' : before === 0 ? 'There is no contribution available to fund advertising or fixed costs.' : `The zero-contribution acquisition ceiling is OMR ${Math.max(0,before).toFixed(3)}; your actual target needs room for overhead and profit.`);
  };
  margin.addEventListener('input', update); update();
 }
})();
