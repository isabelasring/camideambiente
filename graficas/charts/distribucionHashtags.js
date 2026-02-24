/**
 * Gráfica de distribución: Hashtags por fecha y hora
 * X: fecha, Y: hora del día. Popup al hacer click con datos del CSV (sin sentiment)
 */
(function() {
  'use strict';

  const API_URL = '/api/metrics/hashtags';
  const CONTAINER_ID = 'chartDistribucionHashtags';
  const POPUP_ID = 'hashtagPopup';

  function timeToMinutes(timeStr) {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
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
          text: data.map(d => '@' + (d.ownerUsername || '—') + '<br>' + d.dateStr + ' ' + d.timeStr + '<br>Likes: ' + (d.likesCount || 0)),
          hoverinfo: 'text',
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
          if (gd && gd.on) gd.on('plotly_click', (event) => {
            if (event.points && event.points[0]) {
              const pt = event.points[0];
              const d = pt.customdata;
              if (d) showPopup(d);
            }
          });
          requestAnimationFrame(() => {
            setTimeout(() => {
              if (typeof Plotly !== 'undefined' && gd) Plotly.Plots.resize(gd);
            }, 100);
          });
        });
      })
      .catch(err => {
        console.error('Error distribucion hashtags:', err);
        container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;">Error al cargar datos.</p>';
      });
  }

  function showPopup(d) {
    let popup = document.getElementById(POPUP_ID);
    if (!popup) {
      popup = document.createElement('div');
      popup.id = POPUP_ID;
      popup.className = 'hashtag-popup';
      document.body.appendChild(popup);
    }

    const caption = (d.caption || '—').substring(0, 200) + (d.caption && d.caption.length > 200 ? '…' : '');
    const hashtagsStr = (d.hashtags || []).length ? (d.hashtags || []).join(', ') : '—';

    popup.innerHTML = `
      <div class="hashtag-popup-content">
        <button type="button" class="hashtag-popup-close" aria-label="Cerrar">&times;</button>
        <div class="hashtag-popup-row"><strong>@${(d.ownerUsername || '—')}</strong></div>
        <div class="hashtag-popup-row"><strong>Fecha:</strong> ${d.dateStr || '—'}</div>
        <div class="hashtag-popup-row"><strong>Hora:</strong> ${d.timeStr || '—'}</div>
        <div class="hashtag-popup-row"><strong>Caption:</strong> ${escapeHtml(caption)}</div>
        <div class="hashtag-popup-row"><strong>Hashtags:</strong> ${escapeHtml(hashtagsStr)}</div>
        <div class="hashtag-popup-links">
          ${d.url ? `<a href="${escapeHtml(d.url)}" target="_blank" rel="noopener noreferrer">Ver en Instagram</a>` : ''}
          ${d.url ? `<a href="${escapeHtml(d.url)}" target="_blank" rel="noopener noreferrer">Ver imagen</a>` : ''}
        </div>
      </div>
    `;

    popup.classList.add('open');

    popup.querySelector('.hashtag-popup-close')?.addEventListener('click', () => popup.classList.remove('open'));
    popup.addEventListener('click', (e) => { if (e.target === popup) popup.classList.remove('open'); });
  }

  function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  window.ChartDistribucionHashtags = { load };
})();
