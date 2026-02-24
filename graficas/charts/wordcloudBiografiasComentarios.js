/**
 * Word cloud: biografías de usuarios que comentaron
 * Fuente: profileUsersComments.json
 * Quiénes: General | Siguen a Camilo | No siguen a Camilo
 * Modo: Total (todos) | Acotado (200-4000 seguidores)
 */
(function() {
  'use strict';

  const BASE_URL = '/api/metrics/wordcloud-biografias-comentarios';
  const CONTAINER_ID = 'wordcloudBiografiasComentarios';
  const MIN_FREQ_ID = 'wordcloudMinFreqComentarios';
  const STATS_ID = 'wordcloudBiografiasComentariosStats';
  const SUBTITLE_ID = 'wordcloudSubtitleComentarios';

  const FOLLOW_LABELS = { all: 'General', yes: 'Siguen a Camilo', no: 'No siguen a Camilo' };
  const MODE_LABELS = { total: 'todos los usuarios', sesgo: 'acotado (200-4000 seguidores)' };

  function csvEscape(val) {
    const s = String(val == null ? '' : val);
    if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function downloadCsv(lastList, follows, mode) {
    if (!lastList || !lastList.length) return;
    const headers = ['Palabra', 'Frecuencia'];
    const rows = lastList.map((item) => [item[0], item[1]]);
    const line = (arr) => arr.map(csvEscape).join(',');
    const csv = '\uFEFF' + line(headers) + '\r\n' + rows.map(line).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const followSlug = { all: 'general', yes: 'siguen-camilo', no: 'no-siguen-camilo' }[follows] || follows;
    const modeSlug = mode === 'total' ? 'total' : 'acotado';
    const filename = 'wordcloud-biografias-comentarios-' + followSlug + '-' + modeSlug + '.csv';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function render(list) {
    const container = document.getElementById(CONTAINER_ID);
    if (!container || !list || !list.length) return;

    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.id = 'wordcloudCanvasComentarios';
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

  function load(minFreq, mode, follows, onListLoaded) {
    const m = mode || 'sesgo';
    const f = follows || 'all';
    const params = new URLSearchParams({ mode: m, follows: f });
    if (minFreq) params.set('min_freq', String(minFreq));
    const url = BASE_URL + '?' + params.toString();
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((body) => {
        const list = body && body.list;
        const total = body && body.total || 0;
        const statsEl = document.getElementById(STATS_ID);
        const subtitleEl = document.getElementById(SUBTITLE_ID);
        const followLabel = FOLLOW_LABELS[f] || f;
        const modeLabel = MODE_LABELS[m] || m;
        if (statsEl) {
          statsEl.textContent = `${followLabel} (${modeLabel}): ${total.toLocaleString()} perfiles | Palabras: ${(list || []).length}`;
        }
        if (subtitleEl) {
          subtitleEl.textContent = 'Palabras extraídas de las biografías de usuarios que comentaron — ' + followLabel + ', ' + modeLabel + '.';
        }
        if (typeof onListLoaded === 'function') onListLoaded(list || [], f, m);
        if (list && list.length) {
          render(list);
        } else {
          const container = document.getElementById(CONTAINER_ID);
          if (container) container.innerHTML = '<p style="color:rgba(255,255,255,0.7);">No hay palabras con frecuencia suficiente.</p>';
        }
      })
      .catch(err => {
        console.error('Error wordcloud comentarios:', err);
        const container = document.getElementById(CONTAINER_ID);
        if (container) container.innerHTML = '<p style="color:rgba(255,255,255,0.7);">Error al cargar.</p>';
      });
  }

  function init() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    let mode = 'sesgo';
    let follows = 'all';
    let minFreq = 2;
    let lastList = [];
    let lastFollows = 'all';
    let lastMode = 'sesgo';
    const refresh = () => load(minFreq, mode, follows, (list, f, m) => {
      lastList = list;
      lastFollows = f;
      lastMode = m;
    });

    const minFreqEl = document.getElementById(MIN_FREQ_ID);
    const minFreqValEl = document.getElementById('wordcloudMinFreqValComentarios');
    if (minFreqEl) {
      minFreq = parseInt(minFreqEl.value, 10) || 2;
      if (minFreqValEl) minFreqValEl.textContent = minFreq;
      minFreqEl.addEventListener('input', () => {
        minFreq = parseInt(minFreqEl.value, 10) || 2;
        if (minFreqValEl) minFreqValEl.textContent = minFreq;
        refresh();
      });
    }

    const followBtns = {
      all: document.getElementById('wordcloudFollowAllComentarios'),
      yes: document.getElementById('wordcloudFollowYesComentarios'),
      no: document.getElementById('wordcloudFollowNoComentarios')
    };
    const setFollowActive = (f) => {
      Object.keys(followBtns).forEach((k) => followBtns[k]?.classList.toggle('active', k === f));
    };
    [followBtns.all, followBtns.yes, followBtns.no].forEach((btn) => {
      if (!btn) return;
      btn.addEventListener('click', function() {
        const f = this.getAttribute('data-follows') || 'all';
        if (follows === f) return;
        follows = f;
        setFollowActive(follows);
        refresh();
      });
    });

    const totalBtn = document.getElementById('wordcloudModeTotalComentarios');
    const sesgoBtn = document.getElementById('wordcloudModeSesgoComentarios');
    const setModeActive = (active) => {
      totalBtn?.classList.toggle('active', active === 'total');
      sesgoBtn?.classList.toggle('active', active === 'sesgo');
    };
    totalBtn?.addEventListener('click', () => {
      if (mode === 'total') return;
      mode = 'total';
      setModeActive('total');
      refresh();
    });
    sesgoBtn?.addEventListener('click', () => {
      if (mode === 'sesgo') return;
      mode = 'sesgo';
      setModeActive('sesgo');
      refresh();
    });

    const downloadBtn = document.getElementById('wordcloudComentariosDownloadCsv');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => downloadCsv(lastList, lastFollows, lastMode));
    }

    setFollowActive(follows);
    setModeActive(mode);
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ChartWordcloudBiografiasComentarios = { init };
})();
