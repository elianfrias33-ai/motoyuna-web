import './styles.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';
import Lenis from 'lenis';
import manifest from './image-manifest.json';
import { BUSINESS, CATALOG, SWATCH, waLink } from './data.js';

gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
ScrollTrigger.config({ ignoreMobileResize: true });

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const BASE = import.meta.env.BASE_URL;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const money = (n) => `RD$ ${Math.round(n).toLocaleString('en-US')}`;
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

/* ───────── Smooth scroll ───────── */
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const lockScroll = (lock) => {
  document.documentElement.style.overflow = lock ? 'hidden' : '';
  if (lenis) (lock ? lenis.stop() : lenis.start());
};
function scrollToTarget(hash) {
  const target = hash === '#inicio' || hash === '#' ? 0 : $(hash);
  if (target === null) return;
  if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else if (target === 0) window.scrollTo({ top: 0 });
  else target.scrollIntoView();
}

/* ───────── Images ───────── */
function photoTag(name, { sizes = '100vw', alt = '', cls = '', lazy = true } = {}) {
  const m = manifest[name];
  if (!m) return '';
  const srcset = m.widths.map((w) => `${BASE}img/${name}-${w}.webp ${w}w`).join(', ');
  const fallback = m.widths.find((w) => w >= 1080) ?? m.widths[m.widths.length - 1];
  return `<img src="${BASE}img/${name}-${fallback}.webp" srcset="${srcset}" sizes="${sizes}" width="1000" height="${Math.round((m.h / m.w) * 1000)}" alt="${escapeHtml(alt)}" class="${cls}" ${lazy ? 'loading="lazy"' : ''} decoding="async">`;
}
const productInfo = (slug) => (slug && manifest.__products ? manifest.__products[slug] : null);
const productUrl = (slug) => `${BASE}img/products/${slug}.webp`;
const photoUrl = (name, w = 640) => {
  const m = manifest[name];
  if (!m) return '';
  return `${BASE}img/${name}-${m.widths.find((x) => x >= w) ?? m.widths[m.widths.length - 1]}.webp`;
};

/* ───────── WhatsApp links ───────── */
function wireWhatsApp() {
  $$('[data-wa]').forEach((a) => (a.href = waLink()));
  $$('[data-wa-text]').forEach((a) => (a.href = waLink(a.dataset.waText)));
}

/* ───────── Open / closed status (Dominican time) ───────── */
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const fmtTime = (min) => {
  const h = Math.floor(min / 60), m = min % 60;
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
function nowInDR() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: BUSINESS.timezone, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
}
function computeStatus() {
  const { day, minutes } = nowInDR();
  const today = BUSINESS.hours[day];
  const open = today.find(([o, c]) => minutes >= o && minutes < c);
  if (open) return { open: true, text: `Abierto ahora · cierra ${fmtTime(open[1])}`, day };
  const laterToday = today.find(([o]) => o > minutes);
  if (laterToday) {
    const lunch = today.some(([, c]) => c <= minutes);
    return { open: false, text: `${lunch ? 'Almuerzo' : 'Cerrado'} · abrimos hoy ${fmtTime(laterToday[0])}`, day };
  }
  for (let k = 1; k <= 7; k++) {
    const d = (day + k) % 7;
    if (BUSINESS.hours[d].length) {
      const when = k === 1 ? 'mañana' : `el ${DAY_NAMES[d]}`;
      return { open: false, text: `Cerrado · abrimos ${when} ${fmtTime(BUSINESS.hours[d][0][0])}`, day };
    }
  }
  return { open: false, text: 'Cerrado', day };
}
function updateStatus() {
  const s = computeStatus();
  $$('[data-status]').forEach((el) => {
    el.classList.toggle('is-open', s.open);
    el.classList.toggle('is-closed', !s.open);
    $('[data-status-text]', el).textContent = s.text;
  });
  const row = s.day === 0 ? '0' : s.day === 6 ? '6' : '1-5';
  $$('.hours tr').forEach((tr) => tr.classList.toggle('is-today', tr.dataset.day === row));
}

