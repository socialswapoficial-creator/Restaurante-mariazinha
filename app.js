const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function playVideoInView(video, threshold) {
  let visible = false;

  function syncPlayback() {
    if (!visible || reducedMotion.matches) {
      video.pause();
      return;
    }
    video.play().catch(() => {
      // The poster remains visible if automatic playback is blocked.
    });
  }

  reducedMotion.addEventListener('change', syncPlayback);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio >= threshold;
    syncPlayback();
  }, { threshold });
  observer.observe(video);
  return syncPlayback;
}

playVideoInView(document.querySelector('.hero-video'), 0);
const hero = document.querySelector('.hero');
const heroFrame = document.querySelector('.hero-frame');

function heroOpening(left, right) {
  return `polygon(0 0, ${left}% 0, ${left}% 100%, 0 100%, 0 0, ${right}% 0, 100% 0, 100% 100%, ${right}% 100%, ${right}% 0, 0 0)`;
}

for (const link of hero.querySelectorAll('a[href="#cardapio"], a[href="#casa"]')) {
  link.addEventListener('click', async event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey ||
        event.shiftKey || event.altKey || reducedMotion.matches ||
        !hero.animate || !CSS.supports('clip-path', heroOpening(50, 50))) return;

    event.preventDefault();
    if (hero.classList.contains('hero-opening')) return;

    const target = document.querySelector(link.hash);
    const bounds = hero.getBoundingClientRect();
    heroFrame.style.height = `${bounds.height}px`;
    hero.style.top = `${bounds.top}px`;
    hero.classList.add('hero-opening');

    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    target.scrollIntoView({ block: 'start', behavior: 'instant' });

    try {
      await hero.animate(
        [{ clipPath: heroOpening(50, 50) }, { clipPath: heroOpening(0, 100) }],
        { duration: 560, easing: 'cubic-bezier(.65, 0, .25, 1)' }
      ).finished;
    } finally {
      hero.classList.remove('hero-opening');
      hero.style.removeProperty('top');
      heroFrame.style.removeProperty('height');
      if (location.hash === link.hash) target.focus({ preventScroll: true });
    }
  });
}

const houseVideo = document.querySelector('.house-media video');
const syncHouseVideo = playVideoInView(houseVideo, 0.35);
const houseSwitch = document.querySelector('.house-switch');
const houseTitle = document.querySelector('#house-title');
const houseDescription = document.querySelector('.house-intro p');
const houseSource = houseVideo.querySelector('source');
const houseViews = {
  restaurant: {
    title: houseTitle.textContent,
    description: houseDescription.textContent,
    source: houseSource.getAttribute('src'),
    poster: houseVideo.getAttribute('poster'),
    label: houseVideo.getAttribute('aria-label'),
    button: 'Área Kids'
  },
  kids: {
    title: 'Área Kids',
    description: 'Um espaço com brinquedos para as crianças se divertirem durante a visita.',
    source: 'img/area-kids.mp4',
    poster: 'img/area-kids-poster.webp',
    label: 'Vídeo da Área Kids do Mariazinha',
    button: 'Voltar ao vídeo do estacionamento'
  }
};
let houseView = 'restaurant';

houseSwitch.addEventListener('click', () => {
  houseView = houseView === 'restaurant' ? 'kids' : 'restaurant';
  const view = houseViews[houseView];
  houseTitle.textContent = view.title;
  houseDescription.textContent = view.description;
  houseVideo.poster = view.poster;
  houseVideo.setAttribute('aria-label', view.label);
  houseSource.src = view.source;
  houseVideo.load();
  syncHouseVideo();
  houseSwitch.textContent = view.button;
  document.querySelector('#casa').scrollIntoView({ block: 'start' });
});
houseSwitch.hidden = false;

const reserveForm = document.querySelector('#reserve-form');
const reserveDetails = document.querySelector('#reserve-details');
const reserveContact = document.querySelector('#reserve-contact');
const reserveBack = document.querySelector('#reserve-back');
const reserveSubmit = reserveForm.querySelector('[type=submit]');
const reserveTitle = document.querySelector('#reserve-form-title');
const reserveResult = document.querySelector('#reserve-result');
const reserveButtons = document.querySelectorAll('[data-reserve-mode]');
const reserveDate = reserveForm.elements.date;
const reservePhone = reserveForm.elements.phone;
let isReservation = false;

