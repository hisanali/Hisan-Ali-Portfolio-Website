(() => {
  'use strict';
  document.querySelectorAll('.cx-copy').forEach(button => {
    button.addEventListener('click', async () => {
      const code = button.closest('.cx-prompt').querySelector('code').textContent;
      try { await navigator.clipboard.writeText(code); button.textContent = 'Copied'; }
      catch (e) { button.textContent = 'Select & copy'; }
      setTimeout(() => { button.textContent = 'Copy'; }, 1800);
    });
  });

  const form = document.getElementById('cx-picker-form');
  const out = document.getElementById('cx-picker-result');
  if (!form || !out) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    const pick = name => (form.querySelector(`input[name="${name}"]:checked`) || {}).value;
    let claude = 0, codex = 0;
    const sub = pick('sub');
    if (sub === 'claude') claude += 3; else if (sub === 'chatgpt') codex += 3;
    if (pick('task') === 'long') claude += 2; else codex += 2;
    if (pick('place') === 'terminal') claude += 1; else codex += 1;
    if (pick('write') === 'lots') claude += 1; else codex += 1;
    let title, text;
    if (Math.abs(claude - codex) <= 1) {
      title = 'Try both for a week each';
      text = 'Your answers are balanced. Use the entry plan on one side for a week, then the other, on the same real task. Keep the one you reach for without thinking.';
    } else if (claude > codex) {
      title = 'Start with Claude Code';
      text = 'Your work leans towards long, judgement-heavy tasks and writing. Start in plan mode, keep a short CLAUDE.md, and use Codex later as a second-opinion reviewer.';
    } else {
      title = 'Start with Codex';
      text = 'Your work leans towards many small, well-defined tasks you can hand off. Split your backlog into cloud tasks, review each diff, and keep an AGENTS.md with your build and test commands.';
    }
    out.innerHTML = '';
    const strong = document.createElement('strong'); strong.textContent = title;
    const p = document.createElement('p'); p.textContent = text;
    out.append(strong, p);
  });
})();
