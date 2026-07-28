// AgroTritura — interazioni, preventivo, geolocalizzazione e trasporto
const mobileFixes = document.createElement("link");
mobileFixes.rel = "stylesheet";
mobileFixes.href = "css/mobile-fixes.css";
document.head.appendChild(mobileFixes);

const PHONE = "393341067510";
const ORIGIN_ADDRESS = "Revislate, Gattico-Veruno, Novara, Italia";
const PREZZI = {
  "Mais": { piccolo: 0.69, grande: 0.63 },
  "Orzo": { piccolo: 0.69, grande: 0.63 },
  "Frumento": { piccolo: 0.71, grande: 0.65 },
  "Grana verde": { piccolo: 0.72, grande: 0.66 },
  "Mix personalizzato": { piccolo: 0.75, grande: 0.69 }
};

const euro = value => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
const num = value => Number.parseFloat(String(value ?? "").replace(",", ".")) || 0;
let geocodeTimer = null;
let lastGeocodedAddress = "";
let locationRequestId = 0;

function costoTrasporto(km, modalita, totaleMerce) {
  if (modalita === "ritiro") return { costo: 0, testo: "Ritiro gratuito presso AgroTritura" };
  if (modalita === "sul-posto") return { costo: null, testo: "Preventivo personalizzato per lavorazione sul posto" };
  if (!km) return { costo: null, testo: "Inserisci l’indirizzo: i km vengono calcolati automaticamente. Puoi anche inserirli a mano." };
  if (km <= 15 && totaleMerce > 100) return { costo: 0, testo: "Consegna gratuita entro 15 km per ordini superiori a 100 €" };
  if (km <= 15) return { costo: 15, testo: "Fascia entro 15 km" };
  if (km <= 30) return { costo: 30, testo: "Fascia oltre 15–30 km" };
  if (km <= 50) return { costo: 45, testo: "Fascia oltre 30–50 km" };
  if (km <= 75) return { costo: 70, testo: "Fascia oltre 50–75 km" };
  if (km <= 100) return { costo: 95, testo: "Fascia oltre 75–100 km" };
  return { costo: null, testo: "Distanza superiore a 100 km: preventivo personalizzato" };
}

function calcola() {
  const prodotto = document.querySelector("#cereale")?.value || "";
  const quantita = num(document.querySelector("#quantita")?.value);
  const modalita = document.querySelector("#modalita")?.value || "consegna";
  const km = num(document.querySelector("#distanza")?.value);
  const prezzo = PREZZI[prodotto];
  const unitario = prezzo ? (quantita >= 100 ? prezzo.grande : prezzo.piccolo) : null;
  const merce = unitario && quantita ? unitario * quantita : 0;
  const trasporto = costoTrasporto(km, modalita, merce);
  const totale = trasporto.costo === null || !merce ? null : merce + trasporto.costo;

  const qUnit = document.querySelector("#qUnit");
  const qGoods = document.querySelector("#qGoods");
  const qTransport = document.querySelector("#qTransport");
  const qTotal = document.querySelector("#qTotal");
  const qMessage = document.querySelector("#qMessage");
  if (qUnit) qUnit.textContent = unitario ? `${unitario.toFixed(2).replace(".", ",")} €/kg` : "—";
  if (qGoods) qGoods.textContent = merce ? euro(merce) : "—";
  if (qTransport) qTransport.textContent = trasporto.costo === null ? "Da definire" : euro(trasporto.costo);
  if (qTotal) qTotal.textContent = totale === null ? "Da confermare" : euro(totale);
  if (qMessage) qMessage.textContent = trasporto.testo;
  return { prodotto, quantita, modalita, km, unitario, merce, trasporto, totale };
}

function testoPreventivo(dati) {
  const nome = document.querySelector("#nome")?.value.trim() || "Non indicato";
  const telefono = document.querySelector("#telefono")?.value.trim() || "Non indicato";
  const comune = document.querySelector("#comune")?.value.trim() || "Non indicato";
  const note = document.querySelector("#note")?.value.trim() || "Nessuna";
  const modalitaTesto = dati.modalita === "ritiro" ? "Ritiro presso AgroTritura" : dati.modalita === "sul-posto" ? "Tritatura presso la mia azienda" : "Consegna a domicilio";
  return [
    "Buongiorno, vorrei richiedere un preventivo AgroTritura.", "",
    `Nome: ${nome}`, `Telefono: ${telefono}`,
    `Prodotto: ${dati.prodotto || "Da definire"}`,
    `Quantità: ${dati.quantita ? `${dati.quantita} kg` : "Da definire"}`,
    `Modalità: ${modalitaTesto}`, `Comune/indirizzo: ${comune}`,
    `Distanza sola andata: ${dati.km ? `${dati.km} km` : "Non indicata"}`,
    `Prezzo unitario stimato: ${dati.unitario ? `${dati.unitario.toFixed(2).replace(".", ",")} €/kg` : "Da definire"}`,
    `Totale merce stimato: ${dati.merce ? euro(dati.merce) : "Da definire"}`,
    `Trasporto stimato: ${dati.trasporto.costo === null ? "Da definire" : euro(dati.trasporto.costo)}`,
    `Totale stimato: ${dati.totale === null ? "Da confermare" : euro(dati.totale)}`,
    `Note: ${note}`, "", "Attendo conferma di disponibilità e prezzo finale."
  ].join("\n");
}

