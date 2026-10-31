
const $  = (s, ctx = document) => ctx.querySelector(s);
const $$ = (s, ctx = document) => [...ctx.querySelectorAll(s)];
const fmt = n => '$' + new Intl.NumberFormat('es-CO').format(n);
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toast = (msg, type = 'ok') => {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast show toast-${type}`;
  setTimeout(() => t.classList.remove('show'), 2600);
};

// ---------- Menú móvil ----------
const toggle = $('#navToggle');
const menu   = $('#navMenu');
if (toggle && menu) {
  toggle.addEventListener('click', () => {
    menu.classList.toggle('active');
    toggle.classList.toggle('active');
  });
}
$$('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    if (menu)   menu.classList.remove('active');
    if (toggle) toggle.classList.remove('active');
  });
});

// ---------- Smooth scroll ----------
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    e.preventDefault();
    const t = $(href);
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ---------- Formulario de contacto (demo) ----------
const contactForm = $('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    toast('¡Mensaje enviado! Te responderemos pronto 🇲🇽🇨🇴');
    e.target.reset();
  });
}

// ---------- Sistema de modales ----------
$$('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});
$$('[data-close-link]').forEach(btn => {
  btn.addEventListener('click', () => closeCart());
});
if ($('.cart-overlay')) $('.cart-overlay').addEventListener('click', closeCart);

function openModal(id){
  const m = $('#' + id);
  if (!m) return;
  m.classList.add('show');
  m.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeModal(id){
  if (id === 'cartDrawer') return closeCart();
  const m = $('#' + id);
  if (!m) return;
  m.classList.remove('show');
  m.setAttribute('aria-hidden', 'true');
  if (!$('.modal-overlay.show')) document.body.style.overflow = '';
}
function openCart(){
  if ($('#cartOverlay')) $('#cartOverlay').classList.add('show');
  if ($('#cartDrawer'))  $('#cartDrawer').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart(){
  if ($('#cartOverlay')) $('#cartOverlay').classList.remove('show');
  if ($('#cartDrawer'))  $('#cartDrawer').classList.remove('open');
  if (!$('.modal-overlay.show')) document.body.style.overflow = '';
}

// ---------- Autenticación (localStorage, demo) ----------
const USERS_KEY   = 'texcuani_users';
const SESSION_KEY = 'texcuani_session';
let currentUser = (() => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
})();

function getUsers(){
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}
function saveUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

function updateUserUI(){
  const t = $('#navUserText');
  const hint   = $('#cartHint');
  const checkout = $('#checkoutBtn');
  if (currentUser && t) {
    t.textContent = currentUser.nombre.split(' ')[0] + ' 👋';
    if ($('#navUserBtn'))
      $('#navUserBtn').title = `Cerrar sesión de ${currentUser.email}`;
    if (hint)     hint.hidden = true;
    if (checkout) checkout.disabled = false;
  } else if (t) {
    t.textContent = 'Ingresar';
    if ($('#navUserBtn'))
      $('#navUserBtn').title = 'Iniciar sesión / Registrarse';
    if (hint)     hint.hidden = false;
    if (checkout) checkout.disabled = true;
  }
}
updateUserUI();

// Tabs Auth
$$('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const isLogin = tab.dataset.tab === 'login';
    if ($('#loginForm'))    $('#loginForm').classList.toggle('hidden', !isLogin);
    if ($('#registerForm')) $('#registerForm').classList.toggle('hidden', isLogin);
  });
});

// Registro
const regForm = $('#registerForm');
if (regForm) {
  regForm.addEventListener('submit', e => {
    e.preventDefault();
    const nombre = $('#regName').value.trim();
    const email  = $('#regEmail').value.trim().toLowerCase();
    const pass   = $('#regPass').value;
    const perfil = $('#regPerfil').value;

    if (!emailRx.test(email)) return toast('Ingresa un correo válido', 'err');

    const users = getUsers();
    if (users.find(u => u.email === email)) {
      return toast('Ese correo ya está registrado', 'err');
    }
    const user = { nombre, email, pass, perfil, creado: Date.now() };
    users.push(user);
    saveUsers(users);
    currentUser = { nombre, email, perfil };
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    toast('¡Cuenta creada! Bienvenido/a ' + nombre.split(' ')[0]);
    updateUserUI();
    closeModal('authModal');
    e.target.reset();
  });
}

// Login
const logForm = $('#loginForm');
if (logForm) {
  logForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = $('#loginEmail').value.trim().toLowerCase();
    const pass  = $('#loginPass').value;

    if (!emailRx.test(email)) return toast('Ingresa un correo válido', 'err');

    const users = getUsers();
    const user  = users.find(u => u.email === email && u.pass === pass);
    if (!user) return toast('Correo o contraseña incorrectos', 'err');

    currentUser = { nombre: user.nombre, email: user.email, perfil: user.perfil };
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    toast('¡Hola de nuevo, ' + user.nombre.split(' ')[0] + '!');
    updateUserUI();
    closeModal('authModal');
    e.target.reset();
  });
}

// Botón usuario (login / logout)
if ($('#navUserBtn')) {
  $('#navUserBtn').addEventListener('click', () => {
    if (currentUser) {
      if (confirm(`¿Cerrar sesión de ${currentUser.email}?`)) {
        currentUser = null;
        localStorage.removeItem(SESSION_KEY);
        updateUserUI();
        toast('Sesión cerrada');
      }
    } else {
      openModal('authModal');
    }
  });
}

// ---------- Carrito ----------
let cart = []; // {id, nombre, precio, cantidad}

if ($('#cartBtn')) $('#cartBtn').addEventListener('click', openCart);

// Contadores + / -
$$('.qty-plus').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.product-card');
    const span = card && card.querySelector('.qty-value');
    if (!span) return;
    span.textContent = Math.min(99, parseInt(span.textContent || '0', 10) + 1);
  });
});
$$('.qty-minus').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.product-card');
    const span = card && card.querySelector('.qty-value');
    if (!span) return;
    span.textContent = Math.max(0, parseInt(span.textContent || '0', 10) - 1);
  });
});

// Agregar al carrito
$$('.btn-add').forEach(btn => {
  btn.addEventListener('click', () => {
    const card  = btn.closest('.product-card');
    const qtyEl = card && card.querySelector('.qty-value');
    if (!card || !qtyEl) return;

    const qty = parseInt(qtyEl.textContent || '0', 10);
    if (qty <= 0) return toast('Primero elige una cantidad (+)', 'warn');

    const id     = card.dataset.id;
    const nombre = card.dataset.nombre;
    const precio = parseInt(card.dataset.precio, 10);

    const exist = cart.find(i => i.id === id);
    if (exist) exist.cantidad += qty;
    else cart.push({ id, nombre, precio, cantidad: qty });

    qtyEl.textContent = 0;
    renderCart();
    toast(`+${qty} ${nombre} agregado`);

    // Mini feedback en el botón
    const orig = btn.textContent;
    btn.textContent = '✓ Agregado';
    btn.style.background = 'linear-gradient(135deg, var(--red-mx), var(--red-mx-light))';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.background = '';
    }, 900);
  });
});

function renderCart(){
  const items = $('#cartItems');
  if (!items) return;

  const totalItems = cart.reduce((s, i) => s + i.cantidad, 0);
  const countEl = $('#cartCount');
  if (countEl) {
    countEl.textContent = totalItems;
    countEl.classList.toggle('pulse', totalItems > 0);
  }

  const subtotal  = cart.reduce((s, i) => s + (i.precio * i.cantidad), 0);
  const domicilio = cart.length ? 3000 : 0;
  const total     = subtotal + domicilio;

  if ($('#cartEmpty'))   $('#cartEmpty').hidden   = cart.length > 0;
  if ($('#cartSummary')) $('#cartSummary').hidden = cart.length === 0;

  items.innerHTML = cart.map(it => `
    <div class="cart-item" data-id="${it.id}">
      <div class="cart-item-info">
        <div class="cart-item-name">${it.nombre}</div>
        <div class="cart-item-price">${fmt(it.precio)} c/u</div>
      </div>
      <div class="cart-item-actions">
        <div class="qty-row small">
          <button class="qty-btn qty-minus" data-act="minus">−</button>
          <span class="qty-value">${it.cantidad}</span>
          <button class="qty-btn qty-plus"  data-act="plus">+</button>
        </div>
        <button class="cart-item-remove" data-act="remove" title="Quitar">🗑️</button>
        <div class="cart-item-sub">${fmt(it.precio * it.cantidad)}</div>
      </div>
    </div>
  `).join('');

  if ($('#subtotal'))  $('#subtotal').textContent  = fmt(subtotal);
  if ($('#domicilio')) $('#domicilio').textContent = fmt(domicilio);
  if ($('#total'))     $('#total').textContent     = fmt(total);

  // Eventos internos del carrito
  items.querySelectorAll('.cart-item').forEach(row => {
    const id = row.dataset.id;
    const qtyVal = row.querySelector('.qty-value');

    const plus = row.querySelector('[data-act="plus"]');
    if (plus) plus.addEventListener('click', () => {
      const it = cart.find(x => x.id === id);
      if (!it) return;
      it.cantidad = Math.min(99, it.cantidad + 1);
      if (qtyVal) qtyVal.textContent = it.cantidad;
      renderCart();
    });

    const minus = row.querySelector('[data-act="minus"]');
    if (minus) minus.addEventListener('click', () => {
      const it = cart.find(x => x.id === id);
      if (!it) return;
      it.cantidad--;
      if (it.cantidad <= 0) cart = cart.filter(x => x.id !== id);
      renderCart();
    });

    const rm = row.querySelector('[data-act="remove"]');
    if (rm) rm.addEventListener('click', () => {
      const it = cart.find(x => x.id === id);
      if (!it) return;
      toast(`Quitaste ${it.nombre}`, 'warn');
      cart = cart.filter(x => x.id !== id);
      renderCart();
    });
  });
}
renderCart();

// ---------- Checkout ----------
if ($('#checkoutBtn')) {
  $('#checkoutBtn').addEventListener('click', () => {
    if (cart.length === 0) {
      toast('Tu carrito está vacío', 'warn');
      return;
    }
    // Regla obligatoria: sin auth NO puede pedir
    if (!currentUser) {
      toast('Inicia sesión para finalizar tu pedido', 'err');
      openModal('authModal');
      return;
    }
    const subtotal = cart.reduce((s, i) => s + (i.precio * i.cantidad), 0);
    const total = subtotal + 3000;

    if ($('#successUser'))
      $('#successUser').textContent = currentUser.nombre.split(' ')[0];

    if ($('#successSummary')) {
      $('#successSummary').innerHTML = `
        <div class="summary-row">
          <span>Platos (${cart.reduce((s, i) => s + i.cantidad, 0)})</span>
          <span>${fmt(subtotal)}</span>
        </div>
        <div class="summary-row"><span>Domicilio</span><span>$3.000</span></div>
        <div class="summary-row total">
          <strong>Total pagado</strong>
          <strong>${fmt(total)}</strong>
        </div>
        <div class="success-order">
          ${cart.map(i => `• ${i.cantidad}x ${i.nombre}`).join('<br>')}
        </div>
      `;
    }

    // Limpiar pedido
    cart = [];
    renderCart();
    closeCart();
    openModal('successModal');
  });
}

// ---------- Cerrar modales con ESC ----------
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if ($('#cartDrawer') && $('#cartDrawer').classList.contains('open')) closeCart();
  $$('.modal-overlay.show').forEach(m => {
    m.classList.remove('show');
    m.setAttribute('aria-hidden', 'true');
  });
  if (!$('.modal-overlay.show') && !($('#cartDrawer') && $('#cartDrawer').classList.contains('open'))) {
    document.body.style.overflow = '';
  }
});
