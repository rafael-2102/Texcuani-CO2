/* ============================================================
   Conexión a MongoDB Atlas con Mongoose.
   ============================================================ */
const mongoose = require('mongoose');
const config = require('./config');

async function conectarDB() {
  if (!config.mongoUri) {
    throw new Error('Falta MONGODB_URI en el archivo .env');
  }

  mongoose.connection.on('connected', () => {
    console.log(`🍃 MongoDB conectado → ${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (error) => {
    console.error('❌ Error de MongoDB:', error.message);
  });

  await mongoose.connect(config.mongoUri);
  return mongoose.connection;
}

module.exports = { conectarDB };
