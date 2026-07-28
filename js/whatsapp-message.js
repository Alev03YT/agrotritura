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

    return [
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
      `- Dettagli: ${dettagli}`,
      "",
      "🚚 Trasporto / Distanza",
      `- KM sola andata (${kmMode}): ${kmText}`,
      `- Trasporto stimato A/R: ${trasportoText}`,
      "",
      "📝 Note",
      note,
      "",
      "🔁 Fonte: https://agrotritura.it/"
    ].join("\n");
  };
})();