function setLocationStatus(message, type = "info") {
  const status = document.querySelector("#locationStatus");
  if (!status) return;
  status.textContent = message;
  status.dataset.type = type;
}

async function geocodeAddress(address) {
  const query = address.toLowerCase().includes("italia") ? address : `${address}, Italia`;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=it&addressdetails=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { "Accept-Language": "it" } });
  if (!response.ok) throw new Error("Geocodifica non disponibile");
  const results = await response.json();
  if (!Array.isArray(results) || !results.length) throw new Error("Indirizzo non trovato");
  return { lat: Number(results[0].lat), lon: Number(results[0].lon) };
}

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1&zoom=18`;
  const response = await fetch(url, { headers: { "Accept-Language": "it" } });
  if (!response.ok) throw new Error("Indirizzo della posizione non disponibile");
  const result = await response.json();
  return result.display_name || "Posizione attuale";
}

async function getOriginCoordinates() {
  try {
    const cached = JSON.parse(localStorage.getItem("agrotrituraOrigin") || "null");
    if (cached?.lat && cached?.lon) return cached;
  } catch {}
  const origin = await geocodeAddress(ORIGIN_ADDRESS);
  try { localStorage.setItem("agrotrituraOrigin", JSON.stringify(origin)); } catch {}
  return origin;
}

async function routeDistanceKm(destination) {
  const origin = await getOriginCoordinates();
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=false&alternatives=false&steps=false`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Calcolo percorso non disponibile");
  const result = await response.json();
  if (result.code !== "Ok" || !result.routes?.[0]?.distance) throw new Error("Percorso non trovato");
  return Math.round((result.routes[0].distance / 1000) * 10) / 10;
}

async function applyDestination(destination, requestId) {
  const km = await routeDistanceKm(destination);
  if (requestId !== locationRequestId) return;
  const distanceInput = document.querySelector("#distanza");
  if (distanceInput) {
    distanceInput.value = String(km).replace(".", ",");
    distanceInput.dataset.autoCalculated = "true";
    distanceInput.dispatchEvent(new Event("input", { bubbles: true }));
  }
  setLocationStatus(`Distanza calcolata automaticamente: ${String(km).replace(".", ",")} km sola andata.`, "success");
  calcola();
}

async function calculateFromAddress(force = false) {
  const addressInput = document.querySelector("#comune");
  const modalita = document.querySelector("#modalita")?.value || "consegna";
  const address = addressInput?.value.trim() || "";
  if (modalita !== "consegna") return;
  if (address.length < 6) {
    if (force) setLocationStatus("Inserisci una via, il numero civico e il comune.", "error");
    return;
  }
  if (!force && address === lastGeocodedAddress) return;
  const requestId = ++locationRequestId;
  setLocationStatus("Ricerca dell’indirizzo e calcolo dei km…", "loading");
  try {
    const destination = await geocodeAddress(address);
    if (requestId !== locationRequestId) return;
    lastGeocodedAddress = address;
    await applyDestination(destination, requestId);
  } catch (error) {
    if (requestId !== locationRequestId) return;
    setLocationStatus(`${error.message}. Controlla l’indirizzo oppure inserisci i km manualmente.`, "error");
  }
}

