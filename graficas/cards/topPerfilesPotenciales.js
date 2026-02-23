/**
 * Top 10 perfiles en rango 500-5000 seguidores, >500 seguidos
 * Ordenados por seguidores y posts. Tabla.
 */
(function() {
  'use strict';

  const API_URL = '/api/metrics/top-perfiles-potenciales';
  const CONTAINER_ID = 'chartTopProfilesPotenciales';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function load() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    fetch((window.location.origin || '') + API_URL)
      .then(r => r.json())
      .then(({ data }) => {
        if (!data || !data.length) {
          container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;">No hay perfiles en el rango.</p>';
          return;
        }
        const rows = data.map((p, i) => {
          const profileUrl = 'https://www.instagram.com/' + (p.username || '').replace(/^@/, '') + '/';
          return `
            <tr>
              <td class="top-profiles-rank">#${i + 1}</td>
              <td>
                <a href="${esc(profileUrl)}" target="_blank" rel="noopener noreferrer" class="top-profiles-user-link">
                  @${esc(p.username)}
                </a>
              </td>
              <td class="top-profiles-num">${(p.followersCount || 0).toLocaleString('es-CO')}</td>
              <td class="top-profiles-num">${(p.postsCount || 0).toLocaleString('es-CO')}</td>
            </tr>
          `;
        }).join('');
        container.innerHTML = `
          <div class="top-profiles-table-wrap">
            <table class="top-profiles-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Usuario</th>
                  <th>Seguidores</th>
                  <th>Posts</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        `;
      })
      .catch(() => {
        container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;">Error al cargar.</p>';
      });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', load) : load();
  window.TopPerfilesPotenciales = { load };
})();
