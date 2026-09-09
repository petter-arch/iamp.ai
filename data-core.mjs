// Shared, deterministic rules. No API calls and no generated ratings.
export const DAY = 86400000;
export const CATS = ['foto', 'film', 'ljud', '3d', 'mdl', 'tech', 'robot'];
export const idFor = p => p.id || p.n.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const ageDays = (date, now) => (Date.parse(now) - Date.parse(date)) / DAY;
export function videoId(url) {
  try { const u = new URL(url); return u.hostname === 'youtu.be' ? u.pathname.slice(1) : /(^|\.)youtube\.com$/.test(u.hostname) ? u.searchParams.get('v') : null; } catch { return null; }
}
export const articleKey = n => n.id || videoId(n.url) || n.url || n.ttl;
export function mergeNews(old, incoming) {
  const map = new Map(old.map(n => [articleKey(n), n]));
  for (const n of incoming) map.set(articleKey(n), {...map.get(articleKey(n)), ...n});
  return [...map.values()].sort((a,b) => Date.parse(b.date) - Date.parse(a.date));
}
export function durationSeconds(iso) {
  const m = String(iso).match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  return m ? (+m[1] || 0)*3600 + (+m[2] || 0)*60 + (+m[3] || 0) : 0;
}
export function chapters(description, duration) {
  const found = new Map();
  for (const line of description.split('\n')) {
    const m = line.match(/^\s*(?:[•\-*]\s*)?\[?(?:(\d{1,3}):)?(\d{1,2}):(\d{2})\]?\s*[-–—|:]?\s+(.+?)\s*$/);
    if (!m || +m[3] > 59 || (m[1] && +m[2] > 59)) continue;
    const t = (+m[1] || 0)*3600 + (+m[2])*60 + (+m[3]);
    if (duration > 0 && t >= duration) continue;
    if (!found.has(t)) found.set(t, {t, l:m[4]});
  }
  return [...found.values()].sort((a,b) => a.t-b.t); // ALL available chapters.
}
export function validateArticle(n, now) {
  if (!n || !CATS.includes(n.cat) || !n.ttl || !n.sum || !n.full || !n.deep) throw Error('Incomplete article');
  if (!Number.isFinite(ageDays(n.date, now)) || ageDays(n.date, now) < 0) throw Error('Invalid publication date');
  if (!videoId(n.url)) throw Error('Missing video source');
  for (const f of ['ttl','sum','full','deep']) if (typeof n[f] !== 'string' || /[<>]/.test(n[f])) throw Error('Article must be plain text');
  if (n.parts?.some(p => !Number.isFinite(p.t) || p.t < 0 || typeof p.l !== 'string' || /[<>]/.test(p.l))) throw Error('Invalid chapters');
  return n;
}
export function fairSelection(items, perCategory = 2) {
  const selected = [], counts = {};
  for (const n of [...items].sort((a,b) => Date.parse(b.date)-Date.parse(a.date))) {
    if ((counts[n.cat] || 0) >= perCategory) continue;
    counts[n.cat] = (counts[n.cat] || 0)+1;
    selected.push(n);
  }
  return selected;
}
export function trends(news, platforms, now) {
  const seen = new Set(), scores = Object.fromEntries(platforms.map(p => [idFor(p), 0]));
  const channels = {};
  for (const n of news) {
    if(n.editorialStatus && n.editorialStatus!=='approved')continue;
    const age = ageDays(n.date, now), key = articleKey(n);
    if (!Number.isFinite(age) || age < 0 || age > 30 || seen.has(key)) continue;
    seen.add(key);
    for (const p of platforms) {
      const id = idFor(p), names = [p.n,...(p.aliases || [])];
      // Exact resolved references, never a substring such as "Flux" inside "Flux Pro".
      if (!(n.platformIds || []).includes(id) && !names.includes(n.plat)) continue;
      const channel = n.chans?.[0] || n.meta?.split(' · ')[0] || key;
      const ck = id + ':' + channel;
      if ((channels[ck] || 0) >= 3) continue;
      channels[ck] = (channels[ck] || 0)+1;
      scores[id] += Math.pow(0.5, age/7); // Unique recent videos; no view-count barrier.
    }
  }
  return scores;
}
export function focusedSelection(items, limit=20) {
  const group=n=>['foto','film'].includes(n.cat)?0:['ljud','3d'].includes(n.cat)?1:2;
  const pools=[[],[],[]],out=[],seen=new Set();
  for(const n of [...items].sort((a,b)=>(Number(b.trusted)-Number(a.trusted))||Date.parse(b.date)-Date.parse(a.date))) {
    const key=articleKey(n);if(seen.has(key))continue;seen.add(key);pools[group(n)].push(n);
  }
  const pattern=[0,0,1,0,0,2,0,1,0,0];let tech=0;
  for(let i=0;i<limit;i++) {
    let g=pattern[i%10];if(g===2&&tech>=Math.floor(limit*.1))g=0;
    let n=pools[g].shift();if(!n)n=pools[0].shift()||pools[1].shift();
    if(n){out.push(n);if(group(n)===2)tech++;}
  }
  let general=0;
  const allowed=Math.floor(out.filter(n=>group(n)!==2).length/9);
  return out.filter(n=>group(n)!==2||++general<=allowed);
}
export function validateNewProfile(p) {
  if(!p||!p.n||!p.url||!['image','video','audio','3d','upscale','open'].includes(p.cats))throw Error('Invalid model identity');
  const u=new URL(p.url);if(u.protocol!=='https:'||u.username||u.password)throw Error('Invalid model URL');
  for(const k of ['n','sub','long','deep','price'])if(typeof p[k]!=='string'||!p[k].trim()||/[<>]/.test(p[k]))throw Error('Missing model detail '+k);
  for(const k of ['pros','cons','tags','caps'])if(!Array.isArray(p[k])||!p[k].length||p[k].some(s=>typeof s!=='string'||!s.trim()||/[<>]/.test(s)))throw Error('Missing model detail '+k);
  if(!['free','lim','paid','unknown'].includes(p.tier))throw Error('Invalid pricing tier');
  return {...p,id:idFor(p),ico:({image:'📷',video:'🎬',audio:'🎵','3d':'🧊',upscale:'🔍',open:'🧠'})[p.cats],bg:'rgba(121,184,230,.14)',rating:null,tech:null,speed:null,pricev:null,pct:null,bdg:'new',free:p.tier==='free'||p.tier==='lim',ratingBasis:{type:'unrated',checkedAt:null}};
}
export function mergeProfile(p, patch, evidence, now) {
  const fields = ['price','sub','long','deep','tags','caps','pros','cons','tier','free'];
  const next = {...p}, checked = {...p.fieldChecks};
  for (const f of fields) {
    if (!(f in patch)) continue;
    const proof = evidence[f];
    if (!proof?.length || proof.some(e => !e.url || !e.quote || !e.fetched)) throw Error('Missing retrieved evidence for '+f);
    const v = patch[f];
    if (['tags','caps','pros','cons'].includes(f) ? !Array.isArray(v) || !v.length || v.some(x => typeof x !== 'string' || !x.trim() || /[<>]/.test(x)) : f === 'free' ? ![false,'tier',true].includes(v) : typeof v !== 'string' || !v.trim() || /[<>]/.test(v)) throw Error('Invalid profile field '+f);
    if (f === 'tier' && !['free','lim','paid'].includes(v)) throw Error('Invalid tier');
    next[f] = v;
    checked[f] = {checkedAt:now, sources:proof.map(({url,quote}) => ({url,quote}))};
  }
  // Scores and model identity are editorial records; keep their provenance.
  next.fieldChecks = checked;
  next.lastAttemptAt = now;
  return next;
}

