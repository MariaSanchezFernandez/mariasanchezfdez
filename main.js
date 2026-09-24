/* Portfolio de María Sánchez Fernández
 * Sin GSAP (CDN caído) o con movimiento reducido, la página se ve completa y estática:
 * todas las animaciones cuelgan de la clase .gsap en <html>. */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = window.gsap && window.ScrollTrigger && window.SplitText;

// Confeti al descargar el CV (como en el portfolio original)
$$('.js-cv').forEach(a => a.addEventListener('click', e => {
  if (!window.confetti || reduceMotion) return;
  confetti({
    particleCount: 110, spread: 75, colors: ['#0F172A', '#0ACF83', '#FFFFFF'],
    origin: { x: e.clientX / innerWidth || 0.5, y: e.clientY / innerHeight || 0.6 },
  });
}));

/* ─── Footer escondido bajo el contacto (si cabe entero en pantalla) ─── */
const siteFooter = $('.site-footer');
function checkFooterReveal() {
  if (!siteFooter) return;
  const fits = siteFooter.offsetHeight < window.innerHeight * 0.92;
  document.documentElement.classList.toggle('footer-reveal', fits);
}
checkFooterReveal();
window.addEventListener('resize', checkFooterReveal);
document.fonts.ready.then(checkFooterReveal);

/* ─── Hora local en el footer ───────────────────────────────── */
const localTime = $('#localTime');
if (localTime) {
  const fmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
  const tick = () => (localTime.textContent = fmt.format(new Date()));
  tick();
  setInterval(tick, 15000);
}

/* ─── El nombre gigante del footer ocupa justo el ancho disponible ─── */
const footerWord = $('.site-footer__word');
function fitFooterWord() {
  if (!footerWord) return;
  footerWord.style.fontSize = '';
  const base = parseFloat(getComputedStyle(footerWord).fontSize);
  const avail = footerWord.clientWidth;
  footerWord.style.width = 'max-content';
  const needed = footerWord.getBoundingClientRect().width;
  footerWord.style.width = '';
  footerWord.style.fontSize = (base * avail / needed) * 0.99 + 'px';
}
document.fonts.ready.then(fitFooterWord);
window.addEventListener('resize', fitFooterWord);

let lenis = null; // scroll suave; lo crea init() si hay GSAP

if (hasGsap && !reduceMotion) {
  document.documentElement.classList.add('gsap');
  document.fonts.ready.then(init);
}
setupIdea();
setupMenu();

function init() {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* ─── Scroll suave (Lenis) sincronizado con ScrollTrigger ─── */
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Enlaces internos con Lenis
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = $(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.6 });
      else target.scrollIntoView({ behavior: 'smooth' });
      if (a.getAttribute('href') !== '#inicio') {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });

  const intro = setupHero();

  setupHeaderTheme();
  setupChapterIndicator();
  setupTitles();
  setupRomans();
  setupMilestones();
  setupStackCards();
  setupMarquees();
  setupContact();
  setupFlairButtons();
  setupCursor();
  setupTouch();
  setupStackTable();
  setupFooter();
  setupMagnetic();

  // Con todos los pins creados, la página ya tiene su altura real: volvemos a donde estaba
  ScrollTrigger.refresh();
  const saved = restoreScroll(lenis);
  runLoader(lenis, intro, saved > 10);

  window.addEventListener('load', () => ScrollTrigger.refresh());
}

/* ─── Posición de scroll al recargar ───────────────────────── */
// El navegador la restaura antes de que existan los pins y cae en un sitio distinto,
// así que la guardamos nosotros y la aplicamos cuando la maqueta ya está completa.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('pagehide', () => {
  try { sessionStorage.setItem('scrollY', String(window.scrollY)); } catch (_) {}
});
function restoreScroll(lenis) {
  let y = 0;
  try { y = Number(sessionStorage.getItem('scrollY')) || 0; } catch (_) {}
  if (location.hash) {
    const target = $(location.hash);
    if (target) y = target.getBoundingClientRect().top + window.scrollY;
  }
  y = Math.min(y, ScrollTrigger.maxScroll(window));
  window.scrollTo(0, y);
  lenis?.scrollTo(y, { immediate: true, force: true });
  ScrollTrigger.update();
  return y;
}

