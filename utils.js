/* ============================================================
   utils.js — Utilidades compartidas
   Aquí viven los datos de configuración, los atajos del DOM,
   el formato de precios, el aviso "toast" y las peticiones a la
   API (que es la que habla con MongoDB).
   ============================================================ */
window.Tex = window.Tex || {};

/* ---------- Configuración general ---------- */
Tex.CONFIG = {
  API: '/api',
  DOMICILIO: 3000,        // costo de envío
  ENVIO_GRATIS: 40000,    // desde este subtotal el envío va gratis
  CLAVE_TOKEN: 'texcuani_token',
  CLAVE_USUARIO: 'texcuani_usuario',
  CLAVE_CARRITO: 'texcuani_carrito',
};

/* ---------- Atajos del DOM ---------- */
Tex.utils = {
  /* Busca un elemento */
  $(selector, contexto) {
    return (contexto || document).querySelector(selector);
  },

  /* Busca varios elementos y devuelve un array real */
  $$(selector, contexto) {
    return Array.from((contexto || document).querySelectorAll(selector));
  },

  /* Convierte 15500 en "$15.500" */
  precio(valor) {
    return '$' + Number(valor || 0).toLocaleString('es-CO');
  },

  /* Muestra un aviso flotante en la parte inferior */
  toast(mensaje, tipo) {
    const caja = Tex.utils.$('#toast');
    if (!caja) return;
    caja.textContent = mensaje;
    caja.className = 'toast show' + (tipo ? ' ' + tipo : '');
    clearTimeout(Tex.utils._toastTimer);
    Tex.utils._toastTimer = setTimeout(() => {
      caja.className = 'toast' + (tipo ? ' ' + tipo : '');
    }, 3200);
  },

  /* ---------- Sesión guardada en el navegador ---------- */
  leerToken() {
    return localStorage.getItem(Tex.CONFIG.CLAVE_TOKEN);
  },
  leerUsuario() {
    try {
      return JSON.parse(localStorage.getItem(Tex.CONFIG.CLAVE_USUARIO));
    } catch (error) {
      return null;
    }
  },
  guardarSesion(token, usuario) {
    localStorage.setItem(Tex.CONFIG.CLAVE_TOKEN, token);
    localStorage.setItem(Tex.CONFIG.CLAVE_USUARIO, JSON.stringify(usuario));
  },
  borrarSesion() {
    localStorage.removeItem(Tex.CONFIG.CLAVE_TOKEN);
    localStorage.removeItem(Tex.CONFIG.CLAVE_USUARIO);
  },

  /* ---------- Peticiones a la API ---------- */
  async peticion(ruta, opciones) {
    const opcionesFinales = opciones || {};
    const cabeceras = { 'Content-Type': 'application/json' };
    const token = Tex.utils.leerToken();

    if (token && opcionesFinales.conToken !== false) {
      cabeceras.Authorization = 'Bearer ' + token;
    }

    let respuesta;
    try {
      respuesta = await fetch(Tex.CONFIG.API + ruta, {
        method: opcionesFinales.metodo || 'GET',
        headers: cabeceras,
        body: opcionesFinales.cuerpo ? JSON.stringify(opcionesFinales.cuerpo) : undefined,
      });
    } catch (error) {
      throw new Error('No hay conexión con el servidor. ¿Está encendido?');
    }

    const datos = await respuesta.json().catch(() => ({
      ok: false,
      mensaje: 'El servidor devolvió una respuesta inesperada.',
    }));

    if (!respuesta.ok) {
      throw new Error(datos.mensaje || 'Error ' + respuesta.status);
    }
    return datos;
  },

  /* Bloquea o libera el scroll del fondo cuando hay un panel abierto */
  bloquearScroll(bloquear) {
    document.body.style.overflow = bloquear ? 'hidden' : '';
  },
};
