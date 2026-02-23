/**
 * Card: Total Posts
 * Fuente: csvjson/postsCamilo.csv
 */
(function() {
  'use strict';

  const CARD_ID = 'card-posts';
  const API_URL = '/api/metrics/posts';

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  function render(container, count) {
    if (!container) return;
    const valueEl = container.querySelector('.metric-value');
    if (valueEl) valueEl.textContent = formatNumber(count);
  }

  async function load() {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      const container = document.querySelector(`[data-card-id="${CARD_ID}"]`);
      render(container, data.count || 0);
    } catch (err) {
      console.error('Error cargando card posts:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }

  window.CardPosts = { load };
})();
