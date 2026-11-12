/* ============================================================
   ui.js — Interfaz general
   Menú de navegación, modales, animaciones al desplazar y
   contadores de las estadísticas del inicio.
   ============================================================ */
Tex.ui = (function () {
  const U = Tex.utils;

  /* ---------- Abrir / cerrar paneles y modales ---------- */
  function abrir(id) {
    const el = U.$('#' + id);
    if (!el) return;
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    if (id === 'cartDrawer') {
      const overlay = U.$('#cartOverlay');
      if (overlay) overlay.classList.add('open');
    }
    U.bloquearScroll(true);
  }

  function cerrar(id) {
    const el = U.$('#' + id);
    if (!el) return;
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    if (id === 'cartDrawer') {
      const overlay = U.$('#cartOverlay');
      if (overlay) overlay.classList.remove('open');
    }
    /* Si ya no queda nada abierto, devolvemos el scroll */
    if (!U.$('.modal-overlay.open') && !U.$('#cartDrawer.open')) {
      U.bloquearScroll(false);
    }
  }

  function conectarCierres() {
    /* Botones con data-close="idDelPanel" */
    U.$$('[data-close]').forEach((boton) => {
      boton.addEventListener('click', () => cerrar(boton.dataset.close));
    });

    /* Clic fuera de la ventana del modal */
    U.$$('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cerrar(overlay.id);
      });
    });

    const overlayCarrito = U.$('#cartOverlay');
    if (overlayCarrito) overlayCarrito.addEventListener('click', () => cerrar('cartDrawer'));

    /* Tecla Escape cierra lo que esté abierto */
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      cerrar('authModal');
      cerrar('successModal');
      cerrar('cartDrawer');
    });

    /* Enlaces dentro del carrito que deben cerrarlo (ej: "Ver platos") */
    U.$$('[data-close-link]').forEach((enlace) => {
      enlace.addEventListener('click', () => cerrar('cartDrawer'));
    });
  }

  /* ---------- Encabezado y menú móvil ---------- */
  function conectarNavegacion() {
    const header = U.$('.header');
    const boton = U.$('#navToggle');
    const menu = U.$('#navMenu');

    window.addEventListener('scroll', () => {
      if (header) header.classList.toggle('scrolled', window.scrollY > 40);
    });

    if (boton && menu) {
      boton.addEventListener('click', () => {
        menu.classList.toggle('open');
        boton.classList.toggle('abierto');
      });
      U.$$('.nav-link', menu).forEach((enlace) => {
        enlace.addEventListener('click', () => menu.classList.remove('open'));
      });
    }

    /* Resalta el enlace de la sección que estás viendo */
    const secciones = U.$$('section[id]');
    const enlaces = U.$$('.nav-link');
    if (secciones.length && 'IntersectionObserver' in window) {
      const observador = new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            if (!entrada.isIntersecting) return;
            enlaces.forEach((enlace) => {
              enlace.classList.toggle(
                'active',
                enlace.getAttribute('href') === '#' + entrada.target.id
              );
            });
          });
        },
        { rootMargin: '-45% 0px -50% 0px' }
      );
      secciones.forEach((seccion) => observador.observe(seccion));
    }
  }

  /* ---------- Aparición suave al desplazar ---------- */
  function conectarReveal() {
    const objetivos = U.$$(
      '.section-title, .section-subtitle, .audience-card, .product-card, ' +
        '.benefit-item, .testimonial-card, .about-text, .about-image, ' +
        '.estudiantes-box, .contact-info, .contact-form, .oferta-dia, .stat'
    );
    if (!objetivos.length) return;

    objetivos.forEach((el) => el.classList.add('reveal'));

    if (!('IntersectionObserver' in window)) {
      objetivos.forEach((el) => el.classList.add('visible'));
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada, i) => {
          if (!entrada.isIntersecting) return;
          setTimeout(() => entrada.target.classList.add('visible'), (i % 6) * 90);
          observador.unobserve(entrada.target);
        });
      },
      { threshold: 0.12 }
    );

    objetivos.forEach((el) => observador.observe(el));
  }

  /* ---------- Contadores que suben desde 0 ---------- */
  function conectarContadores() {
    const numeros = U.$$('.stat-num');
    if (!numeros.length) return;

    const animar = (el) => {
      const meta = parseInt(el.dataset.count, 10) || 0;
      if (meta === 0) {
        el.textContent = '0';
        return;
      }
      let actual = 0;
      const paso = Math.max(1, Math.round(meta / 34));
      const intervalo = setInterval(() => {
        actual += paso;
        if (actual >= meta) {
          actual = meta;
          clearInterval(intervalo);
        }
        el.textContent = actual;
      }, 26);
    };

    if (!('IntersectionObserver' in window)) {
      numeros.forEach(animar);
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          animar(entrada.target);
          observador.unobserve(entrada.target);
        });
      },
      { threshold: 0.5 }
    );

    numeros.forEach((el) => observador.observe(el));
  }

  function init() {
    conectarCierres();
    conectarNavegacion();
    conectarReveal();
    conectarContadores();
  }

  return { init, abrir, cerrar };
})();
