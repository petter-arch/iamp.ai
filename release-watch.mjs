// Official release corrections. Stable catalogue IDs are product-family IDs.
const URL='https://openai.com/index/introducing-images-2-6/';
const INDEX='https://openai.com/research/index/release/';
const CHECKED='2026-11-24T07:51:00.000Z';
const ID='chatgpt-images-2-0';
const ALIASES=['ChatGPT Images 2.6','Images 2.6','GPT Image 2.6','GPT-Image-2.6','GPT-Image-2.6 Flare','GPT-Image-2.6 Sunburst'];
const key=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[\s\-‑]+/g,'');
export function applyOfficialReleases(state){
 const p=state.platforms.find(x=>x.id===ID);
 if(!p||!/^ChatGPT Images 2\.[05]$/.test(p.n))return false;
 const release={n:'ChatGPT Images 2.6',aliases:ALIASES,sub:'Bildgenerering, precis redigering och GIF-animation',long:'Images 2.6 lanserades av OpenAI den 4 november 2026 i ChatGPT, Codex och API:et. Flare prioriterar snabb bildgenerering, medan Sunburst är avsedd för mer detaljrika resultat och bättre konsekvens mellan redigeringar. Versionen stödjer GIF-animation och förbättrad kontroll över bildredigering. Enligt OpenAI är bildgenereringen upp till 50 procent snabbare än tidigare; det är ett leverantörspåstående, inte ett oberoende jämförelsetest.',deep:'API:et erbjuder Flare och Sunburst, kvalitets- och komplexitetsinställningar, bildmarkeringar samt SVG-export. Tillgången i ChatGPT omfattar alla abonnemangsnivåer; användningsgränser och API-priser kan variera. Något aktuellt oberoende jämförelsebetyg har ännu inte verifierats.',price:'Tillgänglig på alla ChatGPT-nivåer; API debiteras separat',tier:'lim',free:'tier',tags:['Bildgen','GIF','Redigering','API'],caps:['Text-till-bild','Bildredigering','GIF-animation','SVG-export i API'],pros:['Flare för snabbare iteration','Sunburst för detalj och konsekvens','Bildmarkeringar i API'],cons:['Oberoende jämförelsebetyg saknas','API-kostnad och användningsgränser varierar'],rating:null,tech:null,speed:null,pricev:null,pct:null,bdg:'new',ratingBasis:{type:'unrated',checkedAt:null},releaseSource:{url:URL,releasedAt:'2026-11-04',checkedAt:CHECKED},verification:{status:'partial',attemptedAt:CHECKED,checkedAt:null,lastSearchedAt:CHECKED,fields:['n','cats','sub','long','deep','tags','caps','pros'],requiredFields:12,method:'editorial-official-release',sources:[]},fieldChecks:{},lastAttemptAt:CHECKED,lastCheckError:'Fullständig pris- och jämförelsegranskning återstår'};
 Object.assign(p,release);delete p.sourceMonitor;
 const names=new Set(ALIASES.map(key));
 for(const n of state.news||[]){if((n.newPlatforms||[]).some(x=>names.has(key(x)))||names.has(key(n.plat)))n.platformIds=[...new Set([...(n.platformIds||[]),ID])];}
 for(const candidate of state.candidates||[]){if(names.has(key(candidate.name))){candidate.status='published';delete candidate.error;delete candidate.nextAttemptAt;}}
 return true;
}
// Future OpenAI releases: alert on a newer version from the official release index.
// Never fabricate pricing, capabilities, scores, or silently relabel an older model.
export async function monitorOfficialReleases(state,readSource,now){
 const p=state.platforms.find(x=>x.id===ID);if(!p)return;
 try{
  const text=await readSource(INDEX,['openai.com']);
  const current=p.n.match(/Images (\d+)\.(\d+)/);
  const matches=[...text.matchAll(/Introducing (?:ChatGPT )?Images (\d+)\.(\d+)/gi)];
  if(!current||!matches.length)throw Error('Official release index has no recognizable image version');
  const version=m=>Number(m[1])*1000+Number(m[2]);
  const latest=matches.sort((a,b)=>version(b)-version(a))[0];
  p.releaseWatch={checkedAt:now,status:version(latest)>version(current)?'new-version':'current',version:latest[1]+'.'+latest[2],url:INDEX};
 }catch(e){p.releaseWatch={...p.releaseWatch,checkedAt:now,status:'failed',url:INDEX};}
}
