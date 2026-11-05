{
  const menu = document.querySelector('#cardapio');
  const app = menu.querySelector('.menu-app');
  const modes = menu.querySelector('.menu-modes');
  const gallery = menu.querySelector('.menu-gallery');
  const list = menu.querySelector('.menu-dishes');
  const drinks = menu.querySelector('.menu-drinks');
  const bag = menu.querySelector('#menu-bag');
  const reel = menu.querySelector('.menu-reel');
  const details = menu.querySelector('.menu-details');
  const plateTrack = menu.querySelector('.menu-plates');
  const dishes = Array.from(list.querySelectorAll('.dish'), card => ({
    card,
    image: card.querySelector('img'),
    category: card.querySelector('.eyebrow').textContent,
    name: card.querySelector('h3').textContent,
    description: card.querySelector('h3 + p:not(.dish-price)')?.textContent ?? '',
    price: card.querySelector('.dish-price')?.textContent ?? ''
  }));
  const galleryDishes = dishes.filter(({ card }) => !card.hasAttribute('data-list-only'));
  const detailPhoto = details.querySelector('.menu-detail-photo');
  const plates = galleryDishes.map(() => {
    const plate = document.createElement('img');
    plate.alt = '';
    plate.draggable = false;
    plate.className = 'menu-plate';
    plateTrack.append(plate);
    return plate;
  });
  let selected = 0;
  let detailsOrigin = 'gallery';
  let detailsTrigger;
  let pointerStart;
  let swiped = false;

  const order = new Map();
  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const bagItems = bag.querySelector('.bag-items');
  const bagTotal = bag.querySelector('.bag-total');
  const announcement = menu.querySelector('.bag-announcement');
  const galleryAdd = gallery.querySelector('.gallery-add');
  const detailAdd = details.querySelector('.detail-add');

  function priceInCents(price) {
    const match = (price ?? '').match(/R\$\s*([\d.]+),(\d{2})\s*$/);
    return match ? Number(match[1].replaceAll('.', '')) * 100 + Number(match[2]) : 0;
  }

  function updateBagSummary() {
    let count = 0;
    let subtotal = 0;
    for (const { quantity, cents } of order.values()) {
      count += quantity;
      subtotal += quantity * cents;
    }
    bag.querySelector('.bag-empty').hidden = count > 0;
    bagTotal.hidden = count === 0;
    bagTotal.querySelector('strong').textContent = currency.format(subtotal / 100);
    for (const badge of document.querySelectorAll('[data-bag-count]')) {
      badge.textContent = count;
      badge.hidden = count === 0;
      badge.parentElement.setAttribute('aria-label', 'Sacola de pedidos' + (count ? ', ' + count + ' ' + (count === 1 ? 'item' : 'itens') : ''));
    }
  }

  function quantityButton(label, symbol, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = symbol;
    button.setAttribute('aria-label', label);
    button.addEventListener('click', action);
    return button;
  }

  function addItem(item) {
    const cents = priceInCents(item.price);
    if (!cents) return;
    const existing = order.get(item);
    if (existing) {
      existing.change(1);
      return;
    }

    const row = document.createElement('li');
    const name = document.createElement('strong');
    const quantity = document.createElement('span');
    const lineTotal = document.createElement('span');
    const controls = document.createElement('div');
    controls.className = 'bag-quantity';
    name.textContent = item.name;
    const entry = { cents, quantity: 0, change };
    const minus = quantityButton('Diminuir quantidade de ' + item.name, '−', () => change(-1));
    const plus = quantityButton('Aumentar quantidade de ' + item.name, '+', () => change(1));
    controls.append(minus, quantity, plus);
    row.append(name, controls, lineTotal);
    bagItems.append(row);
    order.set(item, entry);
    change(1);

    function change(delta) {
      entry.quantity += delta;
      if (entry.quantity === 0) {
        const nextFocus = row.nextElementSibling?.querySelector('button') ??
          row.previousElementSibling?.querySelector('button') ?? menu.querySelector('.menu-bag-button');
        row.remove();
        order.delete(item);
        nextFocus.focus({ preventScroll: true });
      }
      quantity.textContent = entry.quantity;
      lineTotal.textContent = currency.format(entry.quantity * cents / 100);
      updateBagSummary();
      announcement.textContent = item.name + ' na sacola: ' + entry.quantity;
    }
  }

  function bindAdd(button, item) {
    button.hidden = !priceInCents(item.price);
    button.setAttribute('aria-label', 'Adicionar ' + item.name + ' à sacola');
    button.onclick = () => addItem(item);
  }

  function makeAddButton(card, item) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button menu-add card-add';
    button.textContent = '+ Adicionar';
    bindAdd(button, item);
    card.append(button);
  }

  function selectDish(index) {
    const count = galleryDishes.length;
    selected = (index + count) % count;
    const previous = (selected + count - 1) % count;
    const next = (selected + 1) % count;
    const nearby = [selected, previous, next, (selected + count - 2) % count, (selected + 2) % count];
    plates.forEach((plate, position) => {
      if (nearby.includes(position) && !plate.hasAttribute('src')) {
        const image = galleryDishes[position].image;
        plate.src = image.src;
        plate.style.clipPath = image.style.clipPath;
      }
      plate.dataset.position = position === selected ? 'current' :
        position === previous ? 'previous' : position === next ? 'next' : 'away';
    });
    const dish = galleryDishes[selected];
    gallery.querySelector('h3').textContent = dish.name;
    gallery.querySelector('.eyebrow').textContent = dish.category;
    gallery.querySelector('.menu-price').textContent = dish.price ?? '';
    bindAdd(galleryAdd, dish);
  }

  function fillDetails(dish) {
    const listOnly = dish.card?.hasAttribute('data-list-only');
    detailPhoto.hidden = !listOnly;
    if (listOnly) detailPhoto.src = dish.image.src;
    details.querySelector('.eyebrow').textContent = dish.category;
    details.querySelector('h3').textContent = dish.name;
    details.querySelector('.menu-detail-description').textContent = dish.description;
    details.querySelector('.menu-price').textContent = dish.price ?? '';
    bindAdd(detailAdd, dish);
  }

  function showView(view) {
    app.dataset.view = view;
    gallery.hidden = view !== 'gallery' && (view !== 'detail' || !detailPhoto.hidden);
    drinks.hidden = view !== 'drinks';
    bag.hidden = view !== 'bag';
    list.hidden = view !== 'list';
    details.hidden = view !== 'detail';
    for (const button of menu.querySelectorAll('[data-mode]')) {
      const destination = button.dataset.mode;
      button.setAttribute('aria-pressed', String(destination === (view === 'detail' ? 'gallery' : view)));
    }
  }

  function openDetails(dish, trigger) {
    detailsOrigin = app.dataset.view;
    detailsTrigger = trigger;
    const index = galleryDishes.indexOf(dish);
    if (index >= 0) selectDish(index);
    fillDetails(dish);
    showView('detail');
    details.scrollIntoView({ block: 'nearest' });
    details.querySelector('h3').focus({ preventScroll: true });
  }

  function closeDetails() {
    showView(detailsOrigin);
    detailsTrigger?.focus({ preventScroll: true });
  }

  for (const button of menu.querySelectorAll('[data-mode]')) {
    button.addEventListener('click', () => {
      showView(button.dataset.mode);
      modes.scrollIntoView({ block: 'nearest' });
    });
  }

  dishes.forEach(dish => {
    const { card, name } = dish;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'menu-list-button';
    button.setAttribute('aria-label', 'Ver detalhes de ' + name);
    button.addEventListener('click', () => openDetails(dish, button));
    card.append(button);
    if (priceInCents(dish.price)) makeAddButton(card, dish);
  });

  for (const card of drinks.querySelectorAll('.drink-card')) {
    makeAddButton(card, {
      name: card.querySelector('h3').textContent,
      price: card.querySelector('.drink-price').textContent
    });
  }

  document.querySelector('.hero-bag').addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    showView('bag');
  });

  const plateButton = menu.querySelector('.menu-plate-open');
  plateButton.addEventListener('click', () => openDetails(galleryDishes[selected], plateButton));
  const detailsButton = menu.querySelector('.menu-view-details');
  detailsButton.addEventListener('click', () => openDetails(galleryDishes[selected], detailsButton));
  menu.querySelector('.menu-back').addEventListener('click', closeDetails);
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape' && app.dataset.view === 'detail') closeDetails();
  });
  reel.addEventListener('keydown', event => {
    if (app.dataset.view !== 'gallery' || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    selectDish(selected + (event.key === 'ArrowRight' ? 1 : -1));
  });
  reel.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    swiped = false;
    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  });
  reel.addEventListener('pointerup', event => {
    if (pointerStart?.id !== event.pointerId) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = undefined;
    if (app.dataset.view === 'gallery' && Math.abs(dx) > 32 && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;
      selectDish(selected + (dx < 0 ? 1 : -1));
    }
  });
  reel.addEventListener('pointercancel', () => { pointerStart = undefined; });
  reel.addEventListener('click', event => {
    if (swiped && event.detail > 0) event.stopPropagation();
  }, true);

  selectDish(0);
  modes.hidden = false;
  showView('gallery');
}
