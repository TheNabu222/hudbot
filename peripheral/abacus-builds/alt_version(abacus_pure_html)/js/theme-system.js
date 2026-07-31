/* ===== THEME SYSTEM (Warm Dark/Light) ===== */
const ThemeSystem = {
  init() {
    const saved = localStorage.getItem('anzu_theme') || State.project?.theme || 'dark';
    this.applyTheme(saved);
  },

  toggleTheme() {
    const next = (document.documentElement.getAttribute('data-theme') === 'light') ? 'dark' : 'light';
    this.applyTheme(next);
    if (State.project) {
      State.project.theme = next;
      State.autoSave();
    }
    localStorage.setItem('anzu_theme', next);
    if (typeof Toast !== 'undefined') Toast.show(`Theme switched to ${next}`, 'success');
  },

  applyTheme(themeName) {
    const theme = themeName === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('btn-theme-toggle');
    if (btn) {
      btn.textContent = theme === 'light' ? '🌙 Dark' : '☀ Light';
      btn.title = theme === 'light' ? 'Switch to warm dark theme' : 'Switch to warm light theme';
    }
    if (State.project) State.project.theme = theme;
  },
};
