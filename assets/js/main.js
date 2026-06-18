// Toggle de tema claro/oscuro con persistencia en localStorage
(function () {
  const root = document.documentElement;
  const stored = localStorage.getItem('notas-theme');
  if (stored) root.setAttribute('data-theme', stored);

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('notas-theme', next);
    });
  });
})();