/* ───────── Catalog ───────── */
const TIPO = { pasola: 'Pasola', moto: 'Motocicleta', utilitario: 'Utilitario' };
const COND = { nueva: 'Nueva', importada: 'Importada de Japón', agotado: 'Agotado' };
const BADGE = { nueva: 'Nueva', importada: 'Japón', agotado: 'Agotado' };
const brands = [...new Set(CATALOG.map((v) => v.marca))];

function swatchBg(colorName) {
  const parts = colorName.split(/\s+(?:con|y)\s+/i).map((p) => SWATCH[p.trim()] || '#9a9a9a');
  if (parts.length === 1) return parts[0];
  const step = 100 / parts.length;
  return `linear-gradient(135deg, ${parts.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(', ')})`;
}
const ccOf = (name) => (name.match(/(\d{2,3})\s*cc/i) || [])[1];

function cardMedia(v) {
  const photoColors = v.fotos ? Object.keys(v.fotos) : [];
  const badge = `<span class="card__badge card__badge--${v.condicion}">${BADGE[v.condicion]}</span>`;
  if (photoColors.length) {
    const first = photoColors[0];
    return {
      html: `<div class="card__media">${badge}<span class="card__real">Foto real</span>${photoTag(v.fotos[first], { sizes: '(min-width: 1200px) 24vw, (min-width: 760px) 33vw, 50vw', alt: `${v.marca} ${v.nombre} en ${first}, foto real de Motoyuna` })}</div>`,
      activeColor: first,
    };
  }
  const prod = productInfo(v.producto);
  if (prod) {
    return {
      html: `<div class="card__media card__media--product${prod.cover ? ' card__media--cover' : ''}">${badge}<span class="card__real card__real--ref">Foto referencial</span><img src="${productUrl(v.producto)}" width="${prod.w}" height="${prod.h}" alt="${escapeHtml(`${v.marca} ${v.nombre}, foto referencial del fabricante`)}" loading="lazy" decoding="async"></div>`,
      activeColor: null,
    };
  }
  const cc = ccOf(v.nombre);
  const model = v.nombre.replace(/\s*\d{2,3}\s*cc/i, '').trim();
  return {
    html: `<div class="card__media">${badge}<div class="tile" aria-hidden="true"><span class="tile__brand">${escapeHtml(v.marca)}</span>${cc ? `<span class="tile__cc">${cc}<small>cc</small></span>` : ''}<div><span class="tile__name">${escapeHtml(model)}</span><span class="tile__note">Pide fotos y video por WhatsApp</span></div></div></div>`,
    activeColor: null,
  };
}

function waTextFor(v, color) {
  const price = v.precio ? ` (${money(v.precio)})` : '';
  return `¡Hola Motoyuna! Me interesa la ${v.marca} ${v.nombre}${color ? ` en color ${color}` : ''}${price}. ¿Está disponible?`;
}

