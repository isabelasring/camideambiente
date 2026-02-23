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

  function load() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    const statsEl = document.getElementById(STATS_ID);
    if (statsEl) statsEl.textContent = 'Cargando...';

    fetch(buildUrl())
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((body) => {
        const data = body && body.data;
        const totalSigue = body && body.totalSigue;
        const totalNoSigue = body && body.totalNoSigue;
        const statsBase = body && body.statsBase;
        const totalFiltrado = body && body.totalFiltrado;

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
          Plotly.purge(CONTAINER_ID);
          return;
        }

        const sigue = data.filter(d => d.followsCamilo);
        const noSigue = data.filter(d => !d.followsCamilo);

        const maxComments = Math.max(1, ...data.map(d => d.commentsCount || 1));
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
          legend: { title: { text: 'En la red', font: { color: '#1f2937' } }, font: { color: '#374151' }, yanchor: 'top', y: 1, xanchor: 'left', x: 1.02 },
          margin: { t: 50, r: 150, b: 90, l: 70 }
        };

        Plotly.newPlot(CONTAINER_ID, traces, layout, { responsive: true, scrollZoom: true, displayModeBar: true, useResizeHandler: true });

        if (statsEl) {
          const s = (totalSigue ?? 0).toLocaleString('es-CO');
          const n = (totalNoSigue ?? 0).toLocaleString('es-CO');
          const tot = (totalFiltrado ?? data.length).toLocaleString('es-CO');
          statsEl.textContent = `Usuarios en el filtro: ${tot} (Siguen: ${s} | No siguen: ${n})`;
          statsEl.style.cssText = 'margin-top:1rem;color:rgba(255,255,255,0.7);font-size:0.9rem;';
        }
      })
      .catch(err => console.error('Error distribucion-comentadores-red:', err));
  }

  function init() {
    ['filterPrivateRed', 'filterBusinessRed', 'filterVerifiedRed'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', load);
    });
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.ChartDistribucionComentadoresRed = { init, load };
})();
