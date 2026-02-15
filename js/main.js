// ============================
// MENU MOBILE
// ============================
const hamb = document.querySelector('[data-hamb]');
const panel = document.querySelector('[data-mobile-panel]');

if (hamb && panel) {
  hamb.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('show');
    hamb.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    // nasconde/mostra il bottone WhatsApp quando il menu è aperto
    document.body.classList.toggle('menu-open', isOpen);
  });

  // chiudi il menu quando clicchi un link
  panel.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    panel.classList.remove('show');
    hamb.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  });
}

// ============================
// CONFIG: URL APPS SCRIPT (LEADS)
// ============================
const LEAD_API = "https://script.google.com/macros/s/AKfycbykB-jtTTq0t6aem_sEAfX9xCMCLtNbswXcXPYi5ek_DcNPQif0TJmrCkKSNAXIGNCS/exec";

// ============================
// CAMPI DINAMICI: PRODOTTO + CONSEGNA
// ============================
const selectProdotto = document.querySelector('#cereale');
const campoExtra = document.querySelector('#campoExtraDinamico');

function renderSelect(label, name, options) {
  return `
    <div style="margin-top:10px">
      <label>${label}</label>
      <select name="${name}">
        <option value="">Seleziona…</option>
        ${options.map(o => `<option value="${o}">${o}</option>`).join("")}
      </select>
    </div>
  `;
}

function renderInput(label, name, placeholder) {
  return `
    <div style="margin-top:10px">
      <label>${label}</label>
      <input name="${name}" placeholder="${placeholder}" />
    </div>
  `;
}

function creaCampoExtra(prodotto) {
  if (!campoExtra) return;

  campoExtra.innerHTML = "";

  // ----- CAMPI SPECIFICI PRODOTTO -----
  if (["Mais", "Orzo", "Avena"].includes(prodotto)) {
    campoExtra.innerHTML += renderSelect(
      "Granulometria desiderata",
      "extra_granulometria",
      ["Grossa", "Media", "Fine"]
    );
  } else if (prodotto === "Frumento") {
    campoExtra.innerHTML += renderSelect(
      "Animali destinatari",
      "extra_animali",
      ["Bovini", "Suini", "Pollame", "Ovini", "Altro"]
    );
  } else if (prodotto === "Grana verde") {
    campoExtra.innerHTML += renderSelect(
      "Formato grana verde",
      "extra_formato_grana",
      ["Intero", "Tritato"]
    );

    campoExtra.innerHTML += `<div id="wrapGranaGranulo"></div>`;

    const formatoSel = campoExtra.querySelector('[name="extra_formato_grana"]');
    const wrap = campoExtra.querySelector('#wrapGranaGranulo');

    if (formatoSel && wrap) {
      const update = () => {
        if (formatoSel.value === "Tritato") {
          wrap.innerHTML = renderSelect(
            "Granulometria",
            "extra_granulometria_grana",
            ["Grossa", "Media", "Fine"]
          );
        } else {
          wrap.innerHTML = "";
        }
      };

      formatoSel.addEventListener("change", update);
      update();
    }
  } else if (prodotto === "Mix personalizzato") {
    campoExtra.innerHTML += renderInput(
      "Composizione del mix",
      "extra_mix",
      "Es. mais + orzo + frumento (percentuali se le sai)"
    );
  } else if (prodotto === "Altro / da definire") {
    campoExtra.innerHTML += renderInput(
      "Prodotto richiesto",
      "extra_altro",
      "Descrivi cosa ti serve (cereale/miscela)"
    );
  }

  // ----- CONSEGNA (per tutti) -----
  campoExtra.innerHTML += renderSelect(
    "Consegna",
    "tipo_consegna",
    ["A domicilio", "Presso la tua azienda"]
  );
}

if (selectProdotto) {
  selectProdotto.addEventListener('change', (e) => {
    creaCampoExtra(e.target.value);
  });

  if (selectProdotto.value) creaCampoExtra(selectProdotto.value);
}

// ============================
// JSONP helper (GitHub Pages / CORS)
// ============================
function jsonp(url, timeoutMs = 12000){
  return new Promise((resolve, reject)=>{
    const cb = "__lead_cb_" + Math.random().toString(36).slice(2);
    const s = document.createElement("script");

    let t = setTimeout(()=>{
      cleanup();
      reject(new Error("Timeout richiesta"));
    }, timeoutMs);

    function cleanup(){
      clearTimeout(t);
      try { delete window[cb]; } catch(e) { window[cb] = undefined; }
      if (s && s.parentNode) s.parentNode.removeChild(s);
    }

    window[cb] = (data)=>{
      cleanup();
      resolve(data);
    };

    s.onerror = ()=>{
      cleanup();
      reject(new Error("Errore JSONP"));
    };

    const full = url + (url.includes("?") ? "&" : "?")
      + "callback=" + encodeURIComponent(cb)
      + "&t=" + Date.now();

    s.src = full;
    document.body.appendChild(s);
  });
}

