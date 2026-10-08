// Applies the saved admin theme before first paint; falls back to the system preference.
(() => { try { const theme = localStorage.getItem('admin-theme'); if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme; } catch {} })();
