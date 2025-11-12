(() => {
  const storageKey = 'theme';

  function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
  }

  function getInitialTheme() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return getSystemTheme();
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function saveTheme(theme) {
    try { localStorage.setItem(storageKey, theme); } catch {}
  }

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || getInitialTheme();
  }

  function createToggleButton() {
    const btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    btn.title = 'ダークモード切替';
    updateButtonIcon(btn, currentTheme());
    btn.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      saveTheme(next);
      updateButtonIcon(btn, next);
    });
    return btn;
  }

  function updateButtonIcon(btn, theme) {
    if (theme === 'dark') {
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    } else {
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
    }
  }

  // Apply theme ASAP to avoid flash
  applyTheme(getInitialTheme());

  // React to system changes if user never chose explicitly
  try {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener?.('change', e => {
      const saved = localStorage.getItem(storageKey);
      if (saved !== 'dark' && saved !== 'light') {
        applyTheme(e.matches ? 'dark' : 'light');
        const btn = document.getElementById('themeToggle');
        if (btn) updateButtonIcon(btn, currentTheme());
      }
    });
  } catch {}

  // Inject button once header is available
  window.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header');
    if (!header) return;
    // Prefer placing inside nav if present
    const nav = header.querySelector('nav');
    const target = nav || header;
    const btn = createToggleButton();
    target.appendChild(btn);
  });
})();




