/* AgroTritura: importazione richieste del configuratore WhatsApp.
   Si attiva solo quando il messaggio viene incollato qui.
   Non legge conversazioni WhatsApp e non invia messaggi autonomamente. */
(() => {
 'use strict';
 const $ = s => document.querySelector(s);
 const message = $('#msg'), analyze = $('#analyze'), calculate = $('#calculate');
 if (!message || !analyze || !calculate) return;

 // I nomi devono coincidere con quelli del modulo Prezzo protetto / Magazzino.
 const catalog = {
  'mais': ['Mais tritato', 0.75],
  'mais tritato': ['Mais tritato', 0.75],
  'frumento': ['Frumento tritato', 0.78],
  'frumento tritato': ['Frumento tritato', 0.78],
  'orzo': ['Orzo tritato', 0.76],
  'orzo tritato': ['Orzo tritato', 0.76],
  'mangime ovaiolo': ['Mangime ovaiole completo', 0.89],
  'mangime ovaiole': ['Mangime ovaiole completo', 0.89],
  'mangime ovaiole completo': ['Mangime ovaiole completo', 0.89],
  'grana verde': ['Grana verde tritata', 0.80],
  'grana verde tritata': ['Grana verde tritata', 0.80]
 };
 const numeric = s => Number(String(s).replace(',', '.'));
 const decimal = n => Number(n).toFixed(2).replace('.', ',');
 const field = (t, name) => {
  const label = name.replace(/[.*+?^$()|[\]{}\\]/g, '\\$&');
  return (t.match(new RegExp('(?:^|\\n)\\s*' + label + '\\s*:\\s*([^\\n]+)', 'i')) || [])[1]?.trim() || '';
 };
 const isRequest = t => /composizione richiesta\s*:/i.test(t);
 const saneLabel = t => t.replace(/[<>&"'`]/g, '').trim().slice(0, 110);
 let processing = false, lastOriginal = '', debounce;

 function convert(input) {
  const t = input.replace(/\r\n?/g, '\n');
  const product = saneLabel(field(t, 'Prodotto') || 'Mix personalizzato');
  const quantity = field(t, 'Quantità totale');
  const totalKg = numeric((quantity.match(/\d+(?:[,.]\d+)?/) || [])[0] || 0);
  if (!Number.isFinite(totalKg) || totalKg <= 0) throw Error('Quantità totale mancante o non valida.');
  const segment = t.split(/Composizione richiesta\s*:/i)[1] || '';
  const lines = segment.split('\n');
  const rows = [], seen = new Set(), errors = [];
  let started = false;
  for (const line of lines) {
   const clean = line.trim();
   if (/^(?:vorrei|note\s*:|consegna\s*:|ritiro\s*:)/i.test(clean)) break;
   if (!clean) continue;
   if (!/^[-•]\s*/.test(clean)) {
    if (started) break;
    continue;
   }
   started = true;
   const match = clean.match(/^[-•]\s*([^:]+)\s*:\s*(\d+(?:[,.]\d+)?)\s*kg\s*\(\s*(\d+(?:[,.]\d+)?)\s*%\s*\)\s*$/i);
   if (!match) { errors.push('Riga non riconosciuta: ' + clean.slice(0, 80)); continue; }
   const ingredient = catalog[match[1].trim().toLowerCase().replace(/\s+/g, ' ')];
   if (!ingredient) { errors.push('Ingrediente non riconosciuto: ' + match[1].trim()); continue; }
   if (seen.has(ingredient[0])) { errors.push('Ingrediente ripetuto: ' + match[1].trim()); continue; }
   seen.add(ingredient[0]);
   const kg = numeric(match[2]), pct = numeric(match[3]);
   if (!Number.isFinite(kg) || !Number.isFinite(pct) || kg <= 0 || pct <= 0) throw Error('Quantità o percentuale non valide.');
   rows.push({name: ingredient[0], unit: ingredient[1], kg, pct});
  }
  if (errors.length) throw Error(errors.join(' — '));
  if (!rows.length) throw Error('Non trovo gli ingredienti nella richiesta.');
  const sumKg = rows.reduce((s, r) => s + r.kg, 0);
  const sumPct = rows.reduce((s, r) => s + r.pct, 0);
  if (Math.abs(sumKg - totalKg) > 0.05) throw Error('I kg degli ingredienti (' + decimal(sumKg) + ') non coincidono con ' + decimal(totalKg) + ' kg richiesti.');
  if (Math.abs(sumPct - 100) > 0.05) throw Error('Le percentuali non raggiungono il 100%.');
  if (rows.some(r => Math.abs(r.kg * 100 / totalKg - r.pct) > 0.15)) throw Error('Le percentuali non corrispondono ai kg.');
  const subtotal = rows.reduce((s, r) => s + Math.round(r.kg * r.unit * 100) / 100, 0);
  const normalized = [
   '📄 DATI PER PREVENTIVO — AgroTritura', '',
   '📦 Formulazione',
   '- Nome mix: ' + product,
   '- Quantità totale: ' + decimal(totalKg) + ' kg', '',
   '🧩 Ingredienti',
   ...rows.map(r => '- ' + r.name + ': ' + decimal(r.kg) + ' kg × ' + decimal(r.unit) + ' €/kg = ' + decimal(r.kg * r.unit) + ' € (' + r.pct + '%)'),
   '', '💰 Totale prodotti: ' + decimal(subtotal) + ' €', '',
   '🚚 Trasporto', '- Trasporto stimato A/R: 0,00 €'
  ].join('\n');
  return {normalized, rows, product, totalKg, subtotal};
 }

 const details = document.createElement('details');
 details.style.cssText = 'margin:10px 0 0;background:#f4f8f5;border:1px solid #dfe7e1;border-radius:12px;padding:10px 12px';
 const summary = document.createElement('summary');
 summary.style.cssText = 'font-weight:800;color:#173f2a;cursor:pointer';
 summary.textContent = 'Messaggio WhatsApp originale';
 const originalBox = document.createElement('pre');
 originalBox.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;max-height:210px;overflow:auto';
 details.append(summary, originalBox);
 details.hidden = true;
 message.insertAdjacentElement('afterend', details);

 function inform(text, failure = false) {
  const target = $(failure ? '#error' : '#ok');
  const other = $(failure ? '#ok' : '#error');
  if (target) { target.textContent = text; target.classList.remove('hidden'); }
  if (other) other.classList.add('hidden');
 }
 function importRequest() {
  if (processing || !isRequest(message.value)) return false;
  processing = true;
  const raw = message.value;
  try {
   const parsed = convert(raw);
   lastOriginal = raw;
   originalBox.textContent = raw;
   details.hidden = false;
   message.value = parsed.normalized; // Rimane qui: preventivo, PDF e magazzino leggono lo stesso dato.
   analyze.click(); // Riusa il generatore già presente.
   calculate.click(); // Calcola automaticamente quantità, prezzo e riepilogo.
   window.setTimeout(() => {
    const protectedResult = window.atImportApplyProtected?.();
    let info = 'Mix importato: ' + parsed.totalKg + ' kg, ' + parsed.rows.length + ' ingredienti. Preventivo generato; verifica prezzi, magazzino, disponibilità e trasporto prima di inviare.';
    if (protectedResult?.ok) info = 'Mix importato e prezzo protetto calcolato. Verifica costi, scorte, disponibilità e trasporto prima di inviare.';
    inform(info);
   }, 160);
   return true;
  } catch (error) {
   message.value = raw;
   inform(error.message || 'Impossibile interpretare la richiesta.', true);
   return false;
  } finally {
   processing = false;
  }
 }
 analyze.addEventListener('click', event => {
  if (!isRequest(message.value)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  importRequest();
 }, true);

 // La semplice azione "Incolla" compila il preventivo; resta anche il pulsante Analizza.
 message.addEventListener('input', () => {
  clearTimeout(debounce);
  if (!isRequest(message.value) || message.value === lastOriginal) return;
  debounce = setTimeout(() => {
   if (isRequest(message.value) && /quantit[aà]\s+totale\s*:/i.test(message.value)) importRequest();
  }, 220);
 });
})();