(() => {
  'use strict';
  // Spot-the-problems game on a fictional cleaning company's mobile landing page. Nothing is stored.
  const PROBLEMS = {
    popup: { t: 'A pop-up before anything else', b: 'It covers the page the visitor came to see. Many close the tab instead of the pop-up.', fix: 'No pop-up on arrival.' },
    head: { t: 'A headline that says nothing', b: '“Excellence Redefined” could be a bank, a hotel or a car. Visitors can’t tell what you do or where.', fix: '“Deep home cleaning in Muscat. Booked in 2 minutes.”' },
    stock: { t: 'A stock photo', b: 'Smiling models in a studio look like every other website and reduce trust for a local business.', fix: 'A real photo of the team at work.' },
    menu: { t: 'A full menu with eight links', b: 'Ad visitors wander to “About” or “Careers” and never come back to the offer.', fix: 'No menu, just the logo and a call button.' },
    form: { t: 'A seven-field form', b: 'Email, address, ID, date and more before any contact. Too much work and too much personal data.', fix: 'One WhatsApp button, plus a two-field form.' },
    proof: { t: 'No proof or price anywhere', b: 'No reviews, no rating, no price range. The visitor has no reason to trust a stranger.', fix: '4.8★ Google rating, a real review and “from OMR 25”.' }
  };
  const phone = document.getElementById('lp-phone');
  const score = document.getElementById('lp-score');
  const found = document.getElementById('lp-found');
  const reveal = document.getElementById('lp-reveal');
  if (!phone) return;
  const keys = Object.keys(PROBLEMS);
  let got = new Set();
  let ver = 'bad';
  let popupOpen = true;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hot = (k, html, extra = '') => `<button type="button" class="lp-hot${got.has(k) ? ' is-found' : ''} ${extra}" data-k="${k}" aria-label="${got.has(k) ? 'Found: ' + esc(PROBLEMS[k].t) : 'Possible problem'}">${html}${got.has(k) ? `<span class="lp-pin">${keys.indexOf(k) + 1}</span>` : ''}</button>`;

  function bad() {
    return `<div class="lp-screen">
      ${hot('menu', '<div class="lp-nav"><b>SparkleCo</b><span>Home · About · Services · Gallery · Careers · Blog · FAQ · Contact</span></div>')}
      ${hot('head', '<div class="lp-h">Excellence Redefined.</div><div class="lp-hs">Your journey to a better tomorrow starts here.</div>')}
      ${hot('stock', '<div class="lp-img lp-stock"><span>😁😁😁</span><small>stock photo</small></div>')}
      ${hot('form', '<div class="lp-form"><i>Full name</i><i>Email</i><i>Phone</i><i>Full address</i><i>ID number</i><i>Preferred date</i><i>Message</i><b>SUBMIT</b></div>')}
      ${hot('proof', '<div class="lp-empty-proof">© SparkleCo. All rights reserved.</div>')}
      ${popupOpen ? `<div class="lp-pop-veil">${hot('popup', '<div class="lp-pop"><b>WAIT! Subscribe to our newsletter!</b><span>Enter your email for exclusive updates</span><i>Email address</i><em>×</em></div>')}</div>` : ''}
    </div>`;
  }
  function good() {
    return `<div class="lp-screen lp-good">
      <div class="lp-nav"><b>SparkleCo</b><span class="lp-call">📞 Call</span></div>
      <div class="lp-h">Deep home cleaning in Muscat.</div><div class="lp-hs">Booked in 2 minutes. Same team every visit.</div>
      <div class="lp-img lp-real"><span>🧽 Our team at a villa in Al Mouj</span></div>
      <div class="lp-proofline">★ 4.8 on Google · “On time and spotless.” Huda, Qurum</div>
      <div class="lp-price">From <b>OMR 25</b> · Free re-clean if you’re not happy</div>
      <div class="lp-wa">💬 Book on WhatsApp</div>
      <div class="lp-form lp-form-s"><i>Name</i><i>Phone</i><b>Call me back</b></div>
    </div>`;
  }
  function render() {
    phone.innerHTML = ver === 'bad' ? bad() : good();
    phone.classList.toggle('is-good', ver === 'good');
    score.innerHTML = `<b>${got.size}</b><span>of 6 problems found</span><div class="lp-bar"><i style="width:${(got.size / 6) * 100}%"></i></div>`;
    const list = keys.filter((k) => got.has(k));
    found.innerHTML = list.length ? list.map((k) => `<div class="lp-item"><span class="lp-n">${keys.indexOf(k) + 1}</span><div><b>${esc(PROBLEMS[k].t)}</b><span>${esc(PROBLEMS[k].b)}</span><em>Fix: ${esc(PROBLEMS[k].fix)}</em></div></div>`).join('') : '<div class="lp-hint">Tip: start with what you see first. Would you even reach the page?</div>';
    if (got.size === 6) found.insertAdjacentHTML('afterbegin', '<div class="lp-done">All six found. Now compare with the fixed page.</div>');
    reveal.hidden = got.size === 6;
  }
  phone.addEventListener('click', (e) => {
    const h = e.target.closest('[data-k]');
    if (!h || ver !== 'bad') return;
    const k = h.dataset.k;
    got.add(k);
    if (k === 'popup') popupOpen = false;
    render();
  });
  reveal.addEventListener('click', () => { keys.forEach((k) => got.add(k)); popupOpen = false; render(); });
  document.querySelectorAll('.lp-switch [data-v]').forEach((b) => b.addEventListener('click', () => {
    ver = b.dataset.v;
    document.querySelectorAll('.lp-switch [data-v]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    render();
  }));
  render();
})();
