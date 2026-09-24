(() => {
  'use strict';
  const count = document.querySelector('[data-bx-count]');
  if (count) count.textContent = String(document.querySelectorAll('.blog-grid .blog-card').length);
})();
