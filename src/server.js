require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// CORS para desarrollo
const cors = require('cors');
app.use(cors());

// Rutas
const routes = require('./routes');
app.use('/', routes);

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
