(function () {
            const searchInput = document.getElementById('policySearchInput');
            const searchBtn = document.getElementById('policySearchBtn');
            const headings = Array.from(document.querySelectorAll('#policyContent h2'));
            const tocLinks = Array.from(document.querySelectorAll('#policyToc a'));

            function runSearch() {
                const q = (searchInput?.value || '').trim().toLowerCase();
                if (!q) return;
                const hit = headings.find((h) => h.textContent.toLowerCase().includes(q));
                if (hit) {
                    hit.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    searchInput.blur();
                }
            }

            if (searchBtn) searchBtn.addEventListener('click', runSearch);
            if (searchInput) {
                searchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') runSearch();
                });
            }

            if ('IntersectionObserver' in window) {
                const linkById = new Map(
                    tocLinks.map((a) => [a.getAttribute('href')?.slice(1), a])
                );
                const observer = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (!entry.isIntersecting) return;
                            tocLinks.forEach((a) => a.classList.remove('active'));
                            const id = entry.target.getAttribute('id');
                            const link = id ? linkById.get(id) : null;
                            if (link) link.classList.add('active');
                        });
                    },
                    { rootMargin: '-38% 0px -55% 0px', threshold: 0 }
                );
                headings.forEach((h) => observer.observe(h));
            }
        })();
