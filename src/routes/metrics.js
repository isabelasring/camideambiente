const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
// Ruta relativa al proyecto (src/routes -> proyecto raíz)
const CSVJSON_PATH = path.join(__dirname, '..', '..', 'csvjson');

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
 * Parsea CSV con campos entre comillas (soporta newlines y comas dentro)
 */
function parseCSV(content) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const next = content[i + 1];
    if (inQuotes) {
      if (c === '"') {
        if (next === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',' || c === '\n' || c === '\r') {
        row.push(field.trim());
        field = '';
        if (c === '\n' || (c === '\r' && next !== '\n')) {
          if (row.some(cell => cell)) rows.push(row);
          row = [];
        }
        if (c === '\r' && next === '\n') i++;
      } else field += c;
    }
  }
  if (field || row.length) row.push(field.trim()), rows.push(row);
  return rows;
}

/**
 * GET /api/metrics/posts-mas-comentados
 * Top 23 posts por comentarios desde postsCamilo.csv
 */
router.get('/posts-mas-comentados', (req, res) => {
  try {
    const csvPath = path.join(CSVJSON_PATH, 'postsCamilo.csv');
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ error: 'postsCamilo no encontrado' });
    }
    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(content);
    if (rows.length < 2) return res.json({ data: [] });
    const headers = rows[0].map(h => (h || '').toLowerCase().trim());
    const idx = (n) => headers.indexOf(n) >= 0 ? headers.indexOf(n) : -1;
    const iCaption = idx('caption');
    const iComments = idx('commentscount');
    const iLikes = idx('likescount');
    const iUrl = idx('url');
    if (iCaption < 0 || iComments < 0 || iLikes < 0) {
      return res.status(500).json({ error: 'Columnas requeridas no encontradas' });
    }
    const posts = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const caption = (r[iCaption] || '').trim();
      const comments = parseInt(r[iComments], 10) || 0;
      const likes = parseInt(r[iLikes], 10) || 0;
      const url = (r[iUrl] || '').trim().replace(/\/$/, '');
      const name = caption.replace(/\s+/g, ' ').substring(0, 80);
      posts.push({ name: name || 'Post sin título', commentsCount: comments, likesCount: likes, url: url || null });
    }
    const top23 = posts
      .sort((a, b) => b.commentsCount - a.commentsCount)
      .slice(0, 23)
      .map((p, i) => ({ ...p, postIndex: i + 1 }));
    return res.json({ data: top23 });
  } catch (err) {
    console.error('Error posts-mas-comentados:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/metrics/comentadores-post
 * Primeros 100 comentarios de un post. Parámetro: postUrl
 * Devuelve usuarios con: username, followersCount, followsCount, commentsInPost, followsCamilo
 * Para gráfica de burbujas: tamaño = comentarios en el post, color = sigue/no sigue
 */
router.get('/comentadores-post', (req, res) => {
  try {
    const postUrl = (req.query.postUrl || req.query.post_url || '').trim().replace(/\/$/, '');
    if (!postUrl) {
      return res.status(400).json({ error: 'postUrl requerido' });
    }

    const commentsPath = path.join(CSVJSON_PATH, 'commentsPopularPosts.csv');
    const profilePath = path.join(CSVJSON_PATH, 'profileUsersComments.json');
    const seguidoresPath = path.join(CSVJSON_PATH, 'seguidoresCamilo.csv');

    if (!fs.existsSync(commentsPath)) {
      return res.status(404).json({ error: 'commentsPopularPosts no encontrado' });
    }
    if (!fs.existsSync(profilePath)) {
      return res.status(404).json({ error: 'profileUsersComments no encontrado' });
    }
    if (!fs.existsSync(seguidoresPath)) {
      return res.status(404).json({ error: 'seguidoresCamilo no encontrado' });
    }

    const norm = (u) => (u || '').trim().replace(/\/$/, '');
    const commentRows = parseCSV(fs.readFileSync(commentsPath, 'utf8'));
    const cHeaders = commentRows[0]?.map(h => (h || '').toLowerCase().trim()) || [];
    const iOwner = cHeaders.indexOf('ownerusername');
    const iPostUrl = cHeaders.indexOf('posturl');
    if (iOwner < 0 || iPostUrl < 0) {
      return res.status(500).json({ error: 'Columnas ownerUsername, postUrl requeridas' });
    }

    const commentsForPost = [];
    for (let i = 1; i < commentRows.length && commentsForPost.length < 100; i++) {
      const r = commentRows[i];
      const url = norm(r[iPostUrl]);
      if (url !== norm(postUrl)) continue;
      const user = (r[iOwner] || '').trim();
      if (user) commentsForPost.push({ user: user.toLowerCase() });
    }

    const commentsByUser = {};
    for (const c of commentsForPost) {
      const u = c.user;
      commentsByUser[u] = (commentsByUser[u] || 0) + 1;
    }

    const segRows = parseCSV(fs.readFileSync(seguidoresPath, 'utf8'));
    const segHeaders = segRows[0]?.map(h => (h || '').toLowerCase().trim()) || [];
    const iSegUser = segHeaders.indexOf('username');
    const sigueSet = new Set();
    for (let i = 1; i < segRows.length; i++) {
      const u = (segRows[i][iSegUser] || '').trim().toLowerCase();
      if (u) sigueSet.add(u);
    }

    const profiles = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    const profileMap = new Map();
    for (const p of (Array.isArray(profiles) ? profiles : [])) {
      const u = (p.username || '').toLowerCase();
      if (u) profileMap.set(u, p);
    }

    const result = [];
    for (const [user, commentsInPost] of Object.entries(commentsByUser)) {
      const prof = profileMap.get(user) || {};
      const followers = parseInt(prof.followersCount, 10) || 1;
      const follows = parseInt(prof.followsCount, 10) || 1;
      result.push({
        username: prof.username || user,
        fullName: (prof.fullName || '').trim() || user,
        followersCount: followers,
        followsCount: follows,
        followers_plot: Math.max(1, followers),
        follows_plot: Math.max(1, follows),
        commentsInPost,
        followsCamilo: sigueSet.has(user)
      });
    }

    return res.json({
      data: result,
      postUrl,
      totalComentarios: commentsForPost.length
    });
  } catch (err) {
    console.error('Error comentadores-post:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/metrics/usuarios-mas-comentadores
 * Usuarios que más comentan en los 23 posts más populares (primeros 100 comentarios/post)
 * Fuente: commentsPopularPosts.csv
 * Incluye en qué posts comentó cada usuario (mapeo desde postsCamilo.csv)
 */
router.get('/usuarios-mas-comentadores', (req, res) => {
  try {
    const commentsPath = path.join(CSVJSON_PATH, 'commentsPopularPosts.csv');
    const postsPath = path.join(CSVJSON_PATH, 'postsCamilo.csv');
    if (!fs.existsSync(commentsPath)) {
      return res.status(404).json({ error: 'commentsPopularPosts no encontrado' });
    }
    if (!fs.existsSync(postsPath)) {
      return res.status(404).json({ error: 'postsCamilo no encontrado' });
    }

    const norm = (u) => (u || '').trim().replace(/\/$/, '');
    const postRows = parseCSV(fs.readFileSync(postsPath, 'utf8'));
    const postHeaders = postRows[0]?.map(h => (h || '').toLowerCase().trim()) || [];
    const iUrl = postHeaders.indexOf('url');
    const iCaption = postHeaders.indexOf('caption');
    const urlToCaption = {};
    for (let i = 1; i < postRows.length; i++) {
      const r = postRows[i];
      const url = norm(r[iUrl]);
      const cap = (r[iCaption] || '').replace(/\s+/g, ' ').trim().substring(0, 70);
      if (url) urlToCaption[url] = cap || 'Post';
    }

    const commentRows = parseCSV(fs.readFileSync(commentsPath, 'utf8'));
    const cHeaders = commentRows[0]?.map(h => (h || '').toLowerCase().trim()) || [];
    const iOwner = cHeaders.indexOf('ownerusername');
    const iPostUrl = cHeaders.indexOf('posturl');
    const iPic = cHeaders.indexOf('ownerprofilepicurl');
    if (iOwner < 0 || iPostUrl < 0) {
      return res.status(500).json({ error: 'Columnas ownerUsername, postUrl requeridas' });
    }

    const byUser = {};
    for (let i = 1; i < commentRows.length; i++) {
      const r = commentRows[i];
      const user = (r[iOwner] || '').trim();
      const postUrl = norm(r[iPostUrl]);
      const pic = (r[iPic] || '').trim();
      if (!user) continue;
      if (!byUser[user]) {
        byUser[user] = { username: user, profilePicUrl: pic || null, count: 0, postUrls: new Set() };
      }
      byUser[user].count++;
      if (postUrl) byUser[user].postUrls.add(postUrl);
    }

    const list = Object.values(byUser)
      .map(u => ({
        username: u.username,
        profilePicUrl: u.profilePicUrl,
        commentCount: u.count,
        posts: [...u.postUrls].map(url => ({
          url,
          shortCaption: urlToCaption[url] || 'Post'
        }))
      }))
      .sort((a, b) => b.commentCount - a.commentCount);
    return res.json({ data: list });
  } catch (err) {
    console.error('Error usuarios-mas-comentadores:', err);
    return res.status(500).json({ error: err.message });
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
 * GET /api/metrics/perfiles-analizados
 * Cuenta desde perfilesSeguidores.csv o .json
 */
router.get('/perfiles-analizados', (req, res) => {
  try {
    const jsonPath = path.join(CSVJSON_PATH, 'perfilesSeguidores.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      const count = Array.isArray(data) ? data.length : 0;
      return res.json({ count, source: 'perfilesSeguidores.json' });
    }
    const csvPath = path.join(CSVJSON_PATH, 'perfilesSeguidores.csv');
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.trim().split('\n').filter(l => l.trim());
      return res.json({ count: Math.max(0, lines.length - 1), source: 'perfilesSeguidores.csv' });
    }
    return res.status(404).json({ error: 'perfilesSeguidores no encontrado' });
  } catch (err) {
    console.error('Error perfiles-analizados:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/metrics/comments-analizados
 * Cuenta desde commentsPopularPosts.csv (cada fila = 1 comentario)
 */
router.get('/comments-analizados', (req, res) => {
  try {
    const csvPath = path.join(CSVJSON_PATH, 'commentsPopularPosts.csv');
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.trim().split('\n').filter(l => l.trim());
      return res.json({ count: Math.max(0, lines.length - 1), source: 'commentsPopularPosts.csv' });
    }
    return res.status(404).json({ error: 'commentsPopularPosts no encontrado' });
  } catch (err) {
    console.error('Error comments-analizados:', err);
    return res.status(500).json({ error: err.message });
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
 * GET /api/metrics/perfiles-comentarios
 * Usuarios que comentaron en los posts más comentados (top 100 por post)
 * Fuente: profileUsersComments.json
 * Mismo formato que perfiles-seguidores para la gráfica bubble
 */
router.get('/perfiles-comentarios', (req, res) => {
  try {
    const jsonPath = path.join(CSVJSON_PATH, 'profileUsersComments.json');
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({ error: 'profileUsersComments no encontrado' });
    }
    let raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    if (!Array.isArray(raw)) raw = [];
    const toBool = (v) => v === true || v === 'true' || v === 'True' || v === '1';
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
          segmento: calcularSegmento(followers, posts),
          private: toBool(p.private),
          isBusinessAccount: toBool(p.isBusinessAccount),
          verified: toBool(p.verified)
        };
      });
    const minFollowers = parseInt(req.query.min_followers, 10);
    const maxFollowers = parseInt(req.query.max_followers, 10);
    const filterPrivate = req.query.private;
    const filterBusiness = req.query.is_business;
    const filterVerified = req.query.verified;
    let filtered = data;
    if (!isNaN(minFollowers) || !isNaN(maxFollowers)) {
      filtered = data.filter(p => {
        if (!isNaN(minFollowers) && p.followersCount < minFollowers) return false;
        if (!isNaN(maxFollowers) && p.followersCount > maxFollowers) return false;
        return true;
      });
    }
    const totalEnRango = filtered.length;
    const statsBase = {
      base: totalEnRango,
      privadas: filtered.filter(p => p.private).length,
      publicas: filtered.filter(p => !p.private).length,
      personal: filtered.filter(p => !p.isBusinessAccount).length,
      business: filtered.filter(p => p.isBusinessAccount).length,
      verificadas: filtered.filter(p => p.verified).length
    };
    if (filterPrivate === 'true' || filterPrivate === 'false') {
      const wantPrivate = filterPrivate === 'true';
      filtered = filtered.filter(p => p.private === wantPrivate);
    }
    if (filterBusiness === 'true' || filterBusiness === 'false') {
      const wantBusiness = filterBusiness === 'true';
      filtered = filtered.filter(p => p.isBusinessAccount === wantBusiness);
    }
    if (filterVerified === 'true' || filterVerified === 'false') {
      const wantVerified = filterVerified === 'true';
      filtered = filtered.filter(p => p.verified === wantVerified);
    }
    const step = Math.max(1, Math.floor(filtered.length / 1000));
    const sampled = filtered.filter((_, i) => i % step === 0).slice(0, 1000);
    return res.json({
      data: sampled,
      total: data.length,
      totalEnRango,
      totalFiltrado: filtered.length,
      statsBase
    });
  } catch (err) {
    console.error('Error perfiles-comentarios:', err);
    return res.status(500).json({ error: err.message });
  }
});

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
    const toBool = (v) => v === true || v === 'true' || v === 'True' || v === '1';
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
          segmento: calcularSegmento(followers, posts),
          private: toBool(p.private),
          isBusinessAccount: toBool(p.isBusinessAccount),
          verified: toBool(p.verified)
        };
      });
    const minFollows = parseInt(req.query.min_follows, 10);
    const minFollowers = parseInt(req.query.min_followers, 10);
    const maxFollowers = parseInt(req.query.max_followers, 10);
    const filterPrivate = req.query.private;
    const filterBusiness = req.query.is_business;
    const filterVerified = req.query.verified;
    let filtered = data;
    if (!isNaN(minFollows) || !isNaN(minFollowers) || !isNaN(maxFollowers)) {
      filtered = filtered.filter(p => {
        if (!isNaN(minFollows) && p.followsCount <= minFollows) return false;
        if (!isNaN(minFollowers) && p.followersCount < minFollowers) return false;
        if (!isNaN(maxFollowers) && p.followersCount > maxFollowers) return false;
        return true;
      });
    }
    const totalEnRango = filtered.length;
    const statsBase = {
      base: totalEnRango,
      privadas: filtered.filter(p => p.private).length,
      publicas: filtered.filter(p => !p.private).length,
      personal: filtered.filter(p => !p.isBusinessAccount).length,
      business: filtered.filter(p => p.isBusinessAccount).length,
      verificadas: filtered.filter(p => p.verified).length
    };
    if (filterPrivate === 'true' || filterPrivate === 'false') {
      const wantPrivate = filterPrivate === 'true';
      filtered = filtered.filter(p => p.private === wantPrivate);
    }
    if (filterBusiness === 'true' || filterBusiness === 'false') {
      const wantBusiness = filterBusiness === 'true';
      filtered = filtered.filter(p => p.isBusinessAccount === wantBusiness);
    }
    if (filterVerified === 'true' || filterVerified === 'false') {
      const wantVerified = filterVerified === 'true';
      filtered = filtered.filter(p => p.verified === wantVerified);
    }
    const step = Math.max(1, Math.floor(filtered.length / 1000));
    const sampled = filtered.filter((_, i) => i % step === 0).slice(0, 1000);
    return res.json({
      data: sampled,
      total: data.length,
      totalEnRango,
      totalFiltrado: filtered.length,
      statsBase
    });
  } catch (err) {
    console.error('Error perfiles-seguidores:', err);
    return res.status(500).json({ error: 'Error al leer perfilesSeguidores' });
  }
});

const { removeStopwords, spa, eng, fra, por } = require('stopword');
const STOPWORDS = [...spa, ...eng, ...fra, ...por];

/**
 * GET /api/metrics/wordcloud-biografias
 * mode=total: todas las biografías de perfilesSeguidores.json
 * mode=sesgo: solo perfiles 500-5000 seguidores
 */
router.get('/wordcloud-biografias', (req, res) => {
  try {
    const jsonPath = path.join(CSVJSON_PATH, 'perfilesSeguidores.json');
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({ error: 'perfilesSeguidores no encontrado' });
    }
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const profiles = Array.isArray(raw) ? raw : [];
    const mode = (req.query.mode || 'sesgo').toLowerCase();
    const filtered = mode === 'total'
      ? profiles
      : profiles.filter(p => {
          const f = parseInt(p.followersCount, 10) || 0;
          return f >= 500 && f <= 5000;
        });
    const text = filtered.map(p => (p.biography || '').trim()).filter(Boolean).join(' ');
    const rawWords = text
      .toLowerCase()
      .replace(/[^a-záéíóúñü0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\s+/);
    const words = removeStopwords(rawWords, STOPWORDS)
      .filter(w => w.length >= 2 && !/^\d+$/.test(w));
    const counts = {};
    words.forEach(w => { counts[w] = (counts[w] || 0) + 1; });
    const minFreq = Math.max(1, parseInt(req.query.min_freq, 10) || 2);
    const list = Object.entries(counts)
      .filter(([, c]) => c >= minFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 200)
      .map(([w, c]) => [w, c]);
    return res.json({ list, total: filtered.length, palabras: list.length });
  } catch (err) {
    console.error('Error wordcloud-biografias:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/metrics/wordcloud-biografias-comentarios
 * Fuente: profileUsersComments.json (usuarios que comentaron)
 * mode=total: todas las biografías
 * mode=sesgo: solo perfiles 200-4000 seguidores
 */
router.get('/wordcloud-biografias-comentarios', (req, res) => {
  try {
    const jsonPath = path.join(CSVJSON_PATH, 'profileUsersComments.json');
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({ error: 'profileUsersComments no encontrado' });
    }
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const profiles = Array.isArray(raw) ? raw : [];
    const mode = (req.query.mode || 'sesgo').toLowerCase();
    const filtered = mode === 'total'
      ? profiles
      : profiles.filter(p => {
          const f = parseInt(p.followersCount, 10) || 0;
          return f >= 200 && f <= 4000;
        });
    const text = filtered.map(p => (p.biography || '').trim()).filter(Boolean).join(' ');
    const rawWords = text
      .toLowerCase()
      .replace(/[^a-záéíóúñü0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\s+/);
    const words = removeStopwords(rawWords, STOPWORDS)
      .filter(w => w.length >= 2 && !/^\d+$/.test(w));
    const counts = {};
    words.forEach(w => { counts[w] = (counts[w] || 0) + 1; });
    const minFreq = Math.max(1, parseInt(req.query.min_freq, 10) || 2);
    const list = Object.entries(counts)
      .filter(([, c]) => c >= minFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 200)
      .map(([w, c]) => [w, c]);
    return res.json({ list, total: filtered.length, palabras: list.length });
  } catch (err) {
    console.error('Error wordcloud-biografias-comentarios:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Carga perfilesSeguidores desde JSON o CSV
 */
function cargarPerfilesSeguidores() {
  const jsonPath = path.join(CSVJSON_PATH, 'perfilesSeguidores.json');
  const csvPath = path.join(CSVJSON_PATH, 'perfilesSeguidores.csv');
  if (fs.existsSync(jsonPath)) {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    return Array.isArray(data) ? data : [];
  }
  if (fs.existsSync(csvPath)) {
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const idx = (name) => headers.indexOf(name) >= 0 ? headers.indexOf(name) : -1;
    const iFull = idx('fullname'), iUser = idx('username'), iFol = idx('followerscount'), iFolw = idx('followscount'), iPosts = idx('postscount');
    if (iFull < 0 || iFol < 0) return [];
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      rows.push({
        fullName: (parts[iFull] || '').trim(),
        username: (iUser >= 0 ? parts[iUser] : '') || '',
        followersCount: parseInt(parts[iFol], 10) || 0,
        followsCount: (iFolw >= 0 ? parseInt(parts[iFolw], 10) : 0) || 0,
        postsCount: (iPosts >= 0 ? parseInt(parts[iPosts], 10) : 0) || 0
      });
    }
    return rows;
  }
  return null;
}

/**
 * GET /api/metrics/top-perfiles-potenciales
 * Lee perfilesSeguidores (JSON o CSV), filtra rango 500-5000 seguidores y >500 seguidos,
 * devuelve top 10 ordenados por seguidores (1º) y posts (2º).
 */
router.get('/top-perfiles-potenciales', (req, res) => {
  try {
    const raw = cargarPerfilesSeguidores();
    if (!raw || !Array.isArray(raw)) {
      return res.status(404).json({ error: 'perfilesSeguidores no encontrado' });
    }
    const filtered = raw
      .filter(p => {
        const followers = parseInt(p.followersCount, 10) || 0;
        const follows = parseInt(p.followsCount, 10) || 0;
        return follows > 500 && followers >= 500 && followers <= 5000;
      })
      .map(p => ({
        fullName: (p.fullName || '').trim() || p.username || '—',
        username: (p.username || '').trim() || '',
        followersCount: parseInt(p.followersCount, 10) || 0,
        followsCount: parseInt(p.followsCount, 10) || 0,
        postsCount: parseInt(p.postsCount, 10) || 0
      }))
      .sort((a, b) => {
        if (b.followersCount !== a.followersCount) return b.followersCount - a.followersCount;
        return b.postsCount - a.postsCount;
      })
      .slice(0, 10);
    return res.json({ data: filtered });
  } catch (err) {
    console.error('Error top-perfiles-potenciales:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/metrics/top-perfiles-comentadores
 * Top 10 usuarios que más comentaron, con seguidores y comentarios.
 * Fuente: commentsPopularPosts.csv (conteo) + profileUsersComments.json (seguidores)
 */
router.get('/top-perfiles-comentadores', (req, res) => {
  try {
    const commentsPath = path.join(CSVJSON_PATH, 'commentsPopularPosts.csv');
    const profilePath = path.join(CSVJSON_PATH, 'profileUsersComments.json');
    if (!fs.existsSync(commentsPath)) {
      return res.status(404).json({ error: 'commentsPopularPosts no encontrado' });
    }
    if (!fs.existsSync(profilePath)) {
      return res.status(404).json({ error: 'profileUsersComments no encontrado' });
    }

    const norm = (u) => (u || '').trim().replace(/\/$/, '');
    const commentRows = parseCSV(fs.readFileSync(commentsPath, 'utf8'));
    const cHeaders = commentRows[0]?.map(h => (h || '').toLowerCase().trim()) || [];
    const iOwner = cHeaders.indexOf('ownerusername');
    const iPostUrl = cHeaders.indexOf('posturl');
    if (iOwner < 0) {
      return res.status(500).json({ error: 'Columna ownerUsername requerida' });
    }

    const byUser = {};
    for (let i = 1; i < commentRows.length; i++) {
      const r = commentRows[i];
      const user = (r[iOwner] || '').trim();
      if (!user) continue;
      if (!byUser[user]) byUser[user] = { count: 0, postUrls: new Set() };
      byUser[user].count++;
      const postUrl = iPostUrl >= 0 ? norm(r[iPostUrl]) : '';
      if (postUrl) byUser[user].postUrls.add(postUrl);
    }

    const raw = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    const profiles = Array.isArray(raw) ? raw : [];
    const profileMap = {};
    for (const p of profiles) {
      const u = (p.username || '').trim().toLowerCase();
      if (u) profileMap[u] = p;
    }

    const list = Object.entries(byUser)
      .map(([username, info]) => {
        const prof = profileMap[(username || '').toLowerCase()];
        const followersCount = prof ? (parseInt(prof.followersCount, 10) || 0) : 0;
        return {
          username: username.trim(),
          fullName: (prof?.fullName || '').trim() || username || '—',
          commentCount: info.count,
          postsCommented: info.postUrls.size,
          followersCount
        };
      })
      .sort((a, b) => b.commentCount - a.commentCount)
      .slice(0, 10);
    return res.json({ data: list });
  } catch (err) {
    console.error('Error top-perfiles-comentadores:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/metrics/distribucion-comentadores-red
 * Todos los usuarios que comentaron en los 23 posts virales
 * X: seguidos, Y: seguidores, size: cantidad de comentarios del usuario
 * followsCamilo: true si está en seguidoresCamilo
 * Query: private, is_business, verified
 */
router.get('/distribucion-comentadores-red', (req, res) => {
  try {
    const profilePath = path.join(CSVJSON_PATH, 'profileUsersComments.json');
    const seguidoresPath = path.join(CSVJSON_PATH, 'seguidoresCamilo.csv');
    const commentsPath = path.join(CSVJSON_PATH, 'commentsPopularPosts.csv');
    if (!fs.existsSync(profilePath)) {
      return res.status(404).json({ error: 'profileUsersComments no encontrado' });
    }
    if (!fs.existsSync(seguidoresPath)) {
      return res.status(404).json({ error: 'seguidoresCamilo no encontrado' });
    }

    const toBool = (v) => v === true || v === 'true' || v === 'True' || v === '1';
    const seguidoresRows = parseCSV(fs.readFileSync(seguidoresPath, 'utf8'));
    const segHeaders = seguidoresRows[0]?.map(h => (h || '').toLowerCase().trim()) || [];
    const iUser = segHeaders.indexOf('username');
    const sigueSet = new Set();
    for (let i = 1; i < seguidoresRows.length; i++) {
      const u = (seguidoresRows[i][iUser] || '').trim().toLowerCase();
      if (u) sigueSet.add(u);
    }

    const commentsCountByUser = new Map();
    if (fs.existsSync(commentsPath)) {
      const commentsRows = parseCSV(fs.readFileSync(commentsPath, 'utf8'));
      const commHeaders = commentsRows[0]?.map(h => (h || '').toLowerCase().trim()) || [];
      const iOwner = commHeaders.indexOf('ownerusername');
      for (let i = 1; i < commentsRows.length; i++) {
        const u = (commentsRows[i][iOwner] || '').trim().toLowerCase();
        if (u) commentsCountByUser.set(u, (commentsCountByUser.get(u) || 0) + 1);
      }
    }

    const profiles = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    const list = Array.isArray(profiles) ? profiles : [];
    let filtered = list
      .filter(p => p.followersCount != null && p.followsCount != null)
      .map(p => {
        const followers = parseInt(p.followersCount, 10) || 1;
        const follows = parseInt(p.followsCount, 10) || 1;
        const posts = parseFloat(p.postsCount) || 0;
        const user = (p.username || '').toLowerCase();
        const followsCamilo = sigueSet.has(user);
        const commentsCount = commentsCountByUser.get(user) || 1;
        return {
          username: p.username || '',
          fullName: (p.fullName || '').trim() || p.username || '—',
          followers_plot: Math.max(1, followers),
          follows_plot: Math.max(1, follows),
          followersCount: followers,
          followsCount: follows,
          postsCount: (posts === 0 || isNaN(posts)) ? 1 : posts,
          commentsCount,
          followsCamilo,
          private: toBool(p.private),
          isBusinessAccount: toBool(p.isBusinessAccount),
          verified: toBool(p.verified)
        };
      });

    const statsBase = {
      base: filtered.length,
      privadas: filtered.filter(p => p.private).length,
      publicas: filtered.filter(p => !p.private).length,
      personal: filtered.filter(p => !p.isBusinessAccount).length,
      business: filtered.filter(p => p.isBusinessAccount).length,
      verificadas: filtered.filter(p => p.verified).length,
      sigue: filtered.filter(p => p.followsCamilo).length,
      noSigue: filtered.filter(p => !p.followsCamilo).length
    };

    const filterPrivate = req.query.private;
    const filterBusiness = req.query.is_business;
    const filterVerified = req.query.verified;
    if (filterPrivate === 'true' || filterPrivate === 'false') {
      const want = filterPrivate === 'true';
      filtered = filtered.filter(p => p.private === want);
    }
    if (filterBusiness === 'true' || filterBusiness === 'false') {
      const want = filterBusiness === 'true';
      filtered = filtered.filter(p => p.isBusinessAccount === want);
    }
    if (filterVerified === 'true' || filterVerified === 'false') {
      const want = filterVerified === 'true';
      filtered = filtered.filter(p => p.verified === want);
    }

    return res.json({
      data: filtered,
      totalSigue: filtered.filter(d => d.followsCamilo).length,
      totalNoSigue: filtered.filter(d => !d.followsCamilo).length,
      totalFiltrado: filtered.length,
      statsBase
    });
  } catch (err) {
    console.error('Error distribucion-comentadores-red:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
