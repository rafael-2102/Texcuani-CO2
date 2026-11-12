/* ============================================================
   efectos.js — Detalles visuales
   Barra de progreso de lectura, emojis que siguen el mouse y
   lluvia de confeti cuando se confirma un pedido.
   ============================================================ */
Tex.efectos = (function () {
  const U = Tex.utils;

  /* ---------- Barra de progreso de lectura ---------- */
  function barraProgreso() {
    const barra = U.$('#progressBar');
    if (!barra) return;
    window.addEventListener('scroll', () => {
      const alto = document.documentElement.scrollHeight - window.innerHeight;
      const avance = alto > 0 ? (window.scrollY / alto) * 100 : 0;
      barra.style.width = avance + '%';
    });
  }

  /* ---------- Los emojis del inicio siguen el mouse ---------- */
  function parallaxHero() {
    const hero = U.$('.hero');
    const emojis = U.$$('.float-emoji');
    if (!hero || !emojis.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 760px)').matches) return;

    hero.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      emojis.forEach((emoji, i) => {
        const fuerza = 6 + (i % 3) * 5;
        emoji.style.transform = `translate(${x * fuerza}px, ${y * fuerza}px)`;
      });
    });
  }

  /* ---------- Confeti al confirmar el pedido ---------- */
  function confeti() {
    const colores = ['#E63946', '#FFC23C', '#2A9D8F', '#8AC926', '#118AB2', '#C75B39'];
    const contenedor = document.createElement('div');
    contenedor.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:1999;overflow:hidden;';
    document.body.appendChild(contenedor);

    for (let i = 0; i < 70; i++) {
      const pieza = document.createElement('span');
      const tamano = 7 + Math.random() * 9;
      pieza.style.cssText =
        'position:absolute;top:-16px;' +
        'left:' + Math.random() * 100 + '%;' +
        'width:' + tamano + 'px;height:' + tamano + 'px;' +
        'background:' + colores[Math.floor(Math.random() * colores.length)] + ';' +
        'border-radius:' + (Math.random() > 0.5 ? '50%' : '3px') + ';' +
        'opacity:0.95;' +
        'transition:transform ' + (1.6 + Math.random() * 1.6) + 's linear, top ' +
        (1.6 + Math.random() * 1.6) + 's linear, opacity 2.6s;';
      contenedor.appendChild(pieza);

      requestAnimationFrame(() => {
        pieza.style.top = 90 + Math.random() * 20 + '%';
        pieza.style.transform =
          'translateX(' + (Math.random() - 0.5) * 260 + 'px) rotate(' + Math.random() * 720 + 'deg)';
      });
    }

    setTimeout(() => contenedor.remove(), 3200);
  }

  /* ---------- Emojis extra que caen suavemente en el fondo ---------- */
  function emojisAmbiente() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const comidas = ['🌮', '🥑', '🍌', '🌶️', '🫘', '🍹', '🥗', '🥙'];
    setInterval(() => {
      if (document.hidden) return;
      const emoji = document.createElement('span');
      emoji.textContent = comidas[Math.floor(Math.random() * comidas.length)];
      emoji.style.cssText =
        'position:fixed;top:-40px;left:' + Math.random() * 100 + '%;' +
        'font-size:' + (18 + Math.random() * 18) + 'px;' +
        'opacity:0;pointer-events:none;z-index:5;' +
        'transition:top 9s linear, opacity 1.4s ease;';
      document.body.appendChild(emoji);

      requestAnimationFrame(() => {
        emoji.style.opacity = '0.32';
        emoji.style.top = '105vh';
      });
      setTimeout(() => emoji.remove(), 10000);
    }, 4200);
  }

  function init() {
    barraProgreso();
    parallaxHero();
    emojisAmbiente();
    document.addEventListener('tex:pedido:exitoso', confeti);
  }

  return { init, confeti };
})();
