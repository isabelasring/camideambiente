/**
 * Word cloud: biografías de perfiles
 * Fuente: perfilesSeguidores.json
 * Mode total: todos | Mode sesgo: 500-5000 seguidores
 */
(function() {
  'use strict';

  const BASE_URL = '/api/metrics/wordcloud-biografias';
  const CONTAINER_ID = 'wordcloudBiografias';
  const MIN_FREQ_ID = 'wordcloudMinFreq';
  const STATS_ID = 'wordcloudBiografiasStats';
  const SUBTITLE_ID = 'wordcloudSubtitle';

  function render(list, minFreq) {
    const container = document.getElementById(CONTAINER_ID);
    if (!container || !list || !list.length) return;

    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.id = 'wordcloudCanvas';
    const w = container.offsetWidth || container.parentElement?.offsetWidth || 800;
    canvas.width = Math.max(600, w);
    canvas.height = 400;
    container.appendChild(canvas);

    if (typeof WordCloud !== 'undefined') {
      WordCloud(canvas, {
        list: list,
        gridSize: Math.round(16 * canvas.width / 1024),
        weightFactor: function(size) { return Math.pow(size, 1.2) * canvas.width / 1200; },
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: function() {
          const colors = ['#1e40af', '#7c3aed', '#059669', '#dc2626', '#d97706', '#0891b2', '#4f46e5', '#0d9488'];
          return colors[Math.floor(Math.random() * colors.length)];
        },
        rotateRatio: 0.3,
        rotationSteps: 2,
        backgroundColor: '#ffffff',
        minSize: 8
      });
    }
  }

  function load(minFreq, mode) {
    const m = mode || 'sesgo';
    const params = new URLSearchParams({ mode: m });
    if (minFreq) params.set('min_freq', String(minFreq));
    const url = BASE_URL + '?' + params.toString();
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((body) => {
        const list = body && body.list;
        const total = body && body.total || 0;
        const statsEl = document.getElementById(STATS_ID);
        const subtitleEl = document.getElementById(SUBTITLE_ID);
        if (statsEl) {
          const label = m === 'total' ? 'Perfiles totales' : 'Perfiles 500-5000 seguidores';
          statsEl.textContent = `${label}: ${total.toLocaleString()} | Palabras: ${(list || []).length}`;
        }
        if (subtitleEl) {
          subtitleEl.textContent = m === 'total'
            ? 'Palabras extraídas de las biografías de todos los perfiles'
            : 'Palabras extraídas de las biografías de perfiles con 500-5000 seguidores';
        }
        if (list && list.length) {
          render(list, minFreq);
        } else {
          const container = document.getElementById(CONTAINER_ID);
          if (container) container.innerHTML = '<p style="color:rgba(255,255,255,0.7);">No hay palabras con frecuencia suficiente.</p>';
        }
      })
      .catch(err => {
        console.error('Error wordcloud:', err);
        const container = document.getElementById(CONTAINER_ID);
        if (container) container.innerHTML = '<p style="color:rgba(255,255,255,0.7);">Error al cargar.</p>';
      });
  }

  function init() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    let mode = 'sesgo';
    let minFreq = 2;
    const refresh = () => load(minFreq, mode);

    const minFreqEl = document.getElementById(MIN_FREQ_ID);
    const minFreqValEl = document.getElementById('wordcloudMinFreqVal');
    if (minFreqEl) {
      minFreq = parseInt(minFreqEl.value, 10) || 2;
      if (minFreqValEl) minFreqValEl.textContent = minFreq;
      minFreqEl.addEventListener('input', () => {
        minFreq = parseInt(minFreqEl.value, 10) || 2;
        if (minFreqValEl) minFreqValEl.textContent = minFreq;
        refresh();
      });
    }

    const totalBtn = document.getElementById('wordcloudModeTotal');
    const sesgoBtn = document.getElementById('wordcloudModeSesgo');
    const setActive = (active) => {
      totalBtn?.classList.toggle('active', active === 'total');
      sesgoBtn?.classList.toggle('active', active === 'sesgo');
    };
    totalBtn?.addEventListener('click', () => {
      if (mode === 'total') return;
      mode = 'total';
      setActive('total');
      refresh();
    });
    sesgoBtn?.addEventListener('click', () => {
      if (mode === 'sesgo') return;
      mode = 'sesgo';
      setActive('sesgo');
      refresh();
    });

    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ChartWordcloudBiografias = { init };
})();
