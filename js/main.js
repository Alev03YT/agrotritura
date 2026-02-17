// ============================
// MENU MOBILE
// ============================
const hamb = document.querySelector('[data-hamb]');
const panel = document.querySelector('[data-mobile-panel]');

if (hamb && panel) {
  hamb.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('show');
    hamb.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.classList.toggle('menu-open', isOpen);
  });

  // Chiudi menu quando clicchi un link
  panel.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    panel.classList.remove('show');
    hamb.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  });
}


// ============================
// CONFIG: URL APPS SCRIPT
// ============================
const LEAD_API = "https://script.google.com/macros/s/AKfycbx8ppBJ73ZyoAFLPxHugetMUv6VwS1i4s1jeRtrSWNRKL_UAxZxqTbWjgcHHD4KJmKL/exec";


// ============================
// CONFIG TRASPORTO (stima)
// ============================
// Prezzo gasolio: via di mezzo tra 1,65 e 1,80
const DIESEL_EUR_L = 1.725;

// Consumo medio Jeep Cherokee KJ 2.8 CRD (stima): cambia tu se vuoi
const CONSUMO_L_100KM = 11.0;

// Extra usura/manutenzione (gomme, tagliandi, ecc.) per km
const USURA_EUR_KM = 0.08;

// Margine sul costo trasporto (per non andare “a pari”)
const MARGINE_TRASPORTO = 0.25; // 25%

// Minimo trasporto (solo se non è gratuito)
const TRASPORTO_MIN_EUR = 6.00;

// Regola: gratis >=30€ entro 15km
const SOGLIA_GRATIS_EUR = 30;
const KM_GRATIS = 15;

function round2(n){ return Math.round((n + Number.EPSILON) * 100) / 100; }

function costoKmStimato(){
  const carburante = (CONSUMO_L_100KM / 100) * DIESEL_EUR_L;  // €/km
  return carburante + USURA_EUR_KM;
}

function stimaTrasportoEuro(kmSoloAndata, totaleMerceEuro){
  const km = Number(kmSoloAndata);
  if (!isFinite(km) || km <= 0) return null;

  // regola gratis (solo se hai un totale merce)
  if (isFinite(totaleMerceEuro) && totaleMerceEuro >= SOGLIA_GRATIS_EUR && km <= KM_GRATIS) {
    return 0;
  }

  const kmAR = km * 2; // andata + ritorno
  const base = kmAR * costoKmStimato();
  const conMargine = base * (1 + MARGINE_TRASPORTO);
  const finale = Math.max(TRASPORTO_MIN_EUR, conMargine);

  return round2(finale);
}


