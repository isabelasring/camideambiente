/**
 * Gráfico Plotly filtrado: >500 seguidos Y 500-5000 seguidores
 * Filtros adicionales: privada/pública, personal/business, verificada
 */
(function() {
  'use strict';

  const BASE_URL = '/api/metrics/perfiles-seguidores';
  const MIN_FOLLOWS = 500;
  const MIN_FOLLOWERS = 500;
  const MAX_FOLLOWERS = 5000;
  const CONTAINER_ID = 'chartDistribucionPerfilesFiltrado';
  const STATS_ID = 'chartFiltradoStats';

  function buildUrl() {
    const params = new URLSearchParams({
      min_follows: String(MIN_FOLLOWS),
      min_followers: String(MIN_FOLLOWERS),
      max_followers: String(MAX_FOLLOWERS)
    });
    const priv = document.getElementById('filterPrivate');
    const bus = document.getElementById('filterBusiness');
    const ver = document.getElementById('filterVerified');
    if (priv && priv.value) params.set('private', priv.value);
    if (bus && bus.value) params.set('is_business', bus.value);
    if (ver && ver.value) params.set('verified', ver.value);
    return BASE_URL + '?' + params.toString();
  }

  const SEGMENTO_COLORS = {
    regular: '#94a3b8',
    activo: '#60a5fa',
    micro_influencer: '#a78bfa',
    influencer: '#fb923c',
    bajo_engagement: '#4ade80'
  };

  let cached = null;

  function render(data, totalEnRango, total, statsBase) {
    const container = document.getElementById(CONTAINER_ID);
    const stats = document.getElementById(STATS_ID);
    if (!container || !data || !data.length) return;

    if (statsBase) {
      const fmt = n => (n ?? 0).toLocaleString('es-CO');
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = fmt(val); };
      set('statBase', statsBase.base);
      set('statPrivadas', statsBase.privadas);
      set('statPublicas', statsBase.publicas);
      set('statPersonal', statsBase.personal);
      set('statBusiness', statsBase.business);
      set('statVerificadas', statsBase.verificadas);
    }

    let dataFiltrada = data.filter(d => {
      const f = d.followersCount ?? d.followers_plot ?? 0;
      const s = d.followsCount ?? d.follows_plot ?? 0;
      return s > MIN_FOLLOWS && f >= MIN_FOLLOWERS && f <= MAX_FOLLOWERS;
    });

    const postsExactEl = document.getElementById('filterPostsExact');
    const postsMinEl = document.getElementById('filterPostsMin');
    const postsMaxEl = document.getElementById('filterPostsMax');
    const postsExact = (postsExactEl && postsExactEl.value !== '') ? parseInt(postsExactEl.value, 10) : null;
    const postsMin = (postsMinEl && postsMinEl.value !== '') ? parseInt(postsMinEl.value, 10) : null;
    const postsMax = (postsMaxEl && postsMaxEl.value !== '') ? parseInt(postsMaxEl.value, 10) : null;
    if (postsExact != null && !isNaN(postsExact)) {
      dataFiltrada = dataFiltrada.filter(d => (d.postsCount ?? 0) === postsExact);
    } else {
      if (postsMin != null && !isNaN(postsMin)) {
        dataFiltrada = dataFiltrada.filter(d => (d.postsCount ?? 0) >= postsMin);
      }
      if (postsMax != null && !isNaN(postsMax)) {
        dataFiltrada = dataFiltrada.filter(d => (d.postsCount ?? 0) <= postsMax);
      }
    }

    if (!dataFiltrada.length) {
      if (stats) {
        stats.textContent = (postsExact != null && !isNaN(postsExact))
          ? `No hay perfiles con exactamente ${postsExact} posts en el rango actual.`
          : 'No hay perfiles que cumplan el filtro (500-5000 seguidores, >500 seguidos)';
      }
      return;
    }

    const segmentos = [...new Set(dataFiltrada.map(d => d.segmento))];
    const traces = segmentos.map(seg => {
      const filtered = dataFiltrada.filter(d => d.segmento === seg);
      return {
        x: filtered.map(d => d.follows_plot),
        y: filtered.map(d => d.followers_plot),
        mode: 'markers',
        type: 'scatter',
        name: seg,
        marker: {
          size: filtered.map(d => Math.min(50, Math.max(4, d.postsCount * 0.5))),
          sizemode: 'diameter',
          sizeref: 2,
          sizemin: 4,
          line: { width: 0.5, color: 'white' },
          color: SEGMENTO_COLORS[seg] || '#94a3b8'
        },
        text: filtered.map(d =>
          `${d.fullName || '—'}<br>@${d.username}<br>Seguidores: ${(d.followersCount || 0).toLocaleString()}<br>Seguidos: ${(d.followsCount || 0).toLocaleString()}<br>Posts: ${d.postsCount}<br>Segmento: ${d.segmento}`
        ),
        hoverinfo: 'text'
      };
    });

    const layout = {
      title: { text: 'Filtrado: >500 seguidos, 500-5000 seguidores (tamaño = posts)', font: { size: 14, color: '#1f2937' } },
      xaxis: { title: 'Following (seguidos) - escala log', type: 'log', gridcolor: 'rgba(0,0,0,0.1)', tickfont: { color: '#374151', size: 11 }, titlefont: { color: '#1f2937' } },
      yaxis: { title: 'Followers (seguidores) - escala log', type: 'log', gridcolor: 'rgba(0,0,0,0.1)', tickfont: { color: '#374151', size: 11 }, titlefont: { color: '#1f2937' } },
      paper_bgcolor: '#ffffff', plot_bgcolor: '#ffffff', font: { color: '#1f2937' },
      height: 400, autosize: true, showlegend: true,
      legend: { title: { text: 'Segmento', font: { color: '#1f2937' } }, font: { color: '#374151' }, yanchor: 'top', y: 1, xanchor: 'left', x: 1.02 },
      margin: { t: 50, r: 140, b: 50, l: 60 }
    };

    Plotly.newPlot(CONTAINER_ID, traces, layout, { responsive: true, scrollZoom: true, displayModeBar: true, useResizeHandler: true });

    if (stats) {
      const n = dataFiltrada.length.toLocaleString();
      const tot = (totalEnRango ?? total ?? 0).toLocaleString();
          let msg = `Perfiles que cumplen el filtro: ${n} de ${tot} (rango 500-5000 seguidores, >500 seguidos)`;
          if (postsExact != null && !isNaN(postsExact)) {
            msg += ` · exactamente ${postsExact} posts`;
          } else if ((postsMin != null && !isNaN(postsMin)) || (postsMax != null && !isNaN(postsMax))) {
            const r = [];
            if (postsMin != null && !isNaN(postsMin)) r.push(`≥${postsMin} posts`);
            if (postsMax != null && !isNaN(postsMax)) r.push(`≤${postsMax} posts`);
            msg += ` · ${r.join(' y ')}`;
          }
      stats.textContent = msg;
      stats.style.cssText = 'margin-top:1rem;color:rgba(255,255,255,0.7);font-size:0.9rem;';
    }
  }

  function applyPostsAndRender() {
    if (cached) {
      render(cached.data, cached.totalEnRango, cached.total, cached.statsBase);
    } else {
      load();
    }
  }

  function load() {
    const stats = document.getElementById(STATS_ID);
    if (stats) stats.textContent = 'Cargando...';
    fetch(buildUrl())
      .then(r => r.json())
      .then(({ data, total, totalEnRango, totalFiltrado, statsBase }) => {
        cached = { data: data || [], totalEnRango, total, statsBase };
        if (!data || !data.length) {
          if (stats) stats.textContent = 'No hay perfiles que cumplan el filtro';
          return;
        }
        render(data, totalEnRango, total, statsBase);
      })
      .catch(err => {
        console.error('Error cargando distribucion filtrada:', err);
        if (stats) stats.textContent = 'Error al cargar.';
      });
  }

  function init() {
    ['filterPrivate', 'filterBusiness', 'filterVerified'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', load);
    });
    ['filterPostsExact', 'filterPostsMin', 'filterPostsMax'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', applyPostsAndRender);
        el.addEventListener('change', applyPostsAndRender);
      }
    });
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ChartDistribucionPerfilesFiltrado = { init, load };
})();
