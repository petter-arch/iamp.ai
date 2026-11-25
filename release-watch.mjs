// Official release corrections. Stable catalogue IDs are product-family IDs.
const URL='https://openai.com/index/introducing-images-2-6/';
const INDEX='https://openai.com/research/index/release/';
const CHECKED='2026-11-24T07:51:00.000Z';
const ID='chatgpt-images-2-0';
const ALIASES=['ChatGPT Images 2.6','Images 2.6','GPT Image 2.6','GPT-Image-2.6','GPT-Image-2.6 Flare','GPT-Image-2.6 Sunburst'];
const key=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[\s\-‑]+/g,'');
function applyOpenAIRelease(state){
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

// Editorial corrections based on official model pages, reviewed 2026-11-25.
const REVIEWED='2026-11-25T05:35:00.000Z';
const CATALOGUE_RELEASES=[
  {
    "id": "ideogram-v3",
    "old": "Ideogram V3",
    "n": "Ideogram 4.6",
    "aliases": [
      "Ideogram 4.6",
      "Ideogram v4.6"
    ],
    "url": "https://ideogram.ai/models/4.6/",
    "releasedAt": "2026-11-19",
    "cats": "image",
    "sub": "Bildgenerering och riktad redigering upp till 4K",
    "long": "Ideogram 4.6 släpptes den 19 november 2026. Modellen är inriktad på att göra avgränsade ändringar i en bild och fortsätta redigera samma motiv i flera omgångar. Den stöder bildgenerering och redigering med upp till 4K upplösning. Generate och Precise Edit finns som separata API-funktioner.",
    "deep": "Generate stöder upp till fem referensbilder. Precise Edit kan använda en mask för att avgränsa ändringar. Kvalitetslägena är Very low, Low, Medium och High; Very low stöder högst 2K. Tillverkarens publicerade jämförelser är inte ett eget oberoende test av iamp.ai.",
    "tags": [
      "Bildgen",
      "Redigering",
      "4K",
      "API"
    ],
    "caps": [
      "Text-till-bild",
      "Bildredigering",
      "Mask",
      "Referensbilder"
    ],
    "pros": [
      "Avgränsade ändringar",
      "Upp till 4K",
      "Separat API för precis redigering"
    ],
    "cons": [
      "Mycket låg kvalitet begränsad till 2K",
      "Aktuellt pris och oberoende betyg ej verifierade"
    ],
    "price": "Aktuellt pris inte verifierat",
    "tier": "unknown",
    "free": null
  },
  {
    "id": "seedream-4",
    "old": "Seedream 4",
    "n": "Seedream 5.5",
    "aliases": [
      "Seedream 5.5",
      "Seedream v5.5",
      "ByteDance Seedream 5.5"
    ],
    "url": "https://seed.bytedance.com/en/blog/more-realistic-images-more-stable-editing-across-100-rounds-introducing-seedream-5-5",
    "releasedAt": "2026-11-09",
    "cats": "image",
    "sub": "Multimodal bildgenerering och redigering i flera steg",
    "long": "ByteDance presenterade Seedream 5.5 den 9 november 2026. Modellen är avsedd för bildgenerering och riktad redigering med bättre bevarande av områden som inte ska ändras. Tillverkaren beskriver förbättrad bildrealism, textrendering och stabilitet när samma bild redigeras upprepade gånger.",
    "deep": "Seedream 5.5 har stöd för RGBA-utdata med transparens. ByteDance beskriver redigeringsarbetsflöden med upp till 100 omgångar; detta är tillverkarens uppgift och inte en garanti för alla bilder. En framtida Pro-variant nämns i lanseringen men ingår inte i denna profil.",
    "tags": [
      "Bildgen",
      "Redigering",
      "RGBA"
    ],
    "caps": [
      "Text-till-bild",
      "Bildredigering",
      "Transparens"
    ],
    "pros": [
      "Riktade ändringar i flera steg",
      "RGBA-utdata",
      "Fokus på bevarande av bilddetaljer"
    ],
    "cons": [
      "Aktuellt pris och oberoende betyg ej verifierade"
    ],
    "price": "Aktuellt pris inte verifierat",
    "tier": "unknown",
    "free": null
  },
  {
    "id": "flux-2",
    "old": "FLUX.2",
    "n": "FLUX 3 Image Klein",
    "aliases": [
      "FLUX 3 Image Klein",
      "FLUX-3-Image-Klein",
      "flux-3-image-klein"
    ],
    "url": "https://bfl.ai/blog/flux-3-image-klein/",
    "releasedAt": "2026-10-15",
    "cats": "image,open",
    "sub": "Bildmodell med öppna vikter och upp till tio referenser",
    "long": "Black Forest Labs lanserade FLUX 3 Image Klein den 15 oktober 2026. Bildmodellen har 5,6 miljarder parametrar och stöder generering från text, bildredigering och flera referensbilder. Den erbjuder 4K-generering och styrning med rektangulära områden för placering eller avgränsad redigering.",
    "deep": "Modellen finns med öppna vikter i bas- och destillerad variant samt i leverantörens API. Lanseringen beskriver pris från 0,009 USD för en bild i 1K; detta är lanseringspriset och inte en verifiering av dagens alla API-priser. Vikterna har särskilda licensvillkor, vilket bör kontrolleras inför kommersiell användning.",
    "tags": [
      "Bildgen",
      "Öppna vikter",
      "4K",
      "API"
    ],
    "caps": [
      "Text-till-bild",
      "Bildredigering",
      "Referensbilder",
      "Lokal körning"
    ],
    "pros": [
      "Öppna vikter",
      "Upp till tio referenser",
      "Avgränsad redigering"
    ],
    "cons": [
      "Licensvillkor måste kontrolleras",
      "Oberoende jämförelsebetyg saknas"
    ],
    "price": "Lanseringspris från 0,009 USD per 1K-bild; aktuellt pris ej verifierat",
    "tier": "unknown",
    "free": null
  },
  {
    "id": "meshy-ai",
    "old": "Meshy AI",
    "n": "Meshy 7.1",
    "aliases": [
      "Meshy 7.1",
      "meshy-7.1"
    ],
    "url": "https://docs.meshy.ai/en/api/models",
    "releasedAt": "2026-09-10",
    "cats": "3d",
    "sub": "3D-generering med detaljrik geometri",
    "long": "Meshy 7.1 är den detaljerade standardmodellen i Meshys aktuella API. Den stöder generering av 3D-geometri från bilder och text. Flera foton kan användas för att förbättra modellens överensstämmelse med ett verkligt föremål. Geometrimodell och texturmodell väljs separat i API:et.",
    "deep": "Meshys dokumentation anger att latest i API:et pekar på Meshy 7.1. Äldre Meshy 7 avvecklas för geometri den 31 december 2026 men finns kvar som texturmodell. För tillgångar som behöver lägre antal polygoner erbjuder leverantören andra modeller. Hög geometridetalj ska inte förväxlas med verifierade fysiska mått.",
    "tags": [
      "3D",
      "Geometri",
      "API",
      "Textur"
    ],
    "caps": [
      "Bild-till-3D",
      "Text-till-3D",
      "Flera referensbilder"
    ],
    "pros": [
      "Detaljrik geometri",
      "Stöd för flera foton",
      "Separat texturmodell"
    ],
    "cons": [
      "Meshy 7 för geometri avvecklas",
      "Fysiska mått och oberoende betyg ej verifierade"
    ],
    "price": "Aktuellt pris inte verifierat",
    "tier": "unknown",
    "free": null
  }
];
export function applyOfficialReleases(state){
 let changed=applyOpenAIRelease(state);
 for(const entry of CATALOGUE_RELEASES){
  const {id,old,releasedAt,...profile}=entry;
  const p=state.platforms.find(x=>x.id===id&&x.n===old);if(!p)continue;
  Object.assign(p,profile,{rating:null,tech:null,speed:null,pricev:null,pct:null,bdg:'new',ratingBasis:{type:'unrated',checkedAt:null},releaseSource:{url:profile.url,releasedAt,checkedAt:REVIEWED},verification:{status:'partial',attemptedAt:REVIEWED,checkedAt:null,lastSearchedAt:REVIEWED,fields:['n','cats','sub','long','deep','tags','caps','pros'],requiredFields:12,method:'editorial-official-release',sources:[]},fieldChecks:{},lastAttemptAt:REVIEWED,lastCheckError:'Fullständig pris- och jämförelsegranskning återstår'});
  delete p.sourceMonitor;
  const names=new Set(profile.aliases.map(key));
  for(const n of state.news||[]){if((n.newPlatforms||[]).some(x=>names.has(key(x)))||names.has(key(n.plat)))n.platformIds=[...new Set([...(n.platformIds||[]),id])];}
  for(const c of state.candidates||[]){if(names.has(key(c.name))){c.status='published';delete c.error;delete c.nextAttemptAt;}}
  changed=true;
 }
 return applyEditorialReviews(state)||changed;
}

// Source-based editorial corrections; independent benchmark scores remain unverified.
const EDITORIAL_DATE="2026-11-25T06:02:00.000Z";
const EDITORIAL_REVIEWS=[
  {
    "id": "higgsfield",
    "name": "Higgsfield",
    "sources": [
      "https://higgsfield.ai/camera-controls",
      "https://higgsfield.ai/blog/higgsfield-pricing-explained",
      "https://higgsfield.ai/creator-hub/changelog"
    ],
    "patch": {
      "price": "Begränsad gratisnivå; kreditbaserade abonnemang. Se aktuell prislista.",
      "tier": "lim",
      "free": "tier",
      "sub": "Filmisk kamerastyrning och flera AI-bild- och videomodeller",
      "long": "Higgsfield är en plattform för AI-genererade bilder och video. Kameraverktygen erbjuder bland annat åkning, panorering, kranrörelser och snabba zoomar. Plattformen samlar flera underliggande modeller; egenskaper, tillgängliga funktioner och kvalitet varierar mellan dem.",
      "deep": "Abonnemangen innehåller krediter. Förbrukningen påverkas av vald modell, klipplängd och upplösning. En begränsad gratisnivå finns, medan kampanjer och abonnemangspriser kan förändras. Kontrollera prislistan inför köp.",
      "tags": [
        "Video",
        "Kamerastyrning",
        "AI-bilder"
      ],
      "caps": [
        "Filmisk kamerastyrning",
        "Bildgenerering",
        "Videogenerering"
      ],
      "pros": [
        "Många kamerarörelser",
        "Flera modeller i samma plattform"
      ],
      "cons": [
        "Kreditåtgång varierar med modell och inställningar",
        "Oberoende jämförelsebetyg saknas"
      ]
    }
  },
  {
    "id": "seedance-2-5",
    "name": "Seedance 2.5",
    "sources": [
      "https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5",
      "https://seed.bytedance.com/en/seedance-enterprise/api",
      "https://docs.byteplus.com/en/docs/modelark/model-pricing"
    ],
    "patch": {
      "price": "Officiellt Seedance API: 7,68–14,04 USD/miljon token, beroende på upplösning och videoindata. Partnerpriser varierar.",
      "tier": "paid",
      "free": false,
      "sub": "Video och ljud i upp till 30 sekunder med referensstyrning",
      "long": "ByteDance lanserade Seedance 2.5 den 31 juli 2026. Modellen skapar synkroniserat ljud och video i klipp på upp till 30 sekunder och stöder upprepad förlängning. Upp till 30 bilder, tio videoklipp och tio ljudklipp kan användas som referenser. Redigering kan styras tidsmässigt i klippet.",
      "deep": "Den officiella Seedance API-prislistan anger 12,84 USD per miljon token i 480p/720p utan videoindata, och 7,68 USD med videoindata. Motsvarande priser i 1080p är 14,04 respektive 8,40 USD. Kostnaden påverkas av längd, upplösning och bildfrekvens. BytePlus och andra leverantörer har egna priser och tillgänglighet.",
      "tags": [
        "Video",
        "Ljud",
        "Referenser"
      ],
      "caps": [
        "Text-till-video",
        "Multimodala referenser",
        "Videoförlängning",
        "Tidsstyrd redigering"
      ],
      "pros": [
        "Upp till 30 sekunder per generering",
        "Flera typer av referensmaterial"
      ],
      "cons": [
        "Kostnad varierar med upplösning och längd",
        "Oberoende jämförelsebetyg saknas"
      ]
    }
  },
  {
    "id": "chatgpt-images-2-0",
    "name": "ChatGPT Images 2.6",
    "sources": [
      "https://openai.com/index/introducing-images-2-6/",
      "https://developers.openai.com/api/docs/guides/image-generation",
      "https://developers.openai.com/api/docs/pricing"
    ],
    "patch": {
      "price": "API standard: text in 5 USD, bild in 8 USD, bild ut 30 USD per miljon token (Flare/Sunburst).",
      "sub": "Bildgenerering, precis redigering, GIF och SVG via API",
      "long": "OpenAI lanserade Images 2.6 den 4 november 2026. Flare är inriktad på snabb iteration, medan Sunburst är avsedd för detaljrik bildgenerering. Båda modellerna stöder bildredigering, bildmarkeringar, GIF och SVG via bild-API:et. Tillverkaren beskriver förbättrad konsekvens vid upprepade redigeringar.",
      "deep": "För båda modellerna är standardpriset per miljon token 5 USD för textindata, 8 USD för bildindata och 30 USD för bildutdata. Cachade text- och bildindata kostar 1,25 respektive 2 USD. Batchpriser är lägre. Komplexitet och kvalitetsinställningar är separata reglage; faktisk kostnad per bild beror på användningen. ChatGPT-abonnemang och API-fakturering har separata villkor.",
      "tags": [
        "Bildgen",
        "Redigering",
        "GIF",
        "API"
      ],
      "caps": [
        "Text-till-bild",
        "Bildredigering",
        "GIF",
        "SVG",
        "Komplexitetsstyrning"
      ],
      "pros": [
        "Flare för snabb iteration",
        "Sunburst för detaljer",
        "Styrning av komplexitet"
      ],
      "cons": [
        "Kostnad beror på tokenförbrukning",
        "Oberoende jämförelsebetyg saknas"
      ]
    }
  }
];
export function applyEditorialReviews(state){
 let changed=false;
 for(const review of EDITORIAL_REVIEWS){
  const p=state.platforms.find(x=>x.id===review.id&&x.n===review.name);if(!p||p.editorialReview?.checkedAt>=EDITORIAL_DATE||p.verification?.checkedAt>EDITORIAL_DATE)continue;
  const fields=['n','cats',...Object.keys(review.patch).filter(f=>!['pros','cons','tier','free'].includes(f))];
  if(Number.isFinite(p.rating)&&p.ratingBasis?.type!=='independent-benchmark'){p.historicalRating={rating:p.rating,tech:p.tech,speed:p.speed,pricev:p.pricev,basis:p.ratingBasis||null};Object.assign(p,{rating:null,tech:null,speed:null,pricev:null,pct:null,ratingBasis:{type:'unrated',checkedAt:null}});}
  Object.assign(p,review.patch);p.editorialReview={checkedAt:EDITORIAL_DATE,fields,sources:review.sources};
  p.verification={status:'partial',attemptedAt:EDITORIAL_DATE,checkedAt:null,lastSearchedAt:EDITORIAL_DATE,fields,requiredFields:12,method:'editorial-official-sources',sources:[]};
  p.fieldChecks={};p.lastAttemptAt=EDITORIAL_DATE;p.lastCheckError='Fullständig oberoende faktagranskning återstår';changed=true;
 }
 return changed;
}