/* ─── Pantalla de carga ─────────────────────────────────────── */
function runLoader(lenis, intro, midPage) {
  const loader = $('.loader');
  const count = $('#loaderCount');
  lenis?.stop();
  // A mitad de página la entrada de la portada no se ve: se deja terminada para que
  // la bola no "caiga" mientras el scroll la tiene agrandada
  if (midPage) { intro.progress(1); headerTheme.circle.setReady(); }

  const counter = { v: 0 };
  gsap.timeline({
    onComplete: () => {
      loader.remove();
      lenis?.start();
      if (!midPage) intro.play();
    },
  })
    .to(counter, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: () => (count.textContent = Math.round(counter.v)) })
    .to('.loader__bola', { scale: 1, duration: 0.5, ease: 'back.out(2)' }, '-=0.3')
    .to('.loader__inner', { opacity: 0, y: -20, duration: 0.4 }, '<')
    // La bola blanca crece hasta ser la propia página
    .to('.loader__bola', { scale: () => (Math.hypot(innerWidth, innerHeight) / 45) * 1.1, duration: 1, ease: 'expo.inOut' });
}

/* ─── Portada ───────────────────────────────────────────────── */
function setupHero() {
  const first = SplitText.create('.hero__first', { type: 'chars', mask: 'chars', charsClass: 'char' });
  const last = SplitText.create('.hero__last', { type: 'chars', mask: 'chars', charsClass: 'char' });

  // Entrada (se lanza cuando termina la pantalla de carga)
  const intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
    .from(first.chars, { yPercent: 110, duration: 1.3, stagger: 0.06 })
    .from(last.chars, { yPercent: 110, duration: 1.2, stagger: 0.025 }, '-=1.05')
    .from('.hero__kicker span', { y: 16, opacity: 0, duration: 0.8, stagger: 0.1 }, '-=0.9')
    .from('.wrapped', { y: 24, opacity: 0, duration: 0.9 }, '-=0.7')
    // La bola cae desde fuera de la pantalla (antes esperaba encima de las letras)
    .from('.bola', { y: () => -($('.bola').offsetTop + 90), duration: 1.3, ease: 'bounce.out' }, '-=0.8')
    .from('.hero__hint', { opacity: 0, duration: 0.6 }, '-=0.3')
    .from('.header', { yPercent: -100, opacity: 0, duration: 0.9 }, '-=1.2');
  intro.progress(0).pause(); // aplica los estados iniciales ya, antes de la pantalla de carga

  // Palabras que rotan: iOS → Android → Web → UI/UX → Backend
  const words = $$('.palabras span');
  const spin = gsap.timeline({ repeat: -1, delay: 2.6 });
  for (let i = 1; i < words.length; i++) {
    spin.to(words, { yPercent: -100 * i, duration: 0.7, ease: 'expo.inOut' }, '+=1.4');
  }
  spin.set(words, { yPercent: 0 });

  // La bola es una ventana: «Sobre mí» está justo encima, recortado en un círculo con la
  // posición y el tamaño de la bola. Al hacer scroll el círculo crece y deja ver su contenido,
  // así que nunca hay una pantalla azul vacía.
  const bola = $('.bola');
  const about = $('#sobre-mi');
  const circle = headerTheme.circle;
  const measure = () => {
    circle.r0 = bola.offsetWidth / 2;
    circle.cx = bola.offsetLeft + circle.r0;   // mismas coordenadas para la portada y «Sobre mí»
    circle.cy = bola.offsetTop + circle.r0;
    const corners = [[0, 0], [innerWidth, 0], [0, innerHeight], [innerWidth, innerHeight]];
    circle.r1 = Math.max(...corners.map(([x, y]) => Math.hypot(x - circle.cx, y - circle.cy))) + 4;
  };
  const draw = () => {
    about.style.clipPath = circle.open ? 'none' : `circle(${circle.r}px at ${circle.cx}px ${circle.cy}px)`;
    about.style.pointerEvents = circle.r > circle.r0 * 3 || circle.open ? '' : 'none';
  };
  const grow = gsap.parseEase('power2.in');
  measure();
  circle.r = 0; // antes de hacer scroll solo se ve la bola de verdad (que entra rebotando)
  draw();
  ScrollTrigger.addEventListener('refreshInit', measure);

  gsap.timeline({
    scrollTrigger: {
      trigger: '.intro',
      start: 'top top',
      // La bola se abre en el primer 70 % del recorrido; el resto es una pausa en la que no pasa
      // nada, para que «Sobre mí» se quede quieto un momento antes de seguir bajando
      end: '+=130%',
      pin: true,
      scrub: true,
      invalidateOnRefresh: true,
      // El tamaño del círculo sale siempre de la posición del scroll (también al recargar a mitad)
      onUpdate: self => setCircle(self.progress),
      onRefresh: self => setCircle(self.progress),
      onLeave: () => { circle.open = true; setCircle(1); },
      onEnterBack: self => { circle.open = false; setCircle(self.progress); },
    },
  })
    // 1) El nombre sube y se desvanece como un bloque
    .to('.hero__content', { yPercent: -18, scale: 0.94, autoAlpha: 0, filter: 'blur(6px)', duration: 0.21, ease: 'power2.in' }, 0)
    .to('.hero__hint', { autoAlpha: 0, y: -16, duration: 0.14, ease: 'power2.in' }, 0)
    // 2) La bola se convierte en la ventana y crece hasta llenar la pantalla (ver setCircle)
    .set({}, {}, 1);

  const OPEN = 0.7; // parte del recorrido que tarda la bola en llenar la pantalla
  const content = $('.container', about);
  const roman = $('.chapter__roman', about);
  function setCircle(p) {
    circle.last = p;
    const t = Math.min(p / OPEN, 1);
    circle.p = t;
    // Hasta que la bola de verdad termina de caer no se dibuja la ventana (evita ver dos bolas)
    circle.r = p <= 0 || !circle.ready ? 0 : circle.r0 + (circle.r1 - circle.r0) * grow(t);
    draw();
    // El contenido no se ve al principio: aparece a partir de la mitad de la apertura
    const clear = gsap.parseEase('power1.inOut')(gsap.utils.clamp(0, 1, (t - 0.5) / 0.5));
    content.style.opacity = clear;
    if (roman) roman.style.opacity = clear;
  }

  // La ventana se activa cuando la bola ya está en su sitio
  circle.setReady = () => { circle.ready = true; setCircle(circle.last); };
  intro.eventCallback('onComplete', circle.setReady);

  return intro;
}

