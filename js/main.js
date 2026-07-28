// AgroTritura — interazioni, preventivo e trasporto
const mobileFixes = document.createElement("link");
mobileFixes.rel = "stylesheet";
mobileFixes.href = "css/mobile-fixes.css";
document.head.appendChild(mobileFixes);

const PHONE = "393341067510";
const PREZZI = {
  "Mais": { piccolo: 0.69, grande: 0.63 },
  "Orzo": { piccolo: 0.69, grande: 0.63 },
  "Frumento": { piccolo: 0.71, grande: 0.65 },
  "Grana verde": { piccolo: 0.72, grande: 0.66 },
  "Mix personalizzato": { piccolo: 0.75, grande: 0.69 }
};

const euro = value => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
const num = value => Number.parseFloat(String(value ?? "").replace(",", ".")) || 0;

function costoTrasporto(km, modalita, totaleMerce) {
  if (modalita === "ritiro") return { costo: 0, testo: "Ritiro gratuito presso AgroTritura" };
  if (modalita === "sul-posto") return { costo: null, testo: "Preventivo personalizzato per lavorazione sul posto" };
  if (!km) return { costo: null, testo: "Inserisci la distanza di sola andata" };
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
    "Buongiorno, vorrei richiedere un preventivo AgroTritura.",
    "",
    `Nome: ${nome}`,
    `Telefono: ${telefono}`,
    `Prodotto: ${dati.prodotto || "Da definire"}`,
    `Quantità: ${dati.quantita ? `${dati.quantita} kg` : "Da definire"}`,
    `Modalità: ${modalitaTesto}`,
    `Comune/indirizzo: ${comune}`,
    `Distanza sola andata: ${dati.km ? `${dati.km} km` : "Non indicata"}`,
    `Prezzo unitario stimato: ${dati.unitario ? `${dati.unitario.toFixed(2).replace(".", ",")} €/kg` : "Da definire"}`,
    `Totale merce stimato: ${dati.merce ? euro(dati.merce) : "Da definire"}`,
    `Trasporto stimato: ${dati.trasporto.costo === null ? "Da definire" : euro(dati.trasporto.costo)}`,
    `Totale stimato: ${dati.totale === null ? "Da confermare" : euro(dati.totale)}`,
    `Note: ${note}`,
    "",
    "Attendo conferma di disponibilità e prezzo finale."
  ].join("\n");
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
  ["cereale", "quantita", "modalita", "distanza"].forEach(id => {
    document.querySelector(`#${id}`)?.addEventListener("input", calcola);
    document.querySelector(`#${id}`)?.addEventListener("change", calcola);
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    const dati = calcola();
    const testo = testoPreventivo(dati);
    window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(testo)}`, "_blank", "noopener");
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