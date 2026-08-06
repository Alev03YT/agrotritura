// AgroTritura — interazioni, preventivo, geolocalizzazione, prezzi e trasporto
const mobileFixes = document.createElement('link');
mobileFixes.rel = 'stylesheet';
mobileFixes.href = 'css/mobile-fixes.css';
document.head.appendChild(mobileFixes);

const PHONE = '393341067510';
const ORIGIN = { lat: 45.69063, lon: 8.55019 };
const PREZZI_BASE = {
  'Mais': 0.75,
  'Orzo': 0.76,
  'Frumento': 0.78,
  'Grana verde': 0.80,
  'Mix personalizzato': 0.84
};
const SCONTI = [
  { min: 500, percentuale: 6 },
  { min: 250, percentuale: 4 },
  { min: 100, percentuale: 2 },
  { min: 0, percentuale: 0 }
];

const euro = value => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0);
const num = value => Number.parseFloat(String(value ?? '').replace(',', '.')) || 0;
let geocodeTimer = null;
let lastGeocodedAddress = '';
let locationRequestId = 0;

function scontoPerQuantita(quantita) {
  return SCONTI.find(fascia => quantita >= fascia.min) || SCONTI[SCONTI.length - 1];
}

function dettaglioPrezzo(prodotto, quantita) {
  const base = PREZZI_BASE[prodotto];
  if (!base) return null;
  const fascia = scontoPerQuantita(quantita);
  const unitario = base * (1 - fascia.percentuale / 100);
  return { base, unitario, scontoPercentuale: fascia.percentuale };
}

function costoTrasporto(km, modalita, totaleMerce) {
  if (modalita === 'ritiro') return { costo: 0, testo: 'Ritiro gratuito presso AgroTritura' };
  if (modalita === 'sul-posto') return { costo: null, testo: 'Preventivo personalizzato per lavorazione sul posto' };
  if (!km) return { costo: null, testo: 'Inserisci l’indirizzo: i km vengono calcolati automaticamente. Puoi anche inserirli a mano.' };
  if (km <= 15 && totaleMerce > 100) return { costo: 0, testo: 'Consegna gratuita entro 15 km per ordini superiori a 100 €' };
  if (km <= 15) return { costo: 15, testo: 'Fascia entro 15 km' };
  if (km <= 30) return { costo: 30, testo: 'Fascia oltre 15–30 km' };
  if (km <= 50) return { costo: 45, testo: 'Fascia oltre 30–50 km' };
  if (km <= 75) return { costo: 70, testo: 'Fascia oltre 50–75 km' };
  if (km <= 100) return { costo: 95, testo: 'Fascia oltre 75–100 km' };
  return { costo: null, testo: 'Distanza superiore a 100 km: preventivo personalizzato' };
}

function ensureDiscountRows() {
  const summary = document.querySelector('.quote-summary');
  if (!summary || document.querySelector('#qBaseGoods')) return;
  const goodsRow = document.querySelector('#qGoods')?.closest('.summary-row');
  if (!goodsRow) return;
  const baseRow = document.createElement('div');
  baseRow.className = 'summary-row';
  baseRow.innerHTML = '<span>Prezzo merce prima dello sconto</span><b id="qBaseGoods">—</b>';
  const discountRow = document.createElement('div');
  discountRow.className = 'summary-row';
  discountRow.innerHTML = '<span>Sconto quantità</span><b id="qDiscount">—</b>';
  goodsRow.insertAdjacentElement('beforebegin', baseRow);
  goodsRow.insertAdjacentElement('beforebegin', discountRow);
  goodsRow.querySelector('span').textContent = 'Totale merce scontato';
}

