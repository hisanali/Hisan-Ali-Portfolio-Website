(function () {
  'use strict';
  const { $, icon, esc, copy, segmented, steps } = window.TK;

  // [key, label, placeholder, kind, required]
  const TYPES = {
    LocalBusiness: [['name', 'Business name', 'Example Clinic', 'text', 1], ['subtype', 'Business type', '', 'select:LocalBusiness|Local business (general),Dentist|Dental clinic,MedicalClinic|Medical clinic,Restaurant|Restaurant,RealEstateAgent|Real estate agent,Store|Shop / store,ProfessionalService|Professional service,BeautySalon|Beauty salon,AutoRepair|Car repair', 0], ['url', 'Website', 'https://example.com', 'url', 1], ['telephone', 'Phone', '+968 2400 0000', 'tel', 1], ['street', 'Street address', 'Al Khuwair, Way 3013', 'text', 1], ['city', 'City', 'Muscat', 'text', 1], ['country', 'Country code', 'OM', 'text', 1], ['lat', 'Latitude', '23.5880', 'text', 0], ['lng', 'Longitude', '58.3829', 'text', 0], ['hours', 'Opening hours', 'Su-Th 09:00-18:00', 'text', 0], ['image', 'Logo or photo URL', 'https://example.com/logo.png', 'url', 0], ['priceRange', 'Price range', '$$', 'text', 0]],
    Organization: [['name', 'Organisation name', 'Example LLC', 'text', 1], ['url', 'Website', 'https://example.com', 'url', 1], ['logo', 'Logo URL', 'https://example.com/logo.png', 'url', 1], ['telephone', 'Phone', '+968 …', 'tel', 0], ['email', 'Email', 'hello@example.com', 'email', 0], ['sameAs', 'Social profiles (one per line)', 'https://www.linkedin.com/company/…', 'textarea', 0]],
    Product: [['name', 'Product name', 'Wireless earbuds', 'text', 1], ['image', 'Image URL', 'https://example.com/earbuds.jpg', 'url', 1], ['description', 'Description', '', 'textarea', 0], ['brand', 'Brand', 'Example', 'text', 0], ['sku', 'SKU', 'EB-200', 'text', 0], ['price', 'Price', '25.000', 'text', 1], ['currency', 'Currency', 'OMR', 'text', 1], ['availability', 'Availability', '', 'select:InStock|In stock,OutOfStock|Out of stock,PreOrder|Pre-order', 0], ['rating', 'Average rating (1–5)', '4.6', 'text', 0], ['reviews', 'Number of reviews', '38', 'text', 0]],
    Article: [['headline', 'Headline', 'How to choose a digital marketing agency', 'text', 1], ['image', 'Featured image URL', 'https://example.com/cover.jpg', 'url', 1], ['author', 'Author name', 'Hisan Ali', 'text', 1], ['authorUrl', 'Author profile URL', 'https://example.com/about/', 'url', 0], ['publisher', 'Publisher / site name', 'Example', 'text', 0], ['published', 'Date published', '', 'date', 1], ['modified', 'Date updated', '', 'date', 0]],
    FAQPage: []
  };
  const el = { fields: $('#scFields'), faq: $('#scFaq'), faqList: $('#scFaqList'), addQ: $('#scAddQ'), code: $('#scCode'), copyBtn: $('#scCopy'), status: $('#scStatus'), test: $('#scTest'), example: $('#scExample') };
  const tracker = steps($('#tkSteps'));
  const values = {};
  let faqs = [{ q: '', a: '' }];
  const type = segmented($('#scType'), () => { build(); out(); });

  function build() {
    const t = type.value;
    values[t] = values[t] || {};
    el.faq.hidden = t !== 'FAQPage';
    el.fields.hidden = t === 'FAQPage';
    el.fields.innerHTML = TYPES[t].map(([k, label, ph, kind, req]) => {
      const v = values[t][k] ?? '';
      const lab = `<label class="tk-label" for="sc-${k}">${label}${req ? '<span class="tk-req">Required</span>' : '<span class="tk-val">optional</span>'}</label>`;
      if (kind === 'textarea') return `<div class="tk-field sc-wide">${lab}<textarea class="tk-textarea" id="sc-${k}" data-k="${k}" placeholder="${esc(ph)}" style="min-height:84px">${esc(v)}</textarea></div>`;
      if (kind.startsWith('select:')) return `<div class="tk-field">${lab}<select class="tk-select" id="sc-${k}" data-k="${k}">${kind.slice(7).split(',').map((o) => { const [val, txt] = o.split('|'); return `<option value="${val}" ${val === v ? 'selected' : ''}>${txt}</option>`; }).join('')}</select></div>`;
      return `<div class="tk-field">${lab}<input class="tk-input" id="sc-${k}" data-k="${k}" type="${kind}" placeholder="${esc(ph)}" value="${esc(v)}" autocomplete="off"></div>`;
    }).join('');
    renderFaq();
  }

  function renderFaq() {
    el.faqList.innerHTML = faqs.map((f, i) => `<li class="sc-q" data-i="${i}"><div class="tk-field"><label class="tk-label" for="scq${i}">Question ${i + 1}<button class="tk-iconbtn is-danger" type="button" data-del="${i}" aria-label="Remove question ${i + 1}" ${faqs.length === 1 ? 'disabled' : ''}>${icon('x')}</button></label><input class="tk-input" id="scq${i}" data-q="${i}" value="${esc(f.q)}" placeholder="Do you offer free consultations?"></div><div class="tk-field" style="margin-top:10px"><label class="tk-label" for="sca${i}">Answer</label><textarea class="tk-textarea" id="sca${i}" data-a="${i}" placeholder="Yes — book a free 20-minute call…" style="min-height:76px">${esc(f.a)}</textarea></div></li>`).join('');
  }

  const clean = (o) => { Object.keys(o).forEach((k) => { if (o[k] === '' || o[k] === undefined || (typeof o[k] === 'object' && o[k] && !Array.isArray(o[k]) && !Object.keys(clean(o[k])).some((x) => x !== '@type'))) delete o[k]; }); return o; };

  function data() {
    const t = type.value;
    const v = values[t] || {};
    const missing = TYPES[t].filter((f) => f[4] && !String(v[f[0]] || '').trim()).map((f) => f[1]);
    let o;
    if (t === 'LocalBusiness') {
      o = { '@context': 'https://schema.org', '@type': v.subtype || 'LocalBusiness', name: v.name, url: v.url, telephone: v.telephone, image: v.image, priceRange: v.priceRange,
        address: { '@type': 'PostalAddress', streetAddress: v.street, addressLocality: v.city, addressCountry: v.country },
        geo: v.lat && v.lng ? { '@type': 'GeoCoordinates', latitude: Number(v.lat), longitude: Number(v.lng) } : '', openingHours: v.hours };
    } else if (t === 'Organization') {
      o = { '@context': 'https://schema.org', '@type': 'Organization', name: v.name, url: v.url, logo: v.logo, telephone: v.telephone, email: v.email, sameAs: (v.sameAs || '').split(/\s+/).filter(Boolean) };
      if (!o.sameAs.length) delete o.sameAs;
    } else if (t === 'Product') {
      o = { '@context': 'https://schema.org', '@type': 'Product', name: v.name, image: v.image, description: v.description, sku: v.sku, brand: v.brand ? { '@type': 'Brand', name: v.brand } : '',
        offers: { '@type': 'Offer', price: v.price, priceCurrency: v.currency, availability: `https://schema.org/${v.availability || 'InStock'}` },
        aggregateRating: v.rating && v.reviews ? { '@type': 'AggregateRating', ratingValue: v.rating, reviewCount: v.reviews } : '' };
    } else if (t === 'Article') {
      o = { '@context': 'https://schema.org', '@type': 'Article', headline: v.headline, image: v.image, author: v.author ? { '@type': 'Person', name: v.author, url: v.authorUrl } : '', publisher: v.publisher ? { '@type': 'Organization', name: v.publisher } : '', datePublished: v.published, dateModified: v.modified };
    } else {
      const filled = faqs.filter((f) => f.q.trim() && f.a.trim());
      o = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: filled.map((f) => ({ '@type': 'Question', name: f.q.trim(), acceptedAnswer: { '@type': 'Answer', text: f.a.trim() } })) };
      if (!filled.length) missing.push('at least one question and answer');
    }
    return { json: clean(o), missing };
  }

  function out() {
    const { json, missing } = data();
    el.code.textContent = `<script type="application/ld+json">\n${JSON.stringify(json, null, 2)}\n</script>`;
    const ok = !missing.length;
    el.status.className = `tk-note ${ok ? 'is-ok' : 'is-warn'}`;
    el.status.innerHTML = `${icon(ok ? 'checkc' : 'alert')}<span>${ok ? 'All required fields are filled. Paste this into your page’s &lt;head&gt;, then test it.' : `Still needed: ${esc(missing.join(', '))}.`}</span>`;
    el.copyBtn.disabled = false;
    const anyValue = Object.values(values[type.value] || {}).some((x) => String(x).trim()) || faqs.some((f) => f.q || f.a);
    tracker.set(!anyValue ? 1 : ok ? 3 : 2);
  }

  el.fields.addEventListener('input', (e) => { const k = e.target.dataset.k; if (k) { values[type.value][k] = e.target.value; out(); } });
  el.fields.addEventListener('change', (e) => { const k = e.target.dataset.k; if (k) { values[type.value][k] = e.target.value; out(); } });
  el.faqList.addEventListener('input', (e) => { const q = e.target.dataset.q; const a = e.target.dataset.a; if (q !== undefined) faqs[q].q = e.target.value; if (a !== undefined) faqs[a].a = e.target.value; out(); });
  el.faqList.addEventListener('click', (e) => { const b = e.target.closest('[data-del]'); if (b) { faqs.splice(Number(b.dataset.del), 1); renderFaq(); out(); } });
  el.addQ.addEventListener('click', () => { faqs.push({ q: '', a: '' }); renderFaq(); out(); el.faqList.querySelector(`[data-q="${faqs.length - 1}"]`).focus(); });
  el.copyBtn.addEventListener('click', () => copy(el.code.textContent, 'Schema copied'));
  el.example.addEventListener('click', () => {
    const t = type.value;
    const ex = {
      LocalBusiness: { name: 'Al Noor Dental Clinic', subtype: 'Dentist', url: 'https://example.com', telephone: '+968 2400 0000', street: 'Way 3013, Al Khuwair', city: 'Muscat', country: 'OM', lat: '23.5880', lng: '58.3829', hours: 'Sa-Th 09:00-21:00', priceRange: '$$' },
      Organization: { name: 'Example LLC', url: 'https://example.com', logo: 'https://example.com/logo.png', email: 'hello@example.com', sameAs: 'https://www.linkedin.com/company/example\nhttps://www.instagram.com/example' },
      Product: { name: 'Wireless Earbuds Pro', image: 'https://example.com/earbuds.jpg', brand: 'Example', sku: 'EB-200', price: '25.000', currency: 'OMR', availability: 'InStock', rating: '4.6', reviews: '38' },
      Article: { headline: 'How to choose a digital marketing agency in Oman', image: 'https://example.com/cover.jpg', author: 'Hisan Ali', publisher: 'Example', published: new Date().toISOString().slice(0, 10) }
    };
    if (t === 'FAQPage') faqs = [{ q: 'Do you offer free consultations?', a: 'Yes. Book a free 20-minute call to discuss your goals.' }, { q: 'Which areas do you serve?', a: 'We work with businesses across Oman and the GCC.' }];
    else values[t] = { ...ex[t] };
    build();
    out();
  });
  el.test.addEventListener('click', () => { copy(el.code.textContent, 'Schema copied — paste it into the “Code” tab'); window.open('https://search.google.com/test/rich-results', '_blank', 'noopener'); });
  build();
  out();
})();
