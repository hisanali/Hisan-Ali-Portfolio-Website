(() => {
  'use strict';
  // Day-by-day retargeting sequence for an example Muscat furniture store. Pure content: no tracking, nothing saved.
  const TRACKS = {
    browse: [
      { day: 'Day 0', title: 'Let them go', mood: '“Nice sofa. I’ll ask my wife tonight.”', goal: 'Nothing yet. Showing an ad seconds after someone leaves feels creepy.', channel: 'No ads', tip: 'Make sure the visit is tracked and the right audience (viewed product, 14 days) is filling up.', ad: null },
      { day: 'Day 1', title: 'Remind & reassure', mood: '“What was that shop called again?”', goal: 'Bring back the exact item, plus one reassurance.', channel: 'Instagram & Facebook (dynamic product ad)', tip: 'Show the product they viewed, not your best-seller. Add the reassurance in the first line.', ad: { tone: 'sand', label: 'Linen 3-seater · Sand', head: 'Still on your mind?', body: 'Free delivery & assembly across Muscat. Pay in 4 instalments.', cta: 'View sofa' } },
      { day: 'Day 3', title: 'Prove it', mood: '“Is the quality really good? The photos look too nice.”', goal: 'Answer doubt with proof from real people.', channel: 'Instagram Reels & Stories', tip: 'A 10-second customer video or a staff member sitting on the sofa beats any studio photo.', ad: { tone: 'green', label: '★★★★★ “Better than in the photos”', head: 'Fatma from Al Mouj, 3 weeks later', body: '“Delivered on Saturday, assembled in 20 minutes. Very comfortable.”', cta: 'See reviews' } },
      { day: 'Day 7', title: 'Remove the last objection', mood: '“I want to see the colour in real life first.”', goal: 'Make the next step small and easy.', channel: 'Instagram + Google Display', tip: 'Offer a showroom visit, fabric samples or a WhatsApp video call. A small step beats a big ask.', ad: { tone: 'sky', label: 'Showroom · Al Khuwair', head: 'See it, sit on it, then decide', body: 'Open until 10 pm, Friday from 4 pm. Or ask for a live video tour on WhatsApp.', cta: 'Get directions' } },
      { day: 'Day 14', title: 'A real reason to act', mood: '“Maybe after Eid…”', goal: 'Give an honest reason to decide now, then wind down.', channel: 'Instagram & Facebook', tip: 'Use a real deadline: a seasonal delivery slot, limited stock of that colour, an event. Never a fake countdown.', ad: { tone: 'peach', label: 'Only 4 left in Sand', head: 'Delivered before Eid if ordered by Thursday', body: 'Reserve with OMR 20 on WhatsApp; pay the rest on delivery.', cta: 'Reserve now' } },
      { day: 'Day 15+', title: 'Stop gracefully', mood: '“I bought somewhere else.” or “Not this year.”', goal: 'Stop the sales ads. Move them to a gentle, helpful audience.', channel: 'Exit sequence', tip: 'Drop them from product ads. Let your normal content reach them, and try again only if they visit again.', ad: null, stop: true }
    ],
    cart: [
      { day: 'Hour 1', title: 'A human nudge', mood: '“The delivery fee section confused me.”', goal: 'Help, don’t sell. Most abandoned checkouts are friction.', channel: 'WhatsApp or email (with consent)', tip: 'A short, personal message from a real person often recovers more orders than any ad.', ad: { tone: 'wa', label: 'WhatsApp · Bayt Home', head: 'Hi Ahmed, it’s Sara from Bayt Home 👋', body: 'I saw your order didn’t go through. Any question about delivery or payment? I’m here.', cta: 'Reply' } },
      { day: 'Day 1', title: 'Remind with the basket', mood: '“I’ll finish it later.”', goal: 'Show exactly what they left, and why it’s safe to buy.', channel: 'Instagram & Facebook (dynamic ad)', tip: 'Feature the cart items and the friction-removers: delivery date, returns, cash on delivery.', ad: { tone: 'sand', label: 'Your basket · 2 items', head: 'Your sofa & side table are waiting', body: 'Delivery this Saturday. 14-day returns. Cash or card on delivery.', cta: 'Complete order' } },
      { day: 'Day 2', title: 'Reassure on risk', mood: '“What if it doesn’t fit the living room?”', goal: 'Remove the fear of a wrong decision.', channel: 'Instagram Stories', tip: 'Show your returns policy, measurements help or a free re-measure. Risk reversal works well for bigger purchases.', ad: { tone: 'green', label: 'Free measuring visit', head: 'Not sure it fits? We’ll measure for free', body: 'Our team visits anywhere in Muscat this week, no obligation.', cta: 'Book a visit' } },
      { day: 'Day 4', title: 'One honest incentive', mood: '“Is there a better price somewhere?”', goal: 'If you discount at all, do it once, late and small.', channel: 'Instagram + Google', tip: 'A small extra (free cushions, free delivery upgrade) protects margin better than a big percentage off.', ad: { tone: 'peach', label: 'For you, until Thursday', head: 'Two free cushions with your order', body: 'Complete your basket by Thursday midnight.', cta: 'Finish checkout' } },
      { day: 'Day 7+', title: 'Stop & listen', mood: '“The timing isn’t right.”', goal: 'End the sequence. Ask what stopped them, if you have consent.', channel: 'Exit sequence', tip: 'One short message asking what stopped them gives you gold for fixing the checkout. Then stop.', ad: null, stop: true }
    ]
  };

  const days = document.getElementById('rt-days');
  const stage = document.getElementById('rt-stage');
  const trackBtns = [...document.querySelectorAll('.rt-tracks [data-track]')];
  if (!days || !stage) return;
  let track = 'browse';
  let index = 1;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function adMock(ad) {
    if (!ad) return '';
    if (ad.tone === 'wa') {
      return `<div class="rt-wa" aria-label="Example WhatsApp message"><div class="rt-wa-top"><span class="rt-wa-av">B</span><span><b>Bayt Home</b><small>Business account</small></span></div><div class="rt-wa-body"><div class="rt-wa-msg"><b>${esc(ad.head)}</b><span>${esc(ad.body)}</span><small>10:42 ✓✓</small></div></div></div>`;
    }
    return `<div class="rt-ad" aria-label="Example ad"><div class="rt-ad-top"><span class="rt-ad-av">B</span><span><b>Bayt Home</b><small>Sponsored</small></span><span class="rt-ad-more">•••</span></div><div class="rt-ad-visual rt-${ad.tone}"><span class="rt-ad-label">${esc(ad.label)}</span><span class="rt-sofa" aria-hidden="true"><i></i><i></i><i></i></span></div><div class="rt-ad-copy"><b>${esc(ad.head)}</b><span>${esc(ad.body)}</span></div><div class="rt-ad-cta"><span>baythome.om</span><span class="rt-ad-btn">${esc(ad.cta)}</span></div></div>`;
  }

  function render() {
    const steps = TRACKS[track];
    days.innerHTML = steps.map((s, i) => `<button type="button" role="tab" aria-selected="${i === index}" data-i="${i}" class="${s.stop ? 'is-stop' : ''}${i < index ? ' is-past' : ''}"><span>${esc(s.day)}</span><small>${esc(s.title)}</small></button>`).join('');
    const s = steps[index];
    stage.innerHTML = `<div class="rt-card${s.stop ? ' is-stop' : ''}">
      <div class="rt-info">
        <div class="rt-step"><span>${esc(s.day)}</span>${esc(s.title)}</div>
        <div class="rt-mood"><span class="rt-mood-ic" aria-hidden="true">💭</span>${esc(s.mood)}</div>
        <div class="rt-row"><span>Goal</span><div>${esc(s.goal)}</div></div>
        <div class="rt-row"><span>Where</span><div>${esc(s.channel)}</div></div>
        <div class="rt-tip"><b>Tip</b>${esc(s.tip)}</div>
        <div class="rt-nav"><button type="button" data-go="-1" ${index === 0 ? 'disabled' : ''}>← Previous</button><button type="button" data-go="1" ${index === steps.length - 1 ? 'disabled' : ''}>Next step →</button></div>
      </div>
      <div class="rt-preview">${s.ad ? adMock(s.ad) : `<div class="rt-empty"><span aria-hidden="true">${s.stop ? '✋' : '🕊️'}</span><b>${s.stop ? 'No more sales ads' : 'No ad today'}</b><small>${s.stop ? 'Exclude them from this sequence.' : 'Give them space.'}</small></div>`}</div>
    </div>`;
  }

  days.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { index = Number(b.dataset.i); render(); } });
  days.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = TRACKS[track].length;
    index = (index + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
    render();
    days.querySelector(`[data-i="${index}"]`).focus();
  });
  stage.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) { index += Number(b.dataset.go); render(); } });
  trackBtns.forEach((b) => b.addEventListener('click', () => {
    track = b.dataset.track;
    index = track === 'browse' ? 1 : 0;
    trackBtns.forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    render();
  }));
  render();
})();
