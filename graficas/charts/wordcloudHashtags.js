/**
 * Word cloud: Hashtags más frecuentes
 * Fuente: hashtags.json (filtrado por los filtros de arriba)
 */
(function() {
  'use strict';

  const CONTAINER_ID = 'wordcloudHashtags';
  const MIN_FREQ_ID = 'wordcloudHashtagsMinFreq';
  let currentData = [];
  let minFreq = 1;

  // Función para determinar si un hashtag tiene sentido o es un código/abreviación sin significado
  function isValidHashtag(hashtag) {
    const h = hashtag.toLowerCase();
    
    // Filtrar hashtags muy cortos (menos de 3 caracteres)
    if (h.length < 3) return false;
    
    // Filtrar hashtags que son solo números
    if (/^\d+$/.test(h)) return false;
    
    // Filtrar hashtags que son códigos (muchas mayúsculas seguidas con números)
    // Ejemplos: "SRDF2021", "ABC123", etc.
    if (/^[A-Z]{3,}\d+$/i.test(hashtag)) return false;
    if (/^[A-Z]+\d+[A-Z]*$/i.test(hashtag) && hashtag.length <= 8) return false;
    
    // Filtrar hashtags que son solo números y letras mezclados sin sentido aparente
    // Si tiene más números que letras y es corto, probablemente es un código
    const letters = (h.match(/[a-záéíóúñ]/gi) || []).length;
    const numbers = (h.match(/\d/g) || []).length;
    if (numbers > 0 && letters < 3 && h.length <= 8) return false;
    
    // Filtrar hashtags que son solo letras mayúsculas muy cortas (probablemente abreviaciones sin sentido)
    if (/^[A-Z]{2,4}$/.test(hashtag) && !['medellin', 'colombia', 'bogota', 'cali'].includes(h)) return false;
    
    // Filtrar patrones comunes de códigos
    const codePatterns = [
      /^\d+[a-z]{1,2}$/i,  // "2021a", "123ab"
      /^[a-z]{1,2}\d+$/i,  // "ab123", "x2021"
      /^[a-z]\d+[a-z]$/i   // "a123b"
    ];
    if (codePatterns.some(pattern => pattern.test(hashtag))) return false;
    
    return true;
  }

  function render(filteredData, minFrequency) {
    const freq = minFrequency !== undefined ? minFrequency : minFreq;
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    if (!filteredData || !filteredData.length) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;text-align:center;">No hay datos para mostrar.</p>';
      return;
    }

    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.id = 'wordcloudHashtagsCanvas';
    const w = container.offsetWidth || container.parentElement?.offsetWidth || 800;
    canvas.width = Math.max(600, w);
    canvas.height = 400;
    container.appendChild(canvas);

    // Extraer todos los hashtags y filtrar los que no tienen sentido
    const allHashtags = [];
    filteredData.forEach(post => {
      if (post.hashtags && Array.isArray(post.hashtags)) {
        post.hashtags.forEach(hashtag => {
          if (hashtag && hashtag.trim() && isValidHashtag(hashtag.trim())) {
            allHashtags.push(hashtag.trim());
          }
        });
      }
    });

    if (allHashtags.length === 0) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;text-align:center;">No hay hashtags para mostrar.</p>';
      return;
    }

    // Contar frecuencia de cada hashtag
    const hashtagCount = {};
    allHashtags.forEach(hashtag => {
      const normalized = hashtag.toLowerCase();
      hashtagCount[normalized] = (hashtagCount[normalized] || 0) + 1;
    });

    // Convertir a array, filtrar por frecuencia mínima y ordenar
    const hashtagList = Object.entries(hashtagCount)
      .map(([hashtag, count]) => [hashtag, count])
      .filter(([hashtag, count]) => count >= freq) // Filtrar por frecuencia mínima
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100); // Top 100 hashtags más frecuentes

    if (hashtagList.length === 0) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.7);padding:2rem;text-align:center;">No hay hashtags para mostrar.</p>';
      return;
    }

    // Renderizar word cloud
    if (typeof WordCloud !== 'undefined') {
      WordCloud(canvas, {
        list: hashtagList,
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

  // Función para actualizar el word cloud desde fuera
  function update(filteredData) {
    currentData = filteredData;
    render(filteredData, minFreq);
  }

  function init() {
    const minFreqEl = document.getElementById(MIN_FREQ_ID);
    const minFreqValEl = document.getElementById('wordcloudHashtagsMinFreqVal');
    
    if (minFreqEl) {
      minFreq = parseInt(minFreqEl.value, 10) || 1;
      if (minFreqValEl) minFreqValEl.textContent = minFreq;
      
      minFreqEl.addEventListener('input', () => {
        minFreq = parseInt(minFreqEl.value, 10) || 1;
        if (minFreqValEl) minFreqValEl.textContent = minFreq;
        if (currentData && currentData.length) {
          render(currentData, minFreq);
        }
      });
    }
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ChartWordCloudHashtags = { update };
})();