/* ─── ¿Hay fondo marino en este punto de la pantalla? ────────── */
function isDarkAt(x, y) {
  if (document.documentElement.classList.contains('menu-open')) return true; // el menú del móvil es marino
  const c = headerTheme.circle;
  // El footer está fijo detrás de todo: solo se ve (y cuenta) por debajo del final del contacto
  const footer = $('.site-footer');
  if (footer && y < $('#contacto').getBoundingClientRect().bottom) footer.dataset.hidden = '';
  else if (footer) delete footer.dataset.hidden;
  const inside = el => {
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y < r.bottom;
  };
  if ($$('.scard__inner, .idea__send:not(.idea__send--ghost):not(.idea__send--cv), .to-top').some(inside)) return false; // piezas blancas sobre marino
  // Hasta que la ventana de la bola está abierta, «Sobre mí» (que está encima de la portada)
  // solo cuenta como fondo oscuro dentro del círculo; con el círculo cerrado, nada
  if (!c.open) {
    const a = $('#sobre-mi').getBoundingClientRect();
    if (c.r > 0 && Math.hypot(x - (a.left + c.cx), y - (a.top + c.cy)) <= c.r) return true;
    return $$('[data-theme="dark"]:not(#sobre-mi):not([data-hidden]), .bola').some(inside);
  }
  return $$('[data-theme="dark"]:not([data-hidden]), .bola').some(inside);
}

/* ─── Cabecera: marino sobre blanco, blanco sobre marino ────── */
const headerTheme = { circle: { r: 0, r0: 22, r1: 0, cx: 0, cy: 0, p: 0, open: false, ready: false, last: 0 } };
function setupHeaderTheme() {
  const header = $('#header');
  const update = () => {
    // Se mira el fondo justo debajo del logo y de los enlaces
    const y = header.offsetHeight / 2;
    const dark = document.documentElement.classList.contains('menu-open') || isDarkAt(innerWidth / 2, y) || isDarkAt(innerWidth - 120, y);
    header.classList.toggle('on-dark', dark);
  };
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update, onRefresh: update });
  gsap.ticker.add(update); // también durante la animación de la bola
}

