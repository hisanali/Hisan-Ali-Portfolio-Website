(() => {
  'use strict';
  const form = document.getElementById('te-score');
  const out = document.getElementById('te-score-result');
  if (!form || !out) return;
  const ITEMS = { dish: [18, "Create one signature dish or moment that people want to film."], tag: [16, "Claim your TikTok location and ask guests to tag it, not just your account."], account: [12, "Post at least weekly: the dish, the kitchen, the people."], creators: [16, "Invite two or three local food creators a month; do not script health claims."], reply: [12, "Reply to comments on your videos and on customer videos."], book: [14, "Add online or WhatsApp booking so discovery can turn into a table."], info: [12, "Keep hours, menu and prices current on Google and TikTok."] };
  const render = () => {
    let s = 0; const miss = [];
    for (const [k, [w, fix]] of Object.entries(ITEMS)) { if (form.elements.namedItem(k).checked) s += w; else miss.push([w, fix]); }
    const cls = s >= 75 ? 'hi' : s >= 45 ? 'mid' : 'lo';
    out.innerHTML = '<div class="ed-result"><span class="big"></span><div><strong></strong><p></p><ul></ul></div></div>';
    const box = out.firstChild; box.classList.add(cls);
    box.querySelector('.big').textContent = s + '/100';
    box.querySelector('strong').textContent = cls === 'hi' ? 'Easy for a post-built guide to find' : cls === 'mid' ? 'Visible, with gaps' : 'A guide built from posts would barely see you';
    box.querySelector('p').textContent = miss.length ? 'Fix these first:' : 'Nothing missing. Keep it up and review monthly.';
    const ul = box.querySelector('ul'); miss.sort((a, b) => b[0] - a[0]).slice(0, 3).forEach(([, f]) => { const li = document.createElement('li'); li.textContent = f; ul.append(li); }); if (!ul.children.length) ul.remove();
  };
  form.addEventListener('change', render);
  render();
})();
