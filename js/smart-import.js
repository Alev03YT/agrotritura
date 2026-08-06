(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const imported = localStorage.getItem('at_quote_import');
    if (!imported) return;
    const msg = document.querySelector('#msg');
    if (!msg) return;
    msg.value = imported;
    localStorage.removeItem('at_quote_import');

    const analyze = document.querySelector('#analyze');
    if (analyze) setTimeout(() => analyze.click(), 80);

    const ok = document.querySelector('#ok');
    if (ok) {
      ok.textContent = 'Formulazione importata dal Formulatore Mix. Completa cliente, budget e trasporto.';
      ok.classList.remove('hidden');
    }
  });
})();