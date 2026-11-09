/*
 * Miso — a small ginger cat who lives along the bottom of the screen on desktop.
 * Purely decorative: it walks, sits, grooms, stretches, yawns and naps on its own,
 * follows the cursor with its eyes, chases the pointer along the bottom edge,
 * purrs when petted (hover), meows when clicked and leaves when double-clicked.
 * Self-contained: injects its own markup and styles. Loaded by site-shell.js.
 */
(() => {
  'use strict';
  if (window.__siteCat) return;
  window.__siteCat = true;

  const desktop = matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const STORE = 'site-cat-v1';
  const read = () => { try { return JSON.parse(sessionStorage.getItem(STORE)) || {}; } catch { return {}; } };
  const save = (data) => { try { sessionStorage.setItem(STORE, JSON.stringify(data)); } catch {} };
  if (read().away) return;

  const W = 104; // rendered cat width in px
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  /* ---------- markup ---------- */
  const head = (extra = '') => `
    <g class="sc-head" ${extra}><g class="sc-attention">
      <path class="sc-fur" d="M-14 -3 C -14.5 -10, -13 -18, -11.5 -24 C -7 -20, -3.5 -16.5, -0.5 -13.5 Z"/>
      <path class="sc-fur" d="M2.5 -14 C 6 -17, 10 -20.5, 14.5 -23 C 15.8 -16, 16.2 -9, 15.5 -3 Z"/>
      <path class="sc-ear-in" d="M-11 -7.5 C -11 -12, -10.4 -16, -9.8 -19.5 C -7.6 -17, -5.6 -15, -4 -12.8 Z"/>
      <path class="sc-ear-in" d="M5.5 -13 C 8 -15, 10.4 -16.8 13 -18.4 C 13.6 -14.5, 13.6 -10.5, 13.2 -7 Z"/>
      <path class="sc-tuft" d="M-9.6 -9.5 l-.6 -5.5 M-7.8 -10.8 l.2 -4.6 M-6 -11.4 l.8 -3.4 M7.4 -12.6 l2 -3.4 M9.6 -11.4 l1.4 -4.4 M11.6 -9.8 l.6 -4.6"/>
      <path class="sc-fur" d="M-15.5 1 C -16.5 -9, -8 -14.8, 1 -14.8 C 10 -14.8, 18 -9, 17.5 1 C 17.3 5.5, 15 9.5, 11 12 C 7 14.2, -3 14.2, -7.5 12 C -11.6 10, -15.3 6, -15.5 1 Z"/>
      <path class="sc-fur" d="M-15.3 2 l-4 1.6 l3.6 1.2 l-3 2 l4.2 .2 Z M17.2 2 l4 1.4 l-3.6 1.3 l3 2 l-4.2 .3 Z"/>
      <path class="sc-stripe sc-soft" d="M-3.2 -14 c -.4 2, -.2 4, .3 6 M1 -14.6 v6.4 M5.2 -14 c .4 2, .2 4, -.3 6 M-12.5 -3 l4 1.5 M14.5 -3 l-4 1.5"/>
      <path class="sc-shade-eye" d="M-9.2 -4.6 q4.2 -2.6 8.4 0 M4.3 -4.6 q4.2 -2.6 8.4 0"/>
      <g class="sc-eyes">
        <g class="sc-eye"><path class="sc-iris" d="M-9 -1 C -8 -5, -2 -5, -1 -1 C -2 3, -8 3, -9 -1 Z"/><ellipse class="sc-pupil" cx="-5" cy="-1" rx="1" ry="3"/><circle class="sc-glint" cx="-3.7" cy="-2.6" r=".9"/><circle class="sc-glint" cx="-6.2" cy=".9" r=".35"/></g>
        <g class="sc-eye"><path class="sc-iris" d="M4.5 -1 C 5.5 -5, 11.5 -5, 12.5 -1 C 11.5 3, 5.5 3, 4.5 -1 Z"/><ellipse class="sc-pupil" cx="8.5" cy="-1" rx="1" ry="3"/><circle class="sc-glint" cx="9.8" cy="-2.6" r=".9"/><circle class="sc-glint" cx="7.3" cy=".9" r=".35"/></g>
      </g>
      <path class="sc-closed" d="M-8.8 -.4 q3.8 2.8 7.6 0 M4.7 -.4 q3.8 2.8 7.6 0"/>
      <ellipse class="sc-muzzle" cx="2.2" cy="7.2" rx="4.4" ry="3.4"/>
      <ellipse class="sc-muzzle" cx="6.8" cy="7.2" rx="4.4" ry="3.4"/>
      <ellipse class="sc-muzzle" cx="4.5" cy="10.6" rx="3" ry="1.8"/>
      <path class="sc-whisker-dots" d="M1 6.6 h.01 M2.4 8 h.01 M0.6 9 h.01 M8 6.6 h.01 M6.6 8 h.01 M8.4 9 h.01"/>
      <path class="sc-nose" d="M2.3 3.6 C 3.5 3.1, 5.5 3.1, 6.7 3.6 C 6.4 4.8, 5.3 5.8, 4.5 6.1 C 3.7 5.8, 2.6 4.8, 2.3 3.6 Z"/>
      <path class="sc-line" d="M4.5 6.1 v.9 M4.5 7 q-1.6 2.2 -3.6 1 M4.5 7 q1.6 2.2 3.6 1"/>
      <ellipse class="sc-mouth" cx="4.5" cy="9.4" rx="2.6" ry="3.4"/>
      <path class="sc-whisker" d="M0 7 Q -10 4.5 -22 4.6 M0 8.4 Q -10 8.6 -21 11 M.4 9.6 Q -8 11.6 -17 15 M9 7 Q 19 4.5 29 4 M9 8.4 Q 19 8.6 28 11 M8.6 9.6 Q 16 11.6 24 15"/>
    </g></g>`;

  const svg = `
  <svg class="sc-svg" viewBox="0 0 124 86" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="scg-fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6b878"/><stop offset=".45" stop-color="#e5934f"/><stop offset="1" stop-color="#b9672c"/></linearGradient>
      <linearGradient id="scg-fur-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c77a3c"/><stop offset="1" stop-color="#8a4a1f"/></linearGradient>
      <radialGradient id="scg-head" cx=".42" cy=".32" r=".75"><stop offset="0" stop-color="#f9c389"/><stop offset=".55" stop-color="#e8975a"/><stop offset="1" stop-color="#bf6d31"/></radialGradient>
      <linearGradient id="scg-belly" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6ea"/><stop offset="1" stop-color="#e9c49c"/></linearGradient>
      <radialGradient id="scg-ear" cx=".5" cy=".75" r=".8"><stop offset="0" stop-color="#f6b9b0"/><stop offset="1" stop-color="#c97d72"/></radialGradient>
      <radialGradient id="scg-iris" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#f1f5a0"/><stop offset=".55" stop-color="#b8cf4e"/><stop offset="1" stop-color="#6b8424"/></radialGradient>
      <linearGradient id="scg-nose" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3a0a6"/><stop offset="1" stop-color="#c8606c"/></linearGradient>
      <linearGradient id="scg-tail" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#e18d4b"/><stop offset="1" stop-color="#c36f33"/></linearGradient>
      <filter id="scf-fur" x="-8%" y="-12%" width="116%" height="124%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" seed="4" result="edge"/>
        <feDisplacementMap in="SourceGraphic" in2="edge" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="fuzzy"/>
        <feTurbulence type="fractalNoise" baseFrequency=".13 .75" numOctaves="2" seed="11" result="grain"/>
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 .18  0 0 0 0 .07  0 0 0 0 0  0 0 0 -1.1 .62" result="dark"/>
        <feComposite in="dark" in2="fuzzy" operator="in" result="darkIn"/>
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 1  0 0 0 0 .93  0 0 0 0 .8  0 0 0 1.3 -.8" result="light"/>
        <feComposite in="light" in2="fuzzy" operator="in" result="lightIn"/>
        <feMerge><feMergeNode in="fuzzy"/><feMergeNode in="darkIn"/><feMergeNode in="lightIn"/></feMerge>
      </filter>
      <filter id="scf-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".55"/></filter>
    </defs>

    <g class="sc-pose sc-stand" filter="url(#scf-fur)">
      <g class="sc-tail"><path class="sc-tail-path" d="M32 47 C 16 46, 9 32, 15 16 C 16.5 12.5, 19 11.5, 20.5 13"/><path class="sc-tail-ring" d="M32 47 C 16 46, 9 32, 15 16 C 16.5 12.5, 19 11.5, 20.5 13"/></g>
      <g class="sc-leg sc-l1"><path class="sc-fur-dark" d="M34 51 C 31 59, 37 64, 36.5 70 L 36 79.5 C 37.5 82.4, 42 82.6, 44 80.5 L 43.6 70 C 46.5 63, 47 57, 45 51 Z"/></g>
      <g class="sc-leg sc-l2"><path class="sc-fur-dark" d="M71 52 C 71.5 62, 72 72, 72 80 C 73.6 82.4, 77.6 82.4, 79.6 80.6 C 79.5 72, 80 62, 80.5 52 Z"/></g>
      <g class="sc-torso">
        <path class="sc-fur" d="M27 48 C 26 38, 38 34.5, 52 35 C 66 35.5, 80 34, 87 41 C 92 46, 89 57, 82 61 C 72 66, 56 65, 44 64 C 33 63, 27.5 56, 27 48 Z"/>
        <ellipse class="sc-fur" cx="39" cy="52" rx="12.5" ry="12"/>
        <path class="sc-belly" d="M48 61 C 56 65.5, 70 66, 80 61 C 76 58, 58 58, 48 61 Z"/>
        <path class="sc-stripe sc-soft" d="M46 36.5 c 2.6 5, 2 9, -.6 13 M55.5 35.6 c 2.6 5, 2.2 9, -.4 13 M64.5 35.8 c 2.2 4.6, 1.8 8, -.4 11.5 M73 36.8 c 1.6 3.6, 1.2 6.4, -.6 9 M36.5 41 c 2.4 4, 2 8, -.4 11 M31 47 c 1.6 3, 1.2 6, -.4 8"/>
        <path class="sc-shade" d="M30 56 C 38 64, 60 66, 84 59"/>
      </g>
      <g class="sc-leg sc-l3"><path class="sc-fur" d="M39 51 C 36 59, 42 64, 41.6 70 L 41.2 79.6 C 42.6 82.8, 49.4 82.8, 51 80.4 L 49.4 70 C 52.6 63, 53 57, 51 51 Z"/><ellipse class="sc-paw" cx="46.2" cy="81.2" rx="5.4" ry="2"/></g>
      <g class="sc-leg sc-l4"><path class="sc-fur" d="M77 53 C 77.5 62, 78 72, 78 80 C 79.6 82.8, 85.4 82.8, 87.4 80.6 C 87.2 72, 87.8 62, 88 53 Z"/><ellipse class="sc-paw" cx="82.6" cy="81.2" rx="5.2" ry="2"/></g>
      <g transform="translate(93 33)">${head()}</g>
    </g>

    <g class="sc-pose sc-sit" filter="url(#scf-fur)">
      <g class="sc-tail"><path class="sc-tail-path" d="M37 77 C 50 86, 82 86, 95 78 C 98 76, 99.5 73.5, 98.5 72"/><path class="sc-tail-ring" d="M37 77 C 50 86, 82 86, 95 78 C 98 76, 99.5 73.5, 98.5 72"/></g>
      <ellipse class="sc-fur-dark" cx="40" cy="80" rx="10.5" ry="3.4"/>
      <path class="sc-fur" d="M27 66 C 25 52, 36 43, 50 44 C 62 45, 70 56, 69 68 C 68 78, 60 82, 47 82 C 35 82, 28 76, 27 66 Z"/>
      <path class="sc-stripe sc-soft" d="M37 48.5 c 4 4.5, 4 8.5, 1.4 12.5 M46.5 45.5 c 4 5, 4.2 9.5, 1.4 13.5 M30.5 57 c 3.6 3.6, 3.8 6.6, 2 10 M33 70 c 3 1.6, 4 4, 3.6 6.4"/>
      <path class="sc-fur-dark" d="M57 56 C 56.6 64, 57 74, 57.6 80.4 C 59 82.4, 63.4 82.4, 64.8 80.6 C 65 73, 65.4 64, 65.4 56 Z"/>
      <path class="sc-fur" d="M52 44 C 52 34, 58 27, 65 28 C 74 29, 79 40, 78.5 54 C 78 64, 74 72, 66 72 C 58 72, 53 64, 52 54 Z"/>
      <path class="sc-belly" d="M64 36 C 70 37, 74 46, 73.5 56 C 73 64, 70 70, 66.5 70 C 63 68, 61.5 60, 61.6 52 C 61.6 44, 61.5 38, 64 36 Z"/>
      <path class="sc-chest-fluff" d="M63 40 l2 2.4 l1.6 -2.2 l1.8 2.6 l1.8 -2.2 M62.8 46 l2 2.2 l1.8 -2 l1.8 2.4 l2 -2"/>
      <g class="sc-raise"><path class="sc-fur" d="M66 56 C 66.3 64, 66.4 73, 66.4 80.4 C 68 82.8, 73.8 82.8, 75.6 80.6 C 75.4 73, 75.6 64, 76 56 Z"/><ellipse class="sc-paw" cx="71" cy="81.2" rx="5.2" ry="2"/></g>
      <g transform="translate(68 27)">${head()}</g>
    </g>

    <g class="sc-pose sc-sleep" filter="url(#scf-fur)">
      <g class="sc-breathe">
        <path class="sc-fur" d="M21 70 C 20 60, 34 54, 54 54 C 74 54, 92 59, 92 70 C 92 79, 76 83, 56 83 C 36 83, 22 79, 21 70 Z"/>
        <path class="sc-stripe sc-soft" d="M38 55.6 c 2.6 4, 2.6 7.6, .4 11 M49 54.2 c 2.6 4.2, 2.6 8, .4 11.4 M60 54.4 c 2.6 4.2, 2.6 8, .4 11.4 M71 56 c 2.2 3.8, 2.2 7, .4 10 M29 59 c 2 3, 2 6, .4 9"/>
        <path class="sc-shade" d="M24 74 C 36 82, 74 84, 90 74"/>
      </g>
      <path class="sc-tail-path" d="M22 71 C 15 86, 56 88, 80 81 C 84 80, 86 78, 85.5 76.5"/><path class="sc-tail-ring" d="M22 71 C 15 86, 56 88, 80 81 C 84 80, 86 78, 85.5 76.5"/>
      <g transform="translate(86 64) rotate(10) scale(.94)">${head()}</g>
    </g>
  </svg>`;

  const css = `
  .site-cat{--fur:#e59a5c;--fur-dark:#c8773d;--stripe:#a4521d;--belly:#fbe3c7;--ear:#f2a8a0;--iris:#bfd95a;--line:#5a3520;
    position:fixed;left:0;bottom:0;z-index:9000;width:${W}px;height:${Math.round(W * 86 / 124)}px;pointer-events:none;
    transform:translate3d(var(--x,24px),0,0);user-select:none;-webkit-user-select:none}
  html.theme-dark .site-cat{--line:#3a2214}
  html.theme-dark .site-cat .sc-whisker{opacity:.7}
  .site-cat .sc-body{position:absolute;inset:0;pointer-events:auto;cursor:grab;transform-origin:50% 100%}
  .site-cat.is-left .sc-flip{transform:scaleX(-1)}
  .site-cat .sc-flip{position:absolute;inset:0;transform-origin:50% 50%}
  .site-cat .sc-svg{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 3px 2px rgba(0,0,0,.18))}
  .site-cat .sc-shadow{position:absolute;left:18%;right:14%;bottom:-3px;height:7px;border-radius:50%;background:rgba(0,0,0,.16);filter:blur(2px)}
  .site-cat svg *{transform-box:fill-box}
  .site-cat .sc-fur{fill:url(#scg-fur)} .site-cat .sc-head>.sc-fur:nth-of-type(n+5){fill:url(#scg-head)} .site-cat .sc-fur-dark{fill:url(#scg-fur-dark)} .site-cat .sc-belly,.site-cat .sc-muzzle{fill:url(#scg-belly)}
  .site-cat .sc-ear-in{fill:url(#scg-ear)} .site-cat .sc-paw{fill:#f6dcc0;opacity:.9}
  .site-cat .sc-tuft,.site-cat .sc-chest-fluff{fill:none;stroke:#fff4e6;stroke-width:.55;stroke-linecap:round;stroke-linejoin:round;opacity:.85}
  .site-cat .sc-chest-fluff{stroke-width:.8;opacity:.6}
  .site-cat .sc-shade{fill:none;stroke:#7a3d14;stroke-width:3;opacity:.22;filter:url(#scf-soft)}
  .site-cat .sc-shade-eye{fill:none;stroke:#9c5422;stroke-width:1.1;opacity:.55;stroke-linecap:round}
  .site-cat .sc-soft{filter:url(#scf-soft)}
  .site-cat .sc-whisker-dots{stroke:#a0663c;stroke-width:.7;stroke-linecap:round}
  .site-cat .sc-tail-ring{fill:none;stroke:var(--stripe);stroke-width:7.6;stroke-linecap:butt;stroke-dasharray:3.2 5.4;opacity:.5;filter:url(#scf-soft)}
  .site-cat .sc-stripe{fill:none;stroke:var(--stripe);stroke-width:2.8;stroke-linecap:round;opacity:.62}
  .site-cat .sc-tail-path{fill:none;stroke:url(#scg-tail);stroke-width:7.5;stroke-linecap:round}
  .site-cat .sc-iris{fill:url(#scg-iris);stroke:#2e2410;stroke-width:.6} .site-cat .sc-pupil{fill:#1b1410;transform:translate(var(--px,0px),var(--py,0px));transition:transform .18s ease-out}
  .site-cat .sc-glint{fill:#fff;opacity:.95}
  .site-cat .sc-nose{fill:url(#scg-nose)}
  .site-cat .sc-line,.site-cat .sc-closed{fill:none;stroke:var(--line);stroke-width:1.2;stroke-linecap:round}
  .site-cat .sc-whisker{fill:none;stroke:#fffaf2;stroke-width:.45;opacity:.9;stroke-linecap:round;filter:drop-shadow(0 .3px .3px rgba(60,30,10,.55))}
  .site-cat .sc-mouth{fill:#8c3443;transform:scaleY(0);transform-origin:50% 0}
  .site-cat .sc-closed{display:none}
  .site-cat .sc-pose{display:none}
  .site-cat[data-pose="stand"] .sc-stand,.site-cat[data-pose="sit"] .sc-sit,.site-cat[data-pose="sleep"] .sc-sleep{display:inline}
  .site-cat .sc-eye{transform-origin:50% 50%;transition:transform .09s}
  .site-cat.is-blink .sc-eye{transform:scaleY(.1)}
  .site-cat[data-pose="sleep"] .sc-eyes{display:none} .site-cat[data-pose="sleep"] .sc-closed{display:inline}
  .site-cat .sc-head{transform-origin:50% 80%;transition:transform .35s ease}
  .site-cat .sc-leg{transform-origin:50% 6%}
  .site-cat .sc-tail{transform-origin:100% 100%}
  .site-cat .sc-sit .sc-tail{transform-origin:0% 50%;animation:sc-swish-sit 3.2s ease-in-out infinite}
  .site-cat[data-pose="stand"] .sc-tail{animation:sc-swish 2.4s ease-in-out infinite}
  /* Walking is driven by distance travelled, so planted paws do not slide. */
  .site-cat[data-act="walk"] .sc-stand .sc-tail{animation:none}
  .site-cat[data-act="walk"] .sc-stand .sc-head{transition:none}
  /* stretch */
  .site-cat[data-act="stretch"] .sc-stand{transform-origin:28% 96%;animation:sc-stretch 2.6s ease-in-out both}
  .site-cat[data-act="stretch"] .sc-l2,.site-cat[data-act="stretch"] .sc-l4{animation:sc-reach 2.6s ease-in-out both}
  .site-cat[data-act="stretch"] .sc-stand .sc-tail{animation:sc-tail-up 2.6s ease-in-out both}
  /* groom */
  .site-cat[data-act="groom"] .sc-raise{transform-origin:50% 6%;animation:sc-paw-up 4.2s ease-in-out both}
  .site-cat[data-act="groom"] .sc-sit .sc-head{animation:sc-lick 4.2s ease-in-out both}
  .site-cat[data-act="groom"] .sc-sit .sc-eye{transform:scaleY(.25)}
  /* yawn */
  .site-cat[data-act="yawn"] .sc-sit .sc-head{transform:rotate(-12deg)}
  .site-cat[data-act="yawn"] .sc-sit .sc-mouth{animation:sc-yawn 2.2s ease-in-out both}
  .site-cat[data-act="yawn"] .sc-sit .sc-eye{transform:scaleY(.15)}
  /* look around */
  .site-cat[data-act="look"] .sc-sit .sc-head{animation:sc-look 4s ease-in-out both}
  /* sleep */
  .site-cat .sc-breathe{transform-origin:50% 100%;animation:sc-breathe 3.4s ease-in-out infinite}
  .site-cat .sc-z{position:absolute;right:6px;top:-6px;font:800 13px/1 system-ui,sans-serif;color:var(--fur-dark);opacity:0;pointer-events:none}
  .site-cat[data-pose="sleep"] .sc-z{animation:sc-z 3s ease-out infinite}
  .site-cat[data-pose="sleep"] .sc-z:nth-child(2){animation-delay:1s;font-size:11px}
  .site-cat[data-pose="sleep"] .sc-z:nth-child(3){animation-delay:2s;font-size:9px}
  .site-cat.is-left .sc-z{right:auto;left:6px}
  /* reactions */
  .site-cat.is-hop .sc-body{animation:sc-hop .5s cubic-bezier(.3,.7,.4,1)}
  .site-cat.is-purr .sc-body{animation:sc-purr .12s linear infinite}
  .site-cat.is-purr .sc-eye{transform:scaleY(.2)}
  .site-cat .sc-bubble{position:absolute;bottom:calc(100% + 4px);left:50%;padding:6px 10px;border-radius:12px 12px 12px 3px;white-space:nowrap;
    font:700 12px/1.1 Manrope,system-ui,sans-serif;color:var(--ua-paper,#fff);background:var(--ua-ink,#14251f);box-shadow:0 6px 18px rgba(0,0,0,.18);
    opacity:0;transform:translate(-10%,6px) scale(.9);transform-origin:0 100%;transition:opacity .2s,transform .25s cubic-bezier(.3,1.5,.5,1);pointer-events:none}
  .site-cat .sc-bubble.is-on{opacity:1;transform:translate(-10%,0) scale(1)}
  .site-cat .sc-heart{position:absolute;bottom:60%;left:var(--hx,50%);font-size:14px;color:#ef6b7b;pointer-events:none;animation:sc-heart 1.3s ease-out forwards}
  .site-cat.is-leaving{transition:transform 1.4s cubic-bezier(.5,0,.9,.6),opacity 1.4s}
  .site-cat.is-shoo .sc-l1,.site-cat.is-shoo .sc-l4{animation:sc-step .32s ease-in-out infinite}
  .site-cat.is-shoo .sc-l2,.site-cat.is-shoo .sc-l3{animation:sc-step .32s ease-in-out infinite reverse}
  @keyframes sc-step{0%,100%{transform:rotate(24deg)}50%{transform:rotate(-24deg)}}
  @keyframes sc-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.4px)}}
  @keyframes sc-swish{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(9deg)}}
  @keyframes sc-swish-sit{0%,100%{transform:rotate(0)}40%{transform:rotate(-7deg)}60%{transform:rotate(-2deg)}}
  @keyframes sc-stretch{0%,100%{transform:rotate(0)}30%,72%{transform:rotate(10deg) translateY(-2px)}}
  @keyframes sc-reach{0%,100%{transform:rotate(0)}30%,72%{transform:rotate(-58deg)}}
  @keyframes sc-tail-up{0%,100%{transform:rotate(0)}30%,72%{transform:rotate(18deg)}}
  @keyframes sc-paw-up{0%,100%{transform:rotate(0)}18%,82%{transform:rotate(-158deg)}30%,46%,62%{transform:rotate(-150deg)}38%,54%,70%{transform:rotate(-164deg)}}
  @keyframes sc-lick{0%,100%{transform:rotate(0)}18%,82%{transform:rotate(14deg)}30%,46%,62%{transform:rotate(18deg)}38%,54%,70%{transform:rotate(10deg)}}
  @keyframes sc-yawn{0%,100%{transform:scaleY(0)}35%,70%{transform:scaleY(1)}}
  @keyframes sc-look{0%,100%{transform:rotate(0)}20%,40%{transform:rotate(-10deg) translateX(-1px)}55%,80%{transform:rotate(8deg)}}
  @keyframes sc-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.05)}}
  @keyframes sc-z{0%{opacity:0;transform:translate(0,0) scale(.7)}25%{opacity:.85}100%{opacity:0;transform:translate(10px,-30px) scale(1.15)}}
  @keyframes sc-hop{0%,100%{transform:translateY(0) scaleY(1)}15%{transform:translateY(0) scaleY(.9)}45%{transform:translateY(-20px) scaleY(1.04)}80%{transform:translateY(0) scaleY(.95)}}
  @keyframes sc-purr{0%,100%{transform:translateX(0)}50%{transform:translateX(.6px)}}
  @keyframes sc-heart{0%{opacity:0;transform:translateY(0) scale(.6)}20%{opacity:1}100%{opacity:0;transform:translateY(-44px) scale(1.2)}}
  .sc-attention{transform-origin:50% 80%;transform:rotate(var(--look,0deg)) translateY(var(--lean,0px))}
  .site-cat.is-purr .sc-attention{transform:rotate(-8deg) translateY(-1.4px)}
  .site-cat.is-purr .sc-body{animation:none}
  .site-cat.is-purr .sc-eye{transform:scaleY(.12);transition:transform .4s}
  .site-cat.is-stalking .sc-body{transform:scaleY(.88);transform-origin:50% 100%;transition:transform .25s}
  .site-cat.is-pouncing .sc-body{animation:sc-hop .5s ease-in-out}
  .cat-play{position:fixed;right:24px;bottom:82px;z-index:9001;border:1px solid #bcae9a;border-radius:20px;padding:8px 13px;background:#fff9ed;color:#44382a;font:600 12px system-ui;cursor:pointer;box-shadow:0 2px 10px #0001}
  .cat-play:focus-visible,.cat-toy:focus-visible{outline:3px solid #bc622e;outline-offset:4px}
  .cat-toy{position:fixed;left:0;bottom:8px;z-index:9002;width:26px;height:26px;border:1px solid #9c523b;border-radius:50%;background:repeating-linear-gradient(35deg,#d78666 0 2px,#b96046 3px 4px);box-shadow:inset -4px -4px 5px #743d3544,0 3px 3px #0002;cursor:grab;touch-action:none;transform:translateX(var(--toy-x,400px))}
  .cat-toy:active{cursor:grabbing}
  .cat-toy[hidden]{display:none}
  .cat-toy.is-caught{animation:sc-toy-wobble .45s ease-in-out}
  @keyframes sc-toy-wobble{25%{rotate:18deg}75%{rotate:-15deg}}
  @media(max-width:1023px),(hover:none),(pointer:coarse){.cat-play,.cat-toy{display:none}}
  @media(prefers-reduced-motion:reduce){.cat-toy{animation:none!important}.sc-attention{transform:none!important}}
  @media print{.cat-play,.cat-toy{display:none}}
  body.ua-menu-open .cat-play,body.ua-menu-open .cat-toy,body.hd-panel-open .cat-play,body.hd-panel-open .cat-toy{visibility:hidden}
  body.ua-menu-open .site-cat,body.hd-panel-open .site-cat{visibility:hidden}
  @media print{.site-cat{display:none}}
  @media (prefers-reduced-motion: reduce){.site-cat *{animation-duration:0s!important;animation-iteration-count:1!important}.site-cat[data-pose="sleep"] .sc-z{display:none}}`;

  /* ---------- state ---------- */
  let playButton, toy, playing = false, dragging = false, toyX = 0, chaseTimer = 0;
  let headAngle = 0, strokeDistance = 0, lastStrokeX = null, lastAffection = 0;

  let root, bodyEl, bubble, x, dir, act = '', timer = 0, raf = 0, last = 0;
  let gaitPhase = 0, velocity = 0, legs = [], walkingTorso, walkingHead, walkingTail;
  let target = null, speed = 42, mouse = { x: -1e4, y: -1e4, t: 0 }, lastMove = performance.now();
  let clickTimer = 0, bubbleTimer = 0, purrTimer = 0, petting = false, gone = false;

  // Stay clear of anything pinned to the bottom-left (the cookie/privacy box).
  const minX = () => {
    let edge = 12;
    document.querySelectorAll('.journey-privacy, .journey-privacy > *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height && innerHeight - r.top < 260 && r.left < innerWidth / 2) edge = Math.max(edge, r.right + 16);
    });
    return Math.min(edge, innerWidth - W - 130);
  };
  const maxX = () => Math.max(minX() + 40, innerWidth - W - 110); // keep clear of back-to-top button
  const clamp = (v) => Math.min(maxX(), Math.max(minX(), v));

  const persist = (extra = {}) => !gone && save({ x: Math.round(x), dir, sleeping: act === 'sleep', at: Date.now(), ...extra });
  const place = () => root.style.setProperty('--x', `${x.toFixed(2)}px`);
  const face = (d) => { dir = d; root.classList.toggle('is-left', d < 0); };

  const set = (pose, action) => {
    if (gone && action !== 'walk') return;
    if (act === 'walk' && action !== 'walk') resetGait();
    root.dataset.pose = pose;
    root.dataset.act = action;
    act = action;
    persist();
  };

  const later = (fn, ms) => { clearTimeout(timer); if (!gone && !reduced.matches) timer = setTimeout(fn, ms); };

  /* behaviours */
  const behaviours = {
    walk() {
      let tx = clamp(rand(minX(), maxX()));
      if (Math.abs(tx - x) < 140) tx = clamp(x + (x > innerWidth / 2 ? -1 : 1) * rand(160, 360));
      walkTo(tx, rand(34, 52));
    },
    sit() { set('sit', 'sit'); later(next, rand(4000, 9000)); },
    look() { set('sit', 'look'); later(next, 4000); },
    groom() { set('sit', 'groom'); later(next, 4300); },
    stretch() { set('stand', 'stretch'); later(() => behaviours.walk(), 2700); },
    yawn() { set('sit', 'yawn'); later(() => (Math.random() < .6 ? sleep() : next()), 2400); },
    sleep() { sleep(); }
  };
  const weights = [['walk', 34], ['sit', 16], ['look', 12], ['groom', 12], ['stretch', 10], ['yawn', 9], ['sleep', 7]];

  function next() {
    if (playing) { set('sit', 'sit'); return; }
    if (act === 'sleep' && root.dataset.pose === 'sleep') return wake();
    let r = Math.random() * weights.reduce((s, [, w]) => s + w, 0);
    for (const [name, w] of weights) { if ((r -= w) <= 0) return behaviours[name](); }
    behaviours.sit();
  }

  function sleep(ms = rand(14000, 28000)) {
    target = null;
    set('sleep', 'sleep');
    later(wake, ms);
  }

  function wake() {
    set('sit', 'yawn');
    later(() => behaviours.stretch(), 2300);
  }

  // Four staggered footfalls; each paw stays on the floor for 64% of a stride.
  // Local backwards stance motion exactly cancels the cat's screen movement.
  function renderGait(distance) {
    if (reduced.matches) return;
    const stride = 34, stance = .64;
    gaitPhase = (gaitPhase + distance * 124 / W / stride) % 1;
    const sway = Math.cos(gaitPhase * Math.PI * 4);
    legs.forEach((leg) => {
      const phase = (gaitPhase + leg.phase) % 1;
      const grounded = phase < stance;
      const swing = (phase - stance) / (1 - stance);
      const ease = grounded ? 0 : swing * swing * (3 - 2 * swing);
      const px = leg.x + (grounded ? stride * (stance / 2 - phase) : stride * stance * (ease - .5));
      const lift = grounded ? 0 : Math.sin(Math.PI * swing) * 7;
      const py = 81 - lift;
      const hipY = 51 + sway * .55;
      const kneeX = leg.x + (px - leg.x) * .45 + (leg.hind ? -5 : 3) + (leg.hind ? -1 : 1) * lift * .45;
      const kneeY = (hipY + py) / 2;
      leg.path.setAttribute('d', `M${leg.x-4} ${hipY} Q${kneeX-3} ${kneeY} ${px-2.7} ${py-2} Q${px-4} ${py+1} ${px} ${py+1} L${px+4} ${py+1} Q${px+6} ${py-1} ${px+2.7} ${py-3} Q${kneeX+3} ${kneeY} ${leg.x+4} ${hipY} Z`);
      if (leg.paw) { leg.paw.setAttribute('cx', px + 1); leg.paw.setAttribute('cy', py); }
    });
    walkingTorso.style.transform = `translateY(${(sway * .55).toFixed(3)}px) rotate(${(Math.sin(gaitPhase * Math.PI * 2) * .65).toFixed(3)}deg)`;
    walkingHead.style.transform = `translateY(${(-sway * .25).toFixed(3)}px) rotate(${(Math.sin(gaitPhase * Math.PI * 2 - .5) * .7).toFixed(3)}deg)`;
    walkingTail.style.transform = `rotate(${(Math.sin(gaitPhase * Math.PI * 2 - .8) * 4).toFixed(3)}deg)`;
  }

  function resetGait() {
    velocity = 0;
    legs.forEach(leg => {
      leg.path.setAttribute('d', leg.original);
      if (leg.paw) { leg.paw.setAttribute('cx', leg.pawX); leg.paw.setAttribute('cy', leg.pawY); }
    });
    [walkingTorso, walkingHead, walkingTail].forEach(el => { if (el) el.style.removeProperty('transform'); });
  }

  function walkTo(tx, s = 42, chase = false) {
    if (reduced.matches) { target = null; set('sleep', 'sleep'); return; }
    if (act !== 'walk') velocity = 0;
    target = tx; speed = s;
    face(tx >= x ? 1 : -1);
    root.style.setProperty('--step', `${(chase ? .3 : .56 * 42 / s).toFixed(2)}s`);
    set('stand', 'walk');
    clearTimeout(timer);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }

  function tick(now) {
    if (reduced.matches && act === 'walk' && !gone) {
      target = null; clearTimeout(timer); raf = 0; set('sleep', 'sleep'); return;
    }
    const dt = Math.min(64, now - last) / 1000; last = now;
    if (target != null && act === 'walk') {
      const d = target - x;
      // Ease into a walk and brake before settling into the next pose.
      const desired = Math.min(speed, Math.sqrt(2 * 150 * Math.abs(d)));
      velocity += Math.max(-180 * dt, Math.min(120 * dt, desired - velocity));
      const stepPx = Math.min(Math.abs(d), velocity * dt);
      renderGait(stepPx);
      if (Math.abs(d) <= Math.max(.15, stepPx)) {
        x = target; target = null; place();
        persist();
        if (root.dataset.chasing) { delete root.dataset.chasing; set('sit', 'sit'); root.classList.add('is-pouncing'); toy?.classList.add('is-caught'); setTimeout(() => { root.classList.remove('is-pouncing'); toy?.classList.remove('is-caught'); }, 520); later(next, 2200); }
        else { set('sit', 'sit'); later(next, rand(150, 600)); }
      } else {
        x += Math.sign(d) * stepPx; place();
      }
    }
    // eyes follow the cursor
    const r = bodyEl.getBoundingClientRect();
    const hx = r.left + r.width * (dir > 0 ? .78 : .22), hy = r.top + r.height * .35;
    const attentionX = playing ? toyX + 13 : mouse.x, attentionY = playing ? innerHeight - 21 : mouse.y;
    const dx = attentionX - hx, dy = attentionY - hy, len = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, len / 160);
    const attentive = !reduced.matches && !petting && ['sit','look','walk'].includes(act) && (playing || now - mouse.t < 1500);
    const desiredAngle = attentive ? Math.max(-14, Math.min(14, dy * dir / 18 + dx / 100)) : 0;
    headAngle += (desiredAngle - headAngle) * (1 - Math.exp(-dt * 7));
    root.style.setProperty('--look', `${headAngle.toFixed(2)}deg`);
    root.style.setProperty('--px', `${((dx / len) * 1.5 * k * dir).toFixed(2)}px`);
    root.style.setProperty('--py', `${((dy / len) * 1.2 * k).toFixed(2)}px`);
    raf = (act === 'walk' || now - mouse.t < 1500 || Math.abs(headAngle - desiredAngle) > .1) ? requestAnimationFrame(tick) : 0;
  }

  /* reactions */
  function bubbleSay(text, ms = 1600) {
    bubble.textContent = text;
    bubble.classList.add('is-on');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove('is-on'), ms);
  }

  function hearts(n = 3) {
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const h = document.createElement('span');
        h.className = 'sc-heart'; h.textContent = '♥';
        h.style.setProperty('--hx', `${rand(25, 75)}%`);
        root.appendChild(h);
        setTimeout(() => h.remove(), 1400);
      }, i * 220);
    }
  }

  function hop() {
    root.classList.remove('is-hop'); void root.offsetWidth; root.classList.add('is-hop');
    setTimeout(() => root.classList.remove('is-hop'), 520);
  }

  function onClick() {
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      if (act === 'sleep') { bubbleSay(pick(['…five more minutes', 'zzz… huh?', '*grumble*']), 1800); wake(); return; }
      target = null;
      clearTimeout(purrTimer);
      root.classList.remove('is-purr');
      hop();
      bubbleSay(pick(['meow!', 'mrrp?', 'prrrt!', 'hi human 👋', 'feed me?', 'meow meow', '🐟?']));
      set('sit', 'sit');
      later(next, rand(3000, 6000));
    }, 230);
  }

  function shoo() {
    stopPlay(); playButton?.remove(); toy?.remove();
    clearTimeout(clickTimer); clearTimeout(timer); clearTimeout(purrTimer);
    root.classList.remove('is-purr');
    resetGait();
    root.classList.add('is-shoo');
    bubbleSay('fine. 😾', 1200);
    const off = x > innerWidth / 2 ? innerWidth + 40 : -W - 40;
    face(off > x ? 1 : -1);
    root.style.setProperty('--step', '.28s');
    set('stand', 'walk');
    target = null;
    save({ away: true });
    gone = true;
    setTimeout(() => {
      root.classList.add('is-leaving');
      root.style.setProperty('--x', `${off}px`);
      setTimeout(() => root.remove(), 1500);
    }, 500);
  }

  function petStart() {
    if (gone || dragging) return;
    petting = true; lastStrokeX = null; strokeDistance = 0;
    clearTimeout(chaseTimer); chaseTimer = 0;
    target = null; delete root.dataset.chasing; root.classList.remove('is-stalking');
    clearTimeout(timer);
    if (act !== 'sleep') set('sit', 'sit');
  }
  function petStroke(e) {
    if (!petting || gone) return;
    if (lastStrokeX !== null) strokeDistance += Math.min(15, Math.abs(e.clientX - lastStrokeX));
    lastStrokeX = e.clientX;
    if (strokeDistance < 16) return;
    root.classList.add('is-purr');
    clearTimeout(purrTimer);
    purrTimer = setTimeout(() => root.classList.remove('is-purr'), 1400);
    if (performance.now() - lastAffection > 2400) {
      hearts(1); lastAffection = performance.now();
    }
    strokeDistance = 0;
  }
  function petEnd() {
    petting = false; lastStrokeX = null;
    clearTimeout(purrTimer);
    purrTimer = setTimeout(() => root?.classList.remove('is-purr'), 700);
    later(next, rand(2000, 4000));
  }

  function placeToy(value) {
    toyX = Math.max(minX() + W, Math.min(maxX() + W * .76 - 13, value));
    toy.style.setProperty('--toy-x', `${toyX}px`);
    mouse.t = performance.now(); lastMove = mouse.t;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }
  function inviteChase() {
    if (!playing || reduced.matches || petting || gone || chaseTimer) return;
    clearTimeout(timer);
    if (act !== 'walk') { set('stand', 'sit'); root.classList.add('is-stalking'); face(toyX > x ? 1 : -1); }
    chaseTimer = setTimeout(() => {
      chaseTimer = 0;
      if (!playing || petting || reduced.matches || gone) return;
      root.classList.remove('is-stalking'); root.dataset.chasing = '1';
      const right = toyX > x + W / 2;
      walkTo(clamp(toyX - (right ? W * .76 : W * .2)), 90, true);
    }, act === 'walk' ? 180 : 650);
  }
  function stopPlay() {
    playing = false; dragging = false; clearTimeout(chaseTimer); chaseTimer = 0;
    if (toy) toy.hidden = true;
    if (playButton) { playButton.textContent = 'Play with Miso'; playButton.setAttribute('aria-pressed','false'); }
    root?.classList.remove('is-stalking');
    if (root && !gone) { target = null; delete root.dataset.chasing; set(reduced.matches ? 'sleep' : 'sit', reduced.matches ? 'sleep' : 'sit'); later(next, 3000); }
  }
  function mountPlay() {
    playButton = document.createElement('button'); playButton.type = 'button'; playButton.className = 'cat-play';
    playButton.textContent = 'Play with Miso'; playButton.setAttribute('aria-pressed','false');
    toy = document.createElement('button'); toy.type = 'button'; toy.className = 'cat-toy'; toy.hidden = true;
    toy.setAttribute('aria-label','Yarn toy. Drag or use arrow keys to move; Escape to finish.');
    toy.title = 'Drag to play · arrow keys to move · Esc to finish';
    document.body.append(playButton, toy);
    playButton.addEventListener('click', () => {
      if (playing) { stopPlay(); return; }
      playing = true; clearTimeout(timer); target = null; set('sit','sit');
      playButton.textContent = 'Finish playing'; playButton.setAttribute('aria-pressed','true');
      toy.hidden = false; placeToy(x + W + 130); toy.focus({preventScroll:true}); inviteChase();
    });
    toy.addEventListener('pointerdown', e => { if (e.button !== 0) return; dragging = true; toy.setPointerCapture(e.pointerId); });
    toy.addEventListener('pointermove', e => { if (dragging) { placeToy(e.clientX - 13); inviteChase(); } });
    const release = () => { dragging = false; inviteChase(); };
    toy.addEventListener('pointerup', release); toy.addEventListener('pointercancel', () => { dragging = false; });
    toy.addEventListener('lostpointercapture', () => { dragging = false; });
    toy.addEventListener('keydown', e => { if (['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); placeToy(toyX + (e.key === 'ArrowRight' ? 45 : -45)); inviteChase(); } });
    addEventListener('keydown', e => { if (e.key === 'Escape' && playing) { stopPlay(); playButton.focus({preventScroll:true}); } });
    addEventListener('resize', () => { if (playing) placeToy(toyX); });
  }

  function onMouseMove(e) {
    if (gone) return;
    mouse = { x: e.clientX, y: e.clientY, t: performance.now() };
    lastMove = mouse.t;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }

  }

  /* idle → nap; hidden tab → nap */
  setInterval(() => {
    if (!root?.isConnected || reduced.matches || playing) return;
    if (act !== 'walk' && act !== 'stretch' && x < minX() - 4) { walkTo(clamp(minX() + rand(40, 220)), 60); return; }
    if (act !== 'sleep' && act !== 'walk' && performance.now() - lastMove > 45000) behaviours.yawn();
  }, 5000);
  document.addEventListener('visibilitychange', () => { if (document.hidden && root?.isConnected) persist(); });
  addEventListener('pagehide', () => root?.isConnected && persist());

  /* ---------- mount ---------- */
  function mount() {
    if (root || !desktop.matches || read().away) return;
    const style = document.createElement('style');
    style.id = 'site-cat-style';
    style.textContent = css;
    document.head.appendChild(style);

    root = document.createElement('div');
    root.className = 'site-cat';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = `<div class="sc-body" title="Pet me · click to say hi · double-click to shoo"><span class="sc-shadow"></span><div class="sc-flip">${svg}</div></div>
      <span class="sc-z-wrap"><span class="sc-z">z</span><span class="sc-z">z</span><span class="sc-z">z</span></span><div class="sc-bubble"></div>`;
    // Zzz live directly in root so they don't mirror
    const zWrap = root.querySelector('.sc-z-wrap');
    zWrap.replaceWith(...zWrap.childNodes);
    bodyEl = root.querySelector('.sc-body');
    bubble = root.querySelector('.sc-bubble');
    legs = [
      {selector: '.sc-l1', x: 40, phase: .5, hind: true},
      {selector: '.sc-l2', x: 76, phase: .25, hind: false},
      {selector: '.sc-l3', x: 46, phase: 0, hind: true},
      {selector: '.sc-l4', x: 82, phase: .75, hind: false}
    ].map(leg => {
      const el = root.querySelector(leg.selector), path = el.querySelector('path'), paw = el.querySelector('ellipse');
      return {...leg, path, paw, original: path.getAttribute('d'), pawX: paw?.getAttribute('cx'), pawY: paw?.getAttribute('cy')};
    });
    walkingTorso = root.querySelector('.sc-stand .sc-torso');
    walkingHead = root.querySelector('.sc-stand .sc-head');
    walkingTail = root.querySelector('.sc-stand .sc-tail');
    document.body.appendChild(root);

    const saved = read();
    const fresh = !saved.at || Date.now() - saved.at > 30 * 60 * 1000;
    face(saved.dir || 1);
    x = clamp(typeof saved.x === 'number' && !fresh ? saved.x : rand(minX(), maxX()));
    place();

    bodyEl.addEventListener('click', onClick);
    bodyEl.addEventListener('dblclick', shoo);
    mountPlay();
    bodyEl.addEventListener('mousemove', petStroke);
    bodyEl.addEventListener('mouseenter', petStart);
    bodyEl.addEventListener('mouseleave', petEnd);
    addEventListener('mousemove', onMouseMove, { passive: true });
    addEventListener('resize', () => { x = clamp(x); if (target != null) target = clamp(target); place(); });

    // blink now and then
    (function blink() {
      if (!root.isConnected) return;
      root.classList.add('is-blink');
      setTimeout(() => root.classList.remove('is-blink'), 140);
      setTimeout(blink, rand(2500, 6500));
    })();

    if (reduced.matches) { set('sleep', 'sleep'); return; }

    if (fresh) {
      // stroll in from the nearest edge
      const startX = x;
      x = innerWidth + 10; // enter from the right, away from the cookie box
      face(-1);
      place();
      setTimeout(() => { if (!playing && !petting && !gone) walkTo(startX, 46); }, 1200);
    } else if (saved.sleeping) {
      sleep(rand(6000, 16000));
    } else {
      set('sit', pick(['sit', 'look']));
      later(next, rand(1500, 4000));
    }
  }

  const start = () => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', mount) : mount());
  start();
  reduced.addEventListener?.('change', () => {
    if (!root?.isConnected || gone) return;
    stopPlay();
    clearTimeout(timer); cancelAnimationFrame(raf); raf = 0; target = null;
    resetGait();
    if (reduced.matches) set('sleep', 'sleep');
    else { set('sit', 'sit'); later(next, 2000); }
  });
  desktop.addEventListener?.('change', (e) => {
    if (!root) { if (e.matches) mount(); return; }
    if (!e.matches) stopPlay();
    root.style.display = e.matches ? '' : 'none';
  });
})();
