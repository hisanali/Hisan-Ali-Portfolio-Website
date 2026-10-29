(() => {
  'use strict';
  const form = document.getElementById('pn-check');
  const out = document.getElementById('pn-check-result');
  if (!form || !out) return;
  const v = k => form.elements.namedItem(k).value;
  const render = () => {
    const ratio = v('ratio'), shot = v('shot'), visible = v('visible'), text = Math.min(100, Math.max(0, Number(v('text')) || 0)), title = v('title').trim(), feed = v('feed') === 'yes';
    const flags = []; let score = 0;
    if (ratio === '23') { score += 20; flags.push(['ok', '2:3 vertical: Pinterest’s recommended ratio, no cropping in the feed or close-up.']); } else if (ratio === '45' || ratio === '11') { score += 12; flags.push(['warn', 'Allowed, but 2:3 fills more of the screen and crops less in close-ups.']); } else { flags.push(['bad', '16:9 horizontal gets cropped and loses the product. Rebuild vertical.']); }
    if (shot === 'lifestyle') { score += 22; flags.push(['ok', 'Lifestyle shot: visual search matches products inside real scenes.']); } else if (shot === 'product') { score += 16; flags.push(['ok', 'Clean product shot: easy to match; pair it with a lifestyle Pin.']); } else if (shot === 'collage') { score += 6; flags.push(['warn', 'Collages split attention; visual search may match the wrong item.']); } else { flags.push(['bad', 'Graphic or text-led images have nothing for visual search to match.']); }
    if (visible === 'big') { score += 18; flags.push(['ok', 'The product dominates the frame.']); } else if (visible === 'mid') { score += 10; flags.push(['warn', 'Make the product larger or closer; small objects match poorly.']); } else { flags.push(['bad', 'A small or hidden product will not be recognised. Reshoot.']); }
    if (text <= 15) { score += 14; flags.push(['ok', `${text}% text: the image stays legible and matchable.`]); } else if (text <= 30) { score += 7; flags.push(['warn', `${text}% text overlay hides part of the product; keep it under 15%.`]); } else { flags.push(['bad', `${text}% text turns the Pin into a graphic. Remove most of it.`]); }
    const words = title.split(/\s+/).filter(Boolean).length;
    if (words >= 4 && words <= 12 && /[a-z]/i.test(title)) { score += 12; flags.push(['ok', 'Descriptive title: says what the item is.']); } else if (words) { score += 5; flags.push(['warn', 'Title should name the product, material or colour in 4–12 words.']); } else { flags.push(['bad', 'Add a title that names the product.']); }
    if (feed) { score += 14; flags.push(['ok', 'In the catalogue with price and stock: eligible for product formats.']); } else { flags.push(['bad', 'Visual Search Ads are a product format; add the item to your catalogue feed.']); }
    const level = score >= 85 ? 'Ready for visual search' : score >= 60 ? 'Nearly there' : score >= 35 ? 'Needs work' : 'Not ready';
    out.innerHTML = '<div class="pn-out"><div class="pn-ring" aria-hidden="true"><span></span></div><div><strong></strong><div class="pn-flags"></div></div></div>';
    out.querySelector('.pn-ring').style.setProperty('--p', score); out.querySelector('.pn-ring span').textContent = score;
    out.querySelector('strong').textContent = `${level}: ${score} / 100`;
    const list = out.querySelector('.pn-flags');
    flags.forEach(([k, t]) => { const d = document.createElement('div'); d.className = 'pn-flag ' + k; d.innerHTML = '<i aria-hidden="true"></i><span></span>'; d.querySelector('i').textContent = k === 'ok' ? '✓' : k === 'warn' ? '!' : '✕'; d.querySelector('span').textContent = t; list.append(d); });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
