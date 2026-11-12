/* ============================================================
   main.js — Arranque de la página
   Llama a cada módulo en orden y conecta el formulario de
   contacto (que guarda los mensajes en MongoDB).
   ============================================================ */
(function () {
  const U = Tex.utils;

  /* ---------- Formulario de contacto ---------- */
  function conectarContacto() {
    const formulario = U.$('.contact-form');
    if (!formulario) return;

    formulario.addEventListener('submit', async (e) => {
      e.preventDefault();
      const boton = formulario.querySelector('button[type="submit"]');
      const original = boton.textContent;
      boton.disabled = true;
      boton.textContent = 'Enviando...';

      try {
        const datos = await U.peticion('/contacto', {
          metodo: 'POST',
          conToken: false,
          cuerpo: {
            nombre: U.$('#nombre').value.trim(),
            telefono: U.$('#telefono').value.trim(),
            mensaje: U.$('#mensaje').value.trim(),
          },
        });
        U.toast(datos.mensaje, 'exito');
        formulario.reset();
      } catch (error) {
        U.toast(error.message, 'error');
      } finally {
        boton.disabled = false;
        boton.textContent = original;
      }
    });
  }

  /* ---------- Enlaces sociales y año del pie ---------- */
  function conectarExtras() {
    const wa = U.$('.social-btn.wa');
    const ig = U.$('.social-btn.ig');
    if (wa) wa.href = 'https://wa.me/573053747353';
    if (ig) ig.href = 'https://instagram.com/texcuani_co';

    const pie = U.$('.footer-bottom p');
    if (pie) {
      pie.innerHTML =
        '© ' + new Date().getFullYear() +
        ' Texcuani & CO. Todos los derechos reservados. Hecho con ❤️ entre México 🇲🇽 y Colombia 🇨🇴';
    }
  }

  /* ---------- Encendido ---------- */
  function arrancar() {
    Tex.ui.init();
    Tex.auth.init();
    Tex.cart.init();
    Tex.catalog.init();
    Tex.efectos.init();
    conectarContacto();
    conectarExtras();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }
})();
