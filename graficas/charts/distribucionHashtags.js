/**
 * Gráfica de distribución: Hashtags por fecha y hora
 * X: fecha, Y: hora del día. Popup al hacer click con datos del CSV (sin sentiment)
 */
(function() {
  'use strict';

  const API_URL = '/api/metrics/hashtags';
  const CONTAINER_ID = 'chartDistribucionHashtags';
  const POPUP_ID = 'hashtagPopup';
  let allData = []; // Almacenar todos los datos originales

  function timeToMinutes(timeStr) {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  function filterData(data, filters) {
    return data.filter(d => {
      // Filtro por palabra clave (en caption o hashtags)
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        const captionMatch = (d.caption || '').toLowerCase().includes(keyword);
        const hashtagsMatch = (d.hashtags || []).some(h => h.toLowerCase().includes(keyword));
        if (!captionMatch && !hashtagsMatch) return false;
      }

      // Filtro por fecha desde
      if (filters.dateFrom) {
        const dateFrom = new Date(filters.dateFrom);
        const postDate = new Date(d.timestamp);
        if (postDate < dateFrom) return false;
      }

      // Filtro por fecha hasta
      if (filters.dateTo) {
        const dateTo = new Date(filters.dateTo);
        dateTo.setHours(23, 59, 59, 999); // Incluir todo el día
        const postDate = new Date(d.timestamp);
        if (postDate > dateTo) return false;
      }

      // Filtro por likes mínimos
      if (filters.likesMin) {
        const minLikes = parseInt(filters.likesMin, 10) || 0;
        if ((d.likesCount || 0) < minLikes) return false;
      }

      return true;
    });
  }

  function updateChart(data) {
    const container = document.getElementById(CONTAINER_ID);
    if (!container || !data || !data.length) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;">No hay datos que coincidan con los filtros.</p>';
      return;
    }

    if (typeof Plotly !== 'undefined') Plotly.purge(CONTAINER_ID);

    const x = data.map(d => d.dateNum);
    const y = data.map(d => timeToMinutes(d.timeStr));
    const likes = data.map(d => Math.max(1, d.likesCount || 0));
    const maxLikes = Math.max(...likes, 1);
    const diamMax = 50;
    const sizeref = (2 * maxLikes) / (diamMax * diamMax);

    const trace = {
      x,
      y,
      mode: 'markers',
      type: 'scatter',
      marker: {
        size: likes,
        sizemode: 'area',
        sizeref,
        sizemin: 8,
        color: '#06b6d4',
        opacity: 0.7,
        line: { width: 0.5, color: 'white' }
      },
      hoverinfo: 'none',
      customdata: data
    };

    const layout = {
      title: { text: 'Hashtags por fecha y hora (tamaño = likes)', font: { size: 14, color: '#1f2937' } },
      xaxis: {
        title: 'Fecha',
        type: 'date',
        tickformat: '%Y-%m-%d',
        tickangle: -45,
        gridcolor: 'rgba(0,0,0,0.1)',
        tickfont: { color: '#374151', size: 10 }
      },
      yaxis: {
        title: 'Hora',
        tickvals: [0, 360, 720, 1080, 1440],
        ticktext: ['00:00', '06:00', '12:00', '18:00', '24:00'],
        gridcolor: 'rgba(0,0,0,0.1)',
        tickfont: { color: '#374151', size: 11 }
      },
      paper_bgcolor: '#ffffff',
      plot_bgcolor: '#ffffff',
      font: { color: '#1f2937' },
      height: 480,
      autosize: true,
      margin: { t: 50, r: 40, b: 100, l: 60 }
    };

    Plotly.newPlot(CONTAINER_ID, [trace], layout, {
      responsive: true,
      scrollZoom: true,
      displayModeBar: true,
      useResizeHandler: true
    }).then(() => {
      const gd = document.getElementById(CONTAINER_ID);
      if (gd && gd.on) {
        // Mostrar popup al hacer hover
        gd.on('plotly_hover', (event) => {
          if (event.points && event.points[0]) {
            const pt = event.points[0];
            const d = pt.customdata;
            if (d) showPopup(d, event);
          }
        });
        // Ocultar popup cuando el mouse sale
        gd.on('plotly_unhover', () => {
          hidePopup();
        });
      }
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (typeof Plotly !== 'undefined' && gd) Plotly.Plots.resize(gd);
        }, 100);
      });
    });
  }

  function load() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;">Cargando...</p>';
    if (typeof Plotly !== 'undefined') Plotly.purge(CONTAINER_ID);

    fetch((window.location.origin || '') + API_URL)
      .then(r => r.json())
      .then(({ data }) => {
        if (!data || !data.length) {
          container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;">No hay datos de hashtags.</p>';
          return;
        }

        // Guardar todos los datos originales
        allData = data;

        // Configurar event listeners para los filtros
        setupFilters();

        // Mostrar gráfica inicial con todos los datos
        updateChart(data);
        
        // Inicializar también la gráfica de usuarios
        if (window.ChartDistribucionUsuariosHashtags && window.ChartDistribucionUsuariosHashtags.update) {
          window.ChartDistribucionUsuariosHashtags.update(data);
        }
        
        // Inicializar también el word cloud de hashtags
        if (window.ChartWordCloudHashtags && window.ChartWordCloudHashtags.update) {
          window.ChartWordCloudHashtags.update(data);
        }
        // Inicializar también el word cloud de captions
        if (window.ChartWordCloudCaptions && window.ChartWordCloudCaptions.update) {
          window.ChartWordCloudCaptions.update(data);
        }
        // Inicializar también el gráfico de emojis
        if (window.ChartEmojisCaptions && window.ChartEmojisCaptions.update) {
          window.ChartEmojisCaptions.update(data);
        }
      })
      .catch(err => {
        console.error('Error distribucion hashtags:', err);
        container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;">Error al cargar datos.</p>';
      });
  }

  function setupFilters() {
    const applyBtn = document.getElementById('hashtagFilterApply');
    const resetBtn = document.getElementById('hashtagFilterReset');

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const filters = {
          keyword: document.getElementById('hashtagFilterKeyword')?.value.trim() || '',
          dateFrom: document.getElementById('hashtagFilterDateFrom')?.value || '',
          dateTo: document.getElementById('hashtagFilterDateTo')?.value || '',
          likesMin: document.getElementById('hashtagFilterLikesMin')?.value || ''
        };

        const filteredData = filterData(allData, filters);
        updateChart(filteredData);
        // Actualizar también la gráfica de usuarios
        if (window.ChartDistribucionUsuariosHashtags && window.ChartDistribucionUsuariosHashtags.update) {
          window.ChartDistribucionUsuariosHashtags.update(filteredData);
        }
        // Actualizar también el word cloud de hashtags
        if (window.ChartWordCloudHashtags && window.ChartWordCloudHashtags.update) {
          window.ChartWordCloudHashtags.update(filteredData);
        }
        // Actualizar también el word cloud de captions
        if (window.ChartWordCloudCaptions && window.ChartWordCloudCaptions.update) {
          window.ChartWordCloudCaptions.update(filteredData);
        }
        // El gráfico de emojis no se actualiza con filtros (muestra siempre todos los datos)
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        // Limpiar todos los campos de filtro
        const keywordInput = document.getElementById('hashtagFilterKeyword');
        const dateFromInput = document.getElementById('hashtagFilterDateFrom');
        const dateToInput = document.getElementById('hashtagFilterDateTo');
        const likesMinInput = document.getElementById('hashtagFilterLikesMin');

        if (keywordInput) keywordInput.value = '';
        if (dateFromInput) dateFromInput.value = '';
        if (dateToInput) dateToInput.value = '';
        if (likesMinInput) likesMinInput.value = '';

        // Mostrar todos los datos
        updateChart(allData);
        // Actualizar también la gráfica de usuarios
        if (window.ChartDistribucionUsuariosHashtags && window.ChartDistribucionUsuariosHashtags.update) {
          window.ChartDistribucionUsuariosHashtags.update(allData);
        }
        // Actualizar también el word cloud de hashtags
        if (window.ChartWordCloudHashtags && window.ChartWordCloudHashtags.update) {
          window.ChartWordCloudHashtags.update(allData);
        }
        // Actualizar también el word cloud de captions
        if (window.ChartWordCloudCaptions && window.ChartWordCloudCaptions.update) {
          window.ChartWordCloudCaptions.update(allData);
        }
        // El gráfico de emojis no se actualiza con filtros (muestra siempre todos los datos)
      });
    }
  }

  let hideTimeout = null;

  function showPopup(d, event) {
    // Cancelar cualquier timeout de ocultar
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    let popup = document.getElementById(POPUP_ID);
    const container = document.getElementById(CONTAINER_ID);
    const chartWrap = container ? container.closest('.chart-canvas-wrap') : null;
    
    if (!popup) {
      popup = document.createElement('div');
      popup.id = POPUP_ID;
      popup.className = 'hashtag-popup';
      if (chartWrap) {
        // Insertar el popup dentro del contenedor de la gráfica
        chartWrap.style.position = 'relative';
        chartWrap.appendChild(popup);
      } else if (container && container.parentElement) {
        container.parentElement.style.position = 'relative';
        container.parentElement.appendChild(popup);
      } else {
        document.body.appendChild(popup);
      }
    }

    const caption = (d.caption || '—').substring(0, 500) + (d.caption && d.caption.length > 500 ? '…' : '');
    const hashtagsStr = (d.hashtags && d.hashtags.length) ? d.hashtags.join(', ') : '—';

    // Posicionar el popup dentro del contenedor de la gráfica
    let left = '50%';
    let top = '50%';
    const targetContainer = chartWrap || (container ? container.parentElement : null);
    
    if (event && event.event && targetContainer) {
      const containerRect = targetContainer.getBoundingClientRect();
      const mouseX = event.event.clientX - containerRect.left;
      const mouseY = event.event.clientY - containerRect.top;
      
      // Posicionar a la derecha del cursor, asegurándose de que quepa dentro
      const popupWidth = 420; // max-width del popup
      const popupHeight = 300; // altura estimada
      
      if (mouseX + popupWidth + 20 > containerRect.width) {
        // Si no cabe a la derecha, ponerlo a la izquierda
        left = Math.max(mouseX - popupWidth - 10, 10) + 'px';
      } else {
        left = (mouseX + 15) + 'px';
      }
      
      if (mouseY + popupHeight > containerRect.height) {
        // Si no cabe abajo, ajustar hacia arriba
        top = Math.max(mouseY - popupHeight - 10, 10) + 'px';
      } else {
        top = (mouseY - 10) + 'px';
      }
    }

    popup.innerHTML = `
      <div class="hashtag-popup-content" style="left: ${left}; top: ${top};">
        <div class="hashtag-popup-row"><strong>Usuario:</strong> @${escapeHtml(d.ownerUsername || '—')}</div>
        <div class="hashtag-popup-row"><strong>Hashtags:</strong> ${escapeHtml(hashtagsStr)}</div>
        <div class="hashtag-popup-row"><strong>Caption:</strong> ${escapeHtml(caption)}</div>
        <div class="hashtag-popup-row"><strong>Comentarios:</strong> ${d.commentsCount || 0}</div>
        <div class="hashtag-popup-row"><strong>Likes:</strong> ${d.likesCount || 0}</div>
        <div class="hashtag-popup-links">
          ${d.url ? `<a href="${escapeHtml(d.url)}" target="_blank" rel="noopener noreferrer" class="hashtag-popup-link-instagram">Ver en Instagram</a>` : ''}
        </div>
      </div>
    `;

    popup.classList.add('open');

    // Permitir que el usuario pueda hacer hover sobre el popup
    const popupContent = popup.querySelector('.hashtag-popup-content');
    if (popupContent) {
      popupContent.addEventListener('mouseenter', () => {
        if (hideTimeout) {
          clearTimeout(hideTimeout);
          hideTimeout = null;
        }
      });
      popupContent.addEventListener('mouseleave', () => {
        hidePopup();
      });
    }
  }

  function hidePopup() {
    // Agregar un pequeño delay para permitir que el usuario mueva el mouse al popup
    hideTimeout = setTimeout(() => {
      const popup = document.getElementById(POPUP_ID);
      if (popup) {
        popup.classList.remove('open');
      }
      hideTimeout = null;
    }, 200);
  }

  function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  window.ChartDistribucionHashtags = { load };
})();