function setReserveStep(contactStep) {
  reserveDetails.hidden = reserveDetails.disabled = contactStep;
  reserveContact.hidden = reserveContact.disabled = !contactStep;
  reserveBack.hidden = !contactStep;
  reserveSubmit.textContent = isReservation ? 'Testar reserva' : contactStep ? 'Testar solicitação' : 'Continuar';
}

reserveBack.addEventListener('click', () => {
  setReserveStep(false);
  reserveTitle.focus();
});

for (const button of reserveButtons) {
  button.addEventListener('click', () => {
    isReservation = button.dataset.reserveMode === 'reservation';
    for (const option of reserveButtons) {
      option.setAttribute('aria-pressed', String(option === button));
    }
    reserveTitle.textContent = button.querySelector('strong').textContent;
    for (const field of reserveDetails.querySelectorAll('[data-scheduled]')) {
      field.hidden = !isReservation;
      field.querySelector('input, select, textarea').disabled = !isReservation;
    }
    setReserveStep(false);
    reserveDate.min = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Recife' }).format(new Date());
    reserveResult.textContent = '';
    reserveForm.hidden = false;
    reserveTitle.focus({ preventScroll: true });
    reserveTitle.scrollIntoView({ block: 'nearest' });
  });
}

reserveForm.addEventListener('input', () => {
  reservePhone.setCustomValidity('');
  reserveResult.textContent = '';
});
reserveForm.addEventListener('submit', event => {
  event.preventDefault();
  if (isReservation) {
    reserveResult.textContent = 'Teste concluído. Nenhuma reserva foi enviada.';
    return;
  }
  if (reserveContact.hidden) {
    setReserveStep(true);
    reserveForm.elements.guest.focus();
    return;
  }
  const digits = reservePhone.value.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  if (!/^\d{10,11}$/.test(digits)) {
    reservePhone.setCustomValidity('Informe um telefone com DDD.');
    reservePhone.reportValidity();
    return;
  }
  reserveForm.reset();
  setReserveStep(false);
  reserveResult.textContent = 'Teste concluído. Nenhuma solicitação foi enviada.';
});

const reviewTrack = document.querySelector('.review-track');
let reviewsVisible = false;
let reviewTimer;

function advanceReview() {
  const end = reviewTrack.scrollWidth - reviewTrack.clientWidth;
  const step = reviewTrack.children[1].offsetLeft - reviewTrack.children[0].offsetLeft;
  const atEnd = reviewTrack.scrollLeft >= end - 2;
  const next = Math.min(end, (Math.floor((reviewTrack.scrollLeft + 2) / step) + 1) * step);
  reviewTrack.scrollTo({ left: atEnd ? 0 : next, behavior: atEnd ? 'instant' : 'smooth' });
}

function syncReviewMotion() {
  clearInterval(reviewTimer);
  if (reviewsVisible && !reducedMotion.matches && !document.hidden &&
      !reviewTrack.matches(':focus-within') &&
      !(matchMedia('(hover: hover)').matches && reviewTrack.matches(':hover'))) {
    reviewTimer = setInterval(advanceReview, 1500);
  }
}

const reviewObserver = new IntersectionObserver(([entry]) => {
  reviewsVisible = entry.isIntersecting;
  syncReviewMotion();
}, { threshold: 0.25 });
reviewObserver.observe(reviewTrack);
for (const event of ['mouseenter', 'mouseleave', 'focusin', 'focusout', 'touchend']) {
  reviewTrack.addEventListener(event, syncReviewMotion);
}
document.addEventListener('visibilitychange', syncReviewMotion);
reducedMotion.addEventListener('change', syncReviewMotion);

const revealObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const element = entry.target;
    revealObserver.unobserve(element);
    if (reducedMotion.matches || !element.animate || element.matches(':focus-within')) continue;

    const fromSide = element.classList.contains('house-media');
    element.animate(
      [
        { opacity: 0.12, transform: fromSide ? 'translateX(-38px)' : 'translateY(14px)' },
        { opacity: 1, transform: 'translate(0, 0)' }
      ],
      { duration: fromSide ? 920 : 720, easing: 'cubic-bezier(.25, .46, .45, .94)' }
    );
  }
}, { threshold: 0.01 });

for (const element of document.querySelectorAll(
  '.house-intro, .house-media, .house-switch, .menu-title, .menu-modes, ' +
  '#reviews-title, .reviews > .wrap > p, .review-track, ' +
  '#reserve-title, #reserva > .wrap > p, .reserve-options, .footer-info, .footer-location'
)) {
  revealObserver.observe(element);
}
