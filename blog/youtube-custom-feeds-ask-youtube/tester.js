(() => {
  'use strict';
  const form = document.getElementById('yt-test');
  const out = document.getElementById('yt-test-result');
  if (!form || !out) return;
  const FORMAT = /\b(documentary|tutorial|guide|review|walkthrough|tour|interview|podcast|episode \d|vlog|explainer|lesson|course|unboxing|comparison|recipe|workout|routine|slow tv|live|q&a|case study|masterclass|breakdown|how to|how-to)\b/i;
  const DEPTH = /\b(full|complete|in[- ]depth|beginner|beginner’s|beginner's|advanced|\d+\s?(min|mins|minutes|hours?|hr)|part \d|step[- ]by[- ]step|ultimate|everything)\b/i;
  const BAIT = /(you won’t believe|you won't believe|the truth about|gone wrong|\(not clickbait\)|\bshocking\b|!!|\?\?|#\d\b|must see|insane)/i;
  const score = t => {
    const words = t.trim().split(/\s+/).filter(Boolean);
    const hasTopic = words.length >= 4 && !/^(episode|part|vlog|day)\s*\d+$/i.test(t.trim()) && !/^we tried it$/i.test(t.trim());
    const checks = [[hasTopic, 'clear topic'], [FORMAT.test(t), 'format word'], [DEPTH.test(t), 'length or depth cue'], [!BAIT.test(t), 'no bait phrasing']];
    const pts = checks.filter(c => c[0]).length;
    return { pts, missing: checks.filter(c => !c[0]).map(c => c[1]) };
  };
  const render = () => {
    const titles = form.elements.namedItem('titles').value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 10);
    if (!titles.length) { out.innerHTML = '<p class="fe-error">Paste at least one title.</p>'; return; }
    const rows = titles.map(t => [t, score(t)]);
    const avg = rows.reduce((s, r) => s + r[1].pts, 0) / rows.length;
    out.innerHTML = '<div class="fe-out"><div><span>Average</span><strong></strong><p>out of 4 cues per title.</p></div><div><span>Requestable now</span><strong></strong><p>Titles scoring 3 or 4.</p></div><div><span>Fix first</span><strong></strong><p>The most common missing cue.</p></div></div><div class="yt-rows"></div>';
    const s = out.querySelectorAll('.fe-out strong');
    s[0].textContent = avg.toFixed(1); s[1].textContent = `${rows.filter(r => r[1].pts >= 3).length} / ${rows.length}`;
    const miss = {}; rows.forEach(r => r[1].missing.forEach(m => { miss[m] = (miss[m] || 0) + 1; }));
    const top = Object.entries(miss).sort((a, b) => b[1] - a[1])[0]; s[2].textContent = top ? top[0] : 'Nothing';
    const list = out.querySelector('.yt-rows');
    rows.forEach(([t, r]) => { const d = document.createElement('div'); d.className = 'yt-row'; d.innerHTML = '<b></b><span class="yt-score"></span><small></small>'; d.querySelector('b').textContent = t; const sc = d.querySelector('.yt-score'); sc.textContent = r.pts + '/4'; sc.classList.add(r.pts >= 3 ? 's-hi' : r.pts === 2 ? 's-mid' : 's-lo'); d.querySelector('small').textContent = r.missing.length ? 'Missing: ' + r.missing.join(', ') : 'Describes itself well.'; list.append(d); });
  };
  form.addEventListener('input', render);
  form.addEventListener('submit', e => e.preventDefault());
  render();
})();
