(() => {
  const form = document.querySelector('#growthDiagnostic');
  if (!form) return;
  const steps = [...form.querySelectorAll('.gd-step')];
  const progress = form.querySelector('[data-gd-progress]');
  const progressText = form.querySelector('[data-gd-progress-text]');
  const progressPercent = form.querySelector('[data-gd-progress-percent]');
  const back = form.querySelector('[data-gd-back]');
  const next = form.querySelector('[data-gd-next]');
  const error = form.querySelector('[data-gd-error]');
  const results = document.querySelector('[data-gd-results]');
  let current = 0;
  let reportText = '';

  const domainContent = {
    seo: { label: 'SEO visibility', gap: 'Search demand is not yet connected to a dependable discovery system.', actions: ['Check indexation, technical blockers, and local search basics.', 'Map the five highest-intent customer searches to useful landing pages.', 'Improve one commercial page and one supporting article before expanding.'] },
    ads: { label: 'Advertising readiness', gap: 'Paid activity needs a clearer link between spend, message, and business outcomes.', actions: ['Confirm one primary conversion and its real business value.', 'Separate high-intent demand from broader awareness activity.', 'Run one controlled message or creative test with a written hypothesis.'] },
    content: { label: 'Content strength', gap: 'Your message and useful buying content are not yet working as one trust system.', actions: ['Write the clearest one-sentence promise for the customer you want most.', 'List the five questions buyers ask immediately before contacting you.', 'Publish or improve one decision-stage asset that answers the strongest question.'] },
    analytics: { label: 'Analytics clarity', gap: 'Measurement is not yet reliable enough to guide confident next decisions.', actions: ['Audit GA4, ad-platform conversions, UTM use, and duplicate events.', 'Choose five decision metrics with an owner and review rhythm.', 'Turn the next report into three actions, not another dashboard summary.'] }
  };
  const sentenceLabel = (domain) => domain === 'seo' ? 'SEO visibility' : domainContent[domain].label.toLowerCase();
  const questionDomains = { q1: 'seo', q2: 'seo', q3: 'ads', q4: 'ads', q5: 'content', q6: 'content', q7: 'analytics', q8: 'analytics' };

  function updateStep() {
    steps.forEach((step, index) => step.classList.toggle('is-active', index === current));
    const value = current + 1;
    progress.value = value;
    progressText.textContent = `Step ${value} of ${steps.length}`;
    progressPercent.textContent = `${Math.round((value / steps.length) * 100)}%`;
    back.disabled = current === 0;
    next.innerHTML = current === steps.length - 1 ? 'Build my plan <span>→</span>' : 'Continue <span>→</span>';
    error.textContent = '';
    steps[current].querySelector('input,select')?.focus({ preventScroll: true });
  }

  function validCurrentStep() {
    const required = [...steps[current].querySelectorAll('[required]')];
    const radioNames = [...new Set(required.filter((input) => input.type === 'radio').map((input) => input.name))];
    const missingRadio = radioNames.find((name) => !form.querySelector(`input[name="${name}"]:checked`));
    const missingField = required.find((field) => field.type !== 'radio' && !field.value.trim());
    if (missingRadio || missingField) {
      error.textContent = current === 0 ? 'Choose your primary goal to personalize the plan.' : 'Choose the answer that best matches your current situation.';
      return false;
    }
    return true;
  }

  function scoresFromAnswers() {
    const totals = { seo: 0, ads: 0, content: 0, analytics: 0 };
    Object.entries(questionDomains).forEach(([question, domain]) => {
      totals[domain] += Number(form.querySelector(`input[name="${question}"]:checked`)?.value || 0);
    });
    return Object.fromEntries(Object.entries(totals).map(([domain, total]) => [domain, Math.round((total / 6) * 100)]));
  }

  function buildReport() {
    const data = new FormData(form);
    const scores = scoresFromAnswers();
    const ordered = Object.keys(scores).sort((a, b) => scores[a] - scores[b]);
    const overall = Math.round(Object.values(scores).reduce((sum, value) => sum + value, 0) / 4);
    const name = String(data.get('name') || '').trim();
    const business = String(data.get('business') || '').trim();
    const website = String(data.get('website') || '').trim();
    const goal = String(data.get('goal') || 'business growth');
    const safeBusiness = business.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
    document.querySelector('[data-gd-title]').textContent = name ? `${name}, here is your growth picture.` : 'Here is your growth picture.';
    document.querySelector('[data-gd-overall]').textContent = overall;
    document.querySelector('[data-gd-summary]').textContent = `${business ? `${business} is` : 'You are'} currently strongest in ${sentenceLabel(ordered[3])}. The clearest opportunity is ${sentenceLabel(ordered[0])}, with the plan sequenced toward ${goal}.`;

    const scoreGrid = document.querySelector('[data-gd-scores]');
    scoreGrid.innerHTML = Object.entries(scores).map(([domain, score]) => `<article class="gd-score-card"><span>${domainContent[domain].label}</span><strong>${score}</strong><progress max="100" value="${score}" aria-label="${domainContent[domain].label}: ${score} out of 100"></progress></article>`).join('');
    document.querySelector('[data-gd-gaps]').innerHTML = ordered.slice(0, 3).map((domain, index) => `<article class="gd-gap-card"><b>0${index + 1} · ${scores[domain]}/100</b><strong>${domainContent[domain].label}</strong><p>${domainContent[domain].gap}</p></article>`).join('');

    const weeks = [
      { label: 'Days 1–7', title: `Fix the ${sentenceLabel(ordered[0])} foundation`, items: domainContent[ordered[0]].actions },
      { label: 'Days 8–14', title: `Strengthen ${sentenceLabel(ordered[1])}`, items: domainContent[ordered[1]].actions },
      { label: 'Days 15–21', title: `Connect the system to ${goal}`, items: [`Define what a qualified outcome means for ${safeBusiness || 'the business'}.`, `Connect the first two priority areas to one customer journey.`, 'Remove one activity that produces motion without useful evidence.'] },
      { label: 'Days 22–30', title: 'Review, learn, and choose the next bet', items: ['Compare the baseline with the new decision metrics.', `Keep the actions that create progress toward ${goal}.`, 'Document the next 30-day hypothesis, owner, and success signal.'] }
    ];
    document.querySelector('[data-gd-plan]').innerHTML = weeks.map((week) => `<article class="gd-plan-week"><span>${week.label}</span><div><h4>${week.title}</h4><ul>${week.items.map((item) => `<li>${item}</li>`).join('')}</ul></div></article>`).join('');

    reportText = [`Growth Diagnostic${business ? ` — ${business}` : ''}`, website ? `Website: ${website}` : '', `Primary goal: ${goal}`, `Overall readiness: ${overall}/100`, '', ...Object.entries(scores).map(([domain, score]) => `${domainContent[domain].label}: ${score}/100`), '', 'Three priority gaps:', ...ordered.slice(0, 3).map((domain, index) => `${index + 1}. ${domainContent[domain].label} — ${domainContent[domain].gap}`), '', '30-day plan:', ...weeks.flatMap((week) => [week.label + ': ' + week.title, ...week.items.map((item) => `- ${item}`)]), '', 'Generated at https://hisanali.com/growth-diagnostic/'].filter(Boolean).join('\n');
    const encoded = encodeURIComponent(reportText);
    document.querySelector('[data-gd-email]').href = `mailto:?subject=${encodeURIComponent('My Growth Diagnostic')}&body=${encoded}`;
    document.querySelector('[data-gd-whatsapp]').href = `https://wa.me/?text=${encoded}`;
    const contact = new URL('/contact/', location.origin);
    contact.searchParams.set('service', 'consultation');
    contact.searchParams.set('goal', goal);
    contact.searchParams.set('diagnostic', `${overall}/100 — priorities: ${ordered.slice(0, 3).map((domain) => domainContent[domain].label).join(', ')}`);
    if (website) contact.searchParams.set('website', website);
    document.querySelector('[data-gd-contact]').href = contact.pathname + contact.search;
    form.hidden = true;
    results.hidden = false;
    results.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  next.addEventListener('click', () => {
    if (!validCurrentStep()) return;
    if (current < steps.length - 1) { current += 1; updateStep(); }
    else buildReport();
  });
  back.addEventListener('click', () => { if (current > 0) { current -= 1; updateStep(); } });
  form.addEventListener('change', () => { error.textContent = ''; });
  document.querySelector('[data-gd-copy]').addEventListener('click', async (event) => {
    try { await navigator.clipboard.writeText(reportText); event.currentTarget.textContent = 'Report copied'; }
    catch { event.currentTarget.textContent = 'Select and copy unavailable'; }
  });
  document.querySelector('[data-gd-restart]').addEventListener('click', () => {
    form.reset(); current = 0; results.hidden = true; form.hidden = false; updateStep(); form.scrollIntoView({ behavior: 'smooth' });
  });
  updateStep();
})();