export function isSwedishArticle(text) {
  const words=new Set(String(text).toLowerCase().match(/[a-zåäö]+/g)||[]);
  return ['och','att','är','som','enligt','för','med','till','kan','inte','har','på','av','nya','den','det','ett'].filter(w=>words.has(w)).length>=5;
}
export function supportedAIQuote(quote,title,description) {
  if(typeof quote!=='string'||quote.length<15||quote.length>700)return false;
  const norm=x=>String(x).toLowerCase().replace(/\s+/g,' ').trim();
  const source=norm(title+' '+description);
  return source.includes(norm(quote)) && /\b(ai|artificial intelligence|machine learning|generative|neural|diffusion|llm)\b/i.test(quote);
}
export function retainSourceOnFailure(source,previous,message) {
  return {...source,youtubeId:previous?.youtubeId||null,subscriberCount:previous?.subscriberCount??null,checkedAt:previous?.checkedAt??null,lastError:message};
}

export function sourceSegments(title,description) {
 return [title,...String(description).split(/\n+/)].flatMap(t=>String(t).match(/.{1,450}(?:\s|$)|.+/g)||[]).map(t=>t.trim()).filter(Boolean).map((text,id)=>({id,text}));
}
export function selectedAIProof(ids,segments) {
 if(!Array.isArray(ids)||!ids.length||ids.length>3||ids.some(id=>!Number.isInteger(id)||!segments.some(s=>s.id===id)))return null;
 const text=ids.map(id=>segments.find(s=>s.id===id).text).join(' ');
 if(!/\b(ai|artificial intelligence|machine learning|generative|neural|diffusion|llm|gpt|chatgpt|claude|midjourney|seedance|firefly|elevenlabs|suno|udio)\b/i.test(text))return null;
 return {ids,quote:text.split(/\s+/).slice(0,25).join(' ')};
}
