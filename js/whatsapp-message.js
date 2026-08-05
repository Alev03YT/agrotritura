// Formato professionale del messaggio preventivo WhatsApp
(function () {
  const formatMoney = value => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "Da definire";
    return new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value)) + " €";
  };

  window.testoPreventivo = function (dati) {
    const nome = document.querySelector("#nome")?.value.trim() || "Non indicato";
    const telefono = document.querySelector("#telefono")?.value.trim() || "Non indicato";
    const indirizzo = document.querySelector("#comune")?.value.trim() || "Non indicato";
    const note = document.querySelector("#note")?.value.trim() || "Nessuna";
    const quantitaRaw = document.querySelector("#quantita")?.value.trim() || "Da definire";
    const budgetRaw = document.querySelector("#budget")?.value.trim() || "";
    const budgetTipo = document.querySelector("#budgetTipo")?.value || "totale";
    const priorita = document.querySelector("#prioritaBudget")?.value || "Non indicata";
    const distanceInput = document.querySelector("#distanza");
    const kmMode = distanceInput?.dataset.autoCalculated === "true" ? "automatico" : "manuale";

    const consegna = dati.modalita === "ritiro"
      ? "Ritiro presso AgroTritura"
      : dati.modalita === "sul-posto"
        ? "Tritatura presso l’azienda del cliente"
        : "A domicilio";

    const dettagli = dati.prodotto === "Mix personalizzato"
      ? `Composizione/quantità indicate: ${quantitaRaw} | Consegna: ${consegna}`
      : `Quantità richiesta: ${quantitaRaw}${/^\d+(?:[.,]\d+)?$/.test(quantitaRaw) ? " kg" : ""} | Consegna: ${consegna}`;

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
      `- Quantità: ${quantitaRaw}${/^\d+(?:[.,]\d+)?$/.test(quantitaRaw) ? " kg" : ""}`,
      `- Dettagli: ${dettagli}`
    ];

    if (budgetRaw) {
      righe.push(
        "",
        "💶 Budget disponibile",
        `- Budget massimo: ${budgetRaw.replace(".", ",")} €`,
        `- Il budget comprende: ${budgetTipo === "prodotti" ? "solo i prodotti, trasporto escluso" : "prodotti e consegna"}`,
        `- Priorità: ${priorita}`
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
})();

// Migliorie progressive della homepage senza alterare la struttura principale.
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
    strip.innerHTML = `
      <div class="container at-trust-grid">
        <div class="at-trust-item"><span>✓</span> Preventivo gratuito e senza impegno</div>
        <div class="at-trust-item"><span>✓</span> Preparazione dopo la conferma</div>
        <div class="at-trust-item"><span>✓</span> Prezzi e trasporto definiti prima</div>
      </div>`;
    hero.insertAdjacentElement("afterend", strip);
  }

  const servizi = document.querySelector("#servizi");
  if (servizi && !document.querySelector(".at-process")) {
    const process = document.createElement("section");
    process.className = "at-process";
    process.innerHTML = `
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Come funziona</span>
          <h2>Dalla richiesta alla consegna in quattro passaggi</h2>
          <p>Un percorso semplice e chiaro, pensato per evitare dubbi su prodotto, quantità e costi.</p>
        </div>
        <div class="at-process-grid">
          <article class="at-process-card"><div class="at-process-num">1</div><h3>Invii la richiesta</h3><p>Scegli prodotto, quantità, indirizzo e, se vuoi, il budget disponibile.</p></article>
          <article class="at-process-card"><div class="at-process-num">2</div><h3>Confermiamo il preventivo</h3><p>Verifichiamo disponibilità, distanza, trasporto e composizione del mix.</p></article>
          <article class="at-process-card"><div class="at-process-num">3</div><h3>Prepariamo il prodotto</h3><p>Il cereale viene tritato o miscelato secondo quanto concordato.</p></article>
          <article class="at-process-card"><div class="at-process-num">4</div><h3>Ritiro o consegna</h3><p>Consegniamo all’indirizzo indicato oppure prepariamo tutto per il ritiro.</p></article>
        </div>
      </div>`;
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
    box.innerHTML = `
      <div class="at-budget-title">💶 Hai un budget massimo?</div>
      <p class="at-budget-copy">Campo facoltativo. Indicalo e prepareremo la proposta migliore senza superare la cifra disponibile.</p>
      <div class="at-budget-grid">
        <label>Budget massimo (€)
          <input id="budget" name="budget" type="number" min="1" step="1" inputmode="decimal" placeholder="Es. 120">
        </label>
        <label>Il budget comprende
          <select id="budgetTipo" name="budgetTipo">
            <option value="totale">Prodotti e consegna</option>
            <option value="prodotti">Solo prodotti, trasporto escluso</option>
          </select>
        </label>
        <label>Priorità della proposta
          <select id="prioritaBudget" name="prioritaBudget">
            <option value="Miglior equilibrio tra quantità e composizione">Miglior equilibrio</option>
            <option value="Massima quantità possibile">Massima quantità</option>
            <option value="Mix qualitativamente migliore">Mix migliore</option>
            <option value="Scorta sufficiente per circa un mese">Scorta per un mese</option>
          </select>
        </label>
      </div>`;
    const actions = form.querySelector(".actions, .form-actions, button[type='submit']")?.closest(".actions, .form-actions") || form.querySelector("button[type='submit']");
    if (actions) actions.insertAdjacentElement("beforebegin", box);
    else form.appendChild(box);
  }

  const footer = document.querySelector("footer");
  if (footer && !document.querySelector(".at-footer-panel")) {
    const panel = document.createElement("section");
    panel.className = "at-footer-panel";
    panel.innerHTML = `
      <div class="container at-footer-grid">
        <div>
          <h3>AgroTritura</h3>
          <p>Mangime fresco tritato su misura, mix personalizzati e consegna organizzata in provincia di Novara e zone limitrofe.</p>
          <div class="at-footer-actions">
            <a href="https://wa.me/393341067510" target="_blank" rel="noopener">💬 WhatsApp</a>
            <a class="secondary" href="tel:+393341067510">📞 Chiama</a>
          </div>
        </div>
        <div>
          <h4>Collegamenti rapidi</h4>
          <div class="at-footer-links">
            <a href="#prodotti">Prodotti</a><a href="#configuratore">Trova il mix</a><a href="#prezzi">Prezzi</a><a href="#preventivo">Preventivo</a>
          </div>
        </div>
        <div>
          <h4>Servizio</h4>
          <div class="at-footer-links">
            <a href="ordine.html">Traccia ordine</a><a href="#consegna">Consegna e ritiro</a><a href="#preventivo">Calcola la distanza</a>
          </div>
        </div>
      </div>`;
    footer.insertAdjacentElement("beforebegin", panel);
  }
});