(() => {
  'use strict';
  const form = document.getElementById('wt-plan');
  const out = document.getElementById('wt-plan-result');
  if (!form || !out) return;
  const v = k => form.elements.namedItem(k).value;
  // Base weights from first-half 2026 arrivals: UAE 491,503, India 382,015, Germany 68,771 (top European market).
  const markets = {
    uae: { name: 'UAE weekenders', base: 27, start: 'From early November; push weekend offers 3 to 10 days ahead', ch: 'Instagram, Snapchat and TikTok in Arabic and English, Google Maps, WhatsApp booking' },
    india: { name: 'Indian families and friends', base: 21, start: 'From November for December holidays; again for spring breaks', ch: 'Google Search, YouTube, WhatsApp, community groups; price per family' },
    europe: { name: 'European holidaymakers', base: 14, start: 'Now for this winter through operators; spring for next winter', ch: 'Tour operators and charters, booking sites, Google and Tripadvisor reviews, English and German pages' },
    residents: { name: 'Residents and expats in Oman', base: 18, start: 'National Day on 25 and 26 November, then midweek and shoulder weeks', ch: 'Instagram and Snapchat in Muscat, Google Business Profile, SMS and WhatsApp to opted-in customers' },
    gcc: { name: 'Saudi and other GCC visitors', base: 10, start: 'School holidays in December and January', ch: 'Snapchat and TikTok in Arabic, Google Search, influencer trips' }
  };
  const fit = {
    loc: { muscat: { uae: 6, india: 8, europe: 4, residents: 8, gcc: 4 }, dhofar: { europe: 14, uae: 2, india: 2, residents: 4, gcc: 4 }, sharqiyah: { europe: 10, uae: 6, residents: 8, india: 0, gcc: 2 }, interior: { europe: 8, residents: 10, uae: 4, gcc: 4, india: 0 }, musandam: { uae: 16, europe: 6, residents: 4, india: 2, gcc: 2 } },
    biz: { hotel: { europe: 4, uae: 4, gcc: 2 }, tour: { europe: 8, uae: 2, india: 2 }, food: { residents: 10, india: 6, uae: 2 }, retail: { india: 6, residents: 8, europe: 2 } },
    price: { value: { india: 6, residents: 4 }, mid: {}, premium: { europe: 6, gcc: 6, uae: 2, india: -4 } },
    lang: { ae: {}, en: { uae: -4, gcc: -8, residents: -2 }, multi: { india: 4, europe: 4 } }
  };
  const render = () => {
    const pick = { loc: v('loc'), biz: v('biz'), price: v('price'), lang: v('lang') };
    const scored = Object.entries(markets).map(([k, m]) => {
      let s = m.base; for (const dim of Object.keys(pick)) s += (fit[dim][pick[dim]] || {})[k] || 0;
      return { k, ...m, s };
    }).sort((a, b) => b.s - a.s).slice(0, 3);
    out.innerHTML = '<div class="wt-out"><h4>Your top three markets this winter</h4><div class="wt-rank" role="list"></div><p></p></div>';
    const ol = out.querySelector('.wt-rank');
    scored.forEach((m, i) => { const li = document.createElement('div'); li.className = 'wt-item'; li.setAttribute('role', 'listitem'); li.innerHTML = '<span></span><div><strong></strong><small></small><small></small></div><em></em>'; li.querySelector('span').textContent = i + 1; li.querySelector('strong').textContent = m.name; const sm = li.querySelectorAll('small'); sm[0].textContent = 'Channels: ' + m.ch + '.'; sm[1].textContent = 'Timing: ' + m.start + '.'; li.querySelector('em').textContent = i === 0 ? 'Lead market' : i === 1 ? 'Second' : 'Fill gaps'; ol.append(li); });
    const tips = { hotel: 'Hotel occupancy was about 46% in the first half while rates rose 2.6%: add value, such as late checkout or a dinner, instead of cutting prices.', tour: 'Get listed with the tour operators running charters and reply to every review; Europeans book on reputation.', food: 'Keep Google Maps hours, menus and photos current; visitors choose restaurants on their phones within walking distance.', retail: 'Show prices in OMR and accept QR and cards; visitors buy gifts in the last two days of a trip.' };
    const langTip = pick.lang === 'en' ? ' Add Arabic replies, even templated ones, before targeting UAE and GCC visitors.' : '';
    out.querySelector('p').textContent = tips[pick.biz] + langTip;
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
