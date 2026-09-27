(() => {
  'use strict';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const full = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Live countdown to the next key date. Islamic dates are expected dates and depend on moon sighting.
  const next = document.getElementById('mc-next');
  if (next) {
    const dates = [
      ['2026-11-11', 'Singles’ Day (11.11)'], ['2026-11-20', 'National Day'], ['2026-11-25', 'National Day holiday (25–26 Nov)'], ['2026-11-27', 'White Friday'],
      ['2027-01-05', 'Isra & Mi’raj (expected)'], ['2027-01-11', 'Sultan’s Accession Day (day off may shift)'], ['2027-02-08', 'Ramadan begins (expected)'],
      ['2027-03-10', 'Eid al-Fitr (expected)'], ['2027-05-16', 'Eid al-Adha (expected)'], ['2027-06-06', 'Islamic New Year (expected)'],
      ['2027-06-21', 'Khareef season opens'], ['2027-08-14', 'Prophet’s Birthday (expected)'], ['2027-11-11', 'Singles’ Day (11.11)'],
      ['2027-11-20', 'National Day'], ['2027-11-26', 'White Friday']
    ];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const upcoming = dates.map(([d, label]) => [new Date(d + 'T00:00:00'), label]).find(([d]) => d >= today);
    if (upcoming) {
      const days = Math.round((upcoming[0] - today) / 86400000);
      next.innerHTML = '<b></b><span></span><small>Counted from today in your browser. Start campaign work 4–8 weeks before a peak.</small>';
      next.querySelector('b').textContent = days === 0 ? 'Today' : days + (days === 1 ? ' day' : ' days');
      next.querySelector('span').textContent = `until ${upcoming[1]}, ${upcoming[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
  }

  // Demand heat by sector, 1 (quiet) to 5 (peak). Editorial judgement from campaign experience, not measured data.
  const heat = {
    retail: { label: 'Retail & fashion', v: [3, 4, 5, 2, 4, 3, 2, 4, 3, 3, 5, 4], tip: 'Build stock and creative for the last ten days of Ramadan, Eid al-Adha, back-to-school and the November cluster.' },
    food: { label: 'Cafés & restaurants', v: [4, 5, 5, 3, 4, 3, 2, 3, 3, 4, 4, 5], tip: 'Ramadan iftar and suhoor, winter evenings outdoors and December gatherings carry the year. Plan summer around delivery and indoor offers.' },
    travel: { label: 'Travel & hospitality', v: [5, 3, 4, 3, 4, 4, 5, 5, 3, 4, 4, 5], tip: 'Two seasons: winter inbound tourism in the north, Khareef in Dhofar in July and August. Eid holidays create short domestic travel spikes.' },
    education: { label: 'Education & training', v: [3, 2, 2, 3, 3, 4, 4, 5, 4, 2, 2, 3], tip: 'Enrolment decisions happen from June to August. Mid-year break in January suits short courses and camps.' },
    property: { label: 'Cars & property', v: [4, 3, 4, 3, 3, 3, 2, 2, 4, 4, 5, 4], tip: 'Big-ticket decisions cluster after summer and around National Day and year-end offers. Summer is for building lists, not closing.' },
    b2b: { label: 'B2B services', v: [5, 3, 3, 4, 3, 3, 2, 2, 5, 5, 4, 2], tip: 'New budgets in January and the September–October restart are when decisions get made. Ramadan and summer slow approvals.' }
  };
  const form = document.getElementById('mc-planner');
  const out = document.getElementById('mc-planner-result');
  if (!form || !out) return;
  const render = () => {
    const sector = heat[form.elements.namedItem('sector').value];
    const ranked = sector.v.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    const top = ranked.filter(([v]) => v === 5).map(([, i]) => i);
    const quiet = ranked.filter(([v]) => v <= 2).map(([, i]) => i).sort((a, b) => a - b);
    out.innerHTML = '<div class="mc-heat" role="img"></div><div class="mc-legend" aria-hidden="true"><span>Quiet</span><span>Peak</span></div><div class="mc-summary"><div><span>Peak months</span><p></p></div><div><span>Quiet months</span><p></p></div></div><p class="fe-small"></p>';
    const grid = out.querySelector('.mc-heat');
    grid.setAttribute('aria-label', `${sector.label} demand by month: ` + sector.v.map((v, i) => `${full[i]} ${v} of 5`).join(', '));
    sector.v.forEach((v, i) => {
      const cell = document.createElement('div');
      cell.className = 'mc-cell' + (v === 5 ? ' is-top' : '');
      cell.style.setProperty('--v', v);
      cell.innerHTML = '<i></i>';
      cell.append(months[i]);
      grid.append(cell);
    });
    const ps = out.querySelectorAll('.mc-summary p');
    ps[0].textContent = top.map(i => full[i]).join(', ');
    ps[1].textContent = quiet.length ? quiet.map(i => full[i]).join(', ') : 'None; demand stays steady.';
    out.querySelector('.fe-small').textContent = sector.tip;
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', event => event.preventDefault());
  render();
})();
