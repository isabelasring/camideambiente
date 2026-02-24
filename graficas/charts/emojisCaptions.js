/**
 * Gráfico de barras: Emojis más utilizados en captions
 * Fuente: hashtags.json - campo caption (filtrado por los filtros de arriba)
 */
(function() {
  'use strict';

  const API_URL = '/api/metrics/emojis-captions';
  const CONTAINER_ID = 'chartEmojisCaptions';
  let chartInstance = null;
  let currentFilters = {};

  function updateChart() {
    const canvas = document.getElementById(CONTAINER_ID);
    if (!canvas) return;

    // No aplicar filtros - mostrar todos los datos
    const url = API_URL;

    fetch((window.location.origin || '') + url)
      .then(r => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((data) => {
        const emojis = data && data.emojis || [];
        
        if (emojis.length === 0) {
          if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
          }
          canvas.parentElement.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;text-align:center;">No hay emojis para mostrar.</p>';
          return;
        }

        // Preparar datos para el gráfico
        const labels = emojis.map(e => e.emoji);
        const counts = emojis.map(e => e.count);

        // Destruir gráfico anterior si existe
        if (chartInstance) {
          chartInstance.destroy();
        }

        // Crear nuevo gráfico
        const ctx = canvas.getContext('2d');
        chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Frecuencia',
              data: counts,
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
              borderRadius: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return 'Frecuencia: ' + context.parsed.y;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: '#374151',
                  font: { size: 11 }
                },
                grid: {
                  color: 'rgba(0,0,0,0.1)'
                }
              },
              x: {
                ticks: {
                  color: '#374151',
                  font: { size: 14 }
                },
                grid: {
                  display: false
                }
              }
            }
          }
        });
      })
      .catch(err => {
        console.error('Error emojis-captions:', err);
        if (chartInstance) {
          chartInstance.destroy();
          chartInstance = null;
        }
        canvas.parentElement.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;text-align:center;">Error al cargar datos.</p>';
      });
  }

  // Función para actualizar el gráfico desde fuera (no aplica filtros)
  function update(filteredData) {
    updateChart();
  }

  function init() {
    // Cargar inicialmente
    updateChart();
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ChartEmojisCaptions = { update };
})();