function calcola() {
  const prodotto = document.querySelector('#cereale')?.value || '';
  const quantita = num(document.querySelector('#quantita')?.value);
  const modalita = document.querySelector('#modalita')?.value || 'consegna';
  const km = num(document.querySelector('#distanza')?.value);
  const prezzo = dettaglioPrezzo(prodotto, quantita);
  const merceBase = prezzo && quantita ? prezzo.base * quantita : 0;
  const merce = prezzo && quantita ? prezzo.unitario * quantita : 0;
  const risparmio = Math.max(0, merceBase - merce);
  const trasporto = costoTrasporto(km, modalita, merce);
  const totale = trasporto.costo === null || !merce ? null : merce + trasporto.costo;

  ensureDiscountRows();
  const set = (id, value) => { const el = document.querySelector(id); if (el) el.textContent = value; };
  set('#qUnit', prezzo ? `${prezzo.unitario.toFixed(3).replace('.', ',')} €/kg` : '—');
  set('#qBaseGoods', merceBase ? euro(merceBase) : '—');
  set('#qDiscount', prezzo && prezzo.scontoPercentuale ? `-${euro(risparmio)} (${prezzo.scontoPercentuale}%)` : 'Nessuno');
  set('#qGoods', merce ? euro(merce) : '—');
  set('#qTransport', trasporto.costo === null ? 'Da definire' : euro(trasporto.costo));
  set('#qTotal', totale === null ? 'Da confermare' : euro(totale));
  set('#qMessage', trasporto.testo);

  return { prodotto, quantita, modalita, km, prezzo, unitario: prezzo?.unitario || null, merceBase, merce, risparmio, trasporto, totale };
}

function testoPreventivo(dati) {
  const nome = document.querySelector('#nome')?.value.trim() || 'Non indicato';
  const telefono = document.querySelector('#telefono')?.value.trim() || 'Non indicato';
  const comune = document.querySelector('#comune')?.value.trim() || 'Non indicato';
  const note = document.querySelector('#note')?.value.trim() || 'Nessuna';
  const modalitaTesto = dati.modalita === 'ritiro' ? 'Ritiro presso AgroTritura' : dati.modalita === 'sul-posto' ? 'Tritatura presso la mia azienda' : 'Consegna a domicilio';
  return [
    'Buongiorno, vorrei richiedere un preventivo AgroTritura.', '',
    `Nome: ${nome}`, `Telefono: ${telefono}`,
    `Prodotto: ${dati.prodotto || 'Da definire'}`,
    `Quantità: ${dati.quantita ? `${dati.quantita} kg` : 'Da definire'}`,
    `Modalità: ${modalitaTesto}`, `Comune/indirizzo: ${comune}`,
    `Distanza sola andata: ${dati.km ? `${dati.km} km` : 'Non indicata'}`,
    `Prezzo base: ${dati.prezzo ? `${dati.prezzo.base.toFixed(2).replace('.', ',')} €/kg` : 'Da definire'}`,
    `Sconto quantità: ${dati.prezzo?.scontoPercentuale ? `${dati.prezzo.scontoPercentuale}% (-${euro(dati.risparmio)})` : 'Nessuno'}`,
    `Prezzo unitario applicato: ${dati.unitario ? `${dati.unitario.toFixed(3).replace('.', ',')} €/kg` : 'Da definire'}`,
    `Totale merce: ${dati.merce ? euro(dati.merce) : 'Da definire'}`,
    `Trasporto stimato: ${dati.trasporto.costo === null ? 'Da definire' : euro(dati.trasporto.costo)}`,
    `Totale stimato: ${dati.totale === null ? 'Da confermare' : euro(dati.totale)}`,
    `Note: ${note}`, '', 'Attendo conferma di disponibilità e prezzo finale.'
  ].join('\n');
}

function aggiornaListinoVisibile() {
  const table = document.querySelector('#prezzi table');
  if (!table) return;
  table.querySelector('thead').innerHTML = '<tr><th>Prodotto</th><th>1–99 kg</th><th>100–249 kg</th><th>250–499 kg</th><th>Da 500 kg</th></tr>';
  const prodotti = [
    ['Mais tritato', 'Mais'], ['Orzo tritato', 'Orzo'], ['Frumento tritato', 'Frumento'],
    ['Grana verde tritata', 'Grana verde'], ['Mix personalizzato', 'Mix personalizzato']
  ];
  const prezzoFascia = (nome, q) => dettaglioPrezzo(nome, q).unitario.toFixed(3).replace('.', ',') + ' €/kg';
  table.querySelector('tbody').innerHTML = prodotti.map(([label, nome]) => `<tr><td><b>${label}</b></td><td>${prezzoFascia(nome, 1)}</td><td>${prezzoFascia(nome, 100)}</td><td>${prezzoFascia(nome, 250)}</td><td class="best">${prezzoFascia(nome, 500)}</td></tr>`).join('');
  const panel = document.querySelector('#prezzi .price-panel');
  if (panel && !document.querySelector('.price-value-note')) {
    const note = document.createElement('div');
    note.className = 'price-value-note';
    note.innerHTML = '<h3>Il prezzo comprende il servizio AgroTritura</h3><div><span>✓ Tritatura fresca dopo la conferma</span><span>✓ Granulometria su misura</span><span>✓ Preparazione e mix personalizzati</span><span>✓ Sconti automatici sulle quantità</span></div><p>Il cereale sfuso può costare meno perché non comprende lavorazione, preparazione personalizzata e gestione dell’ordine.</p>';
    panel.appendChild(note);
    const style = document.createElement('style');
    style.textContent = '.price-value-note{margin-top:16px;padding:17px;border-radius:16px;background:#f3f8f4;border:1px solid #dce7df}.price-value-note h3{margin:0 0 10px;color:#173f2a}.price-value-note div{display:grid;grid-template-columns:1fr 1fr;gap:7px;color:#173f2a;font-weight:750}.price-value-note p{margin:11px 0 0;color:#66736b;font-size:.88rem}@media(max-width:600px){.price-value-note div{grid-template-columns:1fr}#prezzi table{min-width:720px}}';
    document.head.appendChild(style);
  }
}

