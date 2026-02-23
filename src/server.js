require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cors = require('cors');
app.use(cors());

// Dashboard con conteo de seguidores inyectado (ruta raíz ANTES de static)
const baseDir = path.join(__dirname, '..');
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

function getTopPostsMasComentados() {
  try {
    const csvPath = path.join(baseDir, 'csvjson', 'postsCamilo.csv');
    if (!fs.existsSync(csvPath)) return [];
    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(content);
    if (rows.length < 2) return [];
    const headers = rows[0].map(h => (h || '').toLowerCase().trim());
    const idx = (n) => headers.indexOf(n) >= 0 ? headers.indexOf(n) : -1;
    const iCaption = idx('caption');
    const iComments = idx('commentscount');
    const iLikes = idx('likescount');
    const iUrl = idx('url');
    if (iCaption < 0 || iComments < 0 || iLikes < 0) return [];
    const posts = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const caption = (r[iCaption] || '').trim();
      const comments = parseInt(r[iComments], 10) || 0;
      const likes = parseInt(r[iLikes], 10) || 0;
      const url = (r[iUrl] || '').trim().replace(/\/$/, '') || null;
      posts.push({ name: (caption.replace(/\s+/g, ' ').substring(0, 80) || 'Post sin título'), commentsCount: comments, likesCount: likes, url });
    }
    return posts.sort((a, b) => b.commentsCount - a.commentsCount).slice(0, 23);
  } catch (e) {
    console.error('Error leyendo posts:', e);
    return [];
  }
}

app.get('/', (req, res) => {
  const csvPath = path.join(baseDir, 'csvjson', 'seguidoresCamilo.csv');
  let count = 0;
  try {
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.trim().split('\n').filter(l => l.trim());
      count = Math.max(0, lines.length - 1);
    }
  } catch (e) {
    console.error('Error leyendo seguidores:', e);
  }
  const postsData = getTopPostsMasComentados();
  const htmlPath = path.join(baseDir, 'public', 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/__COUNT_SEGUIDORES__/g, String(count));
  html = html.replace('__POSTS_JSON__', JSON.stringify(postsData));
  res.type('html').send(html);
});

app.use(express.static('public'));
app.use('/graficas', express.static('graficas'));

const routes = require('./routes');
app.use(routes);


// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