// ============================
// CAMPI DINAMICI: PRODOTTO + CONSEGNA (+ DISTANZA + STIMA TRASPORTO)
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

  if (["Mais", "Orzo", "Avena"].includes(prodotto)) {
    campoExtra.innerHTML += renderSelect("Granulometria desiderata", "extra_granulometria", ["Grossa", "Media", "Fine"]);
  } else if (prodotto === "Frumento") {
    campoExtra.innerHTML += renderSelect("Animali destinatari", "extra_animali", ["Bovini", "Suini", "Pollame", "Ovini", "Altro"]);
  } else if (prodotto === "Grana verde") {
    campoExtra.innerHTML += renderSelect("Formato grana verde", "extra_formato_grana", ["Intero", "Tritato"]);
    campoExtra.innerHTML += `<div id="wrapGranaGranulo"></div>`;

    const formatoSel = campoExtra.querySelector('[name="extra_formato_grana"]');
    const wrap = campoExtra.querySelector('#wrapGranaGranulo');

    const update = () => {
      if (formatoSel.value === "Tritato") {
        wrap.innerHTML = renderSelect("Granulometria", "extra_granulometria_grana", ["Grossa", "Media", "Fine"]);
      } else {
        wrap.innerHTML = "";
      }
    };

    formatoSel.addEventListener("change", update);
    update();
  } else if (prodotto === "Mix personalizzato") {
    campoExtra.innerHTML += renderInput("Composizione del mix", "extra_mix", "Es. mais + orzo + frumento");
  } else if (prodotto === "Altro / da definire") {
    campoExtra.innerHTML += renderInput("Prodotto richiesto", "extra_altro", "Descrivi cosa ti serve");
  }

  // consegna per tutti
  campoExtra.innerHTML += renderSelect("Consegna", "tipo_consegna", ["A domicilio", "Presso la tua azienda"]);

  // campo distanza (mostrato solo se serve)
  campoExtra.innerHTML += `
    <div id="wrapDistanza" style="margin-top:10px; display:none">
      <label>Distanza (km sola andata)</label>
      <input name="distanza_km" inputmode="decimal" placeholder="Es. 12.5" />
      <div style="margin-top:6px; font-size:.9rem; opacity:.8">
        Consiglio: apri Google Maps e prendi i km dalla tua sede al cliente.
      </div>
    </div>
  `;

  // box stima trasporto
  campoExtra.innerHTML += `
    <div id="trasportoPreview" style="
      margin-top:12px;
      padding:10px 12px;
      border-radius:12px;
      border:1px solid rgba(0,0,0,.10);
      background:rgba(46,93,46,.06);
      font-weight:900;
      display:none;
    ">
      Trasporto stimato A/R: <span id="trasportoVal">—</span>
      <div style="margin-top:6px; font-size:.9rem; font-weight:700; opacity:.85">
        Include andata+ritorno, gasolio, usura e margine.
      </div>
    </div>
  `;

  const consegnaSel = campoExtra.querySelector('[name="tipo_consegna"]');
  const wrapDistanza = campoExtra.querySelector('#wrapDistanza');
  const kmEl = campoExtra.querySelector('[name="distanza_km"]');
  const trasportoPreview = campoExtra.querySelector('#trasportoPreview');
  const trasportoVal = campoExtra.querySelector('#trasportoVal');

  function toggleDistanza(){
    const v = (consegnaSel?.value || "");
    // la distanza serve sia per A domicilio che per Presso la tua azienda
    const show = (v === "A domicilio" || v === "Presso la tua azienda");
    if (wrapDistanza) wrapDistanza.style.display = show ? "" : "none";

    // se nascondo distanza, nascondo anche preview
    if (!show && trasportoPreview) trasportoPreview.style.display = "none";
  }

  function updateTrasportoPreview(){
    const kmTxt = (kmEl?.value || "").trim().replace(",", ".");
    const km = parseFloat(kmTxt);

    // salvo comunque la distanza per whatsapp (anche se non valida)
    if (form) form.setAttribute("data-distanza-km", kmTxt);

    if (!isFinite(km) || km <= 0){
      if (trasportoPreview) trasportoPreview.style.display = "none";
      if (form) form.setAttribute("data-trasporto-eur", "");
      return;
    }

    // Non abbiamo “totale merce” calcolato qui, quindi niente regola gratis automatica:
    // (se vuoi, in futuro calcoliamo anche il totale prodotto)
    const stima = stimaTrasportoEuro(km, null);

    if (trasportoPreview) trasportoPreview.style.display = "";
    if (trasportoVal) trasportoVal.textContent = (stima === 0) ? "GRATIS" : `${stima} €`;

    if (form) form.setAttribute("data-trasporto-eur", String(stima));
  }

  consegnaSel?.addEventListener("change", toggleDistanza);
  kmEl?.addEventListener("input", updateTrasportoPreview);

  toggleDistanza();
  updateTrasportoPreview();
}

if (selectProdotto) {
  selectProdotto.addEventListener('change', (e) => creaCampoExtra(e.target.value));
  if (selectProdotto.value) creaCampoExtra(selectProdotto.value);
}


