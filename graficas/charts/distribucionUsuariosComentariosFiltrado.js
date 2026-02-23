/**
 * Gráfico Plotly filtrado: Usuarios que comentaron - solo rango 200-4000 seguidores
 * Fuente: profileUsersComments.json
 * Filtros: privada/pública, personal/business, verificada
 */
(function() {
  'use strict';

  const BASE_URL = '/api/metrics/perfiles-comentarios';
  const MIN_FOLLOWERS = 200;
  const MAX_FOLLOWERS = 4000;
  const CONTAINER_ID = 'chartDistribucionUsuariosComentariosFiltrado';
  const STATS_ID = 'chartUsuariosComentariosFiltradoStats';

  function buildUrl() {
    const params = new URLSearchParams({ min_followers: '200', max_followers: '4000' });
    const priv = document.getElementById('filterPrivateProfiles');
    const bus = document.getElementById('filterBusinessProfiles');
    const ver = document.getElementById('filterVerifiedProfiles');
    if (priv && priv.value) params.set('private', priv.value);
    if (bus && bus.value) params.set('is_business', bus.value);
    if (ver && ver.value) params.set('verified', ver.value);
    return BASE_URL + '?' + params.toString();
  }

  const SEGMENTO_COLORS = {
    regular: '#94a3b8',
    activo: '#60a5fa',
    micro_influencer: '#a78bfa',
    influencer: '#fb923c',
    bajo_engagement: '#4ade80'
  };

  function load() {
    const container = document.getElementById(CONTAINER_ID);
    const stats = document.getElementById(STATS_ID);
    if (!container) return;

    if (stats) stats.textContent = 'Cargando...';
    fetch(buildUrl())
      .then(r => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((body) => {
        const data = body && body.data;
        const totalEnRango = body && body.totalEnRango;
        const totalFiltrado = body && body.totalFiltrado;
        const statsBase = body && body.statsBase;

        if (statsBase) {
          const fmt = n => (n ?? 0).toLocaleString('es-CO');
          const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = fmt(val); };
          set('statBaseProfiles', statsBase.base);
          set('statPrivadasProfiles', statsBase.privadas);
          set('statPublicasProfiles', statsBase.publicas);
          set('statPersonalProfiles', statsBase.personal);
          set('statBusinessProfiles', statsBase.business);
          set('statVerificadasProfiles', statsBase.verificadas);
        }

        if (!data || !data.length) {
          const stats = document.getElementById(STATS_ID);
          if (stats) stats.textContent = 'No hay usuarios en el rango 200-4000 seguidores';
          return;
        }

        const dataFiltrada = data.filter(d => {
          const f = d.followersCount ?? d.followers_plot ?? 0;
          return f >= MIN_FOLLOWERS && f <= MAX_FOLLOWERS;
        });

        if (!dataFiltrada.length) {
          const stats = document.getElementById(STATS_ID);
          if (stats) stats.textContent = 'No hay usuarios en el rango 200-4000 seguidores';
          return;
        }

        const segmentos = [...new Set(dataFiltrada.map(d => d.segmento))];
        const traces = segmentos.map(seg => {
          const filtered = dataFiltrada.filter(d => d.segmento === seg);
          return {
            x: filtered.map(d => d.follows_plot),
            y: filtered.map(d => d.followers_plot),
            mode: 'markers',
            type: 'scatter',
            name: seg,
            marker: {
              size: filtered.map(d => Math.min(50, Math.max(4, d.postsCount * 0.5))),
              sizemode: 'diameter',
              sizeref: 2,
              sizemin: 4,
              line: { width: 0.5, color: 'white' },
              color: SEGMENTO_COLORS[seg] || '#94a3b8'
            },
            text: filtered.map(d =>
              `${d.fullName || '—'}<br>@${d.username}<br>Seguidores: ${(d.followersCount || 0).toLocaleString()}<br>Seguidos: ${(d.followsCount || 0).toLocaleString()}<br>Posts: ${d.postsCount}<br>Segmento: ${d.segmento}`
            ),
            hoverinfo: 'text'
          };
        });

        const layout = {
          title: {
            text: 'Filtrado: 200-4000 seguidores (tamaño = posts)',
            font: { size: 14, color: '#1f2937' }
          },
          xaxis: {
            title: 'Following (seguidos) - escala log',
            type: 'log',
            gridcolor: 'rgba(0,0,0,0.1)',
            tickfont: { color: '#374151', size: 11 },
            titlefont: { color: '#1f2937' }
          },
          yaxis: {
            title: 'Followers (seguidores) - escala log',
            type: 'log',
            gridcolor: 'rgba(0,0,0,0.1)',
            tickfont: { color: '#374151', size: 11 },
            titlefont: { color: '#1f2937' }
          },
          paper_bgcolor: '#ffffff',
          plot_bgcolor: '#ffffff',
          font: { color: '#1f2937' },
          height: 400,
          autosize: true,
          showlegend: true,
          legend: {
            title: { text: 'Segmento', font: { color: '#1f2937' } },
            font: { color: '#374151' },
            yanchor: 'top',
            y: 1,
            xanchor: 'left',
            x: 1.02
          },
          margin: { t: 50, r: 140, b: 50, l: 60 }
        };

        Plotly.newPlot(CONTAINER_ID, traces, layout, { responsive: true, scrollZoom: true, displayModeBar: true, useResizeHandler: true });

        const statsEl = document.getElementById(STATS_ID);
        if (statsEl) {
          const n = (totalFiltrado ?? dataFiltrada.length).toLocaleString();
          const tot = (totalEnRango ?? 0).toLocaleString();
          statsEl.textContent = `Usuarios que cumplen el filtro: ${n} de ${tot} (rango 200-4000 seguidores)`;
          statsEl.style.cssText = 'margin-top:1rem;color:rgba(255,255,255,0.7);font-size:0.9rem;';
        }
      })
      .catch(err => console.error('Error cargando usuarios comentarios filtrado:', err));
  }

  function init() {
    const loadOnChange = () => load();
    ['filterPrivateProfiles', 'filterBusinessProfiles', 'filterVerifiedProfiles'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', loadOnChange);
    });
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ChartDistribucionUsuariosComentariosFiltrado = { init, load };
})();
