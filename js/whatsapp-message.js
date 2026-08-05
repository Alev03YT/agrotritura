// AgroTritura — messaggio WhatsApp e miglioramenti homepage
(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const valueOf = selector => $(selector)?.value?.trim() || '';
  const numberOf = selector => Number.parseFloat(valueOf(selector).replace(',', '.')) || 0;
  const formatMoney = value => new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value) || 0) + ' €';

  window.testoPreventivo = function (dati) {
    const nome = valueOf('#nome') || 'Non indicato';
    const telefono = valueOf('#telefono') || 'Non indicato';
    const indirizzo = valueOf('#comune') || 'Non indicato';
    const note = valueOf('#note') || 'Nessuna';
    const quantita = valueOf('#quantita');
    const budget = valueOf('#budget');
    const budgetTipo = valueOf('#budgetTipo');
    const priorita = valueOf('#prioritaBudget');
    const intento = valueOf('#quantitaIntento');
    const kmMode = $('#distanza')?.dataset.autoCalculated === 'true' ? 'automatico' : 'manuale';

    const consegna = dati.modalita === 'ritiro'
      ? 'Ritiro presso AgroTritura'
      : dati.modalita === 'sul-posto'
        ? 'Tritatura presso l’azienda del cliente'
        : 'A domicilio';

    let quantitaTesto = 'Da calcolare in base al budget';
    let verifica = 'Proposta da definire in base a budget, distanza e priorità';

    if (quantita && !budget) {
      quantitaTesto = `${quantita} kg`;
      verifica = 'Quantità richiesta dal cliente';
    } else if (quantita && budget && intento === 'minima') {
      quantitaTesto = `${quantita} kg minimi desiderati`;
      verifica = `Verificare se almeno ${quantita} kg rientrano nel budget`;
    } else if (quantita && budget && intento === 'indicativa') {
      quantitaTesto = `${quantita} kg indicativi`;
      verifica = 'La quantità può essere modificata per rispettare il budget';
    } else if (budget && intento === 'calcola') {
      verifica = 'Calcolare la quantità migliore senza superare il budget';
    }

    const prodotto = dati.prodotto || 'Da definire';
    if (prodotto === 'Altro / da definire' && budget) {
      verifica += '; prodotto o mix da definire prima del calcolo finale';
    }

    const righe = [
      '📄 DATI PER PREVENTIVO — AgroTritura', '',
      '👤 Cliente',
      `- Nome: ${nome}`,
      `- Telefono: ${telefono}`,
      `- Comune/Indirizzo: ${indirizzo}`, '',
      '📦 Richiesta',
      `- Prodotto: ${prodotto}`,
      `- Quantità: ${quantitaTesto}`,
      `- Modalità: ${consegna}`,
      `- Verifica richiesta: ${verifica}`
    ];

    if (budget) {
      righe.push('', '💶 Budget disponibile',
        `- Budget massimo: ${budget.replace('.', ',')} €`,
        `- Il budget comprende: ${budgetTipo === 'prodotti' ? 'solo i prodotti, trasporto escluso' : 'prodotti e consegna'}`,
        `- Priorità: ${priorita || 'Non indicata'}`
      );
    }

    const trasporto = dati.trasporto?.costo;
    righe.push('', '🚚 Trasporto / Distanza',
      `- KM sola andata (${kmMode}): ${dati.km ? String(dati.km).replace('.', ',') : 'Non indicati'}`,
      `- Trasporto stimato A/R: ${trasporto == null ? 'Da definire' : formatMoney(trasporto)}`,
      '', '📝 Note', note, '', '🔁 Fonte: https://agrotritura.it/'
    );

    return righe.join('\n');
  };

  function showFormError(message) {
    const box = $('#atFormError');
    if (!box) return;
    box.textContent = message;
    box.hidden = false;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { box.hidden = true; }, 4500);
  }

  function validateQuote() {
    const required = [
      ['#nome', 'Inserisci il nome.'],
      ['#telefono', 'Inserisci il numero di telefono.'],
      ['#cereale', 'Seleziona il prodotto o il mix.'],
      ['#modalita', 'Seleziona la modalità.'],
      ['#comune', 'Inserisci l’indirizzo oppure usa la posizione attuale.']
    ];
    for (const [selector, message] of required) {
      if (!valueOf(selector)) return message;
    }
    const quantity = numberOf('#quantita');
    const budget = numberOf('#budget');
    if (!quantity && !budget) return 'Inserisci almeno la quantità desiderata oppure il budget massimo.';
    if (budget && !valueOf('#budgetTipo')) return 'Indica se il budget comprende anche la consegna.';
    if (budget && !valueOf('#prioritaBudget')) return 'Seleziona la priorità della proposta.';
    if (budget && !valueOf('#quantitaIntento')) return 'Indica come considerare la quantità rispetto al budget.';
    return '';
  }

  function setupQuoteFlow() {
    const form = $('#preventivoForm');
    const quantity = $('#quantita');
    const budget = $('#budget');
    const budgetType = $('#budgetTipo');
    const priority = $('#prioritaBudget');
    if (!form || !quantity || !budget || !budgetType || !priority) return;

    quantity.required = false;
    quantity.placeholder = 'Es. 100 oppure indica il budget sotto';
    ['#nome', '#telefono', '#cereale', '#modalita', '#comune'].forEach(selector => {
      const field = $(selector);
      if (field) field.required = true;
    });

    const box = $('.at-budget-box');
    const typeLabel = budgetType.closest('label');
    const priorityLabel = priority.closest('label');
    let intent = $('#quantitaIntento');
    let intentLabel = intent?.closest('label');

    if (!intent && box) {
      intentLabel = document.createElement('label');
      intentLabel.hidden = true;
      intentLabel.innerHTML = `Come considerare la quantità?
        <select id="quantitaIntento" name="quantitaIntento">
          <option value="">Seleziona</option>
          <option value="calcola">Calcolate voi la quantità migliore</option>
          <option value="minima">Voglio almeno la quantità indicata</option>
          <option value="indicativa">La quantità indicata è solo orientativa</option>
        </select>`;
      box.querySelector('.at-budget-grid')?.appendChild(intentLabel);
      intent = $('#quantitaIntento');
    }

    const copy = box?.querySelector('.at-budget-copy');
    if (copy) copy.textContent = 'Compila la quantità desiderata oppure il budget. Se li inserisci entrambi, indica come considerare la quantità.';

    if (!$('#atFormError')) {
      const error = document.createElement('p');
      error.id = 'atFormError';
      error.className = 'at-form-error';
      error.hidden = true;
      box?.appendChild(error);
    }

    budgetType.innerHTML = '<option value="">Seleziona</option><option value="totale">Prodotti e consegna</option><option value="prodotti">Solo prodotti, trasporto escluso</option>';
    priority.innerHTML = '<option value="">Seleziona</option><option>Più kg possibile</option><option>Il mix migliore</option><option>Scorta per circa un mese</option><option>Decidilo tu</option>';

    function sync() {
      const active = numberOf('#budget') > 0;
      const hasQuantity = numberOf('#quantita') > 0;
      if (typeLabel) typeLabel.hidden = !active;
      if (priorityLabel) priorityLabel.hidden = !active;
      if (intentLabel) intentLabel.hidden = !active;
      budgetType.required = active;
      priority.required = active;
      if (intent) intent.required = active;
      if (!active) {
        budgetType.value = '';
        priority.value = '';
        if (intent) intent.value = '';
      } else if (!hasQuantity && intent && !intent.value) {
        intent.value = 'calcola';
      } else if (hasQuantity && intent?.value === 'calcola') {
        intent.value = '';
      }
    }

    budget.addEventListener('input', sync);
    quantity.addEventListener('input', sync);
    sync();

    form.addEventListener('submit', event => {
      const error = validateQuote();
      if (!error) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      showFormError(error);
    }, true);

    $('#btnCopiaPreventivo')?.addEventListener('click', event => {
      const error = validateQuote();
      if (!error) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      showFormError(error);
    }, true);
  }

  function addHomepageEnhancements() {
    if (!$('link[href="css/home-enhancements.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'css/home-enhancements.css';
      document.head.appendChild(link);
    }

    if (!$('#atExtraStyles')) {
      const style = document.createElement('style');
      style.id = 'atExtraStyles';
      style.textContent = `
        .at-form-error{margin:12px 0 0;padding:10px 12px;border-radius:11px;background:#fff0ee;color:#a3382f;font-weight:750}
        .at-budget-box label[hidden]{display:none!important}
        .at-why-card,.at-advice-card{background:#fff;border:1px solid #dfe7e1;border-radius:18px;padding:18px;box-shadow:0 8px 24px rgba(23,63,42,.06)}
        .at-why-grid,.at-advice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .at-why-card h3,.at-advice-card h3{margin:8px 0;color:#173f2a}.at-why-card p,.at-advice-card p{margin:0;color:#66736b;line-height:1.5}
        .at-advice-card a{display:inline-flex;margin-top:12px;color:#173f2a;font-weight:850;text-decoration:none}
        .at-advice-cta{margin-top:18px;display:flex;gap:10px;flex-wrap:wrap}
        @media(max-width:820px){.at-why-grid,.at-advice-grid{grid-template-columns:1fr 1fr}}
        @media(max-width:560px){.at-why-grid,.at-advice-grid{grid-template-columns:1fr}}
      `;
      document.head.appendChild(style);
    }

    const nav = $('.main-nav');
    if (nav && !nav.querySelector('a[href="consigli.html"]')) {
      const link = document.createElement('a');
      link.href = 'consigli.html';
      link.textContent = 'Consigli';
      const cta = nav.querySelector('.nav-cta');
      cta ? nav.insertBefore(link, cta) : nav.appendChild(link);
    }

    const hero = $('.hero');
    if (hero && !$('.at-trust-strip')) {
      const strip = document.createElement('section');
      strip.className = 'at-trust-strip';
      strip.innerHTML = '<div class="container at-trust-grid"><div class="at-trust-item"><span>✓</span> Preventivo gratuito e senza impegno</div><div class="at-trust-item"><span>✓</span> Preparazione dopo la conferma</div><div class="at-trust-item"><span>✓</span> Prezzi e trasporto definiti prima</div></div>';
      hero.insertAdjacentElement('afterend', strip);
    }

    const servizi = $('#servizi');
    if (servizi && !$('.at-process')) {
      const process = document.createElement('section');
      process.className = 'at-process';
      process.innerHTML = '<div class="container"><div class="section-head"><span class="eyebrow">Come funziona</span><h2>Dalla richiesta alla consegna in quattro passaggi</h2><p>Un percorso semplice e chiaro per definire prodotto, quantità e costi.</p></div><div class="at-process-grid"><article class="at-process-card"><div class="at-process-num">1</div><h3>Invii la richiesta</h3><p>Scegli prodotto, quantità o budget e indirizzo.</p></article><article class="at-process-card"><div class="at-process-num">2</div><h3>Confermiamo il preventivo</h3><p>Verifichiamo disponibilità, distanza e composizione.</p></article><article class="at-process-card"><div class="at-process-num">3</div><h3>Prepariamo il prodotto</h3><p>Tritatura o miscelazione secondo quanto concordato.</p></article><article class="at-process-card"><div class="at-process-num">4</div><h3>Ritiro o consegna</h3><p>Prepariamo il ritiro oppure organizziamo la consegna.</p></article></div></div>';
      servizi.insertAdjacentElement('afterend', process);
    }

    document.querySelectorAll('#prodotti article').forEach(card => {
      if (card.querySelector('.at-product-cta')) return;
      const link = document.createElement('a');
      link.className = 'at-product-cta';
      link.href = '#preventivo';
      link.textContent = 'Richiedi preventivo';
      card.appendChild(link);
    });

    const why = $('.why');
    if (why && !$('#atWhyExpanded')) {
      const expanded = document.createElement('section');
      expanded.id = 'atWhyExpanded';
      expanded.className = 'section soft';
      expanded.innerHTML = `<div class="container">
        <div class="section-head"><span class="eyebrow">Il vantaggio AgroTritura</span><h2>Perché scegliere un servizio preparato su richiesta</h2><p>Non vendiamo soltanto cereali: organizziamo prodotto, lavorazione e consegna in base alle esigenze reali del cliente.</p></div>
        <div class="at-why-grid">
          <article class="at-why-card"><span>🌾</span><h3>Fresco dopo la conferma</h3><p>La lavorazione viene eseguita dopo aver definito insieme quantità e granulometria.</p></article>
          <article class="at-why-card"><span>⚙️</span><h3>Tritatura su misura</h3><p>Grossa, media o fine in base alla specie animale e al tipo di razione.</p></article>
          <article class="at-why-card"><span>🧩</span><h3>Mix personalizzabili</h3><p>Possibilità di combinare più ingredienti e adattare la quantità al budget disponibile.</p></article>
          <article class="at-why-card"><span>💬</span><h3>Contatto diretto</h3><p>Preventivo chiaro su WhatsApp e conferma prima di procedere con la lavorazione.</p></article>
          <article class="at-why-card"><span>🚚</span><h3>Trasporto trasparente</h3><p>Il costo viene stimato in anticipo in base alla distanza reale di andata e ritorno.</p></article>
          <article class="at-why-card"><span>⚖️</span><h3>Quantità flessibili</h3><p>Richieste piccole o più consistenti, senza obbligare il cliente a scegliere formati standard.</p></article>
        </div>
      </div>`;
      why.insertAdjacentElement('afterend', expanded);
    }

    const preventivo = $('#preventivo');
    if (preventivo && !$('#atAdvicePreview')) {
      const advice = document.createElement('section');
      advice.id = 'atAdvicePreview';
      advice.className = 'section';
      advice.innerHTML = `<div class="container">
        <div class="section-head"><span class="eyebrow">Centro Consigli AgroTritura</span><h2>Guide pratiche per scegliere cereali, mix e quantità</h2><p>Informazioni semplici per orientarsi prima di richiedere un preventivo.</p></div>
        <div class="at-advice-grid">
          <article class="at-advice-card"><span>🐔</span><h3>Galline ovaiole</h3><p>Consumi indicativi, alimentazione quotidiana e ruolo del mangime completo.</p><a href="consigli.html#ovaiole">Leggi le guide →</a></article>
          <article class="at-advice-card"><span>🐥</span><h3>Polli</h3><p>Differenze tra crescita, mantenimento e fase finale di finissaggio.</p><a href="consigli.html#polli">Leggi le guide →</a></article>
          <article class="at-advice-card"><span>🌽</span><h3>Cereali e mix</h3><p>Come cambiano mais, orzo, frumento, grana verde e granulometria.</p><a href="consigli.html#cereali">Leggi le guide →</a></article>
        </div>
        <div class="at-advice-cta"><a class="btn btn-primary" href="consigli.html">Apri tutti i consigli</a><a class="btn btn-outline" href="#preventivo">Richiedi un preventivo</a></div>
      </div>`;
      preventivo.insertAdjacentElement('beforebegin', advice);
    }

    const form = $('#preventivoForm');
    if (form && !$('#budget')) {
      const box = document.createElement('div');
      box.className = 'at-budget-box';
      box.innerHTML = '<div class="at-budget-title">💶 Hai un budget massimo?</div><p class="at-budget-copy">Compila la quantità desiderata oppure il budget.</p><div class="at-budget-grid"><label>Budget massimo (€)<input id="budget" name="budget" type="number" min="1" step="1" inputmode="decimal" placeholder="Es. 120"></label><label hidden>Il budget comprende<select id="budgetTipo" name="budgetTipo"><option value="">Seleziona</option></select></label><label hidden>Priorità della proposta<select id="prioritaBudget" name="prioritaBudget"><option value="">Seleziona</option></select></label></div>';
      const actions = form.querySelector('.form-actions') || form.querySelector('button[type="submit"]');
      actions ? actions.insertAdjacentElement('beforebegin', box) : form.appendChild(box);
    }

    const footer = $('footer');
    if (footer && !$('.at-footer-panel')) {
      const panel = document.createElement('section');
      panel.className = 'at-footer-panel';
      panel.innerHTML = '<div class="container at-footer-grid"><div><h3>AgroTritura</h3><p>Mangime fresco tritato su misura, mix personalizzati e consegna organizzata.</p><div class="at-footer-actions"><a href="https://wa.me/393341067510" target="_blank" rel="noopener">💬 WhatsApp</a><a class="secondary" href="tel:+393341067510">📞 Chiama</a></div></div><div><h4>Collegamenti rapidi</h4><div class="at-footer-links"><a href="#prodotti">Prodotti</a><a href="#configuratore">Trova il mix</a><a href="consigli.html">Centro Consigli</a><a href="#preventivo">Preventivo</a></div></div><div><h4>Servizio</h4><div class="at-footer-links"><a href="ordine.html">Traccia ordine</a><a href="#consegna">Consegna e ritiro</a><a href="#preventivo">Calcola la distanza</a></div></div></div>';
      footer.insertAdjacentElement('beforebegin', panel);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('main > .section').forEach(section => section.classList.add('at-section-tight'));
    addHomepageEnhancements();
    setupQuoteFlow();
  });
})();