function renderCatalog() {
  const grid = $('[data-catalog]');
  grid.innerHTML = CATALOG.map((v, i) => {
    const off = v.condicion === 'agotado';
    const media = cardMedia(v);
    const swatches = v.colores.map((c) => {
      const hasPhoto = v.fotos && v.fotos[c];
      const active = media.activeColor === c;
      return hasPhoto
        ? `<button type="button" class="swatch${active ? ' is-active' : ''}" style="background:${swatchBg(c)}" data-has-photo data-color="${escapeHtml(c)}" aria-label="Ver foto en ${escapeHtml(c)}" aria-pressed="${active}"></button>`
        : `<span class="swatch" style="background:${swatchBg(c)}" role="img" aria-label="${escapeHtml(c)}" title="${escapeHtml(c)}"></span>`;
    }).join('');
    const colorLabel = media.activeColor || (v.colores.length === 1 ? v.colores[0] : v.colores.length ? `${v.colores.length} colores` : 'Sin existencia');
    let price;
    if (v.precio) price = `<span class="card__amount">${money(v.precio)}</span><span class="card__fin"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>Financiamiento disponible</span>`;
    else if (v.inicial) price = `<span class="card__amount"><small class="card__brand">Inicial desde</small><br>${money(v.inicial)}</span><span class="card__fin"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>Financiamiento disponible</span>`;
    else price = `<span class="card__amount card__amount--ask">${off ? 'No disponible' : 'Precio por WhatsApp'}</span>`;
    const preview = v.fotos ? photoUrl(Object.values(v.fotos)[0], 640) : productInfo(v.producto) ? productUrl(v.producto) : '';
    return `
      <article class="card${off ? ' card--off' : ''}" data-i="${i}" data-tipo="${v.tipo}" data-cond="${v.condicion}" data-marca="${v.marca.toLowerCase()}" data-preview="${preview}" data-preview-kind="${v.fotos || productInfo(v.producto)?.cover ? 'photo' : 'product'}" data-flip-id="card-${i}" ${off ? '' : 'data-cursor="Ver"'}>
        ${media.html}
        <div class="card__body">
          <span class="card__idx">${String(i + 1).padStart(2, '0')}</span>
          <span class="card__brand">${escapeHtml(v.marca)}</span>
          <h3 class="card__name">${escapeHtml(v.nombre)}</h3>
          <span class="card__type">${TIPO[v.tipo]} · ${COND[v.condicion]}</span>
          <div class="swatches">${swatches}<span class="swatches__name" data-color-name>${escapeHtml(colorLabel)}</span></div>
          <div class="card__price">${price}</div>
          ${off ? '<span class="card__cta">Agotado</span>' : `<a class="card__cta" href="${waLink(waTextFor(v, media.activeColor))}" target="_blank" rel="noopener" data-card-wa><svg class="icon" aria-hidden="true"><use href="#i-wa"/></svg>Consultar</a>`}
        </div>
      </article>`;
  }).join('');

  $('[data-brand-group]').innerHTML = brands
    .map((b) => `<button type="button" class="chip chip--brand" data-brand="${b.toLowerCase()}" aria-pressed="false">${escapeHtml(b)}</button>`)
    .join('');

  const available = CATALOG.filter((v) => v.condicion !== 'agotado').length;
  $('[data-catalog-count]').textContent = `${CATALOG.length} unidades · ${available} disponibles`;
  const brandsEl = $('[data-count-brands]');
  brandsEl.textContent = brands.length;
  brandsEl.dataset.count = brands.length;
  const modelsEl = $('[data-count-models]');
  if (modelsEl) modelsEl.textContent = CATALOG.length;
}

