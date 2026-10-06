(() => {
  'use strict';
  // Branching reply simulator for a fictional restaurant. Each choice adds to the thread and moves the public mood.
  const START = { who: 'Ahmed K.', text: 'Ordered at 8:15 for my family, food arrived at 9:30 COLD. Called twice, nobody answered. Never again, worst service in Muscat 😡', likes: 23 };
  const STEPS = {
    s1: { prompt: 'It is 9:40 pm. 23 people have liked the comment. What do you do first?', options: [
      { id: 'a', label: 'Reply now with an apology and a private route', reply: 'Ahmed, a 75-minute wait and cold food is not acceptable, especially for a family dinner. We’re truly sorry. Could you send your order number to our WhatsApp 9XXX XXXX? Our manager Salma will call you tonight.', mood: 2, next: 's2good', note: 'Fast, personal and specific. You acknowledged the problem before explaining anything.' },
      { id: 'b', label: 'Explain that Friday nights are very busy', reply: 'Dear customer, Friday is our busiest night and delivery times can be longer. Thank you for your understanding.', mood: -1, next: 's2bad', note: 'An excuse before an apology. “Thank you for your understanding” tells him his feelings don’t matter.' },
      { id: 'c', label: 'Delete the comment and block him', reply: null, mood: -3, next: 'endDelete', note: 'Deleting a genuine complaint rarely stays hidden. Screenshots exist before you act.' }
    ] },
    s2good: { incoming: { who: 'Ahmed K.', text: 'Sent the order number. Still disappointed, but thanks for replying quickly.', likes: 4 }, prompt: 'Salma calls him. What does she offer?', options: [
      { id: 'a', label: 'A full refund, and a fresh meal on another night', reply: null, mood: 2, next: 's3', note: 'Generous recovery costs little compared to the goodwill and the word of mouth it buys.' },
      { id: 'b', label: 'A 10% voucher for the next order', reply: null, mood: 0, next: 's3', note: 'Better than nothing, but small compared to a ruined family dinner. It can feel like a sales tactic.' }
    ] },
    s2bad: { incoming: { who: 'Ahmed K.', text: 'So it’s my fault for ordering on Friday?? Unbelievable. Everyone, avoid this place.', likes: 41 }, prompt: 'The thread is getting worse and others are joining. Now what?', options: [
      { id: 'a', label: 'Apologise properly and offer a direct call', reply: 'Ahmed, you’re right, and our first reply was not good enough. There is no excuse for cold food and unanswered calls. I’m the owner; may I call you personally tonight? Please share your number on WhatsApp 9XXX XXXX.', mood: 2, next: 's3', note: 'Owning the mistake, including your own bad reply, can turn a thread around.' },
      { id: 'b', label: 'Reply that his account of the times is not accurate', reply: 'Our system shows the order was dispatched at 9:05, not 9:30.', mood: -2, next: 'endArgue', note: 'Even if you are right, arguing facts in public makes you look defensive. Other readers take his side.' }
    ] },
    s3: { prompt: 'The issue is solved privately. Anything else?', options: [
      { id: 'a', label: 'Post a short public update under the comment', reply: 'Update: thank you Ahmed for giving us the chance to make this right. We’ve also changed how we answer calls on busy nights so this doesn’t happen again.', mood: 2, next: 'endGood', note: 'Closing the loop in public is what future customers will read.' },
      { id: 'b', label: 'Leave it, it’s handled', reply: null, mood: 0, next: 'endOk', note: 'Resolved, but anyone reading the thread later only sees the anger.' }
    ] }
  };
  const ENDS = {
    endGood: { t: 'Turned around', b: 'Ahmed edited his comment and later posted a photo of his next meal. The thread now reads as proof that you take care of customers.', incoming: { who: 'Ahmed K.', text: 'Edit: the owner called and sorted it out properly. Respect for that. Will give them another try 👍', likes: 37 } },
    endOk: { t: 'Contained', b: 'The customer is satisfied, but the public thread ends with the complaint. A one-line update would have finished the story.' },
    endDelete: { t: 'It got bigger', b: 'Ahmed posted a screenshot of his deleted comment in two WhatsApp groups and a Facebook group: “They deleted my complaint.” Now the story is about hiding, not cold food.', incoming: { who: 'Muscat Foodies group', text: '“They deleted my complaint and blocked me” 👀 (screenshot attached)', likes: 180 } },
    endArgue: { t: 'You won the argument, lost the room', b: 'Several people replied defending Ahmed. Being technically right didn’t matter; the tone did. Start again and try acknowledging first.', incoming: { who: 'Noor A.', text: 'Wow, arguing with your customer in public. Not ordering from here.', likes: 58 } }
  };
  const feed = document.getElementById('cx-feed');
  const choices = document.getElementById('cx-choices');
  const meter = document.getElementById('cx-meter');
  if (!feed) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let thread, mood, step;
  const comment = (c, mine) => `<div class="cx-c${mine ? ' cx-mine' : ''}"><span class="cx-av">${mine ? 'D' : esc(c.who[0])}</span><div><b>${mine ? 'dhow.kitchen' : esc(c.who)}</b><span>${esc(c.text)}</span><small>${mine ? 'Author · just now' : `♥ ${c.likes} · Reply`}</small></div></div>`;

  function paint() {
    feed.innerHTML = `<div class="cx-post"><div class="cx-post-top"><span class="cx-av cx-av-b">D</span><b>dhow.kitchen</b><small>Sponsored post · Muscat</small></div><div class="cx-post-img">🍛 New Friday family platter</div></div><div class="cx-thread">${thread.join('')}</div>`;
    feed.querySelector('.cx-thread').lastElementChild?.classList.add('is-new');
    const pct = Math.max(0, Math.min(100, 50 + mood * 10));
    meter.innerHTML = `<span class="cx-meter-k">How readers see you</span><div class="cx-meter-bar"><i style="left:${pct}%"></i></div><div class="cx-meter-l"><span>Defensive</span><span>Caring</span></div>`;
  }
  function show(id) {
    step = id;
    const s = STEPS[id];
    if (s.incoming) thread.push(comment(s.incoming));
    paint();
    choices.innerHTML = `<div class="cx-prompt">${esc(s.prompt)}</div>${s.options.map((o) => `<button type="button" class="cx-opt" data-o="${o.id}">${esc(o.label)}</button>`).join('')}`;
  }
  function end(id, lastNote) {
    const e = ENDS[id];
    if (e.incoming) thread.push(comment(e.incoming));
    paint();
    choices.innerHTML = `<div class="cx-end cx-end-${id}"><span class="cx-end-k">Outcome</span><b>${esc(e.t)}</b><span>${esc(e.b)}</span></div>${lastNote}<button type="button" class="cx-opt cx-restart" data-restart>↺ Try different replies</button>`;
  }
  choices.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-restart]')) { start(); return; }
    const b = ev.target.closest('[data-o]');
    if (!b) return;
    const o = STEPS[step].options.find((x) => x.id === b.dataset.o);
    mood += o.mood;
    if (o.reply) thread.push(comment({ text: o.reply }, true));
    const note = `<div class="cx-note${o.mood > 0 ? ' is-good' : o.mood < 0 ? ' is-bad' : ''}"><b>${o.mood > 0 ? 'Good move' : o.mood < 0 ? 'Risky' : 'Okay'}</b>${esc(o.note)}</div>`;
    if (ENDS[o.next]) end(o.next, note);
    else { show(o.next); choices.insertAdjacentHTML('afterbegin', note); }
  });
  function start() { thread = [comment(START)]; mood = 0; show('s1'); }
  start();
})();
