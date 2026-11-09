(() => {
  'use strict';
  const form = document.getElementById('cv-map');
  const out = document.getElementById('cv-map-result');
  if (!form || !out) return;
  const MAP = {
    events: [['A wedding invitation with gold arabesque borders', 'Printed invitations delivered in a week, or a florist for the day'], ['A birthday card for my mum with roses', 'Same-day flowers or a printed card'], ['A balloon arch idea for a baby shower', 'Party decor packages with setup']],
    home: [['My living room in a modern Omani style', 'A sofa or rug that matches the generated look'], ['A kids’ bedroom with a jungle theme', 'Wallpaper, bedding or a fit-out service'], ['A majlis layout for a small room', 'Majlis seating made to measure']],
    fashion: [['An Eid outfit idea in pastel colours', 'The closest real piece from your collection'], ['A bridal henna design', 'A henna artist booking or bridal package'], ['A minimalist abaya sketch', 'Made-to-order abayas with fabric choices']],
    food: [['A menu design for a new café', 'Menu printing or a POS and ordering setup'], ['A cake for a graduation party', 'Custom cakes with delivery'], ['A food truck logo', 'Branding and wrap services']],
    b2b: [['A logo for my cleaning company', 'Branding packages or business cards'], ['A social media post for our sale', 'Design subscriptions or print and signage'], ['A trade show booth concept', 'Booth build and printing']],
    travel: [['A desert camp at sunset', 'A camp night with transfers'], ['A family itinerary poster for Salalah', 'Khareef or winter packages'], ['A beach wedding setup', 'Venue and event packages']]
  };
  const render = () => {
    const cat = form.elements.namedItem('cat').value, mkt = form.elements.namedItem('mkt').value;
    out.innerHTML = '<div class="cv-out-list"></div><div class="ed-result"><span class="big"></span><div><strong></strong><p></p></div></div>';
    const list = out.querySelector('.cv-out-list');
    MAP[cat].forEach(([q, ad]) => { const d = document.createElement('div'); d.className = 'cv-item'; d.innerHTML = '<q></q><span></span>'; d.querySelector('q').textContent = q; d.querySelector('span').textContent = 'Ad idea: ' + ad + '.'; list.append(d); });
    const box = out.querySelector('.ed-result'); box.classList.add(mkt === 'us' ? 'hi' : 'mid');
    box.querySelector('.big').textContent = mkt === 'us' ? 'Test' : 'Prepare';
    box.querySelector('strong').textContent = mkt === 'us' ? 'Ask OpenAI or your agency about joining the test' : 'Not available in your market yet';
    box.querySelector('p').textContent = mkt === 'us' ? 'Start with the request types above, real product photography and a clear next step.' : 'Build a library of real product photos that match these request types, so you can launch quickly when the format arrives.';
  };
  form.addEventListener('input', render);
  render();
})();