function setupCatalog() {
  const grid = $('[data-catalog]');
  const empty = $('[data-catalog-empty]');
  const state = { tipo: 'todos', marca: null };

  const apply = (animate = true) => {
    const cards = $$('.card', grid);
    const flipState = animate && !reduceMotion ? Flip.getState(cards) : null;
    let shown = 0;
    cards.forEach((card) => {
      const t = state.tipo;
      const okTipo = t === 'todos' || (t === 'importada' ? card.dataset.cond === 'importada' : card.dataset.tipo === t);
      const okMarca = !state.marca || card.dataset.marca === state.marca;
      const visible = okTipo && okMarca;
      card.style.display = visible ? '' : 'none';
      if (visible) shown++;
    });
    empty.hidden = shown > 0;
    $$('[data-filter]').forEach((b) => {
      const on = b.dataset.filter === state.tipo;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on);
    });
    $$('[data-brand]').forEach((b) => {
      const on = b.dataset.brand === state.marca;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on);
    });
    if (flipState) {
      Flip.from(flipState, {
        duration: 0.7,
        ease: 'power3.inOut',
        absolute: true,
        scale: false,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.03 }),
        onComplete: () => ScrollTrigger.refresh(),
      });
    } else {
      ScrollTrigger.refresh();
    }
  };

  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-filter]');
    if (f) { state.tipo = f.dataset.filter; apply(); return; }
    const b = e.target.closest('[data-brand]');
    if (b) { state.marca = state.marca === b.dataset.brand ? null : b.dataset.brand; apply(); return; }
    if (e.target.closest('[data-filter-reset]')) { state.tipo = 'todos'; state.marca = null; apply(); return; }
    const link = e.target.closest('[data-filter-link]');
    if (link) {
      e.preventDefault();
      state.tipo = 'todos';
      state.marca = link.dataset.filterLink;
      apply(false);
      scrollToTarget('#catalogo');
      return;
    }
    const sw = e.target.closest('.swatch[data-has-photo]');
    if (sw) {
      const card = sw.closest('.card');
      const v = CATALOG[Number(card.dataset.i)];
      const color = sw.dataset.color;
      const media = $('.card__media', card);
      const oldImg = $('img', media);
      const tmp = document.createElement('div');
      tmp.innerHTML = photoTag(v.fotos[color], { sizes: '(min-width: 1200px) 24vw, (min-width: 760px) 33vw, 50vw', alt: `${v.marca} ${v.nombre} en ${color}, foto real de Motoyuna`, lazy: false });
      const img = tmp.firstElementChild;
      img.style.opacity = '0';
      img.style.position = 'absolute';
      img.style.inset = '0';
      media.appendChild(img);
      const show = () => {
        gsap.to(img, { opacity: 1, duration: 0.45, ease: 'power2.out', onComplete: () => { oldImg?.remove(); img.style.position = ''; img.style.inset = ''; } });
      };
      img.decode ? img.decode().then(show, show) : show();
      $$('.swatch[data-has-photo]', card).forEach((s) => { s.classList.toggle('is-active', s === sw); s.setAttribute('aria-pressed', s === sw); });
      $('[data-color-name]', card).textContent = color;
      const cta = $('[data-card-wa]', card);
      if (cta) cta.href = waLink(waTextFor(v, color));
      card.dataset.preview = photoUrl(v.fotos[color], 640);
    }
  });

  // grid / list view
  $$('[data-view]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const mode = btn.dataset.view;
      if (grid.dataset.viewMode === mode) return;
      const cards = $$('.card', grid);
      const fs = reduceMotion ? null : Flip.getState(cards);
      grid.dataset.viewMode = mode;
      $$('[data-view]').forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', b === btn); });
      if (fs) Flip.from(fs, { duration: 0.6, ease: 'power3.inOut', absolute: true, onComplete: () => ScrollTrigger.refresh() });
      else ScrollTrigger.refresh();
    })
  );

  // floating preview in list view
  if (finePointer) {
    const box = $('.list-preview');
    const img = $('[data-list-preview]');
    const xTo = gsap.quickTo(box, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(box, 'y', { duration: 0.5, ease: 'power3' });
    let current = null;
    grid.addEventListener('pointermove', (e) => {
      if (grid.dataset.viewMode !== 'list') return;
      const card = e.target.closest('.card');
      xTo(e.clientX + 24);
      yTo(e.clientY - 140);
      if (card && card.dataset.preview) {
        if (current !== card.dataset.preview) {
          current = card.dataset.preview;
          img.src = current;
          box.classList.toggle('is-product', card.dataset.previewKind === 'product');
        }
        box.classList.add('is-on');
      } else box.classList.remove('is-on');
    });
    grid.addEventListener('pointerleave', () => box.classList.remove('is-on'));
  }
  apply(false);
}