/* ─── Indicador de sección y progreso ───────────────────────── */
function setupChapterIndicator() {
  const indicator = $('.chapter-indicator');
  const num = $('#chapterNum');
  const sections = $$('[data-chapter]').map(sec => {
    return { sec, label: sec.dataset.chapter };
  });
  let current = num.textContent;

  const pick = self => {
    const mid = innerHeight / 2;
    const opening = !headerTheme.circle.open && headerTheme.circle.p < 0.5;
    const hit = sections.find(({ sec }) => {
      if (sec.id === 'sobre-mi' && opening) return false;
      if (sec.id === 'inicio' && !opening) return false;
      const r = sec.getBoundingClientRect();
      return r.top <= mid && r.bottom > mid;
    });
    gsap.to(indicator, { autoAlpha: self && self.progress > 0.97 ? 0 : 1, duration: 0.3, overwrite: 'auto' });
    const ir = indicator.getBoundingClientRect();
    indicator.classList.toggle('on-dark', isDarkAt(ir.left + 4, ir.top + ir.height / 2));
    if (!hit || hit.label === current) return;
    current = hit.label;
    gsap.timeline()
      .to(num, { yPercent: -100, opacity: 0, duration: 0.18, ease: 'power2.in', overwrite: true })
      .add(() => (num.textContent = current))
      .fromTo(num, { yPercent: 100 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });
  };

  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: pick, onRefresh: pick });
  gsap.to('#chapterBar', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });
}

/* ─── Títulos: líneas que suben desde una máscara ───────────── */
const revealAt = (el, start) => ({ trigger: el, start });

