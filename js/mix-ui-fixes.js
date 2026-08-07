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