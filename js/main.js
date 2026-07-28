// AgroTritura — gestione sito, preventivo e trasporto

// ============================
// CONFIGURAZIONE
// ============================
const LEAD_API = "https://script.google.com/macros/s/AKfycbx8ppBJ73ZyoAFLPxHugetMUv6VwS1i4s1jeRtrSWNRKL_UAxZxqTbWjgcHHD4KJmKL/exec";

const PREZZI = {
  "Mais": { piccolo: 0.69, grande: 0.63 },
  "Orzo": { piccolo: 0.69, grande: 0.63 },
  "Frumento": { piccolo: 0.71, grande: 0.65 },
  "Grana verde": { piccolo: 0.72, grande: 0.66 },
  "Mix personalizzato": { piccolo: 0.75, grande: 0.69 }
};

const SOGLIA_QUANTITA = 100;
const SOGLIA_GRATIS_EUR = 75;
const KM_GRATIS = 15;

// Dati usati soltanto per mostrare il consumo indicativo del viaggio.
const DIESEL_EUR_L = 2.05;
const CONSUMO_L_100KM = 15;

function euro(n) {
  return Number(n).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2
  });
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function parseKg(value) {
  const match = String(value || "").replace(",", ".").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function prezzoUnitario(prodotto, kg) {
  const p = PREZZI[prodotto];
  if (!p || !Number.isFinite(kg) || kg <= 0) return null;
  return kg >= SOGLIA_QUANTITA ? p.grande : p.piccolo;
}

function totaleMerce(prodotto, kg) {
  const prezzo = prezzoUnitario(prodotto, kg);
  return prezzo == null ? null : round2(prezzo * kg);
}

// Tariffe calcolate sulla distanza di sola andata.
function calcolaTrasporto(kmSoloAndata, totaleOrdine, tipoConsegna) {
  const km = Number(kmSoloAndata);
  if (!Number.isFinite(km) || km <= 0) return null;

  if (tipoConsegna === "Ritiro gratuito a Revislate") {
    return { costo: 0, personalizzato: false, etichetta: "GRATIS" };
  }

  if (tipoConsegna === "Lavorazione presso la tua azienda") {
    return {
      costo: null,
      personalizzato: true,
      etichetta: "Preventivo personalizzato"
    };
  }

  if (km > 100) {
    return {
      costo: null,
      personalizzato: true,
      etichetta: "Preventivo personalizzato"
    };
  }

  let costo;
  if (km <= 15) {
    costo = Number.isFinite(totaleOrdine) && totaleOrdine >= SOGLIA_GRATIS_EUR ? 0 : 8;
  } else if (km <= 30) {
    costo = 15;
  } else if (km <= 50) {
    costo = 25;
  } else if (km <= 75) {
    costo = 40;
  } else {
    costo = 60;
  }

  return {
    costo,
    personalizzato: false,
    etichetta: costo === 0 ? "GRATIS" : euro(costo)
  };
}

// ============================
// AGGIORNAMENTO CONTENUTI DEL SITO
// ============================
function aggiornaContenutiCommerciali() {
  const titoloPrezzi = document.querySelector("#prezzi .h2");
  if (titoloPrezzi) titoloPrezzi.textContent = "🌾 Prezzi competitivi e sconti per quantità";

  const leadPrezzi = document.querySelector("#prezzi .lead");
  if (leadPrezzi) {
    leadPrezzi.textContent = "Cereali tritati freschi su ordinazione, con granulometria personalizzata. Prezzi leggermente superiori al prodotto intero da negozio per includere la lavorazione.";
  }

  const righe = document.querySelectorAll("#prezzi tbody tr");
  const dati = [
    ["Mais tritato", "0,69 €/kg", "0,63 €/kg"],
    ["Orzo tritato", "0,69 €/kg", "0,63 €/kg"],
    ["Frumento tritato", "0,71 €/kg", "0,65 €/kg"],
    ["Grana verde tritata", "0,72 €/kg", "0,66 €/kg"],
    ["Mix personalizzato", "da 0,75 €/kg", "da 0,69 €/kg"]
  ];

  righe.forEach((riga, i) => {
    if (!dati[i]) return;
    const celle = riga.querySelectorAll("td");
    if (celle.length < 3) return;
    celle[0].innerHTML = `<strong>${dati[i][0]}</strong>`;
    celle[1].innerHTML = `<strong style="color:var(--green-700);">${dati[i][1]}</strong>`;
    celle[2].innerHTML = `<strong style="color:var(--green-700);">${dati[i][2]}</strong>`;
  });

  const tabella = document.querySelector("#prezzi table");
  if (tabella) tabella.setAttribute("aria-label", "Tabella prezzi AgroTritura");

  const notePrezzi = document.querySelector("#prezzi .note");
  if (notePrezzi) {
    notePrezzi.textContent = "✔ Tritatura inclusa • ✔ Granulometria a scelta • ✔ Sconto da 100 kg • ✔ Ritiro gratuito disponibile";
  }

  const deliveryCard = document.querySelector("#consegna .grid article:nth-child(1) .pad");
  if (deliveryCard) {
    deliveryCard.innerHTML = `
      <h3>Consegna a tariffa chiara</h3>
      <p>
        <strong>0-15 km:</strong> 8 € <span class="small">(gratis con almeno 75 € di prodotti)</span><br>
        <strong>15-30 km:</strong> 15 €<br>
        <strong>30-50 km:</strong> 25 €<br>
        <strong>50-75 km:</strong> 40 €<br>
        <strong>75-100 km:</strong> 60 €<br>
        <strong>Oltre 100 km:</strong> preventivo personalizzato.
      </p>`;
  }

  const areaCard = document.querySelector("#consegna .grid article:nth-child(2) .pad");
  if (areaCard) {
    areaCard.innerHTML = `
      <h3>Ritiro o consegna</h3>
      <p><strong>Ritiro presso AgroTritura a Revislate:</strong> gratuito.<br><span class="small">Per le tratte lunghe valutiamo ordine, distanza e possibilità di raggruppare più consegne nella stessa zona.</span></p>`;
  }
}

// ============================
// MENU MOBILE
// ============================
const hamb = document.querySelector("[data-hamb]");
const panel = document.querySelector("[data-mobile-panel]");

if (hamb && panel) {
  hamb.addEventListener("click", () => {
    const open = panel.classList.toggle("show");
    hamb.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("menu-open", open);
  });

  panel.addEventListener("click", (event) => {
    if (!event.target.closest("a")) return;
    panel.classList.remove("show");
    hamb.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  });
}

// ============================
// JSONP E DISTANZA AUTOMATICA
// ============================
function jsonp(url, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const callback = `__agro_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Tempo scaduto"));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      try { delete window[callback]; } catch (_) { window[callback] = undefined; }
      script.remove();
    }

    window[callback] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Errore di collegamento"));
    };

    script.src = `${url}${url.includes("?") ? "&" : "?"}callback=${encodeURIComponent(callback)}&t=${Date.now()}`;
    document.body.appendChild(script);
  });
}

async function fetchDistanceKmOneWay(address) {
  const url = `${LEAD_API}?action=distance&to=${encodeURIComponent(address)}`;
  const data = await jsonp(url);
  if (!data || data.ok !== true || typeof data.km !== "number") {
    throw new Error(data?.error || "Distanza non disponibile");
  }
  return data.km;
}

// ============================
// FORM PREVENTIVO
// ============================
const form = document.querySelector("#preventivoForm");
const selectProdotto = document.querySelector("#cereale");
const campoExtra = document.querySelector("#campoExtraDinamico");
const quantitaInput = document.querySelector("#quantita");
const comuneInput = document.querySelector("#comune");
const kmInput = document.querySelector('[name="distanza_km"]');
const wrapDistanza = document.querySelector("#wrapDistanza");
const quoteBox = document.querySelector("[data-quote-box]");

function renderSelect(label, name, options) {
  return `<div style="margin-top:10px"><label>${label}</label><select name="${name}"><option value="">Seleziona…</option>${options.map(o => `<option value="${o}">${o}</option>`).join("")}</select></div>`;
}

function renderInput(label, name, placeholder) {
  return `<div style="margin-top:10px"><label>${label}</label><input name="${name}" placeholder="${placeholder}"></div>`;
}

function creaCampiExtra(prodotto) {
  if (!campoExtra) return;
  campoExtra.innerHTML = "";

  if (["Mais", "Orzo", "Frumento"].includes(prodotto)) {
    campoExtra.innerHTML += renderSelect("Granulometria desiderata", "extra_granulometria", ["Grossa", "Media", "Fine"]);
  } else if (prodotto === "Grana verde") {
    campoExtra.innerHTML += renderSelect("Formato", "extra_formato_grana", ["Intera", "Tritata grossa", "Tritata media", "Tritata fine"]);
  } else if (prodotto === "Mix personalizzato") {
    campoExtra.innerHTML += renderInput("Composizione del mix", "extra_mix", "Es. mais + orzo + frumento");
  } else if (prodotto === "Altro / da definire") {
    campoExtra.innerHTML += renderInput("Prodotto richiesto", "extra_altro", "Descrivi cosa ti serve");
  }

  campoExtra.innerHTML += renderSelect("Modalità", "tipo_consegna", [
    "Ritiro gratuito a Revislate",
    "Consegna a domicilio",
    "Lavorazione presso la tua azienda"
  ]);

  campoExtra.querySelector('[name="tipo_consegna"]')?.addEventListener("change", () => {
    aggiornaVisibilitaDistanza();
    aggiornaPreventivo();
    programmaDistanzaAutomatica();
  });

  aggiornaVisibilitaDistanza();
  aggiornaPreventivo();
}

function tipoConsegna() {
  return form?.querySelector('[name="tipo_consegna"]')?.value || "";
}

function aggiornaVisibilitaDistanza() {
  if (!wrapDistanza) return;
  const tipo = tipoConsegna();
  wrapDistanza.style.display = tipo && tipo !== "Ritiro gratuito a Revislate" ? "" : "none";
}

function impostaTesto(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function impostaNascosto(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value == null ? "" : String(value);
}

function aggiornaPreventivo(kmForzati) {
  if (!form) return;

  const prodotto = selectProdotto?.value || "";
  const kg = parseKg(quantitaInput?.value);
  const merce = totaleMerce(prodotto, kg);
  const tipo = tipoConsegna();
  const km = Number.isFinite(Number(kmForzati)) ? Number(kmForzati) : Number(String(kmInput?.value || "").replace(",", "."));

  if (!tipo) {
    if (quoteBox) quoteBox.style.display = "none";
    return;
  }

  if (tipo === "Ritiro gratuito a Revislate") {
    if (quoteBox) quoteBox.style.display = "";
    impostaTesto("[data-q-km]", "Ritiro in sede");
    impostaTesto("[data-q-fuel]", "—");
    impostaTesto("[data-q-transport]", "GRATIS");
    impostaTesto("[data-q-total]", merce == null ? "Da calcolare" : euro(merce));
    impostaNascosto("calc_transport_cost", 0);
    impostaNascosto("calc_total_estimate", merce);
    form.dataset.distanzaKm = "";
    form.dataset.trasportoEur = "0";
    return;
  }

  if (!Number.isFinite(km) || km <= 0) {
    if (quoteBox) quoteBox.style.display = "none";
    return;
  }

  const kmAR = round2(km * 2);
  const litri = round2((kmAR / 100) * CONSUMO_L_100KM);
  const costoCarburante = round2(litri * DIESEL_EUR_L);
  const trasporto = calcolaTrasporto(km, merce, tipo);
  const totale = trasporto && !trasporto.personalizzato && merce != null
    ? round2(merce + trasporto.costo)
    : null;

  if (quoteBox) quoteBox.style.display = "";
  impostaTesto("[data-q-km]", `${km.toLocaleString("it-IT", { maximumFractionDigits: 1 })} km andata • ${kmAR.toLocaleString("it-IT", { maximumFractionDigits: 1 })} km A/R`);
  impostaTesto("[data-q-fuel]", `${litri.toLocaleString("it-IT")} L circa • ${euro(costoCarburante)}`);
  impostaTesto("[data-q-transport]", trasporto?.etichetta || "Da calcolare");
  impostaTesto("[data-q-total]", trasporto?.personalizzato ? "Da confermare" : (totale == null ? "Inserisci prodotto e kg" : euro(totale)));

  const alertBox = document.querySelector("[data-q-alert]");
  if (alertBox) {
    if (trasporto?.personalizzato) {
      alertBox.style.display = "";
      alertBox.textContent = km > 100
        ? "Per distanze oltre 100 km valutiamo un prezzo personalizzato in base alla quantità ordinata e all'organizzazione della consegna."
        : "La lavorazione presso il cliente viene valutata con un preventivo dedicato.";
    } else {
      alertBox.style.display = "none";
      alertBox.textContent = "";
    }
  }

  impostaNascosto("calc_km_roundtrip", kmAR);
  impostaNascosto("calc_fuel_cost", costoCarburante);
  impostaNascosto("calc_transport_cost", trasporto?.personalizzato ? "Personalizzato" : trasporto?.costo);
  impostaNascosto("calc_total_estimate", totale);

  form.dataset.distanzaKm = String(km);
  form.dataset.trasportoEur = trasporto?.personalizzato ? "personalizzato" : String(trasporto?.costo ?? "");
}

let distanceTimer;
function programmaDistanzaAutomatica() {
  clearTimeout(distanceTimer);
  distanceTimer = setTimeout(async () => {
    const address = comuneInput?.value.trim() || "";
    const tipo = tipoConsegna();
    if (!address || address.length < 4 || !tipo || tipo === "Ritiro gratuito a Revislate") return;

    try {
      const km = await fetchDistanceKmOneWay(address);
      if (kmInput) kmInput.value = String(round2(km)).replace(".", ",");
      aggiornaPreventivo(km);
    } catch (error) {
      console.warn("Calcolo automatico distanza non disponibile:", error.message);
    }
  }, 700);
}

function collectExtrasReadable() {
  if (!campoExtra) return "";
  return Array.from(campoExtra.querySelectorAll("select, input, textarea"))
    .map(el => {
      const value = String(el.value || "").trim();
      if (!value) return null;
      const label = el.closest("div")?.querySelector("label")?.textContent?.trim();
      return label ? `${label}: ${value}` : value;
    })
    .filter(Boolean)
    .join(" | ");
}

selectProdotto?.addEventListener("change", () => creaCampiExtra(selectProdotto.value));
quantitaInput?.addEventListener("input", () => aggiornaPreventivo());
kmInput?.addEventListener("input", () => aggiornaPreventivo());
comuneInput?.addEventListener("input", programmaDistanzaAutomatica);

if (selectProdotto?.value) creaCampiExtra(selectProdotto.value);
else aggiornaVisibilitaDistanza();

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = form.querySelector("#nome")?.value.trim() || "";
    const telefono = form.querySelector("#telefono")?.value.trim() || "";
    const prodotto = selectProdotto?.value || "";
    const quantita = quantitaInput?.value.trim() || "";
    const comune = comuneInput?.value.trim() || "";
    const note = form.querySelector("#note")?.value.trim() || "";
    const extra = collectExtrasReadable();
    const km = form.dataset.distanzaKm || "";
    const trasportoRaw = form.dataset.trasportoEur || "";
    const trasporto = trasportoRaw === "0" ? "GRATIS" : trasportoRaw === "personalizzato" ? "Preventivo personalizzato" : (trasportoRaw ? euro(trasportoRaw) : "Da calcolare");

    const leadUrl = `${LEAD_API}?action=lead&nome=${encodeURIComponent(nome)}&telefono=${encodeURIComponent(telefono)}&cereale=${encodeURIComponent(prodotto)}&extra=${encodeURIComponent(extra)}&quantita=${encodeURIComponent(quantita)}&comune=${encodeURIComponent(comune)}&note=${encodeURIComponent(note)}&pagina=${encodeURIComponent(location.href)}`;
    try { await jsonp(leadUrl); } catch (error) { console.warn("Lead non salvato:", error.message); }

    const message = `Ciao AgroTritura!\nVorrei un preventivo.\n\n📦 Ordine\n- Prodotto: ${prodotto || "-"}\n- Quantità: ${quantita || "-"}\n- Dettagli: ${extra || "-"}\n\n📍 Consegna\n- Comune/Indirizzo: ${comune || "-"}\n${km ? `- Distanza sola andata: ${km.replace(".", ",")} km\n` : ""}- Trasporto: ${trasporto}\n\n👤 Cliente\n- Nome: ${nome || "-"}\n- Telefono: ${telefono || "-"}\n\n📝 Note\n${note || "-"}`;
    window.open(`https://wa.me/393341067510?text=${encodeURIComponent(message)}`, "_blank");
  });
}

