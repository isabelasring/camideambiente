/**
 * Top 10 usuarios que más comentaron
 * Tabla con seguidores y comentarios.
 * Filtros: General (all) | Siguen a Camilo (yes) | No siguen a Camilo (no)
 */
(function() {
  'use strict';

  const API_URL = '/api/metrics/top-perfiles-comentadores';
  const CONTAINER_ID = 'chartTopProfilesComentadores';
  let lastData = [];
  let currentFollows = 'all';

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function csvEscape(val) {
    const s = String(val == null ? '' : val);
    if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function downloadCsv() {
    if (!lastData.length) return;
    const headers = ['#', 'Usuario', 'Seguidores', 'Comentarios', 'Cantidad de posts comentados'];
    const rows = lastData.map((p, i) => [
      i + 1,
      (p.username || '').trim(),
      p.followersCount || 0,
      p.commentCount || 0,
      p.postsComented || 0
    ]);
    const line = (arr) => arr.map(csvEscape).join(',');
    const csv = '\uFEFF' + line(headers) + '\r\n' + rows.map(line).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const names = { all: 'general', yes: 'siguen-camilo', no: 'no-siguen-camilo' };
    const filename = 'top-comentadores-' + (names[currentFollows] || currentFollows) + '.csv';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function renderTable(container, data) {
    if (!data || !data.length) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;">No hay datos.</p>';
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
          <td class="top-profiles-num">${(p.commentCount || 0).toLocaleString('es-CO')}</td>
          <td class="top-profiles-num">${(p.postsCommented || 0).toLocaleString('es-CO')}</td>
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
              <th>Comentarios</th>
              <th>Cantidad de posts comentados</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  function load(follows) {
    follows = follows || 'all';
    currentFollows = follows;
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;">Cargando…</p>';
    const url = (window.location.origin || '') + API_URL + '?follows=' + encodeURIComponent(follows);
    fetch(url)
      .then(r => r.json())
      .then(({ data }) => {
        lastData = data || [];
        renderTable(container, lastData);
      })
      .catch(() => {
        container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;">Error al cargar.</p>';
        lastData = [];
      });
  }

  function initTabs() {
    const tabs = document.querySelectorAll('.btn-top-comentadores-tab');
    tabs.forEach((btn) => {
      btn.addEventListener('click', function() {
        const follows = (this.getAttribute('data-follows') || 'all');
        tabs.forEach((b) => b.classList.remove('active'));
        this.classList.add('active');
        load(follows);
      });
    });
  }

  function initDownloadBtn() {
    const btn = document.getElementById('topComentadoresDownloadCsv');
    if (btn) btn.addEventListener('click', downloadCsv);
  }

  function init() {
    load('all');
    initTabs();
    initDownloadBtn();
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  window.TopPerfilesComentadores = { load, downloadCsv };
})();
