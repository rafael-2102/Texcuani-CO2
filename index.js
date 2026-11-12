/* ============================================================
   TEXCUANI & CO — Servidor Express
   Sirve la página (HTML + CSS + JS) y expone la API que habla
   con MongoDB Atlas.

   Arrancar:  npm start     (o  npm run dev  para reinicio automático)
   ============================================================ */
const path = require('path');
const express = require('express');
const cors = require('cors');

const config = require('./config');
const { conectarDB } = require('./db');

const app = express();
const RAIZ = path.join(__dirname, '..');

/* ---------- Middlewares generales ---------- */
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/* ---------- Archivos estáticos (css, js, imágenes, html) ---------- */
// Bloqueamos las carpetas que NO deben verse desde el navegador,
// así nadie puede descargar el código del servidor ni las claves.
const PROHIBIDO = /^\/(server|node_modules|\.env|package(-lock)?\.json|\.git)/;
app.use((req, res, next) => {
  if (PROHIBIDO.test(req.path)) {
    return res.status(404).json({ ok: false, mensaje: 'No encontrado.' });
  }
  next();
});
app.use(express.static(RAIZ, { index: false, extensions: ['html'] }));

/* ---------- API ---------- */
app.use('/api/auth', require('./rutas/autenticacion'));
app.use('/api/platos', require('./rutas/platos'));
app.use('/api/pedidos', require('./rutas/pedidos'));
app.use('/api/contacto', require('./rutas/contacto'));

app.get('/api/salud', (req, res) => {
  res.json({ ok: true, servicio: 'Texcuani & CO API', entorno: config.entorno });
});

/* ---------- Vistas ---------- */
app.get('/admin', (req, res) => res.sendFile(path.join(RAIZ, 'admin.html')));
app.get('/', (req, res) => res.sendFile(path.join(RAIZ, 'index.html')));

/* Cualquier otra ruta de la API que no exista */
app.use('/api', (req, res) => res.status(404).json({ ok: false, mensaje: 'Ruta de API no encontrada.' }));

/* ---------- Arranque ---------- */
async function iniciar() {
  try {
    await conectarDB();
    app.listen(config.puerto, () => {
      console.log('\n============================================');
      console.log('  🌮  TEXCUANI & CO  🇨🇴');
      console.log('============================================');
      console.log(`  Página:  http://localhost:${config.puerto}`);
      console.log(`  Admin:   http://localhost:${config.puerto}/admin`);
      console.log(`  API:     http://localhost:${config.puerto}/api/salud`);
      console.log(`  Entorno: ${config.entorno}`);
      console.log('============================================\n');
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

iniciar();
