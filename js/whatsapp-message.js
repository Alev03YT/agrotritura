// AgroTritura — messaggio WhatsApp, homepage e richiesta con quantità oppure budget
(function () {
  const formatMoney = value => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "Da definire";
    return new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value)) + " €";
  };

  const valueOf = selector => document.querySelector(selector)?.value?.trim() || "";
  const numberOf = selector => Number.parseFloat(valueOf(selector).replace(",", ".")) || 0;

  window.testoPreventivo = function (dati) {
    const nome = valueOf("#nome") || "Non indicato";
    const telefono = valueOf("#telefono") || "Non indicato";
    const indirizzo = valueOf("#comune") || "Non indicato";
    const note = valueOf("#note") || "Nessuna";
    const quantitaRaw = valueOf("#quantita");
    const budgetRaw = valueOf("#budget");
    const budgetTipo = valueOf("#budgetTipo");
    const priorita = valueOf("#prioritaBudget");
    const distanceInput = document.querySelector("#distanza");
    const kmMode = distanceInput?.dataset.autoCalculated === "true" ? "automatico" : "manuale";

    const consegna = dati.modalita === "ritiro"
      ? "Ritiro presso AgroTritura"
      : dati.modalita === "sul-posto"
        ? "Tritatura presso l’azienda del cliente"
        : "A domicilio";

    const kmText = dati.km ? String(dati.km).replace(".", ",") : "Non indicati";
    const trasportoText = dati.trasporto?.costo === null || dati.trasporto?.costo === undefined
      ? "Da definire"
      : formatMoney(dati.trasporto.costo);

    const righe = [
      "📄 DATI PER PREVENTIVO — AgroTritura",
      "",
      "👤 Cliente",
      `- Nome: ${nome}`,
      `- Telefono: ${telefono}`,
      `- Comune/Indirizzo: ${indirizzo}`,
      "",
      "📦 Richiesta",
      `- Prodotto: ${dati.prodotto || "Da definire"}`,
      `- Quantità desiderata: ${quantitaRaw ? quantitaRaw + " kg" : "Da calcolare in base al budget"}`,
      `- Modalità: ${consegna}`
    ];

    if (budgetRaw) {
      righe.push(
        "",
        "💶 Budget disponibile",
        `- Budget massimo: ${budgetRaw.replace(".", ",")} €`,
        `- Il budget comprende: ${budgetTipo === "prodotti" ? "solo i prodotti, trasporto escluso" : "prodotti e consegna"}`,
        `- Priorità: ${priorita || "Non indicata"}`
      );
    }

    righe.push(
      "",
      "🚚 Trasporto / Distanza",
      `- KM sola andata (${kmMode}): ${kmText}`,
      `- Trasporto stimato A/R: ${trasportoText}`,
      "",
      "📝 Note",
      note,
      "",
      "🔁 Fonte: https://agrotritura.it/"
    );

    return righe.join("\n");
  };

  function showFormError(message) {
    const box = document.querySelector("#atFormError");
    if (!box) return;
    box.textContent = message;
    box.hidden = false;
    box.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => { box.hidden = true; }, 4500);
  }

  function validateQuote() {
    const required = [
      ["#nome", "Inserisci il nome."],
      ["#telefono", "Inserisci il numero di telefono."],
      ["#cereale", "Seleziona il prodotto o il mix."],
      ["#modalita", "Seleziona la modalità."],
      ["#comune", "Inserisci l’indirizzo oppure usa la posizione attuale."]
    ];
    for (const [selector, message] of required) {
      if (!valueOf(selector)) return message;
    }

    const quantity = numberOf("#quantita");
    const budget = numberOf("#budget");
    if (!quantity && !budget) return "Inserisci almeno la quantità desiderata oppure il budget massimo.";
    if (budget && !valueOf("#budgetTipo")) return "Indica se il budget comprende anche la consegna.";
    if (budget && !valueOf("#prioritaBudget")) return "Seleziona la priorità della proposta.";
    return "";
  }

  function setupQuoteFlow() {
    const form = document.querySelector("#preventivoForm");
    const quantity = document.querySelector("#quantita");
    const budget = document.querySelector("#budget");
    const budgetType = document.querySelector("#budgetTipo");
    const priority = document.querySelector("#prioritaBudget");
    if (!form || !quantity || !budget || !budgetType || !priority) return;

    quantity.required = false;
    quantity.placeholder = "Es. 100 oppure indica il budget sotto";
    const quantityLabel = quantity.closest("label");
    if (quantityLabel?.firstChild?.nodeType === Node.TEXT_NODE) {
      quantityLabel.firstChild.textContent = "Quantità desiderata in kg ";
    }

    ["#nome", "#telefono", "#cereale", "#modalita", "#comune"].forEach(selector => {
      const field = document.querySelector(selector);
      if (field) field.required = true;
    });

    const budgetBox = document.querySelector(".at-budget-box");
    const budgetCopy = budgetBox?.querySelector(".at-budget-copy");
    const typeLabel = budgetType.closest("label");
    const priorityLabel = priority.closest("label");

    if (budgetCopy) {
      budgetCopy.textContent = "Compila la quantità desiderata oppure il budget. Non è necessario indicare entrambi.";
    }

    const error = document.createElement("p");
    error.id = "atFormError";
    error.className = "at-form-error";
    error.hidden = true;
    budgetBox?.appendChild(error);

    const style = document.createElement("style");
    style.textContent = `
      .at-form-error{margin:12px 0 0;padding:10px 12px;border-radius:11px;background:#fff0ee;color:#a3382f;font-weight:750}
      .at-budget-box label[hidden]{display:none!important}
    `;
    document.head.appendChild(style);

    function syncBudgetFields() {
      const active = numberOf("#budget") > 0;
      if (typeLabel) typeLabel.hidden = !active;
      if (priorityLabel) priorityLabel.hidden = !active;
      budgetType.required = active;
      priority.required = active;
      if (!active) {
        budgetType.value = "";
        priority.value = "";
      }
    }

    budgetType.innerHTML = `
      <option value="">Seleziona</option>
      <option value="totale">Prodotti e consegna</option>
      <option value="prodotti">Solo prodotti, trasporto escluso</option>`;
    priority.innerHTML = `
      <option value="">Seleziona</option>
      <option value="Più kg possibile">Più kg possibile</option>
      <option value="Il mix migliore">Il mix migliore</option>
      <option value="Scorta per circa un mese">Scorta per circa un mese</option>
      <option value="Decidilo tu">Decidilo tu</option>`;

    budget.addEventListener("input", syncBudgetFields);
    syncBudgetFields();

    form.addEventListener("submit", event => {
      const message = validateQuote();
      if (!message) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      showFormError(message);
    }, true);

    document.querySelector("#btnCopiaPreventivo")?.addEventListener("click", event => {
      const message = validateQuote();
      if (!message) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      showFormError(message);
    }, true);
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.querySelector('link[href="css/home-enhancements.css"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "css/home-enhancements.css";
      document.head.appendChild(link);
    }

    document.querySelectorAll("main > .section").forEach(section => section.classList.add("at-section-tight"));

    const hero = document.querySelector(".hero");
    if (hero && !document.querySelector(".at-trust-strip")) {
      const strip = document.createElement("section");
      strip.className = "at-trust-strip";
      strip.innerHTML = `<div class="container at-trust-grid"><div class="at-trust-item"><span>✓</span> Preventivo gratuito e senza impegno</div><div class="at-trust-item"><span>✓</span> Preparazione dopo la conferma</div><div class="at-trust-item"><span>✓</span> Prezzi e trasporto definiti prima</div></div>`;
      hero.insertAdjacentElement("afterend", strip);
    }

    const servizi = document.querySelector("#servizi");
    if (servizi && !document.querySelector(".at-process")) {
      const process = document.createElement("section");
      process.className = "at-process";
      process.innerHTML = `<div class="container"><div class="section-head"><span class="eyebrow">Come funziona</span><h2>Dalla richiesta alla consegna in quattro passaggi</h2><p>Un percorso semplice e chiaro, pensato per evitare dubbi su prodotto, quantità e costi.</p></div><div class="at-process-grid"><article class="at-process-card"><div class="at-process-num">1</div><h3>Invii la richiesta</h3><p>Scegli prodotto, quantità o budget e indirizzo.</p></article><article class="at-process-card"><div class="at-process-num">2</div><h3>Confermiamo il preventivo</h3><p>Verifichiamo disponibilità, distanza, trasporto e composizione del mix.</p></article><article class="at-process-card"><div class="at-process-num">3</div><h3>Prepariamo il prodotto</h3><p>Il cereale viene tritato o miscelato secondo quanto concordato.</p></article><article class="at-process-card"><div class="at-process-num">4</div><h3>Ritiro o consegna</h3><p>Consegniamo all’indirizzo indicato oppure prepariamo tutto per il ritiro.</p></article></div></div>`;
      servizi.insertAdjacentElement("afterend", process);
    }

    document.querySelectorAll("#prodotti article").forEach(card => {
      if (card.querySelector(".at-product-cta")) return;
      const cta = document.createElement("a");
      cta.className = "at-product-cta";
      cta.href = "#preventivo";
      cta.textContent = "Richiedi preventivo";
      card.appendChild(cta);
    });

    const form = document.querySelector("#preventivo form, form#preventivoForm, #preventivo .form");
    if (form && !document.querySelector("#budget")) {
      const box = document.createElement("div");
      box.className = "at-budget-box";
      box.innerHTML = `<div class="at-budget-title">💶 Hai un budget massimo?</div><p class="at-budget-copy">Compila la quantità desiderata oppure il budget. Non è necessario indicare entrambi.</p><div class="at-budget-grid"><label>Budget massimo (€)<input id="budget" name="budget" type="number" min="1" step="1" inputmode="decimal" placeholder="Es. 120"></label><label hidden>Il budget comprende<select id="budgetTipo" name="budgetTipo"><option value="">Seleziona</option></select></label><label hidden>Priorità della proposta<select id="prioritaBudget" name="prioritaBudget"><option value="">Seleziona</option></select></label></div>`;
      const actions = form.querySelector(".actions, .form-actions, button[type='submit']")?.closest(".actions, .form-actions") || form.querySelector("button[type='submit']");
      if (actions) actions.insertAdjacentElement("beforebegin", box);
      else form.appendChild(box);
    }

    const footer = document.querySelector("footer");
    if (footer && !document.querySelector(".at-footer-panel")) {
      const panel = document.createElement("section");
      panel.className = "at-footer-panel";
      panel.innerHTML = `<div class="container at-footer-grid"><div><h3>AgroTritura</h3><p>Mangime fresco tritato su misura, mix personalizzati e consegna organizzata in provincia di Novara e zone limitrofe.</p><div class="at-footer-actions"><a href="https://wa.me/393341067510" target="_blank" rel="noopener">💬 WhatsApp</a><a class="secondary" href="tel:+393341067510">📞 Chiama</a></div></div><div><h4>Collegamenti rapidi</h4><div class="at-footer-links"><a href="#prodotti">Prodotti</a><a href="#configuratore">Trova il mix</a><a href="#prezzi">Prezzi</a><a href="#preventivo">Preventivo</a></div></div><div><h4>Servizio</h4><div class="at-footer-links"><a href="ordine.html">Traccia ordine</a><a href="#consegna">Consegna e ritiro</a><a href="#preventivo">Calcola la distanza</a></div></div></div>`;
      footer.insertAdjacentElement("beforebegin", panel);
    }

    setupQuoteFlow();
  });
})();