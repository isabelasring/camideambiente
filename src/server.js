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
  const htmlPath = path.join(baseDir, 'public', 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace(/__COUNT_SEGUIDORES__/g, String(count));
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