/* ───────── Financing calculator ───────── */
function setupCalc() {
  const input = $('[data-calc-input]');
  const out = $('[data-calc-value]');
  const counter = { v: 0 };
  input.addEventListener('input', () => {
    const digits = input.value.replace(/\D/g, '').slice(0, 9);
    const n = Number(digits);
    input.value = digits ? n.toLocaleString('en-US') : '';
    if (!digits) { out.textContent = 'RD$ —'; counter.v = 0; return; }
    gsap.to(counter, { v: n * 0.4, duration: 0.6, ease: 'power3.out', overwrite: true, onUpdate: () => (out.textContent = `${money(counter.v)} / mes`) });
  });
}

/* ───────── Menu ───────── */
function setupMenu() {
  const toggle = $('[data-menu-toggle]');
  const menu = $('[data-menu]');
  const nav = $('[data-nav]');
  let open = false;
  const links = $$('.menu__links a', menu);
  const setOpen = (v, after) => {
    open = v;
    toggle.setAttribute('aria-expanded', v);
    $('.nav__burger-text', toggle).textContent = v ? 'Cerrar' : 'Menú';
    nav.classList.remove('is-hidden');
    if (v) {
      menu.hidden = false;
      lockScroll(true);
      gsap.timeline()
        .to(menu, { clipPath: 'inset(0 0 0% 0)', duration: reduceMotion ? 0 : 0.8, ease: 'expo.inOut' })
        .fromTo(links, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: 'expo.out' }, '-=0.35');
      links[0].focus({ preventScroll: true });
    } else {
      gsap.to(menu, {
        clipPath: 'inset(0 0 100% 0)', duration: reduceMotion ? 0 : 0.7, ease: 'expo.inOut',
        onComplete: () => { menu.hidden = true; lockScroll(false); after && after(); },
      });
    }
  };
  toggle.addEventListener('click', () => setOpen(!open));
  links.forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); setOpen(false, () => scrollToTarget(a.getAttribute('href'))); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { setOpen(false); toggle.focus(); } });
  window.matchMedia('(min-width: 1201px)').addEventListener('change', (e) => { if (e.matches && open) setOpen(false); });
}

/* ───────── Cursor + magnetic ───────── */
function setupPointer() {
  if (!finePointer || reduceMotion) return;
  const cursor = $('.cursor');
  const label = $('.cursor__label');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
  window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); cursor.classList.add('is-on'); }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor]');
    const grid = e.target.closest('[data-catalog]');
    const listMode = grid && grid.dataset.viewMode === 'list';
    const interactive = e.target.closest('a, button, input, summary, label');
    if (t && !listMode && !(interactive && interactive !== t)) {
      label.textContent = t.dataset.cursor;
      cursor.classList.add('is-big');
    } else cursor.classList.remove('is-big');
  });

  $$('[data-magnetic]').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - (r.left + r.width / 2)) * 0.22);
      my((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    el.addEventListener('pointerleave', () => { mx(0); my(0); });
  });
}

/* ───────── Scroll animations ───────── */
function splitHeadings() {
  const map = new Map();
  $$('[data-split]').forEach((el) => {
    const split = SplitText.create(el, { type: 'lines,words', mask: 'lines', linesClass: 'split-line', wordsClass: 'split-word', aria: 'auto' });
    map.set(el, split);
  });
  return map;
}