function setupTitles() {
  $$('[data-lines]').forEach(el => {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'line' });
    gsap.from(split.lines, {
      yPercent: 115, rotate: 3, duration: 1.3, stagger: 0.12, ease: 'expo.out',
      scrollTrigger: revealAt(el, 'top 85%'),
    });
  });

  $$('.chapter__head').forEach(head => {
    gsap.from(head.children, {
      y: 20, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: revealAt(head, 'top 90%'),
    });
  });

  gsap.from('.about__body > *, .about__facts > div', {
    y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: 'expo.out',
    scrollTrigger: revealAt($('.about__body'), 'top 80%'),
  });

  $$('.chapter__lead').forEach(el => {
    gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
}

function setupRomans() {
  $$('.chapter__roman').forEach(el => {
    gsap.fromTo(el, { yPercent: 30 }, {
      yPercent: -20, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

/* ─── Experiencia: línea de tiempo que se dibuja ──────────── */
function setupMilestones() {
  $$('.milestone').forEach(m => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: m, start: 'top 78%' } })
      .from($('.milestone__dot', m), { scale: 0, duration: 0.6, ease: 'back.out(3)' })
      .from($$('.milestone__date, .milestone__title, .milestone__text', m), { x: 40, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out' }, '-=0.4');
    const line = $('.milestone__line', m);
    if (line) tl.from(line, { scaleY: 0, duration: 1, ease: 'power2.inOut' }, 0.3);
  });
}

/* ─── Botones: el relleno entra y sale por donde pasa el ratón ─── */
function setupFlairButtons() {
  $$('[data-block="button"]').forEach(btn => {
    const flair = $('.button__flair', btn);
    const xSet = gsap.quickSetter(flair, 'xPercent');
    const ySet = gsap.quickSetter(flair, 'yPercent');
    const getXY = e => {
      const { left, top, width, height } = btn.getBoundingClientRect();
      return {
        x: gsap.utils.clamp(0, 100, gsap.utils.mapRange(0, width, 0, 100, e.clientX - left)),
        y: gsap.utils.clamp(0, 100, gsap.utils.mapRange(0, height, 0, 100, e.clientY - top)),
      };
    };

    btn.addEventListener('mouseenter', e => {
      const { x, y } = getXY(e);
      xSet(x); ySet(y);
      gsap.to(flair, { scale: 1, duration: 0.4, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', e => {
      const { x, y } = getXY(e);
      gsap.killTweensOf(flair);
      gsap.to(flair, {
        xPercent: x > 90 ? x + 20 : x < 10 ? x - 20 : x,
        yPercent: y > 90 ? y + 20 : y < 10 ? y - 20 : y,
        scale: 0, duration: 0.3, ease: 'power2.out',
      });
    });
    btn.addEventListener('mousemove', e => {
      const { x, y } = getXY(e);
      gsap.to(flair, { xPercent: x, yPercent: y, duration: 0.4, ease: 'power2' });
    });
    // Con el dedo: el relleno sale de donde tocas y se va al soltar
    btn.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      const { x, y } = getXY(e);
      gsap.killTweensOf(flair);
      gsap.fromTo(flair, { xPercent: x, yPercent: y, scale: 0 }, { scale: 1, duration: 0.45, ease: 'power2.out' });
    });
    const release = e => {
      if (e.pointerType === 'mouse') return;
      gsap.to(flair, { scale: 0, duration: 0.5, delay: 0.25, ease: 'power2.inOut' });
    };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
  });
}

/* ─── Proyectos: tarjetas que se apilan ─────────────────────── */
function setupStackCards() {
  const cards = $$('.scard');
  cards.forEach((card, i) => {
    card.style.setProperty('--i', i);
    const inner = $('.scard__inner', card);

    gsap.from(inner, {
      y: 120, rotateX: -10, transformPerspective: 1200, ease: 'power3.out',
      scrollTrigger: { trigger: card, start: 'top bottom', end: 'top 60%', scrub: true },
    });

    gsap.from($$('.scard__body > *', card), {
      y: 40, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out',
      scrollTrigger: { trigger: card, start: 'top 65%' },
    });
  });

  // El apilado solo en pantallas donde la tarjeta entera cabe en la ventana
  // (en el móvil la tarjeta se ajusta al alto de la pantalla, ver styles.css)
  gsap.matchMedia().add('(min-width: 861px), (min-height: 560px)', () => {
    cards.slice(0, -1).forEach((card, i) => {
      // La de atrás se encoge un poco y su contenido se apaga; el fondo sigue siendo marino
      const st = { trigger: cards[i + 1], start: 'top bottom', end: 'top 20%', scrub: true };
      gsap.to($('.scard__inner', card), { scale: 0.92 + i * 0.012, ease: 'none', scrollTrigger: st });
      gsap.to($$('.scard__inner > *', card), { opacity: 0.18, ease: 'none', scrollTrigger: { ...st } });
    });
  });
}

/* ─── Stack: marquesinas que reaccionan a la velocidad ─────── */
function setupMarquees() {
  const loops = $$('.marquee').map(m => {
    const track = $('.marquee__track', m);
    track.innerHTML += track.innerHTML; // duplica para el bucle infinito
    $$(':scope > *', track).slice(track.children.length / 2).forEach(n => n.setAttribute('aria-hidden', 'true'));
    const dir = Number(m.dataset.direction) || 1;
    const tween = gsap.fromTo(track, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 28, ease: 'none', repeat: -1 });

    gsap.fromTo(m, { x: dir * 80 }, {
      x: -dir * 80, ease: 'none',
      scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true },
    });
    return tween;
  });

  ScrollTrigger.create({
    trigger: '.tools', start: 'top bottom', end: 'bottom top',
    onUpdate: self => {
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 250, 8);
      loops.forEach(t => gsap.to(t, { timeScale: boost, duration: 0.2, overwrite: true, onComplete: () => gsap.to(t, { timeScale: 1, duration: 1.2 }) }));
    },
  });
}

/* ─── Cursor: una bola que sigue al ratón ───────────────────── */
function setupCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const cursor = $('.cursor');
  const label = $('.cursor__label');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
  gsap.set(cursor, { scale: 0 });

  const refresh = () => cursor.classList.toggle('on-dark', isDarkAt(gsap.getProperty(cursor, 'x'), gsap.getProperty(cursor, 'y')));
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: refresh });

  window.addEventListener('mousemove', e => {
    xTo(e.clientX);
    yTo(e.clientY);
    cursor.classList.toggle('on-dark', isDarkAt(e.clientX, e.clientY));
    gsap.to(cursor, { scale: 1, duration: 0.3, overwrite: 'auto' });
  }, { passive: true });
  document.addEventListener('mouseleave', () => gsap.to(cursor, { scale: 0, duration: 0.3 }));

  $$('[data-cursor]').forEach(el => {
    el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursor; cursor.classList.add('is-big'); });
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-big'));
  });
  $$('a:not([data-cursor]), button').forEach(el => {
    // En los botones con relleno el cursor se encoge para dejar ver el efecto
    const scale = el.matches('[data-block="button"]') ? 0.5 : 2.2;
    el.addEventListener('mouseenter', () => gsap.to(cursor, { scale, duration: 0.3 }));
    el.addEventListener('mouseleave', () => gsap.to(cursor, { scale: 1, duration: 0.3 }));
  });
}

