// AgroTritura — slider mobile prodotti, configuratore guidato e consigli
(() => {
  'use strict';

  const isMobile = () => window.matchMedia('(max-width: 620px)').matches;

  function addDots(container, className) {
    if (!container || container.parentElement?.querySelector('.' + className)) return;
    const items = [...container.children].filter(el => el.matches('article, .at-advice-card'));
    if (items.length < 2) return;
    const dots = document.createElement('div');
    dots.className = 'at-slider-dots ' + className;
    dots.setAttribute('aria-hidden', 'true');
    items.forEach((_, i) => {
      const dot = document.createElement('span');
      if (i === 0) dot.classList.add('active');
      dots.appendChild(dot);
    });
    container.insertAdjacentElement('afterend', dots);
    const update = () => {
      const first = items[0];
      if (!first) return;
      const step = first.getBoundingClientRect().width + 12;
      const index = Math.max(0, Math.min(items.length - 1, Math.round(container.scrollLeft / step)));
      [...dots.children].forEach((dot, i) => dot.classList.toggle('active', i === index));
    };
    container.addEventListener('scroll', update, { passive: true });
  }

  function initHorizontalSliders() {
    if (!isMobile()) return;
    const products = document.querySelector('#prodotti .product-grid');
    if (products) {
      products.classList.add('at-mobile-slider');
      addDots(products, 'at-product-dots');
    }
    const advice = document.querySelector('.at-advice-grid');
    if (advice) {
      advice.classList.add('at-mobile-slider');
      addDots(advice, 'at-advice-dots');
    }
  }

  function initMixWizard() {
    if (!isMobile()) return;
    const config = document.querySelector('#configuratore .ag-config');
    const controls = config?.querySelector('.ag-controls');
    const animalField = controls?.querySelector('.ag-field:has(#agAnimalChoices)');
    const goal = document.querySelector('#agGoal');
    const goalField = goal?.closest('.ag-field');
    const animals = document.querySelector('#agAnimals');
    const animalsField = animals?.closest('.ag-field');
    const info = controls?.querySelector('.ag-info-box');
    if (!config || !controls || !animalField || !goalField || !animalsField || controls.querySelector('.at-mix-wizard')) return;

    const wizard = document.createElement('div');
    wizard.className = 'at-mix-wizard';
    const track = document.createElement('div');
    track.className = 'at-mix-wizard-track';

    const slide1 = document.createElement('section');
    slide1.className = 'at-mix-slide';
    slide1.dataset.step = '1';
    const title1 = document.createElement('div');
    title1.className = 'at-mix-slide-title';
    title1.innerHTML = '<span>1</span><div><b>Scegli l’animale</b><small>Seleziona per continuare</small></div>';
    slide1.append(title1, animalField);

    const slide2 = document.createElement('section');
    slide2.className = 'at-mix-slide';
    slide2.dataset.step = '2';
    const title2 = document.createElement('div');
    title2.className = 'at-mix-slide-title';
    title2.innerHTML = '<span>2</span><div><b>Completa le informazioni</b><small>Obiettivo e numero di animali</small></div>';
    slide2.append(title2, goalField, animalsField);
    if (info) slide2.appendChild(info);
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'at-mix-back';
    back.textContent = '← Cambia animale';
    slide2.appendChild(back);

    track.append(slide1, slide2);
    wizard.appendChild(track);
    controls.appendChild(wizard);

    const go = step => {
      track.style.transform = `translateX(-${(step - 1) * 50}%)`;
      wizard.dataset.current = String(step);
    };

    document.querySelectorAll('#agAnimalChoices .ag-choice').forEach(btn => {
      btn.addEventListener('click', () => setTimeout(() => go(2), 80));
    });
    back.addEventListener('click', () => go(1));
    go(1);
  }

  function init() {
    initMixWizard();
    initHorizontalSliders();
    setTimeout(initHorizontalSliders, 120);
    setTimeout(initHorizontalSliders, 400);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
