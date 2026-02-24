/**
 * Gráfico de barras: Emojis más utilizados en los comentarios
 * Fuente: commentsPopularPosts.csv - columna text
 */
(function() {
  'use strict';

  const API_URL = '/api/metrics/emojis-comentarios';
  const CONTAINER_ID = 'chartEmojisComentarios';
  let chartInstance = null;

  function updateChart() {
    const canvas = document.getElementById(CONTAINER_ID);
    if (!canvas) return;

    fetch((window.location.origin || '') + API_URL)
      .then(r => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((data) => {
        const emojis = (data && data.emojis) || [];

        if (emojis.length === 0) {
          if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
          }
          const wrap = canvas.closest('.chart-canvas-wrap');
          if (wrap) wrap.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;text-align:center;">No hay emojis en los comentarios.</p>';
          return;
        }

        // Caracteres que suelen mostrarse como cuadrado blanco (sin glifo); mostramos "U+XXXX" como etiqueta
        const CODEPOINTS_NO_RENDER = ['25FB', '25A1', '2B1C', 'FFFD', '25AB', '2B1B'];
        const labels = emojis.map(e => {
          const cp = (e.codepoint || '').split('-')[0];
          if (cp && CODEPOINTS_NO_RENDER.includes(cp.toUpperCase())) {
            return 'U+' + cp.toUpperCase() + ' (' + e.count + ' usos)';
          }
          return e.emoji;
        });
        const counts = emojis.map(e => e.count);

        if (chartInstance) chartInstance.destroy();

        const ctx = canvas.getContext('2d');
        chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Frecuencia',
              data: counts,
              backgroundColor: 'rgba(37, 99, 235, 0.8)',
              borderColor: '#2563eb',
              borderWidth: 1,
              borderRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return 'Frecuencia: ' + context.parsed.x;
                  }
                }
              }
            },
            scales: {
              x: {
                beginAtZero: true,
                ticks: { color: '#374151', font: { size: 11 } },
                grid: { color: 'rgba(0,0,0,0.08)' }
              },
              y: {
                ticks: { color: '#374151', font: { size: 14 } },
                grid: { display: false }
              }
            }
          }
        });
      })
      .catch(err => {
        console.error('Error emojis-comentarios:', err);
        if (chartInstance) {
          chartInstance.destroy();
          chartInstance = null;
        }
        const wrap = canvas.closest('.chart-canvas-wrap');
        if (wrap) wrap.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;text-align:center;">Error al cargar datos.</p>';
      });
  }

  function init() {
    updateChart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ChartEmojisComentarios = { init, update: updateChart };
})();