function setLocationStatus(message, type = 'info') {
  const status = document.querySelector('#locationStatus');
  if (!status) return;
  status.textContent = message;
  status.dataset.type = type;
}

function unique(values) { return [...new Set(values.map(v => v.trim()).filter(Boolean))]; }
function buildAddressCandidates(rawAddress) {
  const cleaned = rawAddress.replace(/\s+/g, ' ').trim();
  const normalizedCivic = cleaned.replace(/(\d+)\s*\/\s*([a-z])/gi, '$1$2').replace(/(\d+)\s+([a-z])\b/gi, '$1$2');
  const civicWithoutLetter = normalizedCivic.replace(/(\d+)[a-z]\b/gi, '$1');
  const withoutCivic = civicWithoutLetter.replace(/\s+\d+\b/, ' ').replace(/\s+/g, ' ').trim();
  return unique([`${cleaned}, Italia`, `${normalizedCivic}, Italia`, `${civicWithoutLetter}, Italia`, `${normalizedCivic}, Provincia di Novara, Italia`, `${withoutCivic}, Provincia di Novara, Italia`]);
}
async function nominatimSearch(query) {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=it&addressdetails=1&q=${encodeURIComponent(query)}`, { headers: { 'Accept-Language': 'it' } });
  if (!response.ok) throw new Error('Servizio indirizzi temporaneamente non disponibile');
  return response.json();
}
async function geocodeAddress(address) {
  for (const candidate of buildAddressCandidates(address)) {
    const results = await nominatimSearch(candidate);
    const result = results.find(item => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon)));
    if (result) return { lat: Number(result.lat), lon: Number(result.lon) };
  }
  throw new Error('Indirizzo non trovato');
}
async function reverseGeocode(lat, lon) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1&zoom=18`, { headers: { 'Accept-Language': 'it' } });
  if (!response.ok) throw new Error('Indirizzo della posizione non disponibile');
  return (await response.json()).display_name || 'Posizione attuale';
}
async function routeDistanceKm(destination) {
  const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${ORIGIN.lon},${ORIGIN.lat};${destination.lon},${destination.lat}?overview=false&alternatives=false&steps=false`);
  const result = await response.json();
  if (!response.ok || result.code !== 'Ok' || !result.routes?.[0]?.distance) throw new Error('Percorso non trovato');
  return Math.round(result.routes[0].distance / 100) / 10;
}
async function applyDestination(destination, requestId) {
  const km = await routeDistanceKm(destination);
  if (requestId !== locationRequestId) return;
  const input = document.querySelector('#distanza');
  input.value = String(km).replace('.', ',');
  input.dataset.autoCalculated = 'true';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  setLocationStatus(`Distanza calcolata automaticamente: ${String(km).replace('.', ',')} km sola andata.`, 'success');
}
async function calculateFromAddress(force = false) {
  const input = document.querySelector('#comune');
  const address = input?.value.trim() || '';
  if ((document.querySelector('#modalita')?.value || 'consegna') !== 'consegna') return;
  if (address.length < 6) { if (force) setLocationStatus('Inserisci almeno la via e il comune.', 'error'); return; }
  if (!force && address === lastGeocodedAddress) return;
  const requestId = ++locationRequestId;
  setLocationStatus('Ricerca dell’indirizzo e calcolo dei km…', 'loading');
  try { const destination = await geocodeAddress(address); lastGeocodedAddress = address; await applyDestination(destination, requestId); }
  catch (error) { if (requestId === locationRequestId) setLocationStatus(`${error.message}. Puoi inserire i km manualmente.`, 'error'); }
}
function useCurrentPosition() {
  if (!navigator.geolocation) return setLocationStatus('La posizione non è supportata.', 'error');
  const button = document.querySelector('#useLocationBtn'); if (button) button.disabled = true;
  navigator.geolocation.getCurrentPosition(async position => {
    const requestId = ++locationRequestId;
    try {
      const destination = { lat: position.coords.latitude, lon: position.coords.longitude };
      document.querySelector('#comune').value = await reverseGeocode(destination.lat, destination.lon);
      await applyDestination(destination, requestId);
    } catch (error) { setLocationStatus(error.message, 'error'); }
    finally { if (button) button.disabled = false; }
  }, () => { if (button) button.disabled = false; setLocationStatus('Posizione non disponibile o permesso negato.', 'error'); }, { enableHighAccuracy: true, timeout: 12000 });
}
function enhanceLocationFields() {
  const addressInput = document.querySelector('#comune');
  const distanceInput = document.querySelector('#distanza');
  if (!addressInput || !distanceInput || document.querySelector('#useLocationBtn')) return;
  addressInput.placeholder = 'Es. Via Giovan Battista Gambaro 10/b Galliate';
  distanceInput.placeholder = 'Automatica o manuale';
  const controls = document.createElement('div');
  controls.className = 'location-tools';
  controls.innerHTML = '<button type="button" id="useLocationBtn" class="location-button">📍 Usa la mia posizione</button><button type="button" id="calculateAddressBtn" class="location-button secondary">Calcola dall’indirizzo</button><small class="location-help">Scrivi via, numero civico e comune in un’unica riga.</small><small id="locationStatus" class="location-status" aria-live="polite"></small>';
  addressInput.closest('label').insertAdjacentElement('afterend', controls);
  const style = document.createElement('style');
  style.textContent = '.location-tools{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:-8px 0 16px}.location-button{border:0;border-radius:11px;padding:11px;background:#173f2a;color:#fff;font-weight:800}.location-button.secondary{background:#eef5f0;color:#173f2a;border:1px solid #cedbd2}.location-help,.location-status{grid-column:1/-1}.location-status[data-type="error"]{color:#a43e35}.location-status[data-type="success"]{color:#287348}@media(max-width:620px){.location-button{font-size:.78rem}}';
  document.head.appendChild(style);
  document.querySelector('#useLocationBtn').onclick = useCurrentPosition;
  document.querySelector('#calculateAddressBtn').onclick = () => calculateFromAddress(true);
  addressInput.addEventListener('input', () => { clearTimeout(geocodeTimer); geocodeTimer = setTimeout(() => calculateFromAddress(false), 1200); });
}
function initMenu() {
  const button = document.querySelector('.menu-toggle'), nav = document.querySelector('.main-nav');
  if (!button || !nav) return;
  button.onclick = () => { const open = nav.classList.toggle('open'); button.setAttribute('aria-expanded', String(open)); button.textContent = open ? '✕' : '☰'; };
  nav.querySelectorAll('a').forEach(link => link.onclick = () => nav.classList.remove('open'));
}
function initPreventivo() {
  const form = document.querySelector('#preventivoForm');
  if (!form) return;
  enhanceLocationFields();
  ['cereale', 'quantita', 'modalita', 'distanza'].forEach(id => { document.querySelector(`#${id}`)?.addEventListener('input', calcola); document.querySelector(`#${id}`)?.addEventListener('change', calcola); });
  form.addEventListener('submit', event => { event.preventDefault(); const dati = calcola(); window.open(`https://wa.me/${PHONE}?text=${encodeURIComponent(testoPreventivo(dati))}`, '_blank', 'noopener'); });
  document.querySelector('#btnCopiaPreventivo')?.addEventListener('click', async () => { const testo = testoPreventivo(calcola()); try { await navigator.clipboard.writeText(testo); } catch { window.prompt('Copia il riepilogo:', testo); } });
  calcola();
}

document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  aggiornaListinoVisibile();
  initPreventivo();
  const year = document.querySelector('#year'); if (year) year.textContent = new Date().getFullYear();
});