// ============================
// COPIA PREVENTIVO
// ============================
const copyButton = document.querySelector("#btnCopiaPreventivo");
const copyFeedback = document.querySelector("#copyFeedback");

copyButton?.addEventListener("click", async () => {
  if (!form) return;
  const testo = `DATI PREVENTIVO AGROTRITURA\n\nProdotto: ${selectProdotto?.value || "-"}\nQuantità: ${quantitaInput?.value || "-"}\nDettagli: ${collectExtrasReadable() || "-"}\nComune/Indirizzo: ${comuneInput?.value || "-"}\nDistanza sola andata: ${form.dataset.distanzaKm || "-"} km\nTrasporto: ${form.dataset.trasportoEur === "0" ? "GRATIS" : form.dataset.trasportoEur === "personalizzato" ? "Preventivo personalizzato" : (form.dataset.trasportoEur ? euro(form.dataset.trasportoEur) : "Da calcolare")}\nNome: ${form.querySelector("#nome")?.value || "-"}\nTelefono: ${form.querySelector("#telefono")?.value || "-"}\nNote: ${form.querySelector("#note")?.value || "-"}`;

  try {
    await navigator.clipboard.writeText(testo);
    if (copyFeedback) {
      copyFeedback.style.display = "";
      setTimeout(() => { copyFeedback.style.display = "none"; }, 1600);
    }
  } catch (_) {
    alert("Non sono riuscito a copiare automaticamente i dati.");
  }
});