// ============================
// COLLECT EXTRA (leggibile)
// ============================
function collectExtrasReadable(){
  if (!campoExtra) return "";

  const nodes = campoExtra.querySelectorAll("select, input, textarea");
  const parts = [];

  nodes.forEach(el=>{
    const val = (el.value || "").trim();
    if (!val) return;

    const wrap = el.closest("div");
    const label = wrap ? (wrap.querySelector("label")?.textContent || "").trim() : "";

    if (label) parts.push(`${label}: ${val}`);
    else parts.push(val);
  });

  return parts.join(" | ");
}

// ============================
// SUBMIT PREVENTIVO: salva lead + apre WhatsApp
// ============================
const form = document.querySelector('#preventivoForm');

function safe(selector){
  const el = form?.querySelector(selector);
  return (el?.value || "").trim();
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = safe('#nome');
    const telefono = safe('#telefono');
    const prodotto = safe('#cereale');
    const quantita = safe('#quantita');
    const comune = safe('#comune');
    const note = safe('#note');

    const extra = collectExtrasReadable();

    // 1) Salva lead su Google Sheet (non blocca WhatsApp se fallisce)
    const leadUrl =
      LEAD_API +
      "?action=lead" +
      "&nome=" + encodeURIComponent(nome) +
      "&telefono=" + encodeURIComponent(telefono) +
      "&cereale=" + encodeURIComponent(prodotto) +
      "&extra=" + encodeURIComponent(extra) +
      "&quantita=" + encodeURIComponent(quantita) +
      "&comune=" + encodeURIComponent(comune) +
      "&note=" + encodeURIComponent(note) +
      "&pagina=" + encodeURIComponent(location.href);

    try{
      await jsonp(leadUrl);
    }catch(err){
      console.warn("Lead non salvato:", err.message);
      // continuiamo comunque
    }

    // 2) Messaggio WhatsApp PRO
    const msg =
`Ciao AgroTritura!
Vorrei un preventivo per mangime su misura.

📌 Dettagli ordine:
- Prodotto: ${prodotto || "-"}
- Quantità: ${quantita || "-"}
- Comune/Indirizzo: ${comune || "-"}${telefono ? `\n- Telefono: ${telefono}` : ""}${nome ? `\n- Nome: ${nome}` : ""}

🔧 Dettagli specifici:
- ${extra || "-"}

📝 Note:
${note || "-"}

Grazie!`;

    const url = "https://wa.me/393341067510?text=" + encodeURIComponent(msg);
    window.open(url, "_blank");
  });
}

// ============================
// SLIDER PRO (tutte le sezioni): frecce + pallini
// ============================
(function initSlidersPro(){
  const sliders = document.querySelectorAll('[data-slider]');
  if (!sliders.length) return;

  sliders.forEach((wrap) => {
    const track = wrap.querySelector('[data-slider-track]');
    const btnPrev = wrap.querySelector('[data-slider-prev]');
    const btnNext = wrap.querySelector('[data-slider-next]');
    const dotsWrap = wrap.querySelector('[data-slider-dots]');

    if (!track) return;

    // solo elementi reali (no text nodes)
    const items = Array.from(track.children).filter(n => n.nodeType === 1);
    if (items.length <= 1) return;

    // crea pallini
    if (dotsWrap) {
      dotsWrap.innerHTML = items.map((_, i) =>
        `<button class="sliderDot" type="button" aria-label="Vai all'elemento ${i+1}" data-dot="${i}"></button>`
      ).join("");
    }
    const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll('.sliderDot')) : [];

    function getGapPx(){
      const st = getComputedStyle(track);
      const g = st.gap || st.columnGap || "0px";
      const n = parseFloat(g);
      return Number.isFinite(n) ? n : 0;
    }

    function stepPx(){
      const first = items[0];
      const w = first.getBoundingClientRect().width;
      return w + getGapPx();
    }

    function maxIndex(){
      return items.length - 1;
    }

    function setActiveDot(i){
      dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
    }

    function currentIndex(){
      const s = stepPx();
      if (s <= 0) return 0;
      return Math.max(0, Math.min(maxIndex(), Math.round(track.scrollLeft / s)));
    }

    function scrollToIndex(i){
      const s = stepPx();
      track.scrollTo({ left: i * s, behavior: 'smooth' });
      setActiveDot(i);
    }

    function updateActiveState(){
      const hasOverflow = track.scrollWidth > (track.clientWidth + 2);
      wrap.classList.toggle('sliderActive', hasOverflow);
      if (!hasOverflow) setActiveDot(0);
    }

    // bottoni
    btnPrev?.addEventListener('click', () => {
      scrollToIndex(Math.max(0, currentIndex() - 1));
    });
    btnNext?.addEventListener('click', () => {
      scrollToIndex(Math.min(maxIndex(), currentIndex() + 1));
    });

    // click pallini
    dotsWrap?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-dot]');
      if (!b) return;
      scrollToIndex(parseInt(b.dataset.dot, 10));
    });

    // aggiorna pallino durante swipe
    let t;
    track.addEventListener('scroll', () => {
      clearTimeout(t);
      t = setTimeout(() => setActiveDot(currentIndex()), 60);
    }, { passive: true });

    // init + resize
    setActiveDot(0);
    updateActiveState();

    window.addEventListener('resize', () => {
      updateActiveState();
      setActiveDot(currentIndex());
    });
  });
})();
