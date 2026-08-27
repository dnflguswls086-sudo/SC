
const typeName={S:'주어',O:'목적어',P:'서술어',L:'어디에',T:'누구에게'};
const typeClass={S:'subject',O:'object',P:'predicate',L:'location',T:'target'};
function esc(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
function getRoom(){return new URLSearchParams(location.search).get('room')||''}
async function api(url,data){
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data||{})});
  const j=await r.json().catch(()=>({ok:false,error:'서버 응답 오류'}));
  if(!r.ok) throw new Error(j.error||'요청 실패');
  return j;
}
function sentenceHTML(r){
  if(!r)return '';
  const order=r.order||['S','O','P'];
  return order.map(t=>{
    const missing=r.missing===t; let txt=r.parts[t]||'';
    if(missing){
      if(t==='S')txt='________ (이/가)';
      else if(t==='O')txt='________ (을/를)';
      else if(t==='L')txt='________ (에/에서)';
      else if(t==='T')txt='________ (에게/한테)';
      else txt='________';
    }
    return `<span class="part ${typeClass[t]||''} ${missing?'blank':''}">${esc(txt)}</span>`;
  }).join('');
}
function ranked(totals){return Object.entries(totals||{}).map(([name,score])=>({name,score})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'ko'))}
function rankHTML(totals){
  const arr=ranked(totals);let prev=null,rank=0;
  return arr.map((x,i)=>{if(x.score!==prev)rank=i+1;prev=x.score;return `<div class="rankrow ${rank===1?'top':''}"><div class="pos">${rank}</div><div><b>${esc(x.name)}</b></div><div class="score">${x.score}</div></div>`}).join('');
}
