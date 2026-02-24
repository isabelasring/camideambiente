/**
 * Lista: Posts con más comentarios (top 23)
 * Al hacer click: se despliega debajo de esa card la gráfica + botón Ver post
 */
(function() {
  'use strict';

  const API_URL = '/api/metrics/posts-mas-comentados';
  const API_COMENTADORES = '/api/metrics/comentadores-post';
  const CONTAINER_ID = 'postsList';
  let postsData = [];
  let sentimentFilterPost = 'all';

  function csvEscape(v) {
    const s = String(v == null ? '' : v);
    if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function downloadPostsCSV() {
    if (!postsData.length) return;
    const headers = ['#', 'Título', 'Comentarios', 'Likes', 'URL'];
    const rows = postsData.map((p, i) => [
      i + 1,
      (p.name || '').trim(),
      p.commentsCount ?? '',
      p.likesCount ?? '',
      (p.url || '').trim()
    ]);
    const line = (arr) => arr.map(csvEscape).join(',');
    const csv = '\uFEFF' + line(headers) + '\r\n' + rows.map(line).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'posts-mas-comentados.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }

  function toCSV(arr) {
    const cols = ['username', 'fullName', 'followersCount', 'followsCount', 'commentsInPost', 'sigueCamilo'];
    const esc = v => {
      const s = String(v ?? '').replace(/"/g, '""');
      return /[,"\n\r]/.test(s) ? '"' + s + '"' : s;
    };
    const header = cols.join(',');
    const rows = arr.map(d => [
      esc(d.username),
      esc(d.fullName),
      d.followersCount ?? '',
      d.followsCount ?? '',
      d.commentsInPost ?? '',
      d.followsCamilo ? 'Sí' : 'No'
    ].join(','));
    return '\uFEFF' + header + '\r\n' + rows.join('\r\n');
  }

  function toCSVComments(data) {
    const esc = v => {
      const s = String(v ?? '').replace(/"/g, '""');
      return /[,"\n\r]/.test(s) ? '"' + s + '"' : s;
    };
    const header = 'Usuario,Nombre,Seguidores,Seguidos,Sigue a Camilo,Comentario,Sentimiento';
    const rows = [];
    (data || []).forEach((d) => {
      const items = (d.commentsWithSentiment && d.commentsWithSentiment.length)
        ? d.commentsWithSentiment
        : (d.commentsTexts || []).map(t => ({ text: t, sentiment: '' }));
      items.forEach((c) => {
        const text = typeof c === 'object' && c != null ? c.text : c;
        const sent = (typeof c === 'object' && c != null ? (c.sentiment || '') : '') || '';
        rows.push([
          esc(d.username),
          esc(d.fullName),
          d.followersCount ?? '',
          d.followsCount ?? '',
          d.followsCamilo ? 'Sí' : 'No',
          esc(text),
          sent || '—'
        ].join(','));
      });
    });
    return '\uFEFF' + header + '\r\n' + rows.join('\r\n');
  }

  function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function renderChart(chartId, data, postUrl) {
    const chartEl = document.getElementById(chartId);
    const expand = chartEl?.closest('.post-item-expand');
    if (!expand) return;
    expand._comentadoresDataRaw = data || [];
    expand._postUrl = postUrl;
    let dataFiltrada = data || [];
    if (sentimentFilterPost !== 'all') {
      const sent = sentimentFilterPost.toUpperCase();
      dataFiltrada = dataFiltrada
        .map((d) => {
          const arr = (d.commentsWithSentiment || []).filter((c) => (c.sentiment || '').toUpperCase() === sent);
          return { ...d, commentsInPost: arr.length, commentsWithSentiment: arr };
        })
        .filter((d) => (d.commentsInPost || 0) > 0);
    }
    expand._comentadoresData = dataFiltrada;
    const btnVer = expand.querySelector('.btn-ver-post');
    const btnFollowers = expand.querySelector('.btn-download-followers');
    const btnNoFollowers = expand.querySelector('.btn-download-no-followers');
    const btnComments = expand.querySelector('.btn-download-comments-post');
    if (btnVer) {
      btnVer.href = postUrl;
      btnVer.style.display = 'inline-flex';
    }
    if (btnComments) {
      btnComments.style.display = dataFiltrada.length ? 'inline-flex' : 'none';
      btnComments.dataset.postUrl = postUrl;
    }
    if (btnFollowers) {
      btnFollowers.style.display = dataFiltrada.length ? 'inline-flex' : 'none';
      btnFollowers.dataset.postUrl = postUrl;
    }
    if (btnNoFollowers) {
      btnNoFollowers.style.display = dataFiltrada.length ? 'inline-flex' : 'none';
      btnNoFollowers.dataset.postUrl = postUrl;
    }
    if (!dataFiltrada.length) {
      chartEl.innerHTML = '<p style="color:rgba(255,255,255,0.8);padding:2rem;">No hay comentarios para este post' + (sentimentFilterPost !== 'all' ? ' con sentimiento ' + (sentimentFilterPost === 'POSITIVO' ? 'positivo' : sentimentFilterPost === 'NEGATIVO' ? 'negativo' : 'neutro') : '') + '.</p>';
      return;
    }
    const WRAP_WIDTH = 48;
    function escHtml(s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/\n/g, ' ');
    }
    function wrapToWidth(text) {
      const t = text.trim();
      if (!t) return '';
      const parts = [];
      let rest = t;
      while (rest.length > 0) {
        if (rest.length <= WRAP_WIDTH) {
          parts.push(rest);
          break;
        }
        let cut = rest.slice(0, WRAP_WIDTH);
        const lastSpace = cut.lastIndexOf(' ');
        if (lastSpace > WRAP_WIDTH / 2) cut = cut.slice(0, lastSpace);
        parts.push(cut);
        rest = rest.slice(cut.length).trim();
      }
      return parts.join('<br>');
    }
    function sentimentLabel(sentiment) {
      const s = (sentiment || '').toUpperCase();
      if (s === 'POSITIVO') return '  [Positivo]';
      if (s === 'NEGATIVO') return '  [Negativo]';
      if (s === 'NEUTRO') return '  [Neutro]';
      return '';
    }
    function tooltipText(d) {
      const lines = [
        (d.fullName || '—') + '<br>@' + d.username,
        'Seguidores: ' + (d.followersCount || 0).toLocaleString(),
        'Seguidos: ' + (d.followsCount || 0).toLocaleString(),
        'Comentarios en este post: ' + (d.commentsInPost || 0),
        d.followsCamilo ? '✓ Sigue a Camilo' : '✗ No sigue'
      ];
      const withSentiment = d.commentsWithSentiment && d.commentsWithSentiment.length;
      const items = withSentiment ? d.commentsWithSentiment : (d.commentsTexts || []).map(t => ({ text: t, sentiment: null }));
      if (items.length) {
        lines.push('<br><b>Textos de los comentarios:</b>');
        items.forEach((c, i) => {
          const text = typeof c === 'object' && c != null ? c.text : c;
          const safe = escHtml(text);
          const wrapped = wrapToWidth(safe);
          const sent = typeof c === 'object' && c != null ? c.sentiment : null;
          lines.push((i + 1) + '. ' + wrapped + sentimentLabel(sent));
        });
      }
      return lines.join('<br>');
    }

    const sigue = dataFiltrada.filter(d => d.followsCamilo);
    const noSigue = dataFiltrada.filter(d => !d.followsCamilo);
    const maxComments = Math.max(1, ...dataFiltrada.map(d => d.commentsInPost || 1));
    const diamMax = 50;
    const sizeref = (2 * maxComments) / (diamMax * diamMax);
    const trace = (arr, name, color) => ({
      x: arr.map(d => d.follows_plot),
      y: arr.map(d => d.followers_plot),
      mode: 'markers',
      type: 'scatter',
      name,
      marker: {
        size: arr.map(d => Math.max(1, d.commentsInPost || 1)),
        sizemode: 'area',
        sizeref,
        sizemin: 4,
        line: { width: 0.5, color: 'white' },
        color
      },
      text: arr.map(d => tooltipText(d)),
      hoverinfo: 'text'
    });
    const traces = [
      trace(sigue, 'Sigue a Camilo', '#dc2626'),
      trace(noSigue, 'No sigue a Camilo', '#2563eb')
    ].filter(t => t.x.length > 0);
    const layout = {
      title: { text: 'Seguidores vs Seguidos (tamaño = comentarios)', font: { size: 12, color: '#1f2937' } },
      xaxis: { title: 'Following (seguidos)', type: 'log', gridcolor: 'rgba(0,0,0,0.1)' },
      yaxis: { title: 'Followers (seguidores)', type: 'log', gridcolor: 'rgba(0,0,0,0.1)' },
      paper_bgcolor: '#ffffff',
      plot_bgcolor: '#ffffff',
      font: { color: '#1f2937' },
      height: 400,
      showlegend: true,
      legend: { font: { color: '#374151' }, itemsizing: 'constant', itemwidth: 40 },
      margin: { t: 40, r: 80, b: 60, l: 60 },
      hoverlabel: {
        bgcolor: '#ffffff',
        bordercolor: 'rgba(0,0,0,0.2)',
        font: { size: 12, color: '#1f2937', family: 'sans-serif' }
      }
    };
    Plotly.newPlot(chartId, traces, layout, { responsive: true, scrollZoom: true, displayModeBar: true });
  }

  function expandPost(wrapper, postUrl, chartId) {
    const expand = wrapper.querySelector('.post-item-expand');
    const chartEl = wrapper.querySelector('.post-item-expand-chart');
    if (!expand || !chartEl) return;
    document.querySelectorAll('.post-item-wrapper').forEach(w => {
      const ex = w.querySelector('.post-item-expand');
      const ch = w.querySelector('.post-item-expand-chart');
      if (ex) ex.style.display = 'none';
      if (ch && typeof Plotly !== 'undefined') Plotly.purge(ch.id);
      w.querySelector('.post-item')?.classList.remove('post-item-active');
      w.classList.remove('post-item-wrapper-expanded');
    });
    expand.style.display = 'block';
    wrapper.querySelector('.post-item')?.classList.add('post-item-active');
    wrapper.classList.add('post-item-wrapper-expanded');
    chartEl.innerHTML = '';
    expand.querySelectorAll('.btn-ver-post, .btn-download-comments-post, .btn-download-followers, .btn-download-no-followers').forEach(b => { b.style.display = 'none'; });
    expand.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    fetch(API_COMENTADORES + '?postUrl=' + encodeURIComponent(postUrl))
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((body) => {
        const chart = wrapper.querySelector('.post-item-expand-chart');
        if (chart && chart.id === chartId) renderChart(chartId, body?.data, postUrl);
      })
      .catch(() => {
        const chart = wrapper.querySelector('.post-item-expand-chart');
        if (chart) chart.innerHTML = '<p style="color:#ef4444;padding:2rem;">Error al cargar.</p>';
      });
  }

  function collapseExpand(wrapper) {
    const expand = wrapper?.querySelector('.post-item-expand');
    const chartEl = wrapper?.querySelector('.post-item-expand-chart');
    if (expand) expand.style.display = 'none';
    if (chartEl && typeof Plotly !== 'undefined') Plotly.purge(chartEl.id);
    wrapper?.querySelector('.post-item')?.classList.remove('post-item-active');
    wrapper?.classList.remove('post-item-wrapper-expanded');
  }

  function render(data) {
    const list = document.getElementById(CONTAINER_ID);
    if (!list) return;
    postsData = Array.isArray(data) ? data : [];
    if (!postsData.length) {
      list.innerHTML = '<p style="color:rgba(255,255,255,0.7);">No hay posts.</p>';
      return;
    }
    const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const half = Math.ceil(data.length / 2);
    const left = data.slice(0, half);
    const right = data.slice(half);

    const downloadPostsBtn = document.getElementById('postsListDownloadCsv');
    if (downloadPostsBtn && !downloadPostsBtn.dataset.bound) {
      downloadPostsBtn.dataset.bound = '1';
      downloadPostsBtn.addEventListener('click', downloadPostsCSV);
    }

    const renderCol = (arr, offset) => arr.map((p, i) => {
      const idx = offset + i;
      const name = esc(p.name || 'Post sin título');
      const short = name.length > 60 ? name.substring(0, 60) + '…' : name;
      const comments = formatNum(p.commentsCount || 0);
      const likes = formatNum(p.likesCount || 0);
      const url = (p.url || '').trim();
      const clickable = !!url;
      const chartId = 'chartComentadoresPost_' + idx;
      return `
        <div class="post-item-wrapper">
          <div class="post-item ${clickable ? 'post-clickable' : ''}" ${clickable ? 'data-post-url="' + esc(url) + '" data-chart-id="' + chartId + '"' : ''} role="${clickable ? 'button' : 'presentation'}">
            <div class="post-info">
              <span class="post-title" title="${name}">${short}</span>
              <span class="post-meta">Post #${idx + 1}</span>
            </div>
            <div class="post-stats">
              <div class="post-value">${comments} comentarios</div>
              <div class="post-change">${likes} likes</div>
            </div>
          </div>
          ${clickable ? `
          <div class="post-item-expand" style="display:none;">
            <p class="chart-subtitle posts-expand-subtitle">Primeros 100 comentarios. Rojo = sigue a Camilo. Azul = no sigue.</p>
            <div class="chart-filters-row" style="margin-bottom:0.5rem;flex-wrap:wrap;gap:0.35rem;align-items:center;">
              <span style="color:rgba(255,255,255,0.8);font-size:0.9rem;margin-right:0.25rem;">Sentimiento:</span>
              <button type="button" class="btn btn-small btn-sentiment-filter-post active" data-sentiment="all" title="Ver todos los comentarios sin filtrar">Todos</button>
              <button type="button" class="btn btn-small btn-sentiment-filter-post" data-sentiment="POSITIVO">Positivo</button>
              <button type="button" class="btn btn-small btn-sentiment-filter-post" data-sentiment="NEGATIVO">Negativo</button>
              <button type="button" class="btn btn-small btn-sentiment-filter-post" data-sentiment="NEUTRO">Neutro</button>
            </div>
            <div id="${chartId}" class="post-item-expand-chart chart-canvas-wrap-tall" style="min-height:400px;"></div>
            <div class="post-expand-buttons">
              <button type="button" class="btn btn-download-comments-post" style="display:none;" title="Descargar comentarios del filtro actual (con columna Sentimiento)">Comentarios CSV</button>
              <button type="button" class="btn btn-download-followers" style="display:none;">Followers CSV</button>
              <button type="button" class="btn btn-download-no-followers" style="display:none;">No followers CSV</button>
              <a href="#" target="_blank" rel="noopener noreferrer" class="btn btn-ver-post" style="display:none;">Ver post en Instagram</a>
            </div>
          </div>
          ` : ''}
        </div>
      `;
    }).join('');

    list.innerHTML = `
      <div class="posts-col">${renderCol(left, 0)}</div>
      <div class="posts-col">${renderCol(right, half)}</div>
    `;

    if (!list.dataset.downloadBound) {
      list.dataset.downloadBound = '1';
      list.addEventListener('click', (e) => {
        const btnComments = e.target.closest('.btn-download-comments-post');
        if (btnComments) {
          const expand = btnComments.closest('.post-item-expand');
          const data = expand?._comentadoresData || [];
          const slug = (expand?._postUrl || btnComments.dataset.postUrl || '').match(/\/p\/([^/?]+)/)?.[1] || 'post';
          const suf = sentimentFilterPost === 'all' ? '' : '_' + sentimentFilterPost.toLowerCase();
          downloadCSV(toCSVComments(data), 'comentarios_' + slug + suf + '.csv');
          return;
        }
        const btn = e.target.closest('.btn-download-followers, .btn-download-no-followers');
        if (btn) {
          const expand = btn.closest('.post-item-expand');
          const data = expand?._comentadoresData || [];
          const slug = (btn.dataset.postUrl || '').match(/\/p\/([^/?]+)/)?.[1] || 'post';
          const isFollowers = btn.classList.contains('btn-download-followers');
          const filtered = isFollowers ? data.filter(d => d.followsCamilo) : data.filter(d => !d.followsCamilo);
          downloadCSV(toCSV(filtered), (isFollowers ? 'followers' : 'no_followers') + '_' + slug + '.csv');
          return;
        }
        const sentimentBtn = e.target.closest('.btn-sentiment-filter-post');
        if (sentimentBtn) {
          const sent = (sentimentBtn.getAttribute('data-sentiment') || 'all').toUpperCase();
          if (sentimentFilterPost === (sent === 'ALL' ? 'all' : sent)) return;
          sentimentFilterPost = sent === 'ALL' ? 'all' : sent;
          list.querySelectorAll('.btn-sentiment-filter-post').forEach((b) => b.classList.remove('active'));
          list.querySelectorAll('.btn-sentiment-filter-post[data-sentiment="' + sentimentFilterPost + '"]').forEach((b) => b.classList.add('active'));
          const expanded = list.querySelector('.post-item-wrapper-expanded');
          if (expanded) {
            const expand = expanded.querySelector('.post-item-expand');
            const chartEl = expanded.querySelector('.post-item-expand-chart');
            const raw = expand?._comentadoresDataRaw;
            const postUrl = expand?._postUrl;
            if (chartEl && chartEl.id && raw && postUrl) renderChart(chartEl.id, raw, postUrl);
          }
        }
      });
    }

    let activeWrapper = null;
    list.querySelectorAll('.post-clickable').forEach((card) => {
      const wrapper = card.closest('.post-item-wrapper');
      card.addEventListener('click', () => {
        const url = card.getAttribute('data-post-url');
        const chartId = card.getAttribute('data-chart-id');
        if (!url) return;
        const same = activeWrapper === wrapper;
        if (same) {
          collapseExpand(wrapper);
          activeWrapper = null;
        } else {
          activeWrapper = wrapper;
          expandPost(wrapper, url, chartId);
        }
      });
    });
  }

  function load() {
    const list = document.getElementById(CONTAINER_ID);
    if (!list) return;
    if (window.__POSTS_MAS_COMENTADOS__) {
      render(window.__POSTS_MAS_COMENTADOS__);
      return;
    }
    fetch(API_URL)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((body) => render(body && body.data))
      .catch(() => { list.innerHTML = '<p style="color:rgba(255,255,255,0.7);">Error al cargar.</p>'; });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', load) : load();
  window.PostsMasComentados = { load };
})();
