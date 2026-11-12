/* ============================================================
   cart.js — Carrito de compras
   Guarda el pedido en el navegador mientras el cliente navega,
   muestra el resumen nutricional, la barra de envío gratis y
   al final envía el pedido a la API (que recalcula los precios
   en el servidor y lo guarda en MongoDB).
   ============================================================ */
Tex.cart = (function () {
  const U = Tex.utils;
  const C = Tex.CONFIG;

  let items = []; // [{ slug, nombre, emoji, precio, kcal, proteina, cantidad }]

  /* ---------- Guardar y leer del navegador ---------- */
  function cargar() {
    try {
      items = JSON.parse(localStorage.getItem(C.CLAVE_CARRITO)) || [];
    } catch (error) {
      items = [];
    }
  }

  function guardar() {
    localStorage.setItem(C.CLAVE_CARRITO, JSON.stringify(items));
  }

  /* ---------- Operaciones ---------- */
  function agregar(producto, cantidad) {
    const cant = Math.max(1, parseInt(cantidad, 10) || 1);
    const existente = items.find((i) => i.slug === producto.slug);

    if (existente) {
      existente.cantidad += cant;
    } else {
      items.push({
        slug: producto.slug,
        nombre: producto.nombre,
        emoji: producto.emoji,
        precio: Number(producto.precio),
        kcal: Number(producto.kcal) || 0,
        proteina: Number(producto.proteina) || 0,
        cantidad: cant,
      });
    }

    guardar();
    render();
    U.toast(`${producto.emoji} ${producto.nombre} agregado (x${cant})`, 'exito');

    /* Pequeño aviso visual en el contador */
    const contador = U.$('#cartCount');
    if (contador) {
      contador.classList.remove('bump');
      void contador.offsetWidth;
      contador.classList.add('bump');
    }
  }

  function cambiarCantidad(slug, delta) {
    const item = items.find((i) => i.slug === slug);
    if (!item) return;
    item.cantidad += delta;
    if (item.cantidad <= 0) {
      items = items.filter((i) => i.slug !== slug);
    }
    guardar();
    render();
  }

  function quitar(slug) {
    items = items.filter((i) => i.slug !== slug);
    guardar();
    render();
  }

  function vaciar() {
    items = [];
    guardar();
    render();
    document.dispatchEvent(new CustomEvent('tex:carrito:limpiado'));
  }

  /* ---------- Cuentas ---------- */
  function calcular() {
    const subtotal = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
    const envioGratis = subtotal >= C.ENVIO_GRATIS;
    const domicilio = items.length === 0 || envioGratis ? 0 : C.DOMICILIO;
    const total = subtotal + domicilio;
    const kcal = items.reduce((acc, i) => acc + i.kcal * i.cantidad, 0);
    const proteina = items.reduce((acc, i) => acc + i.proteina * i.cantidad, 0);
    const unidades = items.reduce((acc, i) => acc + i.cantidad, 0);
    return { subtotal, domicilio, total, envioGratis, kcal, proteina, unidades };
  }

  /* ---------- Pintar el carrito ---------- */
  function render() {
    const contenedor = U.$('#cartItems');
    const vacio = U.$('#cartEmpty');
    const resumen = U.$('#cartSummary');
    const bloqueEnvio = U.$('#envioGratis');
    const botonPedido = U.$('#checkoutBtn');
    const pista = U.$('#cartHint');
    const contador = U.$('#cartCount');

    if (!contenedor) return;

    /* Contador del icono */
    if (contador) contador.textContent = items.reduce((acc, i) => acc + i.cantidad, 0);

    if (items.length === 0) {
      contenedor.innerHTML = '';
      if (vacio) vacio.classList.remove('hidden');
      if (resumen) resumen.classList.add('hidden');
      if (bloqueEnvio) bloqueEnvio.classList.add('hidden');
      if (botonPedido) botonPedido.disabled = true;
      actualizarPista();
      return;
    }

    if (vacio) vacio.classList.add('hidden');
    if (resumen) resumen.classList.remove('hidden');

    /* Lista de productos */
    contenedor.innerHTML = items
      .map(
        (i) => `
        <div class="cart-item" data-slug="${i.slug}">
          <div class="cart-item__emoji">${i.emoji}</div>
          <div>
            <div class="cart-item__nombre">${i.nombre}</div>
            <div class="cart-item__precio">${U.precio(i.precio)} c/u · ${U.precio(i.precio * i.cantidad)}</div>
          </div>
          <div class="cart-item__controles">
            <div class="cart-item__qty">
              <button data-accion="menos" aria-label="Quitar uno">−</button>
              <span>${i.cantidad}</span>
              <button data-accion="mas" aria-label="Agregar uno">+</button>
            </div>
            <button class="cart-item__quitar" data-accion="quitar">Quitar</button>
          </div>
        </div>`
      )
      .join('');

    /* Totales */
    const cuentas = calcular();
    U.$('#subtotal').textContent = U.precio(cuentas.subtotal);
    U.$('#domicilio').textContent = cuentas.domicilio === 0 ? 'GRATIS 🎉' : U.precio(cuentas.domicilio);
    U.$('#total').textContent = U.precio(cuentas.total);

    /* Resumen nutricional: el detalle que buscan diabéticos y deportistas */
    U.$('#nutKcal').textContent = cuentas.kcal;
    U.$('#nutProt').textContent = cuentas.proteina;
    U.$('#nutItems').textContent = cuentas.unidades;

    /* Barra de envío gratis */
    pintarEnvio(cuentas);

    if (botonPedido) botonPedido.disabled = false;
    actualizarPista();
  }

  function pintarEnvio(cuentas) {
    const bloque = U.$('#envioGratis');
    const texto = U.$('#envioTexto');
    const progreso = U.$('#envioProgreso');
    if (!bloque || !texto || !progreso) return;

    bloque.classList.remove('hidden');

    if (cuentas.envioGratis) {
      texto.textContent = '🎉 ¡Felicidades! Tu domicilio es GRATIS 🛵';
      progreso.style.width = '100%';
      return;
    }

    const faltante = C.ENVIO_GRATIS - cuentas.subtotal;
    const porcentaje = Math.min(100, Math.round((cuentas.subtotal / C.ENVIO_GRATIS) * 100));
    texto.textContent = `Te faltan ${U.precio(faltante)} para el envío GRATIS 🛵`;
    progreso.style.width = porcentaje + '%';
  }

  /* ---------- Botón de finalizar pedido ---------- */
  function actualizarPista() {
    const pista = U.$('#cartHint');
    const boton = U.$('#checkoutBtn');
    if (!pista || !boton) return;

    if (items.length === 0) {
      pista.textContent = '⚠️ Tu carrito está vacío.';
      pista.classList.remove('ok');
      boton.disabled = true;
      return;
    }

    if (!Tex.auth.conectado) {
      pista.textContent = '⚠️ Debes iniciar sesión para confirmar tu pedido.';
      pista.classList.remove('ok');
      boton.disabled = false; /* se puede pulsar: abrirá el registro */
    } else {
      pista.textContent = '✅ Sesión activa. ¡Confirma tu pedido!';
      pista.classList.add('ok');
      boton.disabled = false;
    }
  }

  /* ---------- Enviar el pedido ---------- */
  async function finalizar() {
    if (items.length === 0) {
      U.toast('Tu carrito está vacío. Agrega algo rico primero 🌮');
      return;
    }

    if (!Tex.auth.conectado) {
      Tex.ui.cerrar('cartDrawer');
      Tex.ui.abrir('authModal');
      U.toast('Crea tu cuenta o inicia sesión para pedir 🔒');
      return;
    }

    const direccion = (U.$('#cartDireccion') ? U.$('#cartDireccion').value : '').trim();
    const telefono = (U.$('#cartTelefono') ? U.$('#cartTelefono').value : '').trim();

    if (!direccion) {
      U.toast('Escribe la dirección de entrega 📍', 'error');
      const campo = U.$('#cartDireccion');
      if (campo) campo.focus();
      return;
    }
    if (!telefono) {
      U.toast('Escribe tu teléfono de contacto 📞', 'error');
      const campo = U.$('#cartTelefono');
      if (campo) campo.focus();
      return;
    }

    const boton = U.$('#checkoutBtn');
    boton.disabled = true;
    boton.textContent = 'Enviando pedido...';

    try {
      const datos = await U.peticion('/pedidos', {
        metodo: 'POST',
        cuerpo: {
          items: items.map((i) => ({ slug: i.slug, cantidad: i.cantidad })),
          tipoEntrega: 'domicilio',
          direccion,
          telefono,
        },
      });

      const resumen = datos.resumen;
      const nombre = Tex.auth.usuario ? Tex.auth.usuario.nombre.split(' ')[0] : 'amigo';

      const resumenHtml =
        items
          .map(
            (i) =>
              `<div class="fila"><span>${i.emoji} ${i.nombre} x${i.cantidad}</span><span>${U.precio(
                i.precio * i.cantidad
              )}</span></div>`
          )
          .join('') +
        `<div class="fila"><span>Subtotal</span><span>${U.precio(resumen.subtotal)}</span></div>` +
        `<div class="fila"><span>Domicilio</span><span>${
          resumen.domicilio === 0 ? 'GRATIS 🎉' : U.precio(resumen.domicilio)
        }</span></div>` +
        `<div class="fila"><strong>Total</strong><strong>${U.precio(resumen.total)}</strong></div>`;

      const cajaResumen = U.$('#successSummary');
      if (cajaResumen) cajaResumen.innerHTML = resumenHtml;
      const cajaUsuario = U.$('#successUser');
      if (cajaUsuario) cajaUsuario.textContent = nombre;

      U.toast(datos.mensaje || '¡Pedido confirmado!', 'exito');
      vaciar();
      Tex.ui.cerrar('cartDrawer');
      Tex.ui.abrir('successModal');
      document.dispatchEvent(new CustomEvent('tex:pedido:exitoso'));
    } catch (error) {
      U.toast(error.message, 'error');
    } finally {
      boton.disabled = false;
      boton.textContent = 'Finalizar pedido';
    }
  }

  /* ---------- Enlaces de eventos ---------- */
  function conectar() {
    const botonCarrito = U.$('#cartBtn');
    if (botonCarrito) {
      botonCarrito.addEventListener('click', () => {
        Tex.ui.abrir('cartDrawer');
        render();
      });
    }

    const lista = U.$('#cartItems');
    if (lista) {
      lista.addEventListener('click', (e) => {
        const boton = e.target.closest('[data-accion]');
        if (!boton) return;
        const fila = boton.closest('.cart-item');
        if (!fila) return;
        const slug = fila.dataset.slug;
        const accion = boton.dataset.accion;

        if (accion === 'mas') cambiarCantidad(slug, 1);
        else if (accion === 'menos') cambiarCantidad(slug, -1);
        else if (accion === 'quitar') quitar(slug);
      });
    }

    const botonPedido = U.$('#checkoutBtn');
    if (botonPedido) botonPedido.addEventListener('click', finalizar);

    /* Cuando cambia la sesión, actualizamos el aviso del pie */
    document.addEventListener('tex:sesion', actualizarPista);
  }

  function init() {
    cargar();
    conectar();
    render();
  }

  return {
    init,
    agregar,
    vaciar,
    render,
    get items() {
      return items;
    },
    get total() {
      return calcular();
    },
  };
})();
