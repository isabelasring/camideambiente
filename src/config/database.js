// Configuración de base de datos
// Aquí se configurará la conexión a la base de datos cuando se necesite

// Ejemplo de configuración:
/*
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('✅ Base de datos conectada');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
*/

module.exports = {};
