/**
 * Word cloud: Palabras más frecuentes en captions
 * Fuente: hashtags.json - campo caption (filtrado por los filtros de arriba)
 * Usa stopword del servidor para filtrar artículos y preposiciones
 */
(function() {
  'use strict';

  const API_URL = '/api/metrics/wordcloud-captions';
  const CONTAINER_ID = 'wordcloudCaptions';
  const MIN_FREQ_ID = 'wordcloudCaptionsMinFreq';
  let minFreq = 2;
  let currentFilters = {};

  function render(list, minFrequency) {
    const freq = minFrequency !== undefined ? minFrequency : minFreq;
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    if (!list || !list.length) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;text-align:center;">No hay palabras para mostrar.</p>';
      return;
    }

    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.id = 'wordcloudCaptionsCanvas';
    const w = container.offsetWidth || container.parentElement?.offsetWidth || 800;
    canvas.width = Math.max(600, w);
    canvas.height = 400;
    container.appendChild(canvas);

    // Filtrar por frecuencia mínima
    const wordList = list
      .filter(([word, count]) => count >= freq)
      .slice(0, 100); // Top 100 palabras más frecuentes

    if (wordList.length === 0) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;text-align:center;">No hay palabras con frecuencia suficiente.</p>';
      return;
    }

    // Renderizar word cloud
    if (typeof WordCloud !== 'undefined') {
      WordCloud(canvas, {
        list: wordList,
        gridSize: Math.round(16 * canvas.width / 1024),
        weightFactor: function(size) {
          return Math.pow(size, 1.2) * canvas.width / 1200;
        },
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: function() {
          const colors = ['#1e40af', '#7c3aed', '#059669', '#dc2626', '#d97706', '#0891b2', '#4f46e5', '#0d9488', '#be185d', '#0369a1'];
          return colors[Math.floor(Math.random() * colors.length)];
        },
        rotateRatio: 0.3,
        rotationSteps: 2,
        backgroundColor: '#ffffff',
        minSize: 8
      });
    } else {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;text-align:center;">Error: WordCloud library no está cargada.</p>';
    }
  }

  function load(filters) {
    currentFilters = filters || {};
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;text-align:center;">Cargando...</p>';

    // Construir URL con filtros
    const params = new URLSearchParams();
    if (currentFilters.keyword) params.set('keyword', currentFilters.keyword);
    if (currentFilters.dateFrom) params.set('dateFrom', currentFilters.dateFrom);
    if (currentFilters.dateTo) params.set('dateTo', currentFilters.dateTo);
    if (currentFilters.likesMin) params.set('likesMin', currentFilters.likesMin);

    const url = API_URL + (params.toString() ? '?' + params.toString() : '');

    fetch((window.location.origin || '') + url)
      .then(r => {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then((body) => {
        const list = body && body.list || [];
        render(list, minFreq);
      })
      .catch(err => {
        console.error('Error wordcloud-captions:', err);
        container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;text-align:center;">Error al cargar datos.</p>';
      });
  }

  // Función para actualizar el word cloud desde fuera
  function update(filteredData) {
    // Extraer filtros de los datos o usar los filtros actuales del formulario
    const keywordInput = document.getElementById('hashtagFilterKeyword');
    const dateFromInput = document.getElementById('hashtagFilterDateFrom');
    const dateToInput = document.getElementById('hashtagFilterDateTo');
    const likesMinInput = document.getElementById('hashtagFilterLikesMin');

    const filters = {
      keyword: keywordInput?.value.trim() || '',
      dateFrom: dateFromInput?.value || '',
      dateTo: dateToInput?.value || '',
      likesMin: likesMinInput?.value || ''
    };

    load(filters);
  }

  function init() {
    const minFreqEl = document.getElementById(MIN_FREQ_ID);
    const minFreqValEl = document.getElementById('wordcloudCaptionsMinFreqVal');
    
    if (minFreqEl) {
      minFreq = parseInt(minFreqEl.value, 10) || 2;
      if (minFreqValEl) minFreqValEl.textContent = minFreq;
      
      minFreqEl.addEventListener('input', () => {
        minFreq = parseInt(minFreqEl.value, 10) || 2;
        if (minFreqValEl) minFreqValEl.textContent = minFreq;
        // Recargar con los filtros actuales
        load(currentFilters);
      });
    }

    // Cargar inicialmente sin filtros
    load({});
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ChartWordCloudCaptions = { update, load };
})();
