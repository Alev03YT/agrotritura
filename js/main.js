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
const LEAD_API = "https://script.google.com/macros/s/AKfycbykB-jtTTq0t6aem_sEAfX9xCMCLtNbswXcXPYi5ek_DcNPQif0TJmrCkKSNAXIGNCS/exec";

// ============================
// CONFIG TRASPORTO (stima)
// ============================
// Prezzo gasolio: hai detto "una via di mezzo" tra 1,65 e 1,80
const DIESEL_EUR_L = 1.725;

// Consumo medio Jeep Cherokee KJ 2.8 CRD (stima): cambia tu se vuoi
const CONSUMO_L_100KM = 11.0;

// Extra usura/manutenzione (gomme, tagliandi, ecc.) per km
const USURA_EUR_KM = 0.08;

// Margine sul costo trasporto (per non andare “a pari”)
const MARGINE_TRASPORTO = 0.25; // 25%

// Minimo trasporto (solo se non è gratuito)
const TRASPORTO_MIN_EUR = 6.00;

// Regola già presente: gratis >=30€ entro 15km (puoi modificarla)
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

  // regola gratis
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

const consegnaSel = campoExtra.querySelector('[name="tipo_consegna"]');
const wrapDistanza = campoExtra.querySelector('#wrapDistanza');

function toggleDistanza(){
  const v = (consegnaSel?.value || "");
  // la distanza serve sia per A domicilio che per Presso la tua azienda
  const show = (v === "A domicilio" || v === "Presso la tua azienda");
  if (wrapDistanza) wrapDistanza.style.display = show ? "" : "none";
}
consegnaSel?.addEventListener("change", toggleDistanza);
toggleDistanza();
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
    // attiva se si può scrollare orizzontalmente
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

  // init + resize
  updateActiveState();
  window.addEventListener("resize", ()=> {
    // ricalcola (layout cambia)
    updateActiveState();
    setActiveDot(currentIndex());
  });
}

document.querySelectorAll("[data-slider]").forEach(initSlider);



