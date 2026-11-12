/* ============================================================
   catalog.js — Carta de platos
   1) Lee los platos reales desde MongoDB (/api/platos) y
      actualiza precios, calorías, proteína y etiquetas.
   2) Controla los botones − / + de cada tarjeta.
   3) Filtra por perfil: diabético, deportista o estudiante.
   ============================================================ */
Tex.catalog = (function () {
  const U = Tex.utils;

  /* ---------- Leer los datos de una tarjeta ---------- */
  function productoDeTarjeta(tarjeta) {
    return {
      slug: tarjeta.dataset.id,
      nombre: tarjeta.dataset.nombre,
      precio: Number(tarjeta.dataset.precio),
      kcal: Number(tarjeta.dataset.kcal) || 0,
      proteina: Number(tarjeta.dataset.proteina) || 0,
      emoji: (U.$('.product-img', tarjeta) || {}).textContent || '🌮',
    };
  }

  /* ---------- Botones − y + de cada tarjeta ---------- */
  function conectarCantidades() {
    U.$$('.product-card').forEach((tarjeta) => {
      const valor = U.$('.qty-value', tarjeta);
      const menos = U.$('.qty-minus', tarjeta);
      const mas = U.$('.qty-plus', tarjeta);
      let cantidad = 0;

      if (menos) {
        menos.addEventListener('click', () => {
          cantidad = Math.max(0, cantidad - 1);
          valor.textContent = cantidad;
        });
      }
      if (mas) {
        mas.addEventListener('click', () => {
          cantidad = Math.min(20, cantidad + 1);
          valor.textContent = cantidad;
        });
      }

      /* Guardamos la cantidad "actual" en la propia tarjeta */
      tarjeta._leerCantidad = () => cantidad;
      tarjeta._reiniciarCantidad = () => {
        cantidad = 0;
        if (valor) valor.textContent = '0';
      };
    });
  }

  /* ---------- Agregar al carrito ---------- */
  function conectarAgregar() {
    U.$$('.btn-add').forEach((boton) => {
      boton.addEventListener('click', () => {
        const tarjeta = boton.closest('.product-card');
        if (!tarjeta) return;
        const cantidad = Math.max(1, tarjeta._leerCantidad ? tarjeta._leerCantidad() : 1);
        Tex.cart.agregar(productoDeTarjeta(tarjeta), cantidad);

        tarjeta.classList.remove('recien-agregado');
        void tarjeta.offsetWidth;
        tarjeta.classList.add('recien-agregado');

        if (tarjeta._reiniciarCantidad) tarjeta._reiniciarCantidad();
      });
    });

    /* Botón grande de la oferta del día */
    const botonOferta = U.$('.btn-add-oferta');
    if (botonOferta) {
      botonOferta.addEventListener('click', () => {
        const slug = botonOferta.dataset.id;
        const tarjeta = U.$(`.product-card[data-id="${slug}"]`);
        const emoji = tarjeta ? (U.$('.product-img', tarjeta) || {}).textContent : '🎒';

        Tex.cart.agregar(
          {
            slug,
            nombre: botonOferta.dataset.nombre,
            precio: Number(botonOferta.dataset.precio),
            kcal: Number(botonOferta.dataset.kcal) || 0,
            proteina: Number(botonOferta.dataset.proteina) || 0,
            emoji,
          },
          1
        );

        if (tarjeta && tarjeta._reiniciarCantidad) tarjeta._reiniciarCantidad();
        Tex.ui.abrir('cartDrawer');
      });
    }
  }

  /* ---------- Filtros por perfil ---------- */
  function aplicarFiltro(perfil) {
    let visibles = 0;

    U.$$('.product-card').forEach((tarjeta) => {
      const perfiles = (tarjeta.dataset.perfiles || '').split(' ');
      const mostrar = perfil === 'todos' || perfiles.includes(perfil);
      tarjeta.classList.toggle('oculto', !mostrar);
      if (mostrar) visibles++;
    });

    const aviso = U.$('#filtrosVacio');
    if (aviso) aviso.hidden = visibles !== 0;

    U.$$('.filtro').forEach((boton) => {
      boton.classList.toggle('active', boton.dataset.filtro === perfil);
    });
  }

  function conectarFiltros() {
    U.$$('.filtro').forEach((boton) => {
      boton.addEventListener('click', () => aplicarFiltro(boton.dataset.filtro));
    });

    /* Las tarjetas de "Hecho para ti" también filtran */
    U.$$('.audience-card[data-filtro]').forEach((tarjeta) => {
      tarjeta.addEventListener('click', () => {
        aplicarFiltro(tarjeta.dataset.filtro);
        const productos = U.$('#productos');
        if (productos) productos.scrollIntoView({ behavior: 'smooth' });
        U.toast('Mostrando platos para ' + tarjeta.querySelector('h3').textContent.replace('Para ', ''));
      });
    });
  }

  /* ---------- Sincronizar la carta con MongoDB ---------- */
  function pintarMeta(contenedor, plato) {
    const etiquetas = [];
    const prot = plato.nutricion ? plato.nutricion.proteina : 0;
    const azucar = plato.nutricion ? plato.nutricion.azucar : 0;
    const kcal = plato.nutricion ? plato.nutricion.kcal : 0;

    etiquetas.push(
      prot > 0
        ? `<span class="meta-tag meta-proteina">${prot}g proteína</span>`
        : `<span class="meta-tag meta-proteina">${azucar}g azúcar</span>`
    );
    etiquetas.push(`<span class="meta-tag meta-calorias">${kcal} kcal</span>`);

    if (plato.antes && plato.antes > plato.precio) {
      etiquetas.push(
        `<span class="meta-tag meta-ahorro">Ahorras ${U.precio(plato.antes - plato.precio)}</span>`
      );
    }

    contenedor.innerHTML = etiquetas.join('');
  }

  function pintarBadge(tarjeta, plato) {
    let badge = U.$('.product-badge', tarjeta);
    if (!plato.badge) {
      if (badge) badge.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'product-badge';
      tarjeta.insertBefore(badge, tarjeta.firstChild);
    }
    badge.textContent = plato.badge;
  }

  async function sincronizarConMongo() {
    let datos;
    try {
      datos = await U.peticion('/platos', { conToken: false });
    } catch (error) {
      /* Si el servidor no responde, la página sigue funcionando
         con los datos escritos en el HTML. */
      console.warn('Catálogo sin conexión a MongoDB:', error.message);
      return;
    }

    datos.platos.forEach((plato) => {
      const tarjeta = U.$(`.product-card[data-id="${plato.slug}"]`);
      if (!tarjeta) return;

      if (!plato.disponible) {
        tarjeta.classList.add('oculto');
        return;
      }

      /* Precio, calorías y proteína vienen de la base de datos */
      tarjeta.dataset.nombre = plato.nombre;
      tarjeta.dataset.precio = plato.precio;
      tarjeta.dataset.kcal = plato.nutricion ? plato.nutricion.kcal : 0;
      tarjeta.dataset.proteina = plato.nutricion ? plato.nutricion.proteina : 0;
      tarjeta.dataset.perfiles = (plato.perfiles || []).join(' ');

      const precioEl = U.$('.product-price', tarjeta);
      if (precioEl) precioEl.textContent = U.precio(plato.precio);

      const meta = U.$('.product-meta', tarjeta);
      if (meta) pintarMeta(meta, plato);

      pintarBadge(tarjeta, plato);
    });

    /* Avisamos que la carta ya está sincronizada */
    console.info('🍃 Carta sincronizada con MongoDB (' + datos.total + ' platos)');
  }

  function init() {
    conectarCantidades();
    conectarAgregar();
    conectarFiltros();
    sincronizarConMongo();

    /* Al confirmar un pedido, reiniciamos los contadores de las tarjetas */
    document.addEventListener('tex:carrito:limpiado', () => {
      U.$$('.product-card').forEach((tarjeta) => {
        if (tarjeta._reiniciarCantidad) tarjeta._reiniciarCantidad();
      });
    });
  }

  return { init, aplicarFiltro };
})();