// ============================
// JSONP helper (GitHub Pages)
// ============================
function jsonp(url, timeoutMs = 12000){
  return new Promise((resolve, reject)=>{
    const cb = "__lead_cb_" + Math.random().toString(36).slice(2);
    const s = document.createElement("script");

    const t = setTimeout(()=>{
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

    parts.push(label ? `${label}: ${val}` : val);
  });

  return parts.join(" | ");
}


// ============================
// SUBMIT PREVENTIVO
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

    // leggo stima trasporto salvata dal preview
    const kmSoloAndata = (form.getAttribute("data-distanza-km") || "").trim();
    const trasportoEurRaw = (form.getAttribute("data-trasporto-eur") || "").trim();
    const trasportoLabel = trasportoEurRaw ? (trasportoEurRaw === "0" ? "GRATIS" : `${trasportoEurRaw} €`) : "";

    // 1) salva lead (non blocca whatsapp se fallisce)
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

    try { await jsonp(leadUrl); } catch (err) { console.warn("Lead non salvato:", err.message); }

    // 2) messaggio whatsapp
    const msg =
`Ciao AgroTritura!
Vorrei un preventivo per mangime su misura.

📌 Dettagli ordine:
- Prodotto: ${prodotto || "-"}
- Quantità: ${quantita || "-"}
- Comune/Indirizzo: ${comune || "-"}
${kmSoloAndata ? `- Distanza (km sola andata): ${kmSoloAndata}\n` : ""}${trasportoLabel ? `- Trasporto stimato A/R: ${trasportoLabel}\n` : ""}${telefono ? `- Telefono: ${telefono}\n` : ""}${nome ? `- Nome: ${nome}\n` : ""}

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
// SLIDER PRO (tutte le sezioni con data-slider)
// - frecce + pallini
// - attiva solo se c’è overflow
// ============================
function initSlider(sliderWrap){
  const track = sliderWrap.querySelector("[data-slider-track]");
  const btnPrev = sliderWrap.querySelector("[data-slider-prev]");
  const btnNext = sliderWrap.querySelector("[data-slider-next]");
  const dotsWrap = sliderWrap.querySelector("[data-slider-dots]");
  if (!track) return;

  const items = Array.from(track.children).filter(el => el.nodeType === 1);
  if (!items.length) return;

  function step(){
    const first = items[0];
    const rect = first.getBoundingClientRect();
    const style = getComputedStyle(track);
    const gap = parseFloat(style.gap || style.columnGap || 0) || 12;
    return rect.width + gap;
  }

  function setActiveDot(i){
    const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll(".sliderDot")) : [];
    dots.forEach((d,idx)=> d.classList.toggle("active", idx === i));
  }

  function currentIndex(){
    const s = step();
    return Math.round(track.scrollLeft / s);
  }

  function scrollToIndex(i){
    const s = step();
    const max = items.length - 1;
    const idx = Math.max(0, Math.min(max, i));
    track.scrollTo({ left: idx * s, behavior: "smooth" });
    setActiveDot(idx);
  }

  function buildDots(){
    if (!dotsWrap) return;
    dotsWrap.innerHTML = items.map((_, i)=>(
      `<button class="sliderDot" type="button" aria-label="Vai alla slide ${i+1}" data-dot="${i}"></button>`
    )).join("");
    setActiveDot(0);

    dotsWrap.addEventListener("click", (e)=>{
      const b = e.target.closest("[data-dot]");
      if (!b) return;
      scrollToIndex(parseInt(b.dataset.dot, 10));
    });
  }

  function updateActiveState(){
    const active = track.scrollWidth > track.clientWidth + 2;
    sliderWrap.classList.toggle("sliderActive", active);
    if (active) buildDots();
    else if (dotsWrap) dotsWrap.innerHTML = "";
  }

  btnPrev?.addEventListener("click", ()=> scrollToIndex(currentIndex() - 1));
  btnNext?.addEventListener("click", ()=> scrollToIndex(currentIndex() + 1));

  let t;
  track.addEventListener("scroll", ()=>{
    clearTimeout(t);
    t = setTimeout(()=> setActiveDot(currentIndex()), 60);
  }, { passive:true });

  updateActiveState();
  window.addEventListener("resize", ()=> {
    updateActiveState();
    setActiveDot(currentIndex());
  });
}

document.querySelectorAll("[data-slider]").forEach(initSlider);
