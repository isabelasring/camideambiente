/**
 * Card: COMMENTS ANALYZED
 * Fuente: commentsPopularPosts
 */
(function() {
  'use strict';
  const CARD_ID = 'card-comments-analizados';
  const API_URL = '/api/metrics/comments-analizados';

  function load() {
    const container = document.querySelector(`[data-card-id="${CARD_ID}"]`);
    if (!container) return;
    const valueEl = container.querySelector('.metric-value');
    if (!valueEl) return;

    fetch((window.location.origin || '') + API_URL)
      .then(r => r.json())
      .then(data => { valueEl.textContent = (data.count ?? 0).toLocaleString('es-CO'); })
      .catch(() => { valueEl.textContent = '—'; });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', load) : load();
  window.CardCommentsAnalizados = { load };
})();
