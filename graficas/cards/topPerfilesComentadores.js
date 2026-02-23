/**
 * Top 6 perfiles con más seguidores en rango 200-4000
 * Usuarios que comentaron - Gráfico de barras horizontales
 */
(function() {
  'use strict';

  const API_URL = '/api/metrics/top-perfiles-comentadores';
  const CHART_ID = 'chartTopProfilesComentadores';

  function load() {
    const container = document.getElementById(CHART_ID);
    if (!container) return;

    fetch((window.location.origin || '') + API_URL)
      .then(r => r.json())
      .then(({ data }) => {
        if (!data || !data.length) {
          container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;">No hay perfiles en el rango 200-4000 seguidores.</p>';
          return;
        }
        const labels = data.map(p => '@' + (p.username || '')).reverse();
        const values = data.map(p => p.followersCount || 0).reverse();
        const textHover = data.map(p => (p.fullName || p.username || '—') + '<br>@' + (p.username || '') + '<br>' + (p.followersCount || 0).toLocaleString('es-CO') + ' seguidores').reverse();

        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

        const trace = {
          x: values,
          y: labels,
          type: 'bar',
          orientation: 'h',
          marker: { color: labels.map((_, i) => colors[i % colors.length]), line: { width: 1 } },
          text: values.map(v => v.toLocaleString('es-CO')),
          textposition: 'outside',
          textfont: { color: '#374151', size: 11 },
          hovertext: textHover,
          hoverinfo: 'text'
        };

        const layout = {
          margin: { l: 100, r: 80, t: 20, b: 40 },
          xaxis: { title: 'Seguidores', gridcolor: 'rgba(0,0,0,0.08)', tickfont: { color: '#374151' } },
          yaxis: { tickfont: { color: '#374151', size: 12 } },
          paper_bgcolor: '#ffffff',
          plot_bgcolor: '#ffffff',
          font: { color: '#1f2937' },
          height: 280,
          showlegend: false
        };

        Plotly.newPlot(CHART_ID, [trace], layout, { responsive: true, displayModeBar: true });
      })
      .catch(() => {
        container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;">Error al cargar.</p>';
      });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', load) : load();
  window.TopPerfilesComentadores = { load };
})();