function useCurrentPosition() {
  if (!navigator.geolocation) {
    setLocationStatus("La posizione non è supportata da questo dispositivo.", "error");
    return;
  }
  const button = document.querySelector("#useLocationBtn");
  if (button) button.disabled = true;
  setLocationStatus("Recupero della posizione attuale…", "loading");
  navigator.geolocation.getCurrentPosition(async position => {
    const requestId = ++locationRequestId;
    const destination = { lat: position.coords.latitude, lon: position.coords.longitude };
    try {
      let address = "Posizione attuale";
      try { address = await reverseGeocode(destination.lat, destination.lon); } catch {}
      const addressInput = document.querySelector("#comune");
      if (addressInput) addressInput.value = address;
      lastGeocodedAddress = address;
      await applyDestination(destination, requestId);
    } catch (error) {
      setLocationStatus(`${error.message}. Puoi inserire l’indirizzo o i km manualmente.`, "error");
    } finally {
      if (button) button.disabled = false;
    }
  }, error => {
    if (button) button.disabled = false;
    const messages = {
      1: "Permesso posizione negato. Abilitalo nel browser oppure scrivi l’indirizzo.",
      2: "Posizione non disponibile. Scrivi l’indirizzo manualmente.",
      3: "Recupero posizione scaduto. Riprova oppure scrivi l’indirizzo."
    };
    setLocationStatus(messages[error.code] || "Impossibile recuperare la posizione.", "error");
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
}

function enhanceLocationFields() {
  const addressInput = document.querySelector("#comune");
  const distanceInput = document.querySelector("#distanza");
  if (!addressInput || !distanceInput || document.querySelector("#useLocationBtn")) return;

  addressInput.placeholder = "Es. Via Giovan Battista Gambaro 10/b Galliate";
  distanceInput.placeholder = "Automatica o manuale";
  const addressLabel = addressInput.closest("label");
  const distanceLabel = distanceInput.closest("label");
  if (addressLabel?.firstChild?.nodeType === Node.TEXT_NODE) addressLabel.firstChild.textContent = "Indirizzo completo ";
  if (distanceLabel?.firstChild?.nodeType === Node.TEXT_NODE) distanceLabel.firstChild.textContent = "Distanza sola andata ";

  const controls = document.createElement("div");
  controls.className = "location-tools";
  controls.innerHTML = `
    <button type="button" id="useLocationBtn" class="location-button">📍 Usa la mia posizione</button>
    <button type="button" id="calculateAddressBtn" class="location-button secondary">Calcola dall’indirizzo</button>
    <small class="location-help">Puoi scrivere direttamente <b>Via Giovan Battista Gambaro 10/b Galliate</b>. I km vengono calcolati automaticamente; se li conosci puoi inserirli anche a mano.</small>
    <small id="locationStatus" class="location-status" aria-live="polite"></small>`;
  addressLabel.insertAdjacentElement("afterend", controls);

  const style = document.createElement("style");
  style.textContent = `
    .location-tools{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:-8px 0 16px}
    .location-button{border:0;border-radius:11px;padding:11px 12px;background:#173f2a;color:#fff;font-weight:800;cursor:pointer;min-height:44px}
    .location-button.secondary{background:#eef5f0;color:#173f2a;border:1px solid #cedbd2}
    .location-button:disabled{opacity:.6;cursor:wait}
    .location-help,.location-status{grid-column:1/-1;display:block;line-height:1.35}
    .location-help{color:#66736b;font-size:.76rem}
    .location-status{font-size:.78rem;font-weight:750;min-height:1.1em}
    .location-status[data-type="success"]{color:#257044}
    .location-status[data-type="error"]{color:#a33a2b}
    .location-status[data-type="loading"]{color:#8b620f}
    @media(max-width:620px){.location-tools{grid-template-columns:1fr 1fr;margin:-2px 0 12px}.location-button{font-size:.78rem;padding:9px 7px}.location-help{font-size:.7rem}}
  `;
  document.head.appendChild(style);

  document.querySelector("#useLocationBtn")?.addEventListener("click", useCurrentPosition);
  document.querySelector("#calculateAddressBtn")?.addEventListener("click", () => calculateFromAddress(true));
  addressInput.addEventListener("input", () => {
    clearTimeout(geocodeTimer);
    if (addressInput.value.trim() !== lastGeocodedAddress && distanceInput.dataset.autoCalculated === "true") {
      distanceInput.value = "";
      distanceInput.dataset.autoCalculated = "false";
      calcola();
    }
    geocodeTimer = setTimeout(() => calculateFromAddress(false), 1100);
  });
  addressInput.addEventListener("blur", () => calculateFromAddress(false));
  distanceInput.addEventListener("input", () => {
    if (document.activeElement === distanceInput) distanceInput.dataset.autoCalculated = "false";
  });
}

function initMenu() {
  const button = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (!button || !nav) return;
  button.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
    button.textContent = open ? "✕" : "☰";
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
    button.textContent = "☰";
  }));
}

function initPreventivo() {
  const form = document.querySelector("#preventivoForm");
  if (!form) return;
  enhanceLocationFields();
  ["cereale", "quantita", "modalita", "distanza"].forEach(id => {
    document.querySelector(`#${id}`)?.addEventListener("input", calcola);
    document.querySelector(`#${id}`)?.addEventListener("change", calcola);
  });
  document.querySelector("#modalita")?.addEventListener("change", event => {
    if (event.target.value === "consegna") calculateFromAddress(false);
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const dati = calcola();
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(testoPreventivo(dati))}`, "_blank", "noopener");
  });
  document.querySelector("#btnCopiaPreventivo")?.addEventListener("click", async () => {
    const testo = testoPreventivo(calcola());
    try {
      await navigator.clipboard.writeText(testo);
      const feedback = document.querySelector("#copyFeedback");
      if (feedback) {
        feedback.hidden = false;
        setTimeout(() => { feedback.hidden = true; }, 2200);
      }
    } catch {
      window.prompt("Copia il riepilogo:", testo);
    }
  });
  calcola();
}

document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  initPreventivo();
  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();
});