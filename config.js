/* ============================================================
   Configuración central del servidor.
   Lee las variables del archivo .env y les pone valores por
   defecto para que el proyecto nunca arranque "a ciegas".
   ============================================================ */
require('dotenv').config();

module.exports = {
  puerto: parseInt(process.env.PORT || '8080', 10),
  entorno: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || '',

  jwt: {
    secreto: process.env.JWT_SECRET || 'texcuani-secreto-por-defecto',
    expira: process.env.JWT_EXPIRES || '7d',
  },

  // Reglas del negocio
  domicilio: parseInt(process.env.DOMICILIO_COP || '3000', 10),
  envioGratis: parseInt(process.env.ENVIO_GRATIS_COP || '40000', 10),

  // Cuenta administradora que crea la semilla
  admin: {
    nombre: process.env.ADMIN_NOMBRE || 'Administrador Texcuani',
    email: process.env.ADMIN_EMAIL || 'admin@texcuani.co',
    password: process.env.ADMIN_PASSWORD || 'Texcuani2026*',
  },
};