function heroAnimations(splits) {
  const hero = $('.hero');
  const pin = $('.hero__pin');
  const content = $('.hero__content');
  const titleWords = splits.get($('.hero__title'))?.words || [];
  const rest = [$('.eyebrow', content), $('.hero__sub', content), ...$$('.hero__ctas .btn', content)];

  const intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
    .fromTo(pin, { '--i': 0 }, { '--i': 1, duration: 1.5, ease: 'expo.inOut' }, 0)
    .from('.hero__word--moto .logo-mask', { xPercent: -24, opacity: 0, duration: 1.4 }, 0.35)
    .from('.hero__word--yuna .logo-mask', { xPercent: 24, opacity: 0, duration: 1.4 }, 0.35)
    .from('.hero__corner > *', { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, 0.8);

  const mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 761px)', mobile: '(max-width: 760px)' }, (ctx) => {
    const { desktop } = ctx.conditions;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: () => `+=${window.innerHeight * 1.7}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    tl.to(pin, { '--p': 1, duration: 1, ease: 'power2.inOut' }, 0)
      .to('.hero__word--moto', desktop ? { xPercent: -130, opacity: 0, duration: 0.75, ease: 'power2.in' } : { yPercent: -260, opacity: 0, duration: 0.75, ease: 'power2.in' }, 0)
      .to('.hero__word--yuna', desktop ? { xPercent: 130, opacity: 0, duration: 0.75, ease: 'power2.in' } : { yPercent: 260, opacity: 0, duration: 0.75, ease: 'power2.in' }, 0)
      .to('.hero__corner', { opacity: 0, y: 20, duration: 0.25 }, 0)
      .to('.hero__shade', { opacity: 1, duration: 0.45, ease: 'none' }, 0.55)
      .set(content, { visibility: 'visible' }, 0.7)
      .fromTo(titleWords, { yPercent: 115 }, { yPercent: 0, duration: 0.5, stagger: 0.025, ease: 'power3.out' }, 0.7)
      .fromTo(rest, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power3.out' }, 0.85)
      .to({}, { duration: 0.35 });
    return () => tl.scrollTrigger && tl.scrollTrigger.kill();
  });
  return intro;
}

function sectionAnimations(splits) {
  // headings
  splits.forEach((split, el) => {
    if (el.classList.contains('hero__title')) return;
    gsap.from(split.words, {
      yPercent: 115, duration: 1.1, ease: 'expo.out', stagger: 0.04,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // manifesto word-by-word reading
  const mf = $('[data-manifesto]');
  const mSplit = SplitText.create(mf, { type: 'words', wordsClass: 'mw', aria: 'auto' });
  gsap.fromTo(mSplit.words, { opacity: 0.14 }, {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: mf, start: 'top 78%', end: 'bottom 42%', scrub: true },
  });

  ScrollTrigger.batch('[data-reveal-up]', {
    start: 'top 90%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }),
  });

  $$('[data-reveal-img]').forEach((el) => {
    const img = $('img, iframe', el);
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    tl.fromTo(el, { clipPath: 'inset(12% 6% 12% 6% round 18px)' }, { clipPath: 'inset(0% 0% 0% 0% round 18px)', duration: 1.4, ease: 'expo.inOut' });
    if (img && img.tagName === 'IMG') tl.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.6, ease: 'expo.out' }, 0);
  });

  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    const thousands = el.dataset.format === 'thousands';
    const o = { v: 0 };
    const render = () => (el.textContent = thousands ? Math.round(o.v).toLocaleString('en-US') : o.v.toFixed(decimals));
    render();
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: render, scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  $$('[data-parallax]').forEach((el) => {
    gsap.fromTo(el, { yPercent: -Number(el.dataset.parallax) }, {
      yPercent: Number(el.dataset.parallax), ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // marquee: constant drift that follows scroll direction and velocity
  const track = $('[data-marquee]');
  const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    trigger: '.marquee', start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => {
      const v = self.getVelocity();
      gsap.to(loop, { timeScale: (self.direction === 1 ? 1 : -1) * (1 + Math.min(Math.abs(v) / 400, 5)), duration: 0.2, overwrite: true });
      gsap.to(loop, { timeScale: self.direction === 1 ? 1 : -1, duration: 1.2, delay: 0.2 });
    },
  });

  // horizontal collection (desktop)
  const mm = gsap.matchMedia();
  mm.add('(min-width: 961px)', () => {
    const tr = $('[data-collection-track]');
    const bar = $('[data-collection-progress]');
    const distance = () => Math.max(0, tr.scrollWidth - (document.documentElement.clientWidth - tr.offsetLeft));
    gsap.to(tr, {
      x: () => -distance(), ease: 'none',
      scrollTrigger: {
        trigger: '.collection', start: 'top top', end: () => `+=${distance()}`, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
      },
    });
  });

  // footer wordmark rises
  gsap.fromTo('[data-footer-logo]', { yPercent: 70 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer__logo', start: 'top bottom', end: 'bottom bottom', scrub: true } });
}

function chromeOnScroll() {
  const nav = $('[data-nav]');
  const dock = $('[data-dock]');
  const hero = $('.hero');
  ScrollTrigger.create({
    start: () => hero.offsetHeight + (ScrollTrigger.getAll().find((t) => t.pin === hero)?.end - ScrollTrigger.getAll().find((t) => t.pin === hero)?.start || 0) - 80,
    end: 'max',
    onToggle: (self) => { nav.classList.toggle('is-solid', self.isActive); },
    onUpdate: (self) => nav.classList.toggle('is-hidden', self.direction === 1 && self.isActive && self.getVelocity() > 50),
  });

  if (window.matchMedia('(max-width: 760px)').matches && dock) {
    const revealDock = () => {
      const heroBottom = $('.hero')?.getBoundingClientRect().bottom ?? 0;
      const show = window.scrollY + window.innerHeight > Math.max(heroBottom, 200);
      dock.classList.toggle('is-on', show);
    };
    revealDock();
    window.addEventListener('scroll', revealDock, { passive: true });
    window.addEventListener('resize', revealDock);
  }

  const links = $$('.nav__links a');
  links.forEach((a) => {
    const sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => a.classList.toggle('is-current', s.isActive) });
  });
}

function lazyMap() {
  const frame = $('.visit__map iframe');
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { frame.src = frame.dataset.src; io.disconnect(); }
  }, { rootMargin: '600px' });
  io.observe(frame);
}

/* ───────── Loader → intro ───────── */
async function boot() {
  window.scrollTo(0, 0);
  const loader = $('.loader');
  const heroImg = $('.hero__img');
  const ready = Promise.race([
    Promise.all([document.fonts.ready, heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve()]),
    new Promise((r) => setTimeout(r, 1200)),
  ]);

  await ready;

  const splits = splitHeadings();
  const intro = reduceMotion ? null : heroAnimations(splits);
  if (!reduceMotion) sectionAnimations(splits);
  chromeOnScroll();

  if (loader) {
    await gsap.to(loader, { autoAlpha: 0, duration: 1.8, ease: 'power2.inOut', delay: 0.8 });
    loader.remove();
  }

  if (reduceMotion) {
    gsap.set('.hero__pin', { '--p': 1, '--i': 1 });
    gsap.set(['.hero__shade', '.hero__content'], { opacity: 1, visibility: 'visible' });
    gsap.set('.hero__stage, .hero__corner', { display: 'none' });
    $$('[data-reveal-up]').forEach((el) => (el.style.cssText += 'opacity:1;transform:none'));
    $$('[data-reveal-img]').forEach((el) => (el.style.clipPath = 'none'));
  } else {
    intro.play();
  }
  ScrollTrigger.refresh();
  if (location.hash && location.hash.length > 1) setTimeout(() => scrollToTarget(location.hash), 200);
}

/* ───────── Init ───────── */
renderCatalog();
setupCatalog();
wireWhatsApp();
updateStatus();
setInterval(updateStatus, 60_000);
setupCalc();
setupMenu();
setupPointer();
lazyMap();
$$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.closest('[data-menu]') || a.hasAttribute('data-filter-link')) return;
  const hash = a.getAttribute('href');
  if (hash.length < 2 && hash !== '#') return;
  e.preventDefault();
  scrollToTarget(hash);
  history.replaceState(null, '', hash === '#inicio' ? location.pathname : hash);
});

boot();
