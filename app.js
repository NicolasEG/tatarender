const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const menu = document.querySelector('.menu-button');
const header = document.querySelector('.header');
if (menu) {
  header.classList.add('menu-ready');
  menu.hidden = false;
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Abrir menú');
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target) || event.target.closest('nav a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  matchMedia('(max-width:650px)').addEventListener('change', closeMenu);
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('reveal-in');
      observer.unobserve(entry.target);
    }
  }, { threshold: .08 });
  document.querySelectorAll('[data-reveal], .video-card').forEach(el => observer.observe(el));
}

const banner = document.querySelector('[data-parallax]');
if (banner) {
  let pending = false;
  function update() {
    pending = false;
    const box = banner.getBoundingClientRect();
    if (reduced.matches) {
      banner.style.removeProperty('--offset');
      return;
    }
    if (box.bottom < 0 || box.top > innerHeight) return;
    const value = (innerHeight / 2 - box.top - box.height / 2) / ((innerHeight + box.height) / 2);
    banner.style.setProperty('--offset', Math.max(-1, Math.min(1, value)) * 50 + 'px');
  }
  function queue() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(update);
  }
  addEventListener('scroll', queue, {passive:true});
  addEventListener('resize', queue);
  reduced.addEventListener('change', queue);
  queue();
}

const marquee = document.querySelector('[data-marquee]');
if (marquee) {
  const group = marquee.querySelector('.marquee-group');
  const clone = group.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  clone.querySelectorAll('button').forEach(button => button.tabIndex = -1);
  marquee.querySelector('.marquee-track').append(clone);
  marquee.classList.add('running');
  const toggle = document.querySelector('[data-marquee-toggle]');
  toggle.hidden = reduced.matches;
  let paused = false;
  function reflectPause() {
    marquee.classList.toggle('paused', paused);
    toggle.textContent = paused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', paused ? 'Reanudar movimiento de la galería' : 'Pausar movimiento de la galería');
  }
  toggle.addEventListener('click', () => {
    paused = !paused;
    reflectPause();
  });
  reduced.addEventListener('change', () => toggle.hidden = reduced.matches);
  const dialog = document.querySelector('.lightbox');
  const photo = dialog.querySelector('img');
  const status = dialog.querySelector('[data-photo-status]');
  let selected = 0;
  let trigger;
  function showPhoto(index) {
    selected = (index + 40) % 40;
    photo.src = 'assets/obra-' + String(selected + 1).padStart(2, '0') + '.webp';
    photo.alt = 'Obra de Tata Construcciones, fotografía ' + (selected + 1);
    status.textContent = (selected + 1) + ' / 40';
  }
  marquee.addEventListener('click', event => {
    const button = event.target.closest('[data-photo]');
    if (!button) return;
    trigger = button;
    marquee.classList.add('paused');
    showPhoto(Number(button.dataset.photo));
    dialog.showModal();
  });
  dialog.querySelector('[data-prev]').addEventListener('click', () => showPhoto(selected - 1));
  dialog.querySelector('[data-next]').addEventListener('click', () => showPhoto(selected + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') showPhoto(selected + 1);
    if (event.key === 'ArrowLeft') showPhoto(selected - 1);
  });
  dialog.addEventListener('close', () => {
    reflectPause();
    trigger?.focus({preventScroll:true});
  });

  const videoDialog = document.querySelector('.video-dialog');
  const player = videoDialog.querySelector('video');
  let videoButton;
  document.querySelector('.video-grid').addEventListener('click', event => {
    const button = event.target.closest('[data-video]');
    if (!button) return;
    videoButton = button;
    const id = String(button.dataset.video).padStart(2, '0');
    player.src = 'assets/video-' + id + '.mp4';
    player.poster = 'assets/video-' + id + '.webp';
    document.getElementById('video-title').textContent = 'Recorrido de obra ' + Number(id);
    videoDialog.showModal();
    player.play().catch(() => {});
  });
  videoDialog.addEventListener('close', () => {
    player.pause();
    player.removeAttribute('src');
    player.load();
    videoButton?.focus({preventScroll:true});
  });
}

document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const b = dialog.getBoundingClientRect();
    if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) dialog.close();
  });
});

const form = document.querySelector('[data-quote]');
if (form) {
  form.querySelector('[type=submit]').disabled = false;
  const model = new URLSearchParams(location.search).get('modelo');
  if (['35','40','55','70'].includes(model)) {
    form.elements.modelo.value = model;
    form.elements.proyecto.value = 'Vivienda';
  }
  const result = document.querySelector('.quote-result');
  const message = result.querySelector('[data-message]');
  const status = result.querySelector('[data-status]');
  form.addEventListener('input', event => event.target.setCustomValidity?.(''));
  form.addEventListener('submit', event => {
    event.preventDefault();
    for (const field of form.querySelectorAll('[required]')) {
      field.setCustomValidity(field.value.trim() ? '' : 'Completá este campo.');
    }
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const lines = [
      'Hola, Tata Construcciones. Quisiera consultar por un proyecto.',
      'Nombre: ' + fields.get('nombre').trim(),
      'Localidad o barrio: ' + fields.get('zona').trim(),
      'Proyecto: ' + fields.get('proyecto')
    ];
    const area = fields.get('modelo');
    if (area) lines.push('Superficie: ' + (area === 'Otra' ? area : area + ' m²'));
    lines.push('Mi idea: ' + fields.get('detalle').trim());
    message.value = lines.join('\n');
    status.textContent = 'Copiá el mensaje y pegalo en una conversación de Instagram.';
    result.hidden = false;
    result.scrollIntoView({behavior:reduced.matches ? 'instant' : 'smooth',block:'nearest'});
  });
  result.querySelector('[data-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(message.value);
      status.textContent = 'Mensaje copiado. Abrí Instagram y pegalo en el chat.';
    } catch {
      message.focus();
      message.select();
      status.textContent = 'El mensaje está seleccionado. Copialo y pegalo en el chat de Instagram.';
    }
  });
}
