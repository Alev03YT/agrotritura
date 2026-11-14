/* AgroTritura - archivio locale dei preventivi Smart.
   Registra un preventivo dopo il calcolo riuscito, inclusi eventuali prezzi protetti.
   Mantiene separati i preventivi e gli ordini effettivi. */
(function(){
'use strict';
const KEY='at_smart_quotes_v1';
const $=id=>document.getElementById(id);
const number=s=>{const v=String(s||'').replace(/\s/g,'').replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.');return Number(v)||0};
const value=id=>$(id)?.value?.trim()||'';
const label=id=>$(id)?.textContent?.trim()||'';
const get=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return []}};
function snapshot(){
 if(!$('result')||$('result').classList.contains('hidden')||($('error')&&!$('error').classList.contains('hidden')))return false;
 const tot=number(label('grandTotal')),kg=number(label('suggestedKg'));
 if(!(tot>0)||!(kg>0))return false;
 const testo=$('copy')?.dataset.text||'';
 const prodotto=value('product')||'Mix personalizzato';
 const cliente=value('name')||'Cliente non indicato';
 const t={cliente,telefono:value('phone'),indirizzo:value('address'),prodotto,kg,tot,totale:tot,
   trasporto:number(label('transportTotal')),merce:number(label('goodsTotal')),composizione:label('composition'),testo,
   sorgente:value('msg'),fixed:value('msg').includes('🧩 Ingredienti')};
 const fingerprint=JSON.stringify([t.cliente,t.telefono,t.prodotto,t.kg,t.trasporto,t.composizione,t.sorgente]);
 let history=get(),existing=history.find(x=>x.fingerprint===fingerprint&&Date.now()-new Date(x.date||0).getTime()<15*60000);
 if(existing){Object.assign(existing,t,{fingerprint,date:new Date().toISOString()})}
 else history.unshift({...t,id:'smart-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),date:new Date().toISOString(),fingerprint});
 localStorage.setItem(KEY,JSON.stringify(history.slice(0,1500)));
 const hint=$('atSmartSaved');if(hint)hint.textContent='✓ Preventivo registrato nello storico locale';
 return true;
}
let pending=null;
function schedule(){
 clearTimeout(pending);
 pending=setTimeout(()=>{try{snapshot()}catch(e){console.warn('Storico preventivi non disponibile:',e)}},600);
}
const btn=$('calculate');
if(btn)btn.addEventListener('click',schedule);
const actions=document.querySelector('.btns:has(#calculate)');
if(actions){
 const direct=document.createElement('button');direct.type='button';direct.className='btn light';direct.textContent='💾 Salva nello storico';direct.onclick=()=>{try{if(!snapshot())alert('Calcola prima un preventivo valido.')}catch(e){alert('Impossibile salvare: '+e.message)}};
 const link=document.createElement('a');link.href='storico-preventivi.html';link.className='btn light';link.textContent='📚 Apri storico';link.target='_blank';link.rel='noopener';
 const note=document.createElement('small');note.id='atSmartSaved';note.style.cssText='display:block;width:100%;color:#287348';
 actions.append(direct,link,note);
}
window.atSaveSmartQuote=snapshot;
})();
