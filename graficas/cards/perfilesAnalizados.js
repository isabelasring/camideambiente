/**
 * Card: PROFILES ANALYZED
 * Fuente: perfilesSeguidores
 */
(function() {
  'use strict';
  const CARD_ID = 'card-perfiles-analizados';
  const API_URL = '/api/metrics/perfiles-analizados';

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
  window.CardPerfilesAnalizados = { load };
})();
