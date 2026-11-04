/* AgroTritura - importatore richieste WhatsApp del configuratore.
   Nessun accesso automatico alle chat: l'operatore incolla il testo. */
(()=>{'use strict';
const $=s=>document.querySelector(s);
const prices={'Mais':.75,'Frumento':.78,'Orzo':.76,'Mangime ovaiole completo':.89,'Grana verde':.80};
const labels={'mais':'Mais','frumento':'Frumento','orzo':'Orzo','mangime ovaiolo':'Mangime ovaiole completo','mangime ovaiole completo':'Mangime ovaiole completo','grana verde':'Grana verde'};
function amount(v){return Number(String(v).replace(',','.'))}
function extract(t,label){const m=t.match(new RegExp('(?:^|\\n)\\s*'+label+'\\s*:\\s*([^\\n]+)','i'));return m?.[1]?.trim()||''}
function convert(t){
 if(!/composizione richiesta\s*:/i.test(t))return null;
 const product=extract(t,'Prodotto')||'Mix personalizzato';
 const q=extract(t,'Quantit[aà] totale');
 const total=amount((q.match(/\d+(?:[,.]\d+)?/)||[])[0]||'0');
 const block=t.split(/Composizione richiesta\s*:/i)[1]?.split(/\n\s*(?:Vorrei|Note|Consegna|Ritiro)\b/i)[0]||'';
 const rows=[];
 for(const line of block.split(/\n/)){
  const m=line.match(/^\s*[-•]\s*([^:]+):\s*(\d+(?:[,.]\d+)?)\s*kg\s*\((\d+(?:[,.]\d+)?)\s*%\)/i);
  if(!m)continue;
  const name=labels[m[1].trim().toLowerCase()];
  if(!name)throw Error('Ingrediente non riconosciuto: '+m[1].trim());
  rows.push({name,kg:amount(m[2]),pct:amount(m[3]),unit:prices[name]});
 }
 if(!total||!rows.length)throw Error('Quantità o composizione non riconosciute.');
 const sum=rows.reduce((s,r)=>s+r.kg,0),percent=rows.reduce((s,r)=>s+r.pct,0);
 if(Math.abs(sum-total)>.05||Math.abs(percent-100)>.05)throw Error('La somma degli ingredienti non corrisponde alla quantità totale o al 100%.');
 if(rows.some(r=>Math.abs(r.kg/total*100-r.pct)>.15))throw Error('Le percentuali non corrispondono ai kg indicati.');
 const euro=n=>n.toFixed(2).replace('.',',');
 const subtotal=rows.reduce((s,r)=>s+r.kg*r.unit,0);
 return ['📄 DATI PER PREVENTIVO — AgroTritura','','📦 Formulazione',
 '- Nome mix: '+product,'- Quantità totale: '+total+' kg','','🧩 Ingredienti',
 ...rows.map(r=>'- '+r.name+': '+euro(r.kg)+' kg × '+euro(r.unit)+' €/kg = '+euro(r.kg*r.unit)+' € ('+r.pct+'%)'),
 '','💰 Totale prodotti: '+euro(subtotal)+' €','','🚚 Trasporto','- Trasporto stimato A/R: 0,00 €'].join('\n');
}
const button=$('#analyze'),message=$('#msg');
if(!button||!message)return;
button.addEventListener('click',e=>{
 const original=message.value;
 if(!/composizione richiesta\s*:/i.test(original))return;
 e.stopImmediatePropagation();
 try{
  const normalized=convert(original);
  message.value=normalized;
  button.click();
  message.value=original;
  const calculate=$('#calculate');
  if(calculate)calculate.click();
  const ok=$('#ok');
  if(ok){ok.textContent='Richiesta WhatsApp importata: verifica prezzi, disponibilità, trasporto e dati cliente prima di inviare. Il magazzino non è stato modificato.';ok.classList.remove('hidden')}
 }catch(error){
  message.value=original;
  const el=$('#error');if(el){el.textContent=error.message;el.classList.remove('hidden')}
 }
 },true);
})();