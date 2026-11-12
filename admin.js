/* ============================================================
   admin.js — Panel de administración
   Solo la cuenta con rol "admin" puede entrar. Muestra los
   pedidos recibidos (guardados en MongoDB) y los mensajes del
   formulario de contacto.
   ============================================================ */
(function () {
  const U = Tex.utils;

  const ESTADOS = ['confirmado', 'preparando', 'en camino', 'entregado'];

  /* ---------- Cambiar entre ingreso y panel ---------- */
  function mostrarPanel(mostrar) {
    U.$('#adminLogin').classList.toggle('hidden', mostrar);
    U.$('#adminPanel').classList.toggle('hidden', !mostrar);
    U.$('#salirBtn').classList.toggle('hidden', !mostrar);
  }

  /* ---------- Ingreso ---------- */
  function conectarIngreso() {
    const form = U.$('#adminForm');
    const error = U.$('#adminError');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      error.classList.add('hidden');
      const boton = form.querySelector('button[type="submit"]');
      boton.disabled = true;

      try {
        const datos = await U.peticion('/auth/login', {
          metodo: 'POST',
          conToken: false,
          cuerpo: {
            email: U.$('#adminEmail').value.trim(),
            password: U.$('#adminPass').value,
          },
        });

        if (datos.usuario.rol !== 'admin') {
          throw new Error('Esa cuenta no es de administrador.');
        }

        U.guardarSesion(datos.token, datos.usuario);
        U.toast('Bienvenido, ' + datos.usuario.nombre, 'exito');
        entrar();
      } catch (err) {
        error.textContent = err.message;
        error.classList.remove('hidden');
      } finally {
        boton.disabled = false;
      }
    });
  }

  function conectarSalida() {
    U.$('#salirBtn').addEventListener('click', () => {
      U.borrarSesion();
      U.toast('Sesión cerrada.');
      mostrarPanel(false);
    });
  }

  /* ---------- Pedidos ---------- */
  function pintarPedidos(pedidos) {
    const contenedor = U.$('#pedidosContenedor');

    if (!pedidos.length) {
      contenedor.innerHTML = '<p class="admin-vacio">Todavía no hay pedidos. 🌮</p>';
      return;
    }

    contenedor.innerHTML = pedidos
      .map((p) => {
        const cliente = p.usuario ? p.usuario.nombre : 'Cliente eliminado';
        const correo = p.usuario ? p.usuario.email : '';
        const fecha = new Date(p.createdAt).toLocaleString('es-CO');

        const items = p.items
          .map(
            (i) =>
              `<li>${i.emoji || '🍽️'} ${i.nombre} <strong>x${i.cantidad}</strong> — ${U.precio(i.subtotal)}</li>`
          )
          .join('');

        const opciones = ESTADOS.map(
          (estado) =>
            `<option value="${estado}" ${estado === p.estado ? 'selected' : ''}>${estado}</option>`
        ).join('');

        return `
          <article class="pedido">
            <div class="pedido__cabecera">
              <div>
                <strong>${cliente}</strong>
                <span class="pedido__correo">${correo}</span>
              </div>
              <span class="pedido__fecha">${fecha}</span>
            </div>
            <ul class="pedido__items">${items}</ul>
            <div class="pedido__datos">
              <span>📍 ${p.direccion || 'Sin dirección'}</span>
              <span>📞 ${p.telefono || 'Sin teléfono'}</span>
              <span>🛵 ${p.domicilio === 0 ? 'Envío gratis' : U.precio(p.domicilio)}</span>
            </div>
            <div class="pedido__pie">
              <strong class="pedido__total">Total: ${U.precio(p.total)}</strong>
              <select class="pedido__estado" data-id="${p._id}">${opciones}</select>
            </div>
          </article>`;
      })
      .join('');

    /* Cambiar el estado de un pedido */
    U.$$('.pedido__estado', contenedor).forEach((selector) => {
      selector.addEventListener('change', async () => {
        try {
          await U.peticion('/pedidos/' + selector.dataset.id + '/estado', {
            metodo: 'PATCH',
            cuerpo: { estado: selector.value },
          });
          U.toast('Pedido marcado como "' + selector.value + '"', 'exito');
          cargarTodo();
        } catch (error) {
          U.toast(error.message, 'error');
        }
      });
    });
  }

  /* ---------- Mensajes ---------- */
  function pintarMensajes(mensajes) {
    const contenedor = U.$('#mensajesContenedor');

    if (!mensajes.length) {
      contenedor.innerHTML = '<p class="admin-vacio">Todavía no hay mensajes.</p>';
      return;
    }

    contenedor.innerHTML = mensajes
      .map(
        (m) => `
        <article class="mensaje-admin">
          <div class="mensaje-admin__cabecera">
            <strong>${m.nombre}</strong>
            <span>📞 ${m.telefono}</span>
          </div>
          <p>${m.mensaje}</p>
          <span class="mensaje-admin__fecha">${new Date(m.createdAt).toLocaleString('es-CO')}</span>
        </article>`
      )
      .join('');
  }

  /* ---------- Cargar todo ---------- */
  async function cargarTodo() {
    try {
      const pedidos = await U.peticion('/pedidos');
      pintarPedidos(pedidos.pedidos);

      const ventas = pedidos.pedidos.reduce((acc, p) => acc + p.total, 0);
      const pendientes = pedidos.pedidos.filter((p) => p.estado !== 'entregado').length;
      U.$('#statPedidos').textContent = pedidos.total;
      U.$('#statVentas').textContent = U.precio(ventas);
      U.$('#statPendientes').textContent = pendientes;
    } catch (error) {
      U.toast(error.message, 'error');
      if (/sesión|token|inválida/i.test(error.message)) mostrarPanel(false);
    }

    try {
      const mensajes = await U.peticion('/contacto');
      pintarMensajes(mensajes.mensajes);
      U.$('#statMensajes').textContent = mensajes.total;
    } catch (error) {
      U.$('#mensajesContenedor').innerHTML =
        '<p class="admin-vacio">No se pudieron cargar los mensajes.</p>';
    }
  }

  /* ---------- Entrar al panel ---------- */
  function entrar() {
    mostrarPanel(true);
    cargarTodo();
  }

  async function arrancar() {
    conectarIngreso();
    conectarSalida();
    U.$('#refrescarBtn').addEventListener('click', cargarTodo);

    const usuario = U.leerUsuario();
    if (usuario && usuario.rol === 'admin' && U.leerToken()) {
      try {
        const datos = await U.peticion('/auth/yo');
        if (datos.usuario.rol === 'admin') {
          entrar();
          return;
        }
      } catch (error) {
        U.borrarSesion();
      }
    }
    mostrarPanel(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }
})();
