/**
 * Gráfica de distribución: Usuarios - Likes vs Comentarios
 * X: Total de likes por usuario, Y: Total de comentarios por usuario
 * Tamaño: Número de posts del usuario
 */
(function() {
  'use strict';

  const CONTAINER_ID = 'chartDistribucionUsuariosHashtags';
  const POPUP_ID = 'hashtagUserPopup';

  function updateChart(filteredData) {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    if (!filteredData || !filteredData.length) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;">No hay datos para mostrar.</p>';
      return;
    }

    if (typeof Plotly !== 'undefined') Plotly.purge(CONTAINER_ID);

    // Agrupar datos por usuario
    const userData = {};
    
    filteredData.forEach(d => {
      const username = d.ownerUsername || 'desconocido';
      if (!userData[username]) {
        userData[username] = {
          username: username,
          totalLikes: 0,
          totalComments: 0,
          postCount: 0,
          ownerFullName: d.ownerFullName || ''
        };
      }
      userData[username].totalLikes += d.likesCount || 0;
      userData[username].totalComments += d.commentsCount || 0;
      userData[username].postCount += 1;
    });

    // Convertir a array
    const users = Object.values(userData);

    if (users.length === 0) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;">No hay usuarios para mostrar.</p>';
      return;
    }

    const x = users.map(u => u.totalLikes);
    const y = users.map(u => u.totalComments);
    const sizes = users.map(u => u.postCount);
    const maxSize = Math.max(...sizes, 1);
    const diamMax = 50;
    const sizeref = (2 * maxSize) / (diamMax * diamMax);

    const trace = {
      x,
      y,
      mode: 'markers',
      type: 'scatter',
      marker: {
        size: sizes,
        sizemode: 'area',
        sizeref,
        sizemin: 8,
        color: '#06b6d4',
        opacity: 0.7,
        line: { width: 0.5, color: 'white' }
      },
      hoverinfo: 'none',
      customdata: users
    };

    const layout = {
      title: { text: 'Likes vs Comentarios por Usuario', font: { size: 14, color: '#1f2937' } },
      xaxis: {
        title: 'Total de Likes',
        gridcolor: 'rgba(0,0,0,0.1)',
        tickfont: { color: '#374151', size: 10 }
      },
      yaxis: {
        title: 'Total de Comentarios',
        gridcolor: 'rgba(0,0,0,0.1)',
        tickfont: { color: '#374151', size: 11 }
      },
      paper_bgcolor: '#ffffff',
      plot_bgcolor: '#ffffff',
      font: { color: '#1f2937' },
      height: 480,
      autosize: true,
      margin: { t: 50, r: 40, b: 80, l: 80 }
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
            const user = pt.customdata;
            if (user) showPopup(user, event);
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

  let hideTimeout = null;

  function showPopup(user, event) {
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
        chartWrap.style.position = 'relative';
        chartWrap.appendChild(popup);
      } else if (container && container.parentElement) {
        container.parentElement.style.position = 'relative';
        container.parentElement.appendChild(popup);
      } else {
        document.body.appendChild(popup);
      }
    }

    // Posicionar el popup dentro del contenedor de la gráfica
    let left = '50%';
    let top = '50%';
    const targetContainer = chartWrap || (container ? container.parentElement : null);
    
    if (event && event.event && targetContainer) {
      const containerRect = targetContainer.getBoundingClientRect();
      const mouseX = event.event.clientX - containerRect.left;
      const mouseY = event.event.clientY - containerRect.top;
      
      const popupWidth = 420;
      const popupHeight = 250;
      
      if (mouseX + popupWidth + 20 > containerRect.width) {
        left = Math.max(mouseX - popupWidth - 10, 10) + 'px';
      } else {
        left = (mouseX + 15) + 'px';
      }
      
      if (mouseY + popupHeight > containerRect.height) {
        top = Math.max(mouseY - popupHeight - 10, 10) + 'px';
      } else {
        top = (mouseY - 10) + 'px';
      }
    }

    popup.innerHTML = `
      <div class="hashtag-popup-content" style="left: ${left}; top: ${top};">
        <div class="hashtag-popup-row"><strong>Usuario:</strong> @${escapeHtml(user.username || '—')}</div>
        ${user.ownerFullName ? `<div class="hashtag-popup-row"><strong>Nombre:</strong> ${escapeHtml(user.ownerFullName)}</div>` : ''}
        <div class="hashtag-popup-row"><strong>Total Likes:</strong> ${user.totalLikes || 0}</div>
        <div class="hashtag-popup-row"><strong>Total Comentarios:</strong> ${user.totalComments || 0}</div>
        <div class="hashtag-popup-row"><strong>Número de Posts:</strong> ${user.postCount || 0}</div>
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

  // Función para actualizar la gráfica desde fuera
  function update(filteredData) {
    updateChart(filteredData);
  }

  window.ChartDistribucionUsuariosHashtags = { update };
})();
