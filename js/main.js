// ============================
// MENU MOBILE
// ============================
const hamb = document.querySelector('[data-hamb]');
const panel = document.querySelector('[data-mobile-panel]');

if (hamb && panel) {
  hamb.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('show');
    hamb.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

// ============================
// CONFIG: URL APPS SCRIPT (LEADS + ORDINI)
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

  // --- Campo specifico prodotto ---
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

  // --- Campo CONSEGNA (per tutti) ---
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
// JSONP helper (per GitHub Pages / CORS)
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
      if(s && s.parentNode) s.parentNode.removeChild(s);
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
