/**
 * Lista: Posts con más comentarios (top 23)
 * Fuente: postsCamilo.csv vía API
 */
(function() {
  'use strict';

  const API_URL = '/api/metrics/posts-mas-comentados';
  const CONTAINER_ID = 'postsList';

  function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }

  function render(data) {
    const list = document.getElementById(CONTAINER_ID);
    if (!list) return;
    if (!data || !Array.isArray(data) || !data.length) {
      list.innerHTML = '<p style="color:rgba(255,255,255,0.7);">No hay posts.</p>';
      return;
    }
    const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    list.innerHTML = data.map((p, i) => {
          const name = esc(p.name || 'Post sin título');
          const short = name.length > 60 ? name.substring(0, 60) + '…' : name;
          const comments = formatNum(p.commentsCount || 0);
          const likes = formatNum(p.likesCount || 0);
          return `
            <div class="post-item">
              <div class="post-info">
                <span class="post-title" title="${name}">${short}</span>
                <span class="post-meta">Post #${i + 1}</span>
              </div>
              <div class="post-stats">
                <div class="post-value">${comments} comentarios</div>
                <div class="post-change">${likes} likes</div>
              </div>
            </div>
          `;
        }).join('');
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
