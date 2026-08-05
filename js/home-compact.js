// AgroTritura — riorganizzazione progressiva della homepage senza perdere funzioni
(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('at-home-compact');

    if (!document.querySelector('.at-compact-hub')) {
      const anchor = document.querySelector('.at-trust-strip') || document.querySelector('.hero');
      if (anchor) {
        const hub = document.createElement('section');
        hub.className = 'at-compact-hub';
        hub.innerHTML = `
          <div class="container">
            <a class="at-hub-card" href="#prodotti"><span>🌽</span><div>Prodotti<small>Cereali e mix</small></div></a>
            <a class="at-hub-card" href="#configuratore"><span>🧠</span><div>Trova il mix<small>Scelta guidata</small></div></a>
            <a class="at-hub-card" href="#prezzi"><span>💶</span><div>Prezzi<small>Listino e sconti</small></div></a>
            <a class="at-hub-card" href="#preventivo"><span>📄</span><div>Preventivo<small>Calcolo e WhatsApp</small></div></a>
          </div>`;
        anchor.insertAdjacentElement('afterend', hub);
      }
    }

    const collapsibleIds = ['servizi', 'prodotti', 'prezzi', 'consegna'];
    collapsibleIds.forEach(id => {
      const section = document.getElementById(id);
      if (!section || section.classList.contains('at-collapsible')) return;
      section.classList.add('at-collapsible');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'at-section-toggle';
      button.textContent = 'Mostra tutto';
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => {
        const open = section.classList.toggle('at-open');
        button.textContent = open ? 'Riduci sezione' : 'Mostra tutto';
        button.setAttribute('aria-expanded', String(open));
      });
      section.insertAdjacentElement('afterend', button);
    });

    if (!document.querySelector('.at-bottom-nav')) {
      const nav = document.createElement('nav');
      nav.className = 'at-bottom-nav';
      nav.setAttribute('aria-label', 'Navigazione rapida');
      nav.innerHTML = `
        <a href="#top"><span>🏠</span>Home</a>
        <a href="#prodotti"><span>🌽</span>Prodotti</a>
        <a href="#preventivo"><span>📄</span>Preventivo</a>
        <a href="https://wa.me/393341067510" target="_blank" rel="noopener"><span>💬</span>WhatsApp</a>`;
      document.body.appendChild(nav);
    }

    const first = document.body.firstElementChild;
    if (first && !document.getElementById('top')) first.id = 'top';
  });
})();
