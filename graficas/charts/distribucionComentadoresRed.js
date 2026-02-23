/**
 * Gráfico: Usuarios que comentaron - diferenciados por si siguen o no a Camilo
 * X: seguidos, Y: seguidores, size: cantidad de comentarios
 * Color: Sigue a Camilo (verde) / No sigue (naranja)
 * Filtros: Privada/Pública, Tipo cuenta, Verificada
 */
(function() {
  'use strict';

  const BASE_URL = '/api/metrics/distribucion-comentadores-red';
  const CONTAINER_ID = 'chartDistribucionComentadoresRed';
  const STATS_ID = 'chartComentadoresRedStats';
  const DOWNLOADS_ID = 'chartComentadoresRedDownloads';

  function toCSVRed(arr) {
    const cols = ['username', 'fullName', 'followersCount', 'followsCount', 'commentsCount', 'sigueCamilo'];
    const esc = v => {
      const s = String(v ?? '').replace(/"/g, '""');
      return /[,"\n\r]/.test(s) ? '"' + s + '"' : s;
    };
    const header = cols.join(',');
    const rows = arr.map(d => [
      esc(d.username),
      esc(d.fullName),
      d.followersCount ?? '',
      d.followsCount ?? '',
      d.commentsCount ?? '',
      d.followsCamilo ? 'Sí' : 'No'
    ].join(','));
    return '\uFEFF' + header + '\r\n' + rows.join('\r\n');
  }

  function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function buildUrl() {
    const params = new URLSearchParams();
    const priv = document.getElementById('filterPrivateRed');
    const bus = document.getElementById('filterBusinessRed');
    const ver = document.getElementById('filterVerifiedRed');
    if (priv && priv.value) params.set('private', priv.value);
    if (bus && bus.value) params.set('is_business', bus.value);
    if (ver && ver.value) params.set('verified', ver.value);
    return BASE_URL + (params.toString() ? '?' + params.toString() : '');
  }

  let cached = null;

  function render(data) {
    const container = document.getElementById(CONTAINER_ID);
    const statsEl = document.getElementById(STATS_ID);
    if (!container) return;

    const commentsExactEl = document.getElementById('filterCommentsExactRed');
    const commentsMinEl = document.getElementById('filterCommentsMinRed');
    const commentsMaxEl = document.getElementById('filterCommentsMaxRed');
    const commentsExact = (commentsExactEl && commentsExactEl.value !== '') ? parseInt(commentsExactEl.value, 10) : null;
    const commentsMin = (commentsMinEl && commentsMinEl.value !== '') ? parseInt(commentsMinEl.value, 10) : null;
    const commentsMax = (commentsMaxEl && commentsMaxEl.value !== '') ? parseInt(commentsMaxEl.value, 10) : null;

    let dataFiltrada = data || [];
    if (commentsExact != null && !isNaN(commentsExact)) {
      dataFiltrada = dataFiltrada.filter(d => (d.commentsCount ?? 0) === commentsExact);
    } else {
      if (commentsMin != null && !isNaN(commentsMin)) {
        dataFiltrada = dataFiltrada.filter(d => (d.commentsCount ?? 0) >= commentsMin);
      }
      if (commentsMax != null && !isNaN(commentsMax)) {
        dataFiltrada = dataFiltrada.filter(d => (d.commentsCount ?? 0) <= commentsMax);
      }
    }

    if (!dataFiltrada.length) {
      if (statsEl) {
        statsEl.textContent = (commentsExact != null && !isNaN(commentsExact))
          ? `No hay usuarios con exactamente ${commentsExact} comentarios.`
          : 'Ningún usuario coincide con el filtro.';
      }
      const downloadsEl = document.getElementById(DOWNLOADS_ID);
      if (downloadsEl) downloadsEl.style.display = 'none';
      Plotly.purge(CONTAINER_ID);
      return;
    }

    const downloadsEl = document.getElementById(DOWNLOADS_ID);
    if (downloadsEl) {
      downloadsEl.style.display = 'flex';
      downloadsEl._comentadoresData = dataFiltrada;
    }

    const sigue = dataFiltrada.filter(d => d.followsCamilo);
    const noSigue = dataFiltrada.filter(d => !d.followsCamilo);

        const maxComments = Math.max(1, ...dataFiltrada.map(d => d.commentsCount || 1));
        const diamMax = 50;
        const sizeref = (2 * maxComments) / (diamMax * diamMax);

        const trace = (arr, name, color) => ({
          x: arr.map(d => d.follows_plot),
          y: arr.map(d => d.followers_plot),
          mode: 'markers',
          type: 'scatter',
          name,
          marker: {
            size: arr.map(d => Math.max(1, d.commentsCount || 1)),
            sizemode: 'area',
            sizeref,
            sizemin: 4,
            line: { width: 0.5, color: 'white' },
            color
          },
          text: arr.map(d =>
            `${d.fullName || '—'}<br>@${d.username}<br>Seguidores: ${(d.followersCount || 0).toLocaleString()}<br>Seguidos: ${(d.followsCount || 0).toLocaleString()}<br>Comentarios: ${d.commentsCount || 0}<br>${d.followsCamilo ? '✓ Sigue a Camilo' : '✗ No sigue'}`
          ),
          hoverinfo: 'text'
        });

        const traces = [
          trace(sigue, 'Sigue a Camilo', '#22c55e'),
          trace(noSigue, 'No sigue a Camilo', '#f97316')
        ].filter(t => t.x.length > 0);

        const layout = {
          title: { text: 'Comentadores: ¿Siguen a Camilo? (tamaño = comentarios)', font: { size: 14, color: '#1f2937' } },
          xaxis: { title: 'Following (seguidos / los que sigue cada usuario) - escala log', type: 'log', gridcolor: 'rgba(0,0,0,0.1)', tickfont: { color: '#374151', size: 11 }, titlefont: { color: '#1f2937' } },
          yaxis: { title: 'Followers (seguidores) - escala log', type: 'log', gridcolor: 'rgba(0,0,0,0.1)', tickfont: { color: '#374151', size: 11 }, titlefont: { color: '#1f2937' } },
          paper_bgcolor: '#ffffff',
          plot_bgcolor: '#ffffff',
          font: { color: '#1f2937' },
          height: 480,
          autosize: true,
          showlegend: true,
          legend: { title: { text: 'En la red', font: { color: '#1f2937' } }, font: { color: '#374151' }, yanchor: 'top', y: 1, xanchor: 'left', x: 1.02, itemsizing: 'constant', itemwidth: 40 },
          margin: { t: 50, r: 150, b: 90, l: 70 }
        };

        Plotly.newPlot(CONTAINER_ID, traces, layout, { responsive: true, scrollZoom: true, displayModeBar: true, useResizeHandler: true });

        if (statsEl) {
          const s = sigue.length.toLocaleString('es-CO');
          const n = noSigue.length.toLocaleString('es-CO');
          const tot = dataFiltrada.length.toLocaleString('es-CO');
          let msg = `Usuarios en el filtro: ${tot} (Siguen: ${s} | No siguen: ${n})`;
          if (commentsExact != null && !isNaN(commentsExact)) {
            msg += ` · exactamente ${commentsExact} comentarios`;
          } else if ((commentsMin != null && !isNaN(commentsMin)) || (commentsMax != null && !isNaN(commentsMax))) {
            const r = [];
            if (commentsMin != null && !isNaN(commentsMin)) r.push(`≥${commentsMin} comentarios`);
            if (commentsMax != null && !isNaN(commentsMax)) r.push(`≤${commentsMax} comentarios`);
            msg += ` · ${r.join(' y ')}`;
          }
          statsEl.textContent = msg;
          statsEl.style.cssText = 'margin-top:1rem;color:rgba(255,255,255,0.7);font-size:0.9rem;';
        }
  }

  function applyCommentsAndRender() {
    if (cached && cached.data) {
      render(cached.data);
    } else {
      load();
    }
  }

  function load() {
    const statsEl = document.getElementById(STATS_ID);
    if (statsEl) statsEl.textContent = 'Cargando...';
    fetch(buildUrl())
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((body) => {
        const data = body && body.data;
        const statsBase = body && body.statsBase;
        cached = { data: data || [], statsBase };

        if (statsBase) {
          const fmt = n => (n ?? 0).toLocaleString('es-CO');
          const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = fmt(val); };
          set('statBaseRed', statsBase.base);
          set('statSigueRed', statsBase.sigue);
          set('statNoSigueRed', statsBase.noSigue);
          set('statPrivadasRed', statsBase.privadas);
          set('statPublicasRed', statsBase.publicas);
          set('statPersonalRed', statsBase.personal);
          set('statBusinessRed', statsBase.business);
          set('statVerificadasRed', statsBase.verificadas);
        }

        if (!data || !data.length) {
          if (statsEl) statsEl.textContent = 'Ningún usuario coincide con el filtro.';
          const downloadsEl = document.getElementById(DOWNLOADS_ID);
          if (downloadsEl) downloadsEl.style.display = 'none';
          Plotly.purge(CONTAINER_ID);
          return;
        }
        render(data);
      })
      .catch(err => console.error('Error distribucion-comentadores-red:', err));
  }

  function init() {
    ['filterPrivateRed', 'filterBusinessRed', 'filterVerifiedRed'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', load);
    });
    ['filterCommentsExactRed', 'filterCommentsMinRed', 'filterCommentsMaxRed'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', applyCommentsAndRender);
        el.addEventListener('change', applyCommentsAndRender);
      }
    });
    const downloadsEl = document.getElementById(DOWNLOADS_ID);
    if (downloadsEl) {
      downloadsEl.querySelector('.btn-download-followers-red')?.addEventListener('click', () => {
        const data = downloadsEl._comentadoresData || [];
        const filtered = data.filter(d => d.followsCamilo);
        downloadCSV(toCSVRed(filtered), 'comentadores_followers.csv');
      });
      downloadsEl.querySelector('.btn-download-no-followers-red')?.addEventListener('click', () => {
        const data = downloadsEl._comentadoresData || [];
        const filtered = data.filter(d => !d.followsCamilo);
        downloadCSV(toCSVRed(filtered), 'comentadores_no_followers.csv');
      });
    }
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.ChartDistribucionComentadoresRed = { init, load };
})();
