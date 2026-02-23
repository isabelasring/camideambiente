/**
 * Card: Total Seguidores
 * Fuente: csvjson/seguidoresCamilo.csv | seguidoresCamilo.json
 */
(function() {
  'use strict';

  const CARD_ID = 'card-seguidores';
  const API_URL = '/api/metrics/seguidores';

  function render(container, count) {
    if (!container) return;
    const valueEl = container.querySelector('.metric-value');
    if (valueEl) valueEl.textContent = String(count);
  }

  async function load() {
    const container = document.querySelector(`[data-card-id="${CARD_ID}"]`);
    const valueEl = container?.querySelector('.metric-value');
    if (!valueEl) return;
    if (valueEl.textContent.includes('COUNT_SEGUIDORES')) {
      try {
        const base = window.location.origin || '';
        const res = await fetch(base + API_URL);
        const data = await res.json();
        render(container, data.count || 0);
      } catch (err) {
        valueEl.textContent = '—';
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }

  window.CardSeguidores = { load };
})();
