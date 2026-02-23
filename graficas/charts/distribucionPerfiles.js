/**
 * Gráfico Plotly: Distribución de perfiles
 * Igual que analisis_posibles_votantes.ipynb (líneas 1-49)
 * - x: follows_plot (seguidos), escala log
 * - y: followers_plot (seguidores), escala log
 * - size: postsCount
 * - color: segmento
 * - hover: Full Name, Username, seguidores, seguidos, posts, segmento
 */
(function() {
  'use strict';

  const API_URL = '/api/metrics/perfiles-seguidores';
  const CONTAINER_ID = 'chartDistribucionPerfiles';

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
      .then(({ data }) => {
        if (!data || !data.length) return;

        const segmentos = [...new Set(data.map(d => d.segmento))];
        const traces = segmentos.map(seg => {
          const filtered = data.filter(d => d.segmento === seg);
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
            text: 'Distribución de perfiles: Seguidores vs Seguidos (tamaño = posts)',
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

        const config = { responsive: true, scrollZoom: true, displayModeBar: true, useResizeHandler: true };

        Plotly.newPlot(CONTAINER_ID, traces, layout, config);
      })
      .catch(err => console.error('Error cargando distribucion perfiles:', err));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ChartDistribucionPerfiles = { init };
})();
