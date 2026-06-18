/* =====================================================================
   Buscador full-text para Notas Cuánticas
   Usa window.SEARCH_INDEX (definido en search-index.js) para evitar
   fetch() — que está bloqueado al abrir el HTML con file://
   ===================================================================== */

(function () {
  const ROOT = document.body.getAttribute('data-root') || '';

  function getIndex() {
    return window.SEARCH_INDEX || { notes: [] };
  }

  // Quita acentos y pasa a minúsculas para comparar
  function normalize(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  function makeSnippet(text, query, radius) {
    radius = radius || 60;
    const haystack = normalize(text);
    const needle = normalize(query);
    const idx = haystack.indexOf(needle);
    if (idx < 0) return '';
    const start = Math.max(0, idx - radius);
    const end = Math.min(text.length, idx + needle.length + radius);
    let snippet = text.slice(start, end);
    if (start > 0) snippet = '… ' + snippet;
    if (end < text.length) snippet = snippet + ' …';
    const re = new RegExp(escapeRegex(query), 'gi');
    return snippet.replace(re, m => '<mark>' + m + '</mark>');
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeHtml(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function search(query) {
    const index = getIndex();
    if (!query || query.length < 2) return [];
    const q = normalize(query);
    const results = [];
    for (const note of index.notes) {
      const tagStr = (note.tags || []).join(' ');
      const fields = [note.title, note.area, note.stage, tagStr, note.content];
      const haystack = normalize(fields.join(' '));
      const pos = haystack.indexOf(q);
      if (pos < 0) continue;
      let score = 0;
      if (normalize(note.title).indexOf(q) >= 0) score += 1000;
      if ((note.tags || []).some(t => normalize(t).indexOf(q) >= 0)) score += 500;
      score -= pos;
      results.push({
        note: note,
        score: score,
        snippet: makeSnippet(note.content, query) || makeSnippet(note.title + ' — ' + tagStr, query)
      });
    }
    results.sort(function (a, b) { return b.score - a.score; });
    return results.slice(0, 8);
  }

  function render(results, query) {
    const box = document.querySelector('.search-results');
    if (!box) return;
    if (!query || query.length < 2) {
      box.classList.remove('open');
      box.innerHTML = '';
      return;
    }
    if (results.length === 0) {
      box.innerHTML = '<div class="search-empty">Sin resultados para <em>' + escapeHtml(query) + '</em></div>';
      box.classList.add('open');
      return;
    }
    const html = results.map(function (r) {
      const url = ROOT + r.note.url;
      return '<a class="search-hit" href="' + url + '">' +
        '<div class="search-hit-title">' + escapeHtml(r.note.title) + '</div>' +
        '<div class="search-hit-meta">' + escapeHtml(r.note.stage) + ' · ' + escapeHtml(r.note.area) + '</div>' +
        '<div class="search-hit-snippet">' + r.snippet + '</div>' +
      '</a>';
    }).join('');
    box.innerHTML = html;
    box.classList.add('open');
  }

  function setupSearch() {
    const input = document.querySelector('.search-input');
    const box = document.querySelector('.search-results');
    if (!input || !box) return;

    input.addEventListener('input', function (e) {
      const q = e.target.value.trim();
      const results = search(q);
      render(results, q);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        input.value = '';
        box.classList.remove('open');
        input.blur();
      }
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.search-wrap')) {
        box.classList.remove('open');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        input.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSearch);
  } else {
    setupSearch();
  }
})();
