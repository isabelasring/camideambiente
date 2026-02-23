/**
 * Lista: Usuarios que más comentan en los posts populares
 * Fuente: commentsPopularPosts.csv vía API
 */
(function() {
  'use strict';

  const API_URL = '/api/metrics/usuarios-mas-comentadores';
  const CONTAINER_ID = 'usuariosMasComentadoresList';
  const BADGE_ID = 'usuariosComentadoresBadge';
  const SEARCH_ID = 'usuariosComentadoresSearch';

  let allData = [];

  function formatNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function render(data, searchTerm) {
    const list = document.getElementById(CONTAINER_ID);
    const badge = document.getElementById(BADGE_ID);
    if (!list) return;
    let toShow = data || [];
    if (searchTerm) {
      const q = searchTerm.toLowerCase().replace(/^@/, '').trim();
      toShow = toShow.filter(u => (u.username || '').toLowerCase().includes(q));
    }
    if (badge) badge.textContent = toShow.length ? toShow.length + ' usuarios' : (data?.length ? '0 de ' + data.length : '—');
    if (!toShow.length) {
      list.innerHTML = '<p style="color:rgba(255,255,255,0.7);">' + (data?.length ? 'Ningún usuario coincide con la búsqueda.' : 'No hay datos.') + '</p>';
      return;
    }
    const mid = Math.ceil(toShow.length / 2);
    const left = toShow.slice(0, mid);
    const right = toShow.slice(mid);
    const renderItem = (u, i) => {
      const pic = u.profilePicUrl ? `<img src="${esc(u.profilePicUrl)}" alt="" class="user-commenter-avatar" onerror="this.style.display='none'">` : '';
      const comments = formatNum(u.commentCount);
      const posts = (u.posts || []).slice(0, 5);
      const more = (u.posts || []).length > 5 ? (u.posts.length - 5) + ' más' : '';
      const postsHtml = posts.length
        ? posts.map(p => `<span class="user-post-tag" title="${esc(p.shortCaption)}">${esc(p.shortCaption.length > 35 ? p.shortCaption.substring(0, 35) + '…' : p.shortCaption)}</span>`).join('')
        : '';
      const profileUrl = 'https://www.instagram.com/' + (u.username || '').replace(/^@/, '') + '/';
      return `
        <a href="${esc(profileUrl)}" target="_blank" rel="noopener noreferrer" class="user-commenter-item user-commenter-item-link">
          <div class="user-commenter-header">
            <div class="user-commenter-avatar-wrap">${pic || '<div class="user-commenter-avatar-placeholder">@</div>'}</div>
            <div class="user-commenter-info">
              <span class="user-commenter-username">@${esc(u.username)}</span>
              <span class="user-commenter-count">${comments} comentarios</span>
            </div>
            <span class="user-commenter-rank">#${i + 1}</span>
          </div>
          <div class="user-commenter-posts">
            <span class="user-commenter-posts-label">Comentó en:</span>
            ${postsHtml}${more ? `<span class="user-post-tag more">+${more}</span>` : ''}
          </div>
        </a>
      `;
    };
    const colHtml = (col, offset) => col.map((u, j) => renderItem(u, offset + j)).join('');
    list.innerHTML = `
      <div class="usuarios-comentadores-col">${colHtml(left, 0)}</div>
      <div class="usuarios-comentadores-col">${colHtml(right, mid)}</div>
    `;
  }

  function load() {
    const list = document.getElementById(CONTAINER_ID);
    const searchEl = document.getElementById(SEARCH_ID);
    if (!list) return;
    list.innerHTML = '<p style="color:rgba(255,255,255,0.7);">Cargando...</p>';
    fetch(API_URL)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((body) => {
        allData = body && body.data ? body.data : [];
        render(allData, searchEl ? searchEl.value : '');
      })
      .catch(() => { if (list) list.innerHTML = '<p style="color:rgba(255,255,255,0.7);">Error al cargar.</p>'; });
    if (searchEl) {
      searchEl.addEventListener('input', () => render(allData, searchEl.value));
      searchEl.addEventListener('keyup', () => render(allData, searchEl.value));
    }
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', load) : load();
  window.UsuariosMasComentadores = { load };
})();
