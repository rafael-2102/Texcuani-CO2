/* ============================================================
   auth.js — Cuentas de usuario
   Registro y login contra la API (que guarda los usuarios en
   MongoDB con la contraseña encriptada). El token JWT se
   almacena en el navegador para las siguientes peticiones.
   ============================================================ */
Tex.auth = (function () {
  const U = Tex.utils;

  const estado = {
    usuario: U.leerUsuario(), // { id, nombre, email, perfil, rol }
  };

  /* ---------- Pintar el botón del usuario ---------- */
  function pintarUsuario() {
    const boton = U.$('#navUserBtn');
    const texto = U.$('#navUserText');
    if (!boton || !texto) return;

    if (estado.usuario) {
      texto.textContent = estado.usuario.nombre.split(' ')[0];
      boton.classList.add('conectado');
    } else {
      texto.textContent = 'Ingresar';
      boton.classList.remove('conectado');
    }

    /* Avisamos al carrito por si debe habilitar el botón de pedido */
    document.dispatchEvent(new CustomEvent('tex:sesion', { detail: estado.usuario }));
  }

  /* ---------- Menú desplegable cuando hay sesión ---------- */
  function menuUsuario() {
    const existente = U.$('#userMenu');
    if (existente) existente.remove();

    const boton = U.$('#navUserBtn');
    const menu = document.createElement('div');
    menu.id = 'userMenu';
    menu.className = 'user-menu';
    menu.innerHTML =
      '<span class="user-menu__saludo">Hola, ' +
      estado.usuario.nombre.split(' ')[0] +
      ' 👋</span>' +
      '<button class="user-menu__item" data-accion="pedidos">🧾 Mis pedidos</button>' +
      '<button class="user-menu__item user-menu__item--salir" data-accion="salir">Cerrar sesión</button>';

    boton.parentElement.style.position = 'relative';
    boton.parentElement.appendChild(menu);

    menu.addEventListener('click', async (e) => {
      const accion = e.target.dataset.accion;
      if (!accion) return;
      menu.remove();

      if (accion === 'salir') {
        U.borrarSesion();
        estado.usuario = null;
        pintarUsuario();
        U.toast('Sesión cerrada. ¡Vuelve pronto! 🌮', 'exito');
        return;
      }

      if (accion === 'pedidos') {
        try {
          const datos = await U.peticion('/pedidos/mios');
          if (!datos.pedidos.length) {
            U.toast('Todavía no tienes pedidos registrados.');
            return;
          }
          U.toast(
            'Tienes ' + datos.pedidos.length + ' pedido(s). Último: ' +
              U.precio(datos.pedidos[0].total) + ' (' + datos.pedidos[0].estado + ')'
          );
        } catch (error) {
          U.toast(error.message, 'error');
        }
      }
    });

    /* Se cierra al hacer clic en cualquier otra parte */
    setTimeout(() => {
      document.addEventListener('click', function fuera(ev) {
        if (!menu.contains(ev.target)) {
          menu.remove();
          document.removeEventListener('click', fuera);
        }
      });
    }, 0);
  }

  /* ---------- Pestañas del modal ---------- */
  function conectarPestanas() {
    U.$$('.auth-tab').forEach((pestana) => {
      pestana.addEventListener('click', () => {
        U.$$('.auth-tab').forEach((p) => p.classList.remove('active'));
        pestana.classList.add('active');

        const esLogin = pestana.dataset.tab === 'login';
        U.$('#loginForm').classList.toggle('hidden', !esLogin);
        U.$('#registerForm').classList.toggle('hidden', esLogin);

        const titulo = U.$('#authTitle');
        const subtitulo = U.$('#authSubtitle');
        if (titulo) titulo.textContent = esLogin ? 'Bienvenido' : 'Crea tu cuenta';
        if (subtitulo) {
          subtitulo.textContent = esLogin
            ? 'Para hacer tu pedido, inicia sesión o crea una cuenta con tu correo.'
            : 'Regístrate con tu correo para pedir y llevar el control de tus pedidos.';
        }
        limpiarError();
      });
    });
  }

  function mostrarError(mensaje) {
    const form = U.$('#loginForm').classList.contains('hidden') ? U.$('#registerForm') : U.$('#loginForm');
    limpiarError();
    const caja = document.createElement('p');
    caja.className = 'auth-error';
    caja.textContent = mensaje;
    form.insertBefore(caja, form.firstChild);
  }

  function limpiarError() {
    U.$$('.auth-error').forEach((el) => el.remove());
  }

  /* ---------- Formularios ---------- */
  function conectarFormularios() {
    const formLogin = U.$('#loginForm');
    const formRegistro = U.$('#registerForm');

    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      limpiarError();
      const boton = formLogin.querySelector('button[type="submit"]');
      boton.disabled = true;

      try {
        const datos = await U.peticion('/auth/login', {
          metodo: 'POST',
          conToken: false,
          cuerpo: {
            email: U.$('#loginEmail').value.trim(),
            password: U.$('#loginPass').value,
          },
        });
        entrar(datos);
      } catch (error) {
        mostrarError(error.message);
      } finally {
        boton.disabled = false;
      }
    });

    formRegistro.addEventListener('submit', async (e) => {
      e.preventDefault();
      limpiarError();
      const boton = formRegistro.querySelector('button[type="submit"]');
      boton.disabled = true;

      try {
        const datos = await U.peticion('/auth/registro', {
          metodo: 'POST',
          conToken: false,
          cuerpo: {
            nombre: U.$('#regName').value.trim(),
            email: U.$('#regEmail').value.trim(),
            password: U.$('#regPass').value,
            perfil: U.$('#regPerfil').value,
          },
        });
        entrar(datos);
      } catch (error) {
        mostrarError(error.message);
      } finally {
        boton.disabled = false;
      }
    });
  }

  function entrar(datos) {
    U.guardarSesion(datos.token, datos.usuario);
    estado.usuario = datos.usuario;
    pintarUsuario();
    U.toast(datos.mensaje || '¡Listo!', 'exito');
    Tex.ui.cerrar('authModal');
    formLoginReset();
  }

  function formLoginReset() {
    const l = U.$('#loginForm');
    const r = U.$('#registerForm');
    if (l) l.reset();
    if (r) r.reset();
    limpiarError();
  }

  /* ---------- Botón "Ingresar" de la barra superior ---------- */
  function conectarBoton() {
    const boton = U.$('#navUserBtn');
    if (!boton) return;
    boton.addEventListener('click', () => {
      if (estado.usuario) {
        menuUsuario();
      } else {
        Tex.ui.abrir('authModal');
      }
    });
  }

  /* ---------- Revisar que el token siga siendo válido ---------- */
  async function validarSesion() {
    if (!U.leerToken()) return;
    try {
      const datos = await U.peticion('/auth/yo');
      estado.usuario = datos.usuario;
      U.guardarSesion(U.leerToken(), datos.usuario);
      pintarUsuario();
    } catch (error) {
      U.borrarSesion();
      estado.usuario = null;
      pintarUsuario();
    }
  }

  function init() {
    conectarPestanas();
    conectarFormularios();
    conectarBoton();
    pintarUsuario();
    validarSesion();
  }

  return {
    init,
    get usuario() {
      return estado.usuario;
    },
    get conectado() {
      return Boolean(estado.usuario);
    },
  };
})();