/* ─── Toque: lo que en el PC hace el ratón ─────────────────── */
function setupTouch() {
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  // Una bola aparece donde tocas y se desvanece (el cursor del PC, pero con el dedo)
  window.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || e.target.closest('.game')) return;
    const dot = document.createElement('span');
    dot.className = 'tap' + (isDarkAt(e.clientX, e.clientY) ? ' on-dark' : '');
    document.body.appendChild(dot);
    gsap.fromTo(dot, { x: e.clientX, y: e.clientY, scale: 0.2, opacity: 0.9 },
      { scale: 1.6, opacity: 0, duration: 0.6, ease: 'power2.out', onComplete: () => dot.remove() });
  }, { passive: true });

  // Chips del stack: se encienden al tocarlas, como con el ratón encima
  $$('.tech__list li').forEach(li => li.addEventListener('pointerdown', () => {
    li.classList.add('is-on');
    gsap.fromTo(li, { scale: 0.92 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    setTimeout(() => li.classList.remove('is-on'), 900);
  }));

  // Sin ratón, las chips se encienden solas en cascada cuando entran en pantalla
  $$('.tech__list').forEach(list => {
    ScrollTrigger.create({
      trigger: list, start: 'top 70%', once: true,
      onEnter: () => $$('li', list).forEach((li, i) => {
        setTimeout(() => li.classList.add('is-on'), 250 + i * 90);
        setTimeout(() => li.classList.remove('is-on'), 650 + i * 90);
      }),
    });
  });
}

/* ─── Contacto: entrada del título y la pista ──────────────── */
function setupContact() {
  gsap.from('.idea__hint, .idea__sentence, .idea__actions, .idea__alt', {
    y: 40, opacity: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out',
    scrollTrigger: { trigger: '.idea', start: 'top 75%' },
  });
}

/* ─── Stack: filas que entran en cascada ────────────────────── */
function setupStackTable() {
  $$('.tech__group').forEach(group => {
    gsap.from($$('.tech__title, .tech__list li', group), {
      y: 24, opacity: 0, duration: 0.8, stagger: 0.05, ease: 'expo.out',
      scrollTrigger: { trigger: group, start: 'top 85%' },
    });
  });
}

/* ─── Footer ────────────────────────────────────────────────── */
function setupFooter() {
  const word = $('.site-footer__word');
  const split = SplitText.create($$('.w-bold, .w-thin', word), { type: 'chars', charsClass: 'char' });

  // El nombre gigante sube letra a letra al llegar al final
  // Mientras el contacto sube y lo descubre, el footer asoma desde un poco más abajo
  const reveal = () => document.documentElement.classList.contains('footer-reveal');
  gsap.from('.site-footer__inner', {
    yPercent: () => (reveal() ? 18 : 0), opacity: () => (reveal() ? 0.3 : 1), ease: 'none',
    scrollTrigger: { trigger: '#contacto', start: 'bottom bottom', end: () => `bottom ${innerHeight - siteFooter.offsetHeight}px`, scrub: true, invalidateOnRefresh: true },
  });
  gsap.from(split.chars, {
    yPercent: 100, opacity: 0, stagger: 0.035, ease: 'power3.out',
    scrollTrigger: { trigger: '#contacto', start: 'bottom 85%', end: () => `bottom ${innerHeight - siteFooter.offsetHeight}px`, scrub: 1, invalidateOnRefresh: true },
  });
  gsap.from('.site-footer__cols > *', {
    y: 40, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out',
    scrollTrigger: { trigger: '#contacto', start: 'bottom 75%' },
  });

  // Secreto: las letras saltan al pasar el ratón (o el dedo)
  const hop = ch => {
    if (gsap.isTweening(ch)) return;
    gsap.timeline()
      .to(ch, { yPercent: -22, rotate: gsap.utils.random(-8, 8), duration: 0.25, ease: 'power2.out' })
      .to(ch, { yPercent: 0, rotate: 0, duration: 0.9, ease: 'elastic.out(1.1, 0.35)' });
  };
  split.chars.forEach(ch => ch.addEventListener('mouseenter', () => hop(ch)));
  const hopAt = e => {
    for (const t of e.changedTouches) {
      const ch = document.elementFromPoint(t.clientX, t.clientY)?.closest('.site-footer__word .char');
      if (ch) hop(ch);
    }
  };
  word.addEventListener('touchstart', hopAt, { passive: true });
  word.addEventListener('touchmove', hopAt, { passive: true });
}

/* ─── Botones magnéticos (volver arriba) ───────────────────── */
function setupMagnetic() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  $$('.magnetic').forEach(el => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.35);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.35)' }));
  });
}

/* ─── Menú del móvil ──────────────────────────────────────────
 * Se abre como la bola: un círculo marino que crece desde el botón (en CSS).
 * Funciona también sin GSAP. */
