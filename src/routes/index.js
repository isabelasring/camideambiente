const express = require('express');
const router = express.Router();
const metricsRouter = require('./metrics');

router.use('/api/metrics', metricsRouter);

// Ruta principal
router.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenido a la plataforma',
    status: 'OK',
    version: '1.0.0'
  });
});

// Ruta de salud/health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