// ============================
// SLIDER
// ============================
function initSlider(sliderWrap) {
  const track = sliderWrap.querySelector("[data-slider-track]");
  const previous = sliderWrap.querySelector("[data-slider-prev]");
  const next = sliderWrap.querySelector("[data-slider-next]");
  const dotsWrap = sliderWrap.querySelector("[data-slider-dots]");
  if (!track) return;

  const items = Array.from(track.children);
  if (!items.length) return;

  function step() {
    const rect = items[0].getBoundingClientRect();
    const style = getComputedStyle(track);
    return rect.width + (parseFloat(style.gap || style.columnGap || 0) || 12);
  }

  function currentIndex() {
    return Math.round(track.scrollLeft / step());
  }

  function setDot(index) {
    dotsWrap?.querySelectorAll(".sliderDot").forEach((dot, i) => dot.classList.toggle("active", i === index));
  }

  function scrollTo(index) {
    const safeIndex = Math.max(0, Math.min(items.length - 1, index));
    track.scrollTo({ left: safeIndex * step(), behavior: "smooth" });
    setDot(safeIndex);
  }

  function setup() {
    const active = track.scrollWidth > track.clientWidth + 2;
    sliderWrap.classList.toggle("sliderActive", active);
    if (!dotsWrap) return;
    if (!active) {
      dotsWrap.innerHTML = "";
      return;
    }
    dotsWrap.innerHTML = items.map((_, i) => `<button class="sliderDot" type="button" aria-label="Vai alla slide ${i + 1}" data-dot="${i}"></button>`).join("");
    dotsWrap.querySelectorAll("[data-dot]").forEach(dot => dot.addEventListener("click", () => scrollTo(Number(dot.dataset.dot))));
    setDot(currentIndex());
  }

  previous?.addEventListener("click", () => scrollTo(currentIndex() - 1));
  next?.addEventListener("click", () => scrollTo(currentIndex() + 1));
  track.addEventListener("scroll", () => setDot(currentIndex()), { passive: true });
  window.addEventListener("resize", setup);
  setup();
}

document.querySelectorAll("[data-slider]").forEach(initSlider);
aggiornaContenutiCommerciali();
