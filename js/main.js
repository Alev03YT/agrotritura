const hamb = document.querySelector('[data-hamb]');
const panel = document.querySelector('[data-mobile-panel]');

if (hamb && panel) {
  hamb.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('show');
    hamb.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

// === CAMPI DINAMICI PER PRODOTTO + CONSEGNA ===
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

// === WHATSAPP (TESTO PULITO, SENZA EMOJI) ===
const form = document.querySelector('#preventivoForm');

function safeValue(selector) {
  const el = form?.querySelector(selector);
  return (el?.value || "").trim();
}

function dettagliSpecificiPer(prodotto) {
  // valori dai campi dinamici
  const gran = safeValue('[name="extra_granulometria"]');
  const anim = safeValue('[name="extra_animali"]');
  const fmt = safeValue('[name="extra_formato_grana"]');
  const granaGran = safeValue('[name="extra_granulometria_grana"]');
  const mix = safeValue('[name="extra_mix"]');
  const altro = safeValue('[name="extra_altro"]');

  if (["Mais", "Orzo", "Avena"].includes(prodotto)) {
    return `Granulometria: ${gran || "-"}`;
  }
  if (prodotto === "Frumento") {
    return `Animali: ${anim || "-"}`;
  }
  if (prodotto === "Grana verde") {
    let s = `Formato: ${fmt || "-"}`;
    if (fmt === "Tritato") s += `\nGranulometria: ${granaGran || "-"}`;
    return s;
  }
  if (prodotto === "Mix personalizzato") {
    return `Composizione mix: ${mix || "-"}`;
  }
  if (prodotto === "Altro / da definire") {
    return `Richiesta: ${altro || "-"}`;
  }
  return "-";
}

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome = safeValue('[name="nome"]');
    const prodotto = safeValue('[name="cereale"]');
    const qty = safeValue('[name="quantita"]');
    const comune = safeValue('[name="comune"]');
    const telefono = safeValue('[name="telefono"]');
    const note = safeValue('[name="note"]');
    const consegna = safeValue('[name="tipo_consegna"]');

    const dettagliSpecifici = dettagliSpecificiPer(prodotto);

    const msg =
`Ciao AgroTritura,
sono ${nome || "un cliente"} e vorrei ricevere un preventivo per mangime su misura.

DETTAGLI ORDINE
Prodotto: ${prodotto || "-"}
Quantità: ${qty || "-"}
Comune: ${comune || "-"}
Consegna: ${consegna || "-"}`
+ (telefono ? `\nTelefono: ${telefono}` : "") +

`\n\nDETTAGLI SPECIFICI
${dettagliSpecifici}

NOTE
${note || "-"}

Grazie, attendo gentile riscontro.`;

    const url = "https://wa.me/393341067510?text=" + encodeURIComponent(msg);
    window.open(url, "_blank");
  });
}