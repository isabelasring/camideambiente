const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const CSVJSON_PATH = path.resolve(process.cwd(), 'csvjson');

/**
 * GET /api/metrics/seguidores
 * Cuenta total de seguidores desde seguidoresCamilo.csv y .json
 */
router.get('/seguidores', (req, res) => {
  try {
    const csvPath = path.join(CSVJSON_PATH, 'seguidoresCamilo.csv');
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      const count = Math.max(0, lines.length - 1);
      return res.json({ count, source: 'seguidoresCamilo.csv' });
    }
    const jsonPath = path.join(CSVJSON_PATH, 'seguidoresCamilo.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const count = Array.isArray(data) ? data.length : 0;
      return res.json({ count, source: 'seguidoresCamilo.json' });
    }
    return res.status(404).json({ error: 'Archivo de seguidores no encontrado' });
  } catch (err) {
    console.error('Error leyendo seguidores:', err);
    return res.status(500).json({ error: 'Error al leer datos de seguidores' });
  }
});

/**
 * GET /api/metrics/posts
 * Cuenta total de posts desde postsCamilo.csv
 */
router.get('/posts', (req, res) => {
  try {
    const csvPath = path.join(CSVJSON_PATH, 'postsCamilo.csv');
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      const count = Math.max(0, lines.length - 1); // excluir header
      return res.json({ count, source: 'postsCamilo.csv' });
    }
    return res.status(404).json({ error: 'Archivo de posts no encontrado' });
  } catch (err) {
    console.error('Error leyendo posts:', err);
    return res.status(500).json({ error: 'Error al leer datos de posts' });
  }
});

/**
 * Calcula segmento igual que el notebook (analisis_posibles_votantes)
 */
function calcularSegmento(followersCount, postsCount) {
  const f = parseInt(followersCount, 10) || 0;
  const p = parseFloat(postsCount) || 0;
  if (f >= 10000) return 'influencer';
  if (f >= 1000 && f < 10000) return 'micro_influencer';
  if (p >= 100 && f < 1000) return 'activo';
  if (p <= 5 && f < 500) return 'bajo_engagement';
  return 'regular';
}

/**
 * GET /api/metrics/perfiles-seguidores
 * Datos para gráfica Plotly: follows_plot, followers_plot, postsCount (size), segmento
 * Igual lógica que analisis_posibles_votantes.ipynb
 */
router.get('/perfiles-seguidores', (req, res) => {
  try {
    const jsonPath = path.join(CSVJSON_PATH, 'perfilesSeguidores.json');
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({ error: 'perfilesSeguidores no encontrado' });
    }
    let raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (!Array.isArray(raw)) raw = [];
    const data = raw
      .filter(p => p.followersCount != null && p.followsCount != null)
      .map(p => {
        const followers = parseInt(p.followersCount, 10) || 1;
        const follows = parseInt(p.followsCount, 10) || 1;
        const posts = parseFloat(p.postsCount) || 0;
        const postsPlot = (posts === 0 || isNaN(posts)) ? 0.1 : posts;
        return {
          followers_plot: Math.max(1, followers),
          follows_plot: Math.max(1, follows),
          postsCount: postsPlot,
          followersCount: followers,
          followsCount: follows,
          username: p.username || '',
          fullName: (p.fullName || '').trim() || p.username || '—',
          segmento: calcularSegmento(followers, posts)
        };
      });
    const minFollows = parseInt(req.query.min_follows, 10);
    const minFollowers = parseInt(req.query.min_followers, 10);
    const maxFollowers = parseInt(req.query.max_followers, 10);
    let filtered = data;
    if (!isNaN(minFollows) || !isNaN(minFollowers) || !isNaN(maxFollowers)) {
      filtered = data.filter(p => {
        if (!isNaN(minFollows) && p.followsCount <= minFollows) return false;
        if (!isNaN(minFollowers) && p.followersCount < minFollowers) return false;
        if (!isNaN(maxFollowers) && p.followersCount > maxFollowers) return false;
        return true;
      });
    }
    const step = Math.max(1, Math.floor(filtered.length / 1000));
    const sampled = filtered.filter((_, i) => i % step === 0).slice(0, 1000);
    return res.json({
      data: sampled,
      total: data.length,
      totalFiltrado: filtered.length
    });
  } catch (err) {
    console.error('Error perfiles-seguidores:', err);
    return res.status(500).json({ error: 'Error al leer perfilesSeguidores' });
  }
});

module.exports = router;
