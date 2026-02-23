/**
 * Gráfico Plotly filtrado: enfoque en el sesgo
 * Igual que analisis_posibles_votantes.ipynb (1-50)
 * Filtro: >500 seguidos Y 500-5000 seguidores
 */
(function() {
  'use strict';

  const API_URL = '/api/metrics/perfiles-seguidores?min_follows=500&min_followers=500&max_followers=5000';
  const MIN_FOLLOWS = 500;
  const MIN_FOLLOWERS = 500;
  const MAX_FOLLOWERS = 5000;
  const CONTAINER_ID = 'chartDistribucionPerfilesFiltrado';
  const STATS_ID = 'chartFiltradoStats';

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

    fetch((window.location.origin || '') + API_URL)
      .then(r => r.json())
      .then(({ data, total, totalFiltrado }) => {
        if (!data || !data.length) {
          const stats = document.getElementById(STATS_ID);
          if (stats) stats.textContent = 'No hay perfiles que cumplan el filtro';
          return;
        }

        const dataFiltrada = data.filter(d => {
          const f = d.followersCount ?? d.followers_plot ?? 0;
          const s = d.followsCount ?? d.follows_plot ?? 0;
          return s > MIN_FOLLOWS && f >= MIN_FOLLOWERS && f <= MAX_FOLLOWERS;
        });

        if (!dataFiltrada.length) {
          const stats = document.getElementById(STATS_ID);
          if (stats) stats.textContent = 'No hay perfiles que cumplan el filtro (500-5000 seguidores, >500 seguidos)';
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
            text: 'Filtrado: >500 seguidos, 500-5000 seguidores (tamaño = posts)',
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
          const tot = (total ?? data.length).toLocaleString();
          stats.textContent = `Perfiles en el filtro: ${n} de ${tot} totales (500-5000 seguidores, >500 seguidos)`;
          stats.style.cssText = 'margin-top:1rem;color:rgba(255,255,255,0.7);font-size:0.9rem;';
        }
      })
      .catch(err => console.error('Error cargando distribucion filtrada:', err));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ChartDistribucionPerfilesFiltrado = { init };
})();