function setupMenu() {
  const btn = $('#menuBtn');
  const menu = $('#menu');
  if (!btn || !menu) return;
  const root = document.documentElement;
  const label = $('.header__menu-label', btn);
  const links = $$('.menu__links a', menu);

  const toggle = open => {
    if (open === root.classList.contains('menu-open')) return;
    const r = $('.header__menu-dot', btn).getBoundingClientRect();
    menu.style.setProperty('--mx', r.left + r.width / 2 + 'px');
    menu.style.setProperty('--my', r.top + r.height / 2 + 'px');
    root.classList.toggle('menu-open', open);
    menu.inert = !open;
    btn.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Cerrar' : 'Menú';
    if (open) {
      lenis?.stop();
      // Resalta la sección en la que estás
      const here = $$('main section[id]').find(s => { const b = s.getBoundingClientRect(); return b.top <= innerHeight / 2 && b.bottom > innerHeight / 2; });
      links.forEach(a => a.classList.toggle('is-current', !!here && a.getAttribute('href') === '#' + here.id));
      setTimeout(() => links[0].focus({ preventScroll: true }), 350);
    } else {
      lenis?.start();
    }
  };

  btn.addEventListener('click', () => toggle(!root.classList.contains('menu-open')));
  // Al elegir una sección se cierra el menú y el scroll lo hace el manejador de los enlaces internos
  $$('a', menu).forEach(a => a.addEventListener('click', () => toggle(false)));
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && root.classList.contains('menu-open')) { toggle(false); btn.focus(); }
  });
  matchMedia('(min-width: 701px)').addEventListener('change', e => e.matches && toggle(false));
}

/* ─── Contacto: «Cuéntame tu idea» ────────────────────────────
 * Una frase con huecos que escribe quien visita la web; se convierte en el
 * mensaje de email o WhatsApp. Funciona también sin GSAP. */
function setupIdea() {
  const form = $('#ideaForm');
  if (!form) return;
  const inputs = $$('.idea__field input', form);
  const [nameIn, whatIn, forIn] = inputs;
  const mail = $('#ideaMail');
  const wa = $('#ideaWa');

  const update = () => {
    const name = nameIn.value.trim(), what = whatIn.value.trim(), para = forIn.value.trim();
    if (!name && !what && !para) {
      mail.href = 'mailto:sanchez.fdez.maria@gmail.com';
      wa.href = 'https://wa.me/34681085558';
      return;
    }
    let frase = 'Hola María' + (name ? `, soy ${name}` : '') + '.';
    if (what) frase += ` Necesito ${what}${para ? ` para ${para}` : ''}.`;
    else if (para) frase += ` Te escribo por ${para}.`;
    const subject = what ? `Idea: ${what}${para ? ` para ${para}` : ''}` : 'Hola, María';
    mail.href = `mailto:sanchez.fdez.maria@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(frase + '\n\n')}`;
    wa.href = `https://wa.me/34681085558?text=${encodeURIComponent(frase)}`;
  };

  // Cada hueco crece con lo que se escribe
  const sizer = document.createElement('span');
  sizer.setAttribute('aria-hidden', 'true');
  sizer.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;pointer-events:none;';
  form.appendChild(sizer);
  const fit = input => {
    const cs = getComputedStyle(input);
    sizer.style.font = cs.font;
    sizer.style.letterSpacing = cs.letterSpacing;
    sizer.textContent = input.value || input.placeholder;
    input.style.width = sizer.offsetWidth + 4 + 'px';
  };
  inputs.forEach(input => input.addEventListener('input', () => { fit(input); update(); }));
  const fitAll = () => inputs.forEach(fit);
  document.fonts.ready.then(fitAll);
  window.addEventListener('resize', fitAll);

  // Enter en un hueco pasa al siguiente; en el último, abre el email
  form.addEventListener('submit', e => e.preventDefault());
  inputs.forEach((input, i) => input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (inputs[i + 1]) inputs[i + 1].focus();
    else mail.click();
  }));

  // Copiar el email
  $('#copyEmail').addEventListener('click', async e => {
    try {
      await navigator.clipboard.writeText(e.currentTarget.dataset.email);
      toast('Email copiado: sanchez.fdez.maria@gmail.com');
    } catch (_) {
      toast('sanchez.fdez.maria@gmail.com');
    }
  });

  update();
}

/* ════════════════════════════════════════════════════════════
 * Secretos
 * ════════════════════════════════════════════════════════════ */
function toast(msg, ms = 3200) {
  let el = $('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('is-on');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('is-on'), ms);
}

function storeGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
function storeSet(k, v) { try { localStorage.setItem(k, v); } catch (_) {} }

// Un saludo para quien abre la consola
console.log(
  '%c¡Hola, curiosa o curioso! 👋%c\nEsta web esconde algunos secretos. Pistas: un punto que no pinta nada, un código clásico de videojuegos y un logo al que le gusta que le hagan clic.',
  'font: 700 16px Inter, sans-serif; color: #0F172A',
  'font: 13px Inter, sans-serif; color: #0ACF83'
);

/* 1 · Código Konami → «Modo azul», la paleta alternativa */
(() => {
  const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let pos = 0;
  if (storeGet('modo2024') === '1') document.documentElement.classList.add('retro');
  window.addEventListener('keydown', e => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = key === code[pos] ? pos + 1 : key === code[0] ? 1 : 0;
    if (pos < code.length) return;
    pos = 0;
    const on = document.documentElement.classList.toggle('retro');
    storeSet('modo2024', on ? '1' : '0');
    toast(on ? 'Modo azul activado: la paleta alternativa' : 'De vuelta al verde');
  });
})();

