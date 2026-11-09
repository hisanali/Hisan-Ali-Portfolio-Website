(() => {
  'use strict';
  const form = document.getElementById('ig-pick');
  const out = document.getElementById('ig-pick-result');
  if (!form || !out) return;
  const v = k => form.elements.namedItem(k).value;
  const render = () => {
    const type = v('type'), aud = v('aud'), search = v('search'), money = v('money');
    let yt = 0, ig = 0;
    if (search === 'yes') yt += 3; if (money === 'yes') yt += 3; if (aud === 'yt') yt += 2; if (aud === 'ig') ig += 3;
    if (type === 'howto') yt += 2; if (type === 'podcast') ig += 1; if (type === 'event' || type === 'product') ig += 1;
    const lead = yt > ig + 1 ? 'yt' : ig > yt + 1 ? 'ig' : 'both';
    const head = lead === 'yt' ? 'YouTube first' : lead === 'ig' ? 'Instagram first' : 'Both, from one recording';
    const tips = [];
    if (lead !== 'ig') tips.push('Publish the full video on YouTube with a searchable title and chapters.');
    if (lead !== 'yt') tips.push('Post the strongest minute as a Reel; add the full video as a Feature when it reaches your account.');
    tips.push('Film horizontally in good quality so one recording works on both platforms.');
    if (money === 'yes') tips.push('Only YouTube shares ad revenue on long videos today; Instagram Features does not yet.');
    if (type === 'podcast') tips.push('Cut three to five Shorts and Reels from each episode, each with one clear idea.');
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.firstChild; box.classList.add(lead === 'both' ? 'mid' : 'hi');
    box.querySelector('.big').textContent = lead === 'yt' ? 'YouTube' : lead === 'ig' ? 'Instagram' : 'Both';
    box.querySelector('strong').textContent = head;
    box.querySelector('p').textContent = lead === 'ig' ? 'Your audience is on Instagram and the topic is not search-driven.' : lead === 'yt' ? 'Search, earnings or your audience point to YouTube.' : 'Use YouTube for discovery by search and Instagram for your followers.';
    const ul = box.querySelector('ul'); tips.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
  };
  form.addEventListener('input', render);
  render();
})();