// =====================================================================
// ✅ AGGIUNTA: STIMA TRASPORTO (KM A/R + GASOLIO + MARGINE) + BOX UI
// - NON modifica il tuo submit handler: aggiunge la stima nelle NOTE
// - Richiede Apps Script action=distance (vedi sotto)
// =====================================================================
(function initTransportQuote(){
  if (!form) return;

  // --- CONFIG (modificabile)
  const ORIGIN_ADDRESS = "Novara, Italia";   // <-- metti qui il tuo punto di partenza (sede)
  const DIESEL_EUR_L = 1.725;                // “via di mezzo” tra 1,65 e 1,80
  const CONSUMPTION_L_PER_100KM = 11.5;      // Jeep Cherokee KJ 2.8 CRD (stima prudente)
  const TRANSPORT_MARGIN_PCT = 0.30;         // +30% sul costo carburante (profitto + imprevisti)
  const TRANSPORT_MIN_EUR = 8;               // minimo per non andare mai sotto
  const FREE_DELIVERY_MAX_KM_ONEWAY = 15;    // regola sito (entro 15km)
  const FREE_DELIVERY_MIN_ORDER_EUR = 30;    // regola sito (>= 30€)

  // prezzi indicativi “medi” (per stima totale ordine)
  const PRICE_MID_EUR_KG = {
    "Mais": 2.00,
    "Orzo": 1.90,
    "Avena": 1.90,
    "Frumento": 1.95,
    "Grana verde": 2.05,
    "Mix personalizzato": 2.20
  };

  // --- elementi UI (già aggiunti in HTML)
  const quoteBox = form.querySelector("[data-quote-box]");
  const elKm = form.querySelector("[data-q-km]");
  const elFuel = form.querySelector("[data-q-fuel]");
  const elTransport = form.querySelector("[data-q-transport]");
  const elTotal = form.querySelector("[data-q-total]");
  const elAlert = form.querySelector("[data-q-alert]");

  const hidKmRT = form.querySelector("#calc_km_roundtrip");
  const hidFuel = form.querySelector("#calc_fuel_cost");
  const hidTransport = form.querySelector("#calc_transport_cost");
  const hidTotal = form.querySelector("#calc_total_estimate");

  const inputComune = form.querySelector("#comune");
  const inputQuantita = form.querySelector("#quantita");
  const inputProdotto = form.querySelector("#cereale");
  const textareaNote = form.querySelector("#note");

  if (!quoteBox || !inputComune) return;

  // cache ultima stima (usata per append nelle note)
  let lastQuote = null;

  function fmtEur(n){
    if (typeof n !== "number" || !isFinite(n)) return "—";
    return n.toFixed(2).replace(".", ",") + " €";
  }
  function fmtKm(n){
    if (typeof n !== "number" || !isFinite(n)) return "—";
    return (Math.round(n * 10) / 10).toString().replace(".", ",") + " km";
  }
  function parseKg(str){
    // estrae primo numero (accetta "100", "100kg", "100 kg", "100,5 kg")
    const m = (str || "").replace(",", ".").match(/(\d+(?:\.\d+)?)/);
    if (!m) return null;
    const v = parseFloat(m[1]);
    return isFinite(v) ? v : null;
  }

  function computeQuote(oneWayKm){
    const kmRT = oneWayKm * 2;
    const liters = (kmRT * CONSUMPTION_L_PER_100KM) / 100;
    const fuelCost = liters * DIESEL_EUR_L;

    // costo trasporto con margine + minimo
    let transportCost = fuelCost * (1 + TRANSPORT_MARGIN_PCT);
    if (transportCost < TRANSPORT_MIN_EUR) transportCost = TRANSPORT_MIN_EUR;

    // stima ordine (se posso)
    const prodotto = (inputProdotto?.value || "").trim();
    const kg = parseKg(inputQuantita?.value || "");
    let goodsCost = null;
    if (kg && PRICE_MID_EUR_KG[prodotto]) goodsCost = kg * PRICE_MID_EUR_KG[prodotto];

    // regola: consegna gratuita entro 15km e ordine >= 30€
    let transportApplied = transportCost;
    let freeApplied = false;
    if (oneWayKm <= FREE_DELIVERY_MAX_KM_ONEWAY && goodsCost !== null && goodsCost >= FREE_DELIVERY_MIN_ORDER_EUR){
      transportApplied = 0;
      freeApplied = true;
    }

    const total = (goodsCost !== null) ? (goodsCost + transportApplied) : null;

    return {
      oneWayKm,
      kmRT,
      liters,
      fuelCost,
      transportCost,
      transportApplied,
      freeApplied,
      goodsCost,
      total
    };
  }

  function renderQuote(q){
    if (!q) {
      quoteBox.style.display = "none";
      return;
    }

    quoteBox.style.display = "block";
    elKm && (elKm.textContent = fmtKm(q.kmRT));
    elFuel && (elFuel.textContent = fmtEur(q.fuelCost));
    elTransport && (elTransport.textContent = q.transportApplied === 0 ? "0,00 €" : fmtEur(q.transportApplied));
    elTotal && (elTotal.textContent = q.total !== null ? fmtEur(q.total) : "—");

    // hidden fields (per WhatsApp/Sheets)
    hidKmRT && (hidKmRT.value = q.kmRT.toFixed(2));
    hidFuel && (hidFuel.value = q.fuelCost.toFixed(2));
    hidTransport && (hidTransport.value = q.transportApplied.toFixed(2));
    hidTotal && (hidTotal.value = q.total !== null ? q.total.toFixed(2) : "");

    // alert/info
    if (elAlert) {
      elAlert.style.display = "none";
      elAlert.textContent = "";
      if (q.total === null) {
        elAlert.style.display = "block";
        elAlert.textContent = "Per vedere il totale stimato inserisci anche una quantità (es. 100 kg).";
      } else if (q.freeApplied) {
        elAlert.style.display = "block";
        elAlert.textContent = "Consegna stimata: gratuita (entro 15 km e ordine ≥ 30€).";
      }
    }
  }

  async function fetchDistanceKmOneWay(destinationAddress){
    // Richiede Apps Script: action=distance&from=...&to=...
    const url = LEAD_API
      + "?action=distance"
      + "&from=" + encodeURIComponent(ORIGIN_ADDRESS)
      + "&to=" + encodeURIComponent(destinationAddress);

    const data = await jsonp(url, 12000);
    // atteso: { ok:true, km:12.3 }
    if (!data || data.ok !== true || typeof data.km !== "number") {
      throw new Error("Risposta distance non valida");
    }
    return data.km;
  }

  // debounce
  let timer = null;
  function scheduleUpdate(){
    clearTimeout(timer);
    timer = setTimeout(updateQuote, 500);
  }

  async function updateQuote(){
    const addr = (inputComune.value || "").trim();
    if (!addr || addr.length < 4) {
      lastQuote = null;
      renderQuote(null);
      return;
    }

    try{
      const kmOneWay = await fetchDistanceKmOneWay(addr);
      lastQuote = computeQuote(kmOneWay);
      renderQuote(lastQuote);
    }catch(err){
      // se non hai ancora implementato action=distance, non rompe nulla
      lastQuote = null;
      renderQuote(null);
      console.warn("Stima distanza non disponibile:", err.message);
    }
  }

  // Aggiorna su input
  inputComune.addEventListener("input", scheduleUpdate);
  inputQuantita?.addEventListener("input", scheduleUpdate);
  inputProdotto?.addEventListener("change", scheduleUpdate);

  // ✅ AGGIUNTA: prima del tuo submit, inserisco la stima nelle NOTE (senza toccare il tuo handler)
  form.addEventListener("submit", ()=>{
    if (!lastQuote || !textareaNote) return;

    const stamp = `\n\n🚚 Stima trasporto (automatica)\n- Km A/R: ${fmtKm(lastQuote.kmRT)}\n- Carburante stimato: ${fmtEur(lastQuote.fuelCost)}\n- Trasporto: ${lastQuote.transportApplied === 0 ? "0,00 € (gratuito)" : fmtEur(lastQuote.transportApplied)}${lastQuote.total !== null ? `\n- Totale stimato: ${fmtEur(lastQuote.total)}` : ""}`;

    const cur = textareaNote.value || "";
    // evita duplicati
    if (cur.includes("🚚 Stima trasporto (automatica)")) return;

    textareaNote.value = (cur.trim() ? cur : "").trim() + stamp;
  }, true);

  // init
  updateQuote();
})();