/* 2 · Cinco clics seguidos en «MSF» → lluvia de bolas */
(() => {
  const logo = $('.header__logo');
  let clicks = 0, timer;
  logo?.addEventListener('click', () => {
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(() => (clicks = 0), 700);
    if (clicks < 5) return;
    clicks = 0;
    if (window.confetti && !reduceMotion) {
      const colors = ['#0F172A', '#1E293B', '#0ACF83'];
      [0.2, 0.5, 0.8].forEach((x, i) => setTimeout(() => confetti({
        particleCount: 40, spread: 70, startVelocity: 18, gravity: 1.3, ticks: 260,
        origin: { x, y: -0.1 }, shapes: ['circle'], scalar: 1.6, colors,
      }), i * 140));
    }
    toast('¡Lluvia de bolas! Todavía quedan secretos por encontrar…');
  });
})();

/* 3 · El punto escondido del footer → «Atrapa la bola» */
(() => {
  const trigger = $('.secret-dot');
  if (!trigger) return;
  let playing = false;

  trigger.addEventListener('click', () => {
    if (playing) return;
    playing = true;

    const layer = document.createElement('div');
    layer.className = 'game';
    layer.innerHTML = `
      <div class="game__hud" aria-live="polite">
        <span class="game__title">Atrapa la bola</span>
        <span class="game__score"><b>0</b> bolas</span>
        <span class="game__time">15</span>
        <button class="game__close" type="button" aria-label="Salir del juego">Esc</button>
      </div>
      <button class="game__ball" type="button" aria-label="Bola"></button>`;
    document.body.appendChild(layer);

    const ball = $('.game__ball', layer);
    const scoreEl = $('.game__score b', layer);
    const timeEl = $('.game__time', layer);
    let score = 0, size = 64, speed = 5;
    let x = innerWidth / 2 - size / 2, y = innerHeight / 2 - size / 2;
    let angle = Math.random() * Math.PI * 2;
    let vx = Math.cos(angle) * speed, vy = Math.sin(angle) * speed;
    let raf, left = 15;

    const place = () => { ball.style.width = ball.style.height = size + 'px'; ball.style.transform = `translate(${x}px, ${y}px)`; };
    const loop = () => {
      x += vx; y += vy;
      if (x < 0 || x > innerWidth - size) { vx *= -1; x = Math.max(0, Math.min(x, innerWidth - size)); }
      if (y < 70 || y > innerHeight - size) { vy *= -1; y = Math.max(70, Math.min(y, innerHeight - size)); }
      place();
      raf = requestAnimationFrame(loop);
    };

    ball.addEventListener('pointerdown', e => {
      e.preventDefault();
      score++;
      scoreEl.textContent = score;
      navigator.vibrate?.(15);
      size = Math.max(26, size - 3);
      speed = Math.min(16, speed + 0.8);
      angle = Math.random() * Math.PI * 2;
      vx = Math.cos(angle) * speed; vy = Math.sin(angle) * speed;
      ball.classList.remove('is-hit'); void ball.offsetWidth; ball.classList.add('is-hit');
    });

    const countdown = setInterval(() => {
      left--;
      timeEl.textContent = left;
      if (left <= 0) end();
    }, 1000);

    const onKey = e => { if (e.key === 'Escape') end(true); };
    window.addEventListener('keydown', onKey);
    $('.game__close', layer).addEventListener('click', () => end(true));

    function end(quit) {
      clearInterval(countdown);
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      layer.classList.add('is-out');
      setTimeout(() => layer.remove(), 400);
      playing = false;
      if (quit) return;
      const best = Math.max(score, Number(storeGet('bolaRecord')) || 0);
      storeSet('bolaRecord', best);
      toast(score > 0 && score >= best ? `¡Nuevo récord: ${score} bolas!` : `${score} bolas. Tu récord: ${best}`, 4200);
    }

    place();
    requestAnimationFrame(() => layer.classList.add('is-on'));
    raf = requestAnimationFrame(loop);
  });
})();
