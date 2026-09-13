// AgroTritura — rifiniture UI configuratore mix mobile
(() => {
  'use strict';

  function init() {
    const section = document.querySelector('#configuratore');
    const config = section?.querySelector('.ag-config');
    const choices = [...document.querySelectorAll('#agAnimalChoices .ag-choice')];
    const goal = document.querySelector('#agGoal');
    const animals = document.querySelector('#agAnimals');
    const empty = document.querySelector('#agEmpty');
    const result = document.querySelector('#agResult');
    const controls = document.querySelector('.ag-controls');
    if (!section || !config || !choices.length || !goal || !animals || !controls) return;

    if (!document.querySelector('#agUiFixStyles')) {
      const style = document.createElement('style');
      style.id = 'agUiFixStyles';
      style.textContent = `
        .ag-reset-wrap{display:flex;justify-content:flex-end;margin-top:14px;position:relative;z-index:5}
        .ag-reset-btn{border:1px solid #cdded2;background:#eef6f0;color:#173f2a;border-radius:13px;padding:11px 16px;font-weight:850;cursor:pointer;box-shadow:0 5px 14px rgba(23,63,42,.06)}
        .ag-reset-btn:hover{background:#e5f0e8}
        #configuratore.ag-initial .ag-reset-wrap{display:none!important}
        @media(max-width:760px){
          #configuratore.ag-initial .ag-config-grid{display:block!important}
          #configuratore.ag-initial .ag-config-grid>div:nth-child(2){display:none!important}
          #configuratore.ag-initial .ag-controls{height:auto!important;min-height:0!important;padding-bottom:18px!important}
          #configuratore.ag-initial .ag-controls .ag-field:nth-of-type(2),
          #configuratore.ag-initial .ag-controls .ag-field:nth-of-type(3),
          #configuratore.ag-initial .ag-controls .ag-info-box{display:none!important}
          #configuratore.ag-initial .ag-choice-grid{grid-template-columns:1fr 1fr!important}
          #configuratore.ag-initial .ag-choice{min-height:86px!important}
          #configuratore.ag-active .ag-config-grid{min-height:0!important}
          #configuratore.ag-active .ag-controls{min-height:0!important}
          .ag-reset-wrap{justify-content:stretch;margin-top:12px}
          .ag-reset-btn{width:100%;font-size:.95rem}
        }
      `;
      document.head.appendChild(style);
    }

    let resetWrap = document.querySelector('#agResetWrap');
    if (!resetWrap) {
      resetWrap = document.createElement('div');
      resetWrap.className = 'ag-reset-wrap';
      resetWrap.id = 'agResetWrap';
      resetWrap.innerHTML = '<button type="button" class="ag-reset-btn" id="agResetMix">↺ Ricomincia / cambia animale</button>';
      config.appendChild(resetWrap);
    }

    function setInitial() {
      section.classList.add('ag-initial');
      section.classList.remove('ag-active');
    }

    function setActive() {
      section.classList.remove('ag-initial');
      section.classList.add('ag-active');
    }

    setInitial();

    choices.forEach(button => {
      button.addEventListener('click', () => {
        setActive();
        requestAnimationFrame(() => {
          const target = goal.closest('.ag-field');
          if (target && window.innerWidth <= 760) target.scrollIntoView({behavior:'smooth', block:'center', inline:'center'});
        });
      });
    });

    document.querySelector('#agResetMix')?.addEventListener('click', () => {
      choices.forEach(button => button.classList.remove('active'));
      goal.innerHTML = '<option value="">Prima scegli l’animale</option>';
      goal.value = '';
      goal.disabled = true;
      animals.value = '20';
      if (empty) {
        empty.hidden = false;
        empty.style.display = '';
      }
      if (result) result.hidden = true;
      setInitial();
      requestAnimationFrame(() => {
        const first = document.querySelector('#agAnimalChoices');
        first?.scrollIntoView({behavior:'smooth', block:'center'});
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));
  } else {
    setTimeout(init, 0);
  }
})();

// AgroTritura — richiesta rapida Mix Ovaiole Completo
(() => {
  'use strict';

  const PHONE = '393341067510';
  const RECIPE = [
    {name:'Mais', pct:32, icon:'🌽'},
    {name:'Frumento', pct:23, icon:'🌾'},
    {name:'Orzo', pct:20, icon:'🌾'},
    {name:'Mangime Ovaiolo', pct:22, icon:'🐔'},
    {name:'Grana Verde', pct:3, icon:'🌿'}
  ];

  const formatKg = value => Number(value).toLocaleString('it-IT', {minimumFractionDigits:0, maximumFractionDigits:2});

  function initQuickOvaiole() {
    const configuratore = document.querySelector('#configuratore');
    if (!configuratore || document.querySelector('#quickMixOvaiole')) return;

    const section = document.createElement('section');
    section.className = 'section';
    section.id = 'quickMixOvaiole';
    section.innerHTML = `
      <div class="container">
        <div class="at-quick-card">
          <div class="at-quick-intro">
            <span class="eyebrow">Scelta rapida per ovaiole</span>
            <h2>Non sai quale mix scegliere?</h2>
            <p>Parti dal nostro <strong>Mix Ovaiole Completo</strong>: inserisci solo quanti kg vuoi e la composizione si adatta automaticamente mantenendo le stesse percentuali.</p>
            <button type="button" class="btn btn-primary" id="openQuickMix">🐔 Crea il mio Mix Ovaiole</button>
          </div>

          <div class="at-quick-builder" id="quickMixBuilder" hidden>
            <div class="at-quick-top">
              <div>
                <span class="at-quick-kicker">Mix Ovaiole Completo</span>
                <h3>Quanti kg vuoi preparare?</h3>
                <p>Puoi inserire qualsiasi quantità. I kg dei singoli ingredienti vengono ricalcolati in automatico.</p>
              </div>
              <label class="at-quick-qty">
                <span>Quantità totale</span>
                <div><input id="quickMixKg" type="number" min="1" step="0.5" value="25" inputmode="decimal"><b>kg</b></div>
              </label>
            </div>

            <div class="at-quick-recipe" id="quickMixRecipe"></div>

            <div class="at-quick-summary">
              <div><span>Totale</span><strong id="quickMixTotal">25 kg</strong></div>
              <div><span>Composizione</span><strong>5 ingredienti · 100%</strong></div>
            </div>

            <div class="at-quick-actions">
              <a class="btn btn-primary" id="quickMixWhatsapp" target="_blank" rel="noopener">📲 Richiedi preventivo su WhatsApp</a>
              <button type="button" class="btn btn-light" id="closeQuickMix">Chiudi</button>
            </div>
            <p class="at-quick-note">Il prezzo viene confermato nel preventivo in base alla quantità richiesta, alla disponibilità e all'eventuale consegna.</p>
          </div>
        </div>
      </div>`;

    configuratore.insertAdjacentElement('afterend', section);

    if (!document.querySelector('#quickMixOvaioleStyles')) {
      const style = document.createElement('style');
      style.id = 'quickMixOvaioleStyles';
      style.textContent = `
        #quickMixOvaiole{padding-top:0}
        .at-quick-card{background:linear-gradient(135deg,#173f2a 0%,#245f40 100%);color:#fff;border-radius:28px;padding:clamp(22px,4vw,42px);box-shadow:0 18px 50px rgba(23,63,42,.16);overflow:hidden;position:relative}
        .at-quick-card:after{content:'🐔';position:absolute;right:-12px;top:-24px;font-size:150px;opacity:.06;pointer-events:none}
        .at-quick-intro{max-width:760px;position:relative;z-index:1}
        .at-quick-intro .eyebrow{color:#d8eddd}
        .at-quick-intro h2{margin:8px 0 10px;color:#fff;font-size:clamp(1.6rem,4vw,2.5rem)}
        .at-quick-intro p{margin:0 0 20px;color:rgba(255,255,255,.86);line-height:1.65}
        .at-quick-intro .btn{background:#fff;color:#173f2a;border:0}
        .at-quick-builder{margin-top:24px;background:#fff;color:#18221c;border-radius:22px;padding:clamp(18px,3vw,28px);position:relative;z-index:1}
        .at-quick-builder[hidden]{display:none!important}
        .at-quick-top{display:grid;grid-template-columns:1fr 220px;gap:22px;align-items:end}
        .at-quick-kicker{font-size:.8rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#2f7a50}
        .at-quick-top h3{margin:5px 0 7px;color:#173f2a;font-size:1.45rem}
        .at-quick-top p{margin:0;color:#66736b;line-height:1.5}
        .at-quick-qty>span{display:block;font-weight:850;color:#173f2a;margin-bottom:7px}
        .at-quick-qty>div{display:flex;align-items:center;border:1px solid #cfddd2;border-radius:14px;background:#f8fbf9;overflow:hidden}
        .at-quick-qty input{width:100%;min-width:0;border:0;background:transparent;padding:13px 14px;font:inherit;font-weight:850;color:#173f2a;outline:0}
        .at-quick-qty b{padding:0 14px;color:#66736b}
        .at-quick-recipe{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:22px 0}
        .at-quick-item{background:#f5f9f6;border:1px solid #e0e9e2;border-radius:16px;padding:14px;text-align:center}
        .at-quick-icon{font-size:1.55rem;display:block;margin-bottom:6px}
        .at-quick-item b,.at-quick-item strong,.at-quick-item small{display:block}
        .at-quick-item b{color:#173f2a;font-size:.92rem}
        .at-quick-item strong{margin-top:7px;color:#173f2a;font-size:1.08rem}
        .at-quick-item small{margin-top:3px;color:#718078}
        .at-quick-summary{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px}
        .at-quick-summary>div{background:#173f2a;color:#fff;border-radius:15px;padding:13px 15px}
        .at-quick-summary span,.at-quick-summary strong{display:block}
        .at-quick-summary span{font-size:.78rem;opacity:.7}
        .at-quick-summary strong{margin-top:4px}
        .at-quick-actions{display:flex;gap:10px;flex-wrap:wrap}
        .at-quick-actions .btn{text-decoration:none}
        .at-quick-note{font-size:.82rem;color:#6d7971;margin:14px 0 0;line-height:1.5}
        @media(max-width:820px){.at-quick-top{grid-template-columns:1fr}.at-quick-recipe{grid-template-columns:repeat(2,minmax(0,1fr))}.at-quick-item:last-child{grid-column:1/-1}.at-quick-summary{grid-template-columns:1fr}}
        @media(max-width:520px){.at-quick-card{border-radius:22px;padding:18px}.at-quick-recipe{grid-template-columns:1fr 1fr}.at-quick-item{padding:12px 8px}.at-quick-actions .btn{width:100%;text-align:center}}
      `;
      document.head.appendChild(style);
    }

    const builder = section.querySelector('#quickMixBuilder');
    const input = section.querySelector('#quickMixKg');
    const recipe = section.querySelector('#quickMixRecipe');
    const total = section.querySelector('#quickMixTotal');
    const whatsapp = section.querySelector('#quickMixWhatsapp');

    function update() {
      let kg = Number.parseFloat(String(input.value).replace(',', '.'));
      if (!Number.isFinite(kg) || kg <= 0) kg = 1;

      recipe.innerHTML = RECIPE.map(item => {
        const amount = kg * item.pct / 100;
        return `<div class="at-quick-item"><span class="at-quick-icon">${item.icon}</span><b>${item.name}</b><strong>${formatKg(amount)} kg</strong><small>${item.pct}%</small></div>`;
      }).join('');

      total.textContent = `${formatKg(kg)} kg`;
      const lines = RECIPE.map(item => `- ${item.name}: ${formatKg(kg * item.pct / 100)} kg (${item.pct}%)`);
      const message = [
        'Ciao, vorrei richiedere un preventivo AgroTritura.',
        '',
        'Prodotto: Mix Ovaiole Completo',
        `Quantità totale: ${formatKg(kg)} kg`,
        '',
        'Composizione richiesta:',
        ...lines,
        '',
        'Vorrei conoscere disponibilità, prezzo e modalità di ritiro/consegna.'
      ].join('\n');
      whatsapp.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
    }

    section.querySelector('#openQuickMix').addEventListener('click', () => {
      builder.hidden = false;
      update();
      requestAnimationFrame(() => builder.scrollIntoView({behavior:'smooth', block:'center'}));
    });

    section.querySelector('#closeQuickMix').addEventListener('click', () => {
      builder.hidden = true;
      section.querySelector('#openQuickMix').scrollIntoView({behavior:'smooth', block:'center'});
    });

    input.addEventListener('input', update);
    input.addEventListener('change', update);
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initQuickOvaiole, 30));
  } else {
    setTimeout(initQuickOvaiole, 30);
  }
})();