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

// AgroTritura — richiesta rapida Mix Ovaiole nella hero
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
    const trustRow = document.querySelector('.hero .trust-row');
    if (!trustRow || document.querySelector('#quickMixOvaiole')) return;

    const wrap = document.createElement('div');
    wrap.id = 'quickMixOvaiole';
    wrap.className = 'hero-quick-mix';
    wrap.innerHTML = `
      <button type="button" class="hero-quick-trigger" id="openQuickMix" aria-expanded="false">
        <span class="hero-quick-icon" aria-hidden="true">🐔</span>
        <span class="hero-quick-copy">
          <span class="hero-quick-kicker">NON SAI QUALE MIX SCEGLIERE?</span>
          <strong>Crea il tuo Mix Ovaiole</strong>
          <small>Composizione bilanciata pronta all'uso</small>
        </span>
        <span class="hero-quick-arrow" aria-hidden="true">›</span>
        <span class="hero-quick-cta">Calcola mix</span>
      </button>

      <div class="hero-quick-builder" id="quickMixBuilder" hidden>
        <div class="hero-quick-builder-head">
          <div>
            <span class="hero-quick-builder-kicker">Mix Ovaiole Completo</span>
            <h3>Quanti kg vuoi preparare?</h3>
            <p>Inserisci la quantità totale: la composizione si adatta automaticamente mantenendo le stesse percentuali.</p>
          </div>
          <label class="hero-quick-qty">
            <span>Quantità totale</span>
            <div><input id="quickMixKg" type="number" min="1" step="0.5" value="25" inputmode="decimal"><b>kg</b></div>
          </label>
        </div>

        <div class="hero-quick-recipe" id="quickMixRecipe"></div>

        <div class="hero-quick-summary">
          <span>Totale mix</span>
          <strong id="quickMixTotal">25 kg</strong>
          <small>5 ingredienti · 100%</small>
        </div>

        <div class="hero-quick-actions">
          <a class="btn btn-primary" id="quickMixWhatsapp" target="_blank" rel="noopener">📲 Richiedi preventivo su WhatsApp</a>
          <button type="button" class="btn btn-light" id="closeQuickMix">Chiudi</button>
        </div>
      </div>`;

    trustRow.insertAdjacentElement('afterend', wrap);

    if (!document.querySelector('#quickMixOvaioleStyles')) {
      const style = document.createElement('style');
      style.id = 'quickMixOvaioleStyles';
      style.textContent = `
        .hero-quick-mix{margin-top:18px;max-width:820px}
        .hero-quick-trigger{width:100%;display:grid;grid-template-columns:58px minmax(0,1fr) 28px auto;align-items:center;gap:12px;padding:10px 12px;border:1px solid rgba(255,255,255,.28);border-radius:24px;background:rgba(255,255,255,.055);color:#fff;text-align:left;cursor:pointer;box-shadow:none;transition:.2s ease}
        .hero-quick-trigger:hover{background:rgba(255,255,255,.09);border-color:rgba(255,255,255,.38)}
        .hero-quick-icon{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#f7e3aa,#dca841);font-size:1.85rem;border:2px solid rgba(255,255,255,.72);box-shadow:0 5px 15px rgba(0,0,0,.14)}
        .hero-quick-copy{min-width:0;display:block}
        .hero-quick-kicker{display:inline-block;font-size:.68rem;line-height:1;font-weight:900;letter-spacing:.04em;color:#d7eadc;background:rgba(255,255,255,.13);padding:5px 9px;border-radius:999px;margin-bottom:5px}
        .hero-quick-copy strong{display:block;font-size:1.03rem;line-height:1.2;color:#fff}
        .hero-quick-copy small{display:block;margin-top:3px;color:rgba(255,255,255,.76);font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .hero-quick-arrow{font-size:2rem;line-height:1;color:#fff;opacity:.92}
        .hero-quick-cta{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:0 17px;border-radius:16px;background:rgba(255,255,255,.11);font-weight:850;color:#fff;white-space:nowrap}
        .hero-quick-builder{margin-top:10px;background:#fff;color:#18221c;border-radius:20px;padding:18px;box-shadow:0 14px 35px rgba(0,0,0,.16)}
        .hero-quick-builder[hidden]{display:none!important}
        .hero-quick-builder-head{display:grid;grid-template-columns:1fr 190px;gap:18px;align-items:end}
        .hero-quick-builder-kicker{font-size:.73rem;font-weight:900;text-transform:uppercase;letter-spacing:.07em;color:#2f7a50}
        .hero-quick-builder h3{margin:4px 0 6px;color:#173f2a;font-size:1.25rem}
        .hero-quick-builder p{margin:0;color:#66736b;line-height:1.45;font-size:.9rem}
        .hero-quick-qty>span{display:block;font-size:.8rem;font-weight:850;color:#173f2a;margin-bottom:6px}
        .hero-quick-qty>div{display:flex;align-items:center;border:1px solid #cfddd2;border-radius:13px;background:#f8fbf9;overflow:hidden}
        .hero-quick-qty input{width:100%;min-width:0;border:0;background:transparent;padding:11px 12px;font:inherit;font-weight:850;color:#173f2a;outline:0}
        .hero-quick-qty b{padding:0 12px;color:#66736b}
        .hero-quick-recipe{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:16px 0}
        .hero-quick-item{background:#f5f9f6;border:1px solid #e0e9e2;border-radius:13px;padding:10px 7px;text-align:center}
        .hero-quick-item span,.hero-quick-item b,.hero-quick-item strong,.hero-quick-item small{display:block}
        .hero-quick-item span{font-size:1.25rem;margin-bottom:3px}
        .hero-quick-item b{color:#173f2a;font-size:.78rem}
        .hero-quick-item strong{margin-top:5px;color:#173f2a;font-size:.9rem}
        .hero-quick-item small{margin-top:2px;color:#718078;font-size:.72rem}
        .hero-quick-summary{display:flex;align-items:center;gap:8px;background:#173f2a;color:#fff;border-radius:13px;padding:11px 13px;margin-bottom:13px}
        .hero-quick-summary span{font-size:.76rem;opacity:.74}.hero-quick-summary strong{font-size:1rem}.hero-quick-summary small{margin-left:auto;opacity:.7}
        .hero-quick-actions{display:flex;gap:8px;flex-wrap:wrap}.hero-quick-actions .btn{text-decoration:none}
        @media(max-width:760px){
          .hero-quick-mix{margin-top:16px}
          .hero-quick-trigger{grid-template-columns:48px minmax(0,1fr) 18px auto;gap:8px;padding:8px 9px;border-radius:21px}
          .hero-quick-icon{width:46px;height:46px;font-size:1.55rem}
          .hero-quick-kicker{font-size:.58rem;padding:4px 7px;margin-bottom:4px}
          .hero-quick-copy strong{font-size:.91rem}
          .hero-quick-copy small{font-size:.68rem}
          .hero-quick-arrow{font-size:1.55rem}
          .hero-quick-cta{min-height:38px;padding:0 11px;border-radius:13px;font-size:.75rem}
          .hero-quick-builder-head{grid-template-columns:1fr}
          .hero-quick-recipe{grid-template-columns:repeat(2,minmax(0,1fr))}
          .hero-quick-item:last-child{grid-column:1/-1}
        }
        @media(max-width:430px){
          .hero-quick-trigger{grid-template-columns:44px minmax(0,1fr) auto;gap:8px}
          .hero-quick-icon{width:42px;height:42px;font-size:1.4rem}
          .hero-quick-arrow{display:none}
          .hero-quick-cta{padding:0 9px;font-size:.7rem}
          .hero-quick-copy strong{font-size:.86rem}
          .hero-quick-copy small{font-size:.64rem}
          .hero-quick-builder{padding:14px}
          .hero-quick-actions .btn{width:100%;text-align:center}
          .hero-quick-summary{display:grid;grid-template-columns:auto 1fr}.hero-quick-summary small{grid-column:1/-1;margin-left:0}
        }
      `;
      document.head.appendChild(style);
    }

    const builder = wrap.querySelector('#quickMixBuilder');
    const trigger = wrap.querySelector('#openQuickMix');
    const input = wrap.querySelector('#quickMixKg');
    const recipe = wrap.querySelector('#quickMixRecipe');
    const total = wrap.querySelector('#quickMixTotal');
    const whatsapp = wrap.querySelector('#quickMixWhatsapp');

    function update() {
      let kg = Number.parseFloat(String(input.value).replace(',', '.'));
      if (!Number.isFinite(kg) || kg <= 0) kg = 1;

      recipe.innerHTML = RECIPE.map(item => {
        const amount = kg * item.pct / 100;
        return `<div class="hero-quick-item"><span>${item.icon}</span><b>${item.name}</b><strong>${formatKg(amount)} kg</strong><small>${item.pct}%</small></div>`;
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

    trigger.addEventListener('click', () => {
      const opening = builder.hidden;
      builder.hidden = !opening;
      trigger.setAttribute('aria-expanded', String(opening));
      if (opening) {
        update();
        requestAnimationFrame(() => builder.scrollIntoView({behavior:'smooth', block:'nearest'}));
      }
    });

    wrap.querySelector('#closeQuickMix').addEventListener('click', () => {
      builder.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
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