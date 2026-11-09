(() => {
  'use strict';
  const form = document.getElementById('mt-check');
  const out = document.getElementById('mt-check-result');
  if (!form || !out) return;
  const v = k => form.elements.namedItem(k).value;
  const render = () => {
    const geo = v('geo'), link = v('link'), copy = v('copy');
    const inList = geo !== 'no', tiktok = link === 'tt' || copy === 'yes';
    const level = inList && link === 'tt' ? 'lo' : inList && tiktok ? 'mid' : tiktok ? 'mid' : 'hi';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.querySelector('.ed-result'); box.classList.add(level);
    box.querySelector('.big').textContent = level === 'lo' ? 'High' : level === 'mid' ? 'Some' : 'Low';
    box.querySelector('strong').textContent = level === 'lo' ? 'High risk of rejection' : level === 'mid' ? 'Some risk' : 'Low risk';
    box.querySelector('p').textContent = level === 'lo' ? 'This ad targets a listed country and sends people to TikTok, which is what the block reportedly covers.' : inList ? 'TikTok branding in an ad for a listed country could draw a rejection while Meta’s criteria are unclear.' : tiktok ? 'Your countries are not on the list, but rules can widen. Keep TikTok links out of paid ads where you can.' : 'Nothing in this campaign touches the reported block.';
    const tips = [];
    if (link === 'tt') tips.push('Send people to your website, Instagram profile or WhatsApp instead of TikTok.');
    if (copy === 'yes') tips.push('Remove TikTok watermarks and handles; upload the original video file.');
    if (geo === 'egypt') tips.push('Put Egypt in its own ad set so a rejection doesn’t pause your GCC delivery.');
    if (!tips.length) tips.push('Keep landing pages on channels you own.');
    const ul = box.querySelector('ul'); tips.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
  };
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
