/**
 * Gráfico Plotly filtrado: Usuarios que comentaron - solo rango 500-5000 seguidores
 * - Y: seguidores, X: seguidos (escala log)
 * - size: postsCount
 * - Solo muestra usuarios con 500 <= seguidores <= 5000
 */
(function() {
  'use strict';

  const API_URL = '/api/metrics/perfiles-comentarios?min_followers=500&max_followers=5000';
  const MIN_FOLLOWERS = 500;
  const MAX_FOLLOWERS = 5000;
  const CONTAINER_ID = 'chartDistribucionUsuariosComentariosFiltrado';
  const STATS_ID = 'chartUsuariosComentariosFiltradoStats';

  const SEGMENTO_COLORS = {
    regular: '#94a3b8',
    activo: '#60a5fa',
    micro_influencer: '#a78bfa',
    influencer: '#fb923c',
    bajo_engagement: '#4ade80'
  };

  function init() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    fetch(API_URL)
      .then(r => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((body) => {
        const data = body && body.data;
        const total = body && body.total;
        const totalFiltrado = body && body.totalFiltrado;

        if (!data || !data.length) {
          const stats = document.getElementById(STATS_ID);
          if (stats) stats.textContent = 'No hay usuarios en el rango 500-5000 seguidores';
          return;
        }

        const dataFiltrada = data.filter(d => {
          const f = d.followersCount ?? d.followers_plot ?? 0;
          return f >= MIN_FOLLOWERS && f <= MAX_FOLLOWERS;
        });

        if (!dataFiltrada.length) {
          const stats = document.getElementById(STATS_ID);
          if (stats) stats.textContent = 'No hay usuarios en el rango 500-5000 seguidores';
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
            text: 'Filtrado: 500-5000 seguidores (tamaño = posts)',
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

        const stats = document.getElementById(STATS_ID);
        if (stats) {
          const n = dataFiltrada.length.toLocaleString();
          const tot = (total ?? 0).toLocaleString();
          stats.textContent = `Usuarios en el rango: ${n} de ${tot} totales (500-5000 seguidores)`;
          stats.style.cssText = 'margin-top:1rem;color:rgba(255,255,255,0.7);font-size:0.9rem;';
        }
      })
      .catch(err => console.error('Error cargando usuarios comentarios filtrado:', err));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ChartDistribucionUsuariosComentariosFiltrado = { init };
})();
