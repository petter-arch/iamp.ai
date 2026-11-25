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
 const editorial=applyEditorialReviews(state);const catalogue=applyCatalogueFacts(state);return catalogue||editorial||changed;
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

// Specific source-backed fields; do not certify an entire profile from a price page.
export const CATALOGUE_FACTS=[
  {
    "id": "midjourney-v8-2",
    "name": "Midjourney V8.2",
    "sources": [
      "https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version",
      "https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans"
    ],
    "patch": {
      "price": "Abonnemang: 10, 30, 60 eller 120 USD/mån. Årsbetalning ger rabatt.",
      "tier": "paid",
      "free": false
    },
    "markers": [
      {
        "url": "https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version",
        "all": [
          "default",
          "V8.2"
        ]
      },
      {
        "url": "https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans",
        "all": [
          "Monthly Price",
          "$10",
          "$30",
          "$60",
          "$120"
        ]
      }
    ]
  },
  {
    "id": "runway-gen-4-5",
    "name": "Runway Gen-4.5",
    "sources": [
      "https://help.runwayml.com/hc/en-us/articles/46974685288467-Creating-with-Gen-4-5",
      "https://help.runwayml.com/hc/en-us/articles/15124877443219-How-do-credits-work"
    ],
    "patch": {
      "price": "Gen-4.5: 12 krediter/sekund; Standard eller högre krävs.",
      "sub": "Text- och bildstyrd video i 2–10 sekunder",
      "tier": "paid",
      "free": false
    },
    "markers": [
      {
        "url": "https://help.runwayml.com/hc/en-us/articles/46974685288467-Creating-with-Gen-4-5",
        "all": [
          "12 credits per second",
          "Standard and higher",
          "2 - 10 seconds"
        ]
      }
    ]
  },
  {
    "id": "google-veo-3-1",
    "name": "Google Veo 3.1",
    "sources": [
      "https://deepmind.google/models/veo/",
      "https://ai.google.dev/gemini-api/docs/pricing"
    ],
    "patch": {
      "price": "API med ljud: Lite 0,05–0,08; Fast 0,10–0,30; Standard 0,40–0,60 USD/sekund beroende på upplösning.",
      "tier": "paid",
      "free": false
    },
    "markers": [
      {
        "url": "https://ai.google.dev/gemini-api/docs/pricing",
        "all": [
          "Veo 3.1",
          "$0.40",
          "$0.60",
          "$0.05",
          "$0.08",
          "$0.30"
        ]
      }
    ]
  },
  {
    "id": "flux-2",
    "name": "FLUX 3 Image Klein",
    "sources": [
      "https://bfl.ai/models/flux-3-image-klein",
      "https://bfl.ai/pricing?category=flux+3+image"
    ],
    "patch": {
      "price": "API per bild: 768 px 0,008; 1K 0,009; 1,5K 0,011; 2K 0,014; 4K 0,036 USD. Lokala vikter under licens.",
      "tier": "paid",
      "free": false
    },
    "markers": [
      {
        "url": "https://bfl.ai/pricing?category=flux+3+image",
        "all": [
          "FLUX 3 Image Klein",
          "$0.008",
          "$0.009",
          "$0.011",
          "$0.014",
          "$0.036"
        ]
      }
    ]
  },
  {
    "id": "ideogram-v3",
    "name": "Ideogram 4.6",
    "sources": [
      "https://ideogram.ai/models/4.6/",
      "https://developer.ideogram.ai/ideogram-api/models"
    ],
    "patch": {
      "price": "API: generering 0,008–0,20 USD/bild; redigering 0,008–0,60 USD/bild, beroende på kvalitet och upplösning.",
      "tier": "paid",
      "free": false
    },
    "markers": [
      {
        "url": "https://ideogram.ai/models/4.6/",
        "all": [
          "Ideogram 4.6",
          "$0.008",
          "$0.20",
          "$0.60"
        ]
      }
    ]
  },
  {
    "id": "meshy-ai",
    "name": "Meshy 7.1",
    "sources": [
      "https://docs.meshy.ai/en/api/models",
      "https://docs.meshy.ai/en/api/pricing"
    ],
    "patch": {
      "price": "API: geometri 20 krediter, med textur 30–35; högre geometriupplösning +5 krediter.",
      "tier": "paid",
      "free": false,
      "deep": "Meshy 7.1 är standardvalet för detaljrik geometri. Meshy 7 fasas ut som geometrimodell 31 december 2026 men finns kvar för texturering. Geometri kostar 20 API-krediter; 2K eller 4K geometriupplösning kostar 5 extra. 4K är inte tillgängligt för Multi-Image to 3D. Texturmodell väljs separat. Fysiska mått och topologi måste kontrolleras för varje tillgång."
    },
    "markers": [
      {
        "url": "https://docs.meshy.ai/en/api/models",
        "all": [
          "meshy-7.1",
          "20",
          "4k"
        ]
      },
      {
        "url": "https://docs.meshy.ai/en/api/pricing",
        "all": [
          "20 credits",
          "30 credits",
          "35 credits"
        ]
      }
    ]
  },
  {
    "id": "elevenlabs",
    "name": "ElevenLabs",
    "sources": [
      "https://elevenlabs.io/pricing"
    ],
    "patch": {
      "price": "Gratisnivå; Starter ordinarie 6 USD/mån, 30 000 krediter. Introduktionserbjudanden varierar.",
      "tier": "lim",
      "free": "tier"
    },
    "markers": [
      {
        "url": "https://elevenlabs.io/pricing",
        "all": [
          "$6 per month",
          "30k credits"
        ]
      }
    ]
  },
  {
    "id": "elevenmusic",
    "name": "ElevenMusic",
    "sources": [
      "https://elevenlabs.io/music"
    ],
    "patch": {
      "price": "Gratisnivå för begränsad personlig användning. Starter 6, Creator 22, Pro 99 USD/mån (ordinarie).",
      "tier": "lim",
      "free": "tier"
    },
    "markers": [
      {
        "url": "https://elevenlabs.io/music",
        "all": [
          "$6 per month",
          "$22 per month",
          "$99 per month"
        ]
      }
    ]
  },
  {
    "id": "heygen",
    "name": "HeyGen",
    "sources": [
      "https://www.heygen.com/pricing"
    ],
    "patch": {
      "price": "Gratis: 3 vattenmärkta videor/mån. Creator 29, Pro 49, Business 149 USD/mån.",
      "tier": "lim",
      "free": "tier",
      "sub": "AI-avatarer, videoproduktion och lokalisering med flera modeller"
    },
    "markers": [
      {
        "url": "https://www.heygen.com/pricing",
        "all": [
          "$29",
          "$49",
          "$149",
          "3 videos a month"
        ]
      }
    ]
  },
  {
    "id": "adobe-firefly",
    "name": "Adobe Firefly",
    "sources": [
      "https://www.adobe.com/products/firefly/plans.html"
    ],
    "patch": {
      "price": "Gratis begränsad nivå. Standard 9,99; Pro 19,99; Pro Plus 49,99 USD/mån (ordinarie).",
      "tier": "lim",
      "free": "tier"
    },
    "markers": [
      {
        "url": "https://www.adobe.com/products/firefly/plans.html",
        "all": [
          "US$9.99",
          "US$19.99",
          "US$49.99",
          "2,000"
        ]
      }
    ]
  },
  {
    "id": "recraft-v4-1",
    "name": "Recraft V4.1",
    "sources": [
      "https://www.recraft.ai/pricing?tab=api",
      "https://www.recraft.ai/blog/recraft-v4-1-more-beautiful-by-nature"
    ],
    "patch": {
      "price": "API: V4.1 0,035; Vector 0,08; Pro 0,21; Pro Vector 0,30 USD/bild.",
      "tier": "paid",
      "free": false
    },
    "markers": [
      {
        "url": "https://www.recraft.ai/pricing?tab=api",
        "all": [
          "V4.1",
          "$0.035",
          "$0.08",
          "$0.21",
          "$0.3"
        ]
      }
    ]
  },
  {
    "id": "nano-banana-pro",
    "name": "Nano Banana Pro",
    "sources": [
      "https://ai.google.dev/gemini-api/docs/pricing"
    ],
    "patch": {
      "price": "Gemini API: bildutdata ca 0,134 USD (1K/2K) eller 0,24 USD (4K); indata tillkommer.",
      "tier": "paid",
      "free": false
    },
    "markers": [
      {
        "url": "https://ai.google.dev/gemini-api/docs/pricing",
        "all": [
          "Nano Banana Pro",
          "$0.134",
          "$0.24"
        ]
      }
    ]
  },
  {
    "id": "nano-banana-2",
    "name": "Nano Banana 2",
    "newName": "Nano Banana 2.1",
    "aliases": [
      "Nano Banana 2.1",
      "Gemini Nano Banana 2.1",
      "gemini-nano-banana-2.1"
    ],
    "sources": [
      "https://deepmind.google/models/model-cards/nano-banana-2-1/",
      "https://ai.google.dev/gemini-api/docs/pricing"
    ],
    "patch": {
      "url": "https://deepmind.google/models/model-cards/nano-banana-2-1/",
      "price": "API: bildutdata 0,0336 USD (1K), 0,0504 USD (2K), 0,113 USD (4K); indata tillkommer.",
      "tier": "paid",
      "free": false,
      "sub": "Multimodal bildgenerering och redigering i 1K–4K",
      "long": "Nano Banana 2.1 är Googles uppdatering av Nano Banana 2, baserad på Gemini 3.6 Flash. Modellen kan behandla text och bilder och generera både bild och text. Google beskriver förbättringar för redigering i flera omgångar, text i bilder och bibehållen produkt- och karaktärskonsistens.",
      "deep": "API-modellen gemini-nano-banana-2.1 stöder 1K, 2K och 4K. Bildutdata debiteras med 30 USD per miljon token; indata med 1,50 USD per miljon token. Textutdata och eventuell sökgrundning har separata priser. Tillverkarens tester är inte ett oberoende iamp.ai-betyg.",
      "tags": [
        "Bildgen",
        "Redigering",
        "4K"
      ],
      "caps": [
        "Text-till-bild",
        "Bildredigering",
        "Multimodala indata"
      ],
      "pros": [
        "Bildredigering i flera steg",
        "Stöd för flera upplösningar"
      ],
      "cons": [
        "API saknar fri nivå",
        "Oberoende jämförelsebetyg saknas"
      ]
    },
    "markers": [
      {
        "url": "https://deepmind.google/models/model-cards/nano-banana-2-1/",
        "all": [
          "Nano Banana 2.1",
          "Gemini 3.6 Flash"
        ]
      },
      {
        "url": "https://ai.google.dev/gemini-api/docs/pricing",
        "all": [
          "gemini-nano-banana-2.1",
          "$0.0336",
          "$0.0504",
          "$0.113"
        ]
      }
    ]
  },
  {
    "id": "gemini-omni-flash",
    "name": "Gemini Omni Flash",
    "newName": "Gemini Omni 1.2 Flash",
    "aliases": [
      "Gemini Omni 1.2 Flash",
      "Gemini Omni Flash 1.2",
      "gemini-omni-1.2-flash"
    ],
    "sources": [
      "https://deepmind.google/models/model-cards/gemini-omni-1-2-flash/"
    ],
    "patch": {
      "url": "https://deepmind.google/models/model-cards/gemini-omni-1-2-flash/",
      "price": "Tillgänglig via Gemini API; exakt pris för version 1.2 behöver verifieras separat.",
      "tier": "unknown",
      "free": null,
      "sub": "Multimodal videogenerering och konversationsbaserad redigering",
      "long": "Gemini Omni 1.2 Flash presenterades i november 2026. Modellen tar emot text, bilder, ljud och video och genererar högupplöst video med ljud. Den bygger på Gemini Omni Flash och kan användas för att skapa video eller redigera video genom dialog.",
      "deep": "Googles modellkort anger tillgänglighet genom bland annat Gemini, Flow, AI Studio och Gemini API. Pris och upplösningsgränser måste knytas till den exakta API-versionen; priset för den äldre 1.1-versionen ska inte automatiskt återanvändas. Oberoende jämförelsebetyg saknas.",
      "tags": [
        "Video",
        "Ljud",
        "Redigering"
      ],
      "caps": [
        "Multimodala indata",
        "Videogenerering",
        "Videoredigering"
      ],
      "pros": [
        "Flera typer av indata",
        "Redigering genom dialog"
      ],
      "cons": [
        "Exakt API-pris behöver verifieras"
      ]
    },
    "markers": [
      {
        "url": "https://deepmind.google/models/model-cards/gemini-omni-1-2-flash/",
        "all": [
          "Gemini Omni 1.2 Flash",
          "video with audio"
        ]
      }
    ]
  },
  {
    "id": "tripo-3-1",
    "name": "Tripo 3.1",
    "newName": "Tripo H3.1",
    "aliases": [
      "Tripo H3.1",
      "Tripo 3.1",
      "Tripo v3.1"
    ],
    "sources": [
      "https://developers.tripo3d.ai/en/models/v3-1",
      "https://www.tripo3d.ai/blog/introducing-hd-model-v3-1"
    ],
    "patch": {
      "url": "https://developers.tripo3d.ai/en/models/v3-1",
      "price": "API: text till 3D 0,10–0,40 USD; bild/multiview 0,20–0,50 USD beroende på textur. Extra funktioner tillkommer.",
      "tier": "paid",
      "free": false,
      "sub": "Detaljrik 3D-geometri med PBR-texturer",
      "long": "Tripo H3.1 är en högdetaljerad modell för 3D-tillgångar. Den tar emot text, en bild eller flera vyer och kan skapa mesh med PBR-material. Den dokumenterade modellversionen är v3.1-20260211. Upp till två miljoner polygoner kan användas med inställningen för detaljerad geometri.",
      "deep": "API:ets grundpris utan textur är 0,10 USD från text och 0,20 USD från bild eller flera vyer. Med 8K-textur blir motsvarande priser 0,40 och 0,50 USD. Detaljerad geometri kostar ytterligare 0,20 USD. Tillverkarens angivna tider varierar med textur och inställning; faktiska mått och topologi behöver kontrolleras.",
      "tags": [
        "3D",
        "PBR",
        "Geometri"
      ],
      "caps": [
        "Text-till-3D",
        "Bild-till-3D",
        "Multi-view",
        "PBR"
      ],
      "pros": [
        "Hög detaljnivå i geometri",
        "Flera inmatningssätt"
      ],
      "cons": [
        "Extra kostnad för detalj och textur",
        "Oberoende jämförelsebetyg saknas"
      ]
    },
    "markers": [
      {
        "url": "https://developers.tripo3d.ai/en/models/v3-1",
        "all": [
          "Tripo H3.1",
          "$0.10",
          "$0.50",
          "v3.1-20260211"
        ]
      }
    ]
  }
];
const FACT_DATE='2026-11-25T06:10:00.000Z';
export function applyCatalogueFacts(state){
 let changed=false;
 for(const review of CATALOGUE_FACTS){
  const p=state.platforms.find(x=>x.id===review.id&&(x.n===review.name||x.n===review.newName));if(!p||p.catalogueFacts?.checkedAt>=FACT_DATE||p.verification?.checkedAt>FACT_DATE)continue;
  const renamed=!!review.newName&&p.n!==review.newName;
  if(renamed){p.historicalRating={rating:p.rating??null,tech:p.tech??null,speed:p.speed??null,pricev:p.pricev??null,basis:p.ratingBasis||null};Object.assign(p,{n:review.newName,aliases:review.aliases,rating:null,tech:null,speed:null,pricev:null,pct:null,ratingBasis:{type:'unrated',checkedAt:null},bdg:'new'});const names=new Set(review.aliases.map(key));for(const n of state.news||[])if((n.newPlatforms||[]).some(x=>names.has(key(x)))||names.has(key(n.plat)))n.platformIds=[...new Set([...(n.platformIds||[]),p.id])];}
  Object.assign(p,review.patch);
  const fields=['n',...Object.keys(review.patch).filter(f=>!['url','pros','cons','tier','free'].includes(f))].filter(f=>!(review.id==='gemini-omni-flash'&&f==='price'));
  p.catalogueFacts={checkedAt:FACT_DATE,fields,sources:review.sources,markers:review.markers};
  const previous=(!renamed&&(p.verification?.status==='partial'||p.verification?.status==='verified'))?(p.verification.fields||[]):[];
  p.verification={status:'partial',attemptedAt:FACT_DATE,checkedAt:null,fields:[...new Set([...previous,...fields])],requiredFields:12,method:'editorial-specific-fields',sources:[]};
  if(renamed)p.fieldChecks={};
  p.lastAttemptAt=FACT_DATE;p.lastCheckError='Fullständig faktagranskning återstår';changed=true;
 }
 return changed;
}
