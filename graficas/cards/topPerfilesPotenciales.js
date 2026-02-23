/**
 * Top 6 perfiles con más seguidores en rango 500-5000, >500 seguidos
 * Fuente: perfilesSeguidores (API)
 */
(function() {
  'use strict';

  const API_URL = '/api/metrics/top-perfiles-potenciales';
  const CONTAINER_ID = 'topProfilesGrid';

  function load() {
    const grid = document.getElementById(CONTAINER_ID);
    if (!grid) return;

    fetch((window.location.origin || '') + API_URL)
      .then(r => r.json())
      .then(({ data }) => {
        if (!data || !data.length) {
          grid.innerHTML = '<p style="color:rgba(255,255,255,0.7);">No hay perfiles en el rango.</p>';
          return;
        }
        const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        grid.innerHTML = data.map(p => {
          const name = esc(p.fullName || '—');
          const short = name.length > 30 ? name.substring(0, 30) + '…' : name;
          const user = esc(p.username || '');
          const count = (p.followersCount || 0).toLocaleString('es-CO');
          return `<div class="top-profile-card"><div class="profile-name" title="${name}">${short}</div><div class="profile-username">@${user}</div><div class="profile-followers-count">${count} seguidores</div></div>`;
        }).join('');
      })
      .catch(() => {
        grid.innerHTML = '<p style="color:rgba(255,255,255,0.7);">Error al cargar.</p>';
      });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', load) : load();
  window.TopPerfilesPotenciales = { load };
})();
