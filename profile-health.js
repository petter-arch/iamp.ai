// Display verification age, not the time a news feed happened to be updated.
(function(root){
 'use strict';
 function status(p,now){var v=p.verification;if(!v)return p.lastCheckError?'failed':'unknown';var age=now-Date.parse(v.attemptedAt);if(!Number.isFinite(age)||age<0||age>26*3600000)return 'stale';if(v.status==='verified'){var checked=now-Date.parse(v.checkedAt);if(!Number.isFinite(checked)||checked<0||checked>26*3600000)return 'stale';}return ['verified','partial','failed','stale'].includes(v.status)?v.status:'unknown';}
 function label(p,now,lang){var s=status(p,now),en=lang==='en',v=p.verification||{};var text=({verified:en?'Verified':'Verifierad',partial:en?'Partly verified — older facts retained':'Delvis verifierad — tidigare fakta kvar',failed:en?'Check failed — previous facts shown':'Kontroll misslyckades — tidigare fakta visas',stale:en?'Needs a new check':'Behöver ny kontroll',unknown:en?'Not yet verified':'Ännu inte verifierad'})[s];if(s==='partial')text+=' ('+(v.fields||[]).length+'/'+(v.requiredFields||12)+')';var date=s==='verified'?v.checkedAt:v.attemptedAt||p.lastAttemptAt;if(Number.isFinite(Date.parse(date)))text+=' · '+new Date(date).toLocaleString(en?'en-GB':'sv-SE',{dateStyle:'short',timeStyle:'short'});return text;}
 function escape(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function ratingLabel(p,lang){return Number.isFinite(p.rating)&&p.ratingBasis?.type!=='independent-benchmark'?(lang==='en'?' · Historical editorial rating, not currently verified':' · Äldre redaktionellt betyg, ej aktuellt verifierat'):'';}
 // Public copy describes what has actually been checked, rather than internal audit counters.
 function reviewedFields(p,now){
  var records=[p.editorialReview,p.catalogueFacts,p.releaseSource&&p.verification?.method==='editorial-official-release'?{checkedAt:p.releaseSource.checkedAt,fields:p.verification.fields}:null];
  var v=p.verification;
  if(v&&['verified','partial'].includes(v.status)&&v.method==='official-sources-and-independent-audit')records.push({checkedAt:v.status==='verified'?v.checkedAt:v.attemptedAt,fields:v.fields});
  if(v?.status==='verified'&&v.checkedAt)records.push({checkedAt:v.checkedAt,fields:v.fields});
  var valid=records.filter(r=>r&&Array.isArray(r.fields)&&Number.isFinite(Date.parse(r.checkedAt))&&Date.parse(r.checkedAt)<=now);
  var fields=new Set(valid.flatMap(r=>r.fields));
  var latest=valid.map(r=>r.checkedAt).sort().at(-1);
  return {fields:fields,date:latest};
 }
 function publicLabel(p,now,lang){
  var en=lang==='en',r=reviewedFields(p,now),f=r.fields,parts=[];
  if(f.has('n'))parts.push(en?'model':'modell');
  if(f.has('price'))parts.push(en?'pricing':'pris');
  if(f.has('sub')&&f.has('long')&&f.has('caps'))parts.push(en?'features':'funktioner');
  var text=parts.length&&r.date?(en?'Sources reviewed: ':'Källgranskat: ')+parts.join(', ')+' · '+new Date(r.date).toLocaleDateString(en?'en-GB':'sv-SE',{day:'numeric',month:'short',year:'numeric'}):(en?'Product information awaits source review':'Produktuppgifter inväntar källgranskning');
  if(!f.has('price'))text+=en?' · Pricing not confirmed':' · Pris ej bekräftat';
  if(!(f.has('sub')&&f.has('long')&&f.has('caps'))&&parts.length)text+=en?' · Other features not confirmed':' · Övriga funktioner ej bekräftade';
  if(p.catalogueFacts?.monitor?.status==='needs-review'||p.sourceMonitor?.status==='changed'&&p.verification?.status==='stale')text+=en?' · Source changes under review':' · Källändring behöver följas upp';
  else if(p.catalogueFacts?.monitor?.status==='source-unavailable'||p.sourceMonitor?.status==='fetch-failed')text+=en?' · Latest source check unavailable':' · Senaste källkontroll ej tillgänglig';
  if(p.releaseWatch?.status==='new-version')text+=en?' · New version: '+p.releaseWatch.version+' (review pending)':' · Ny version: '+p.releaseWatch.version+' (granskning pågår)';
  if(p.auditReleaseWatch?.status==='candidate')text+=en?' · Possible newer version: '+p.auditReleaseWatch.name:' · Möjlig ny version: '+p.auditReleaseWatch.name;
  return text+ratingLabel(p,lang);
 }
 function fullLabel(p,now,lang){return publicLabel(p,now,lang);}
 function markup(p,now,lang){var official=["https://openai.com/index/introducing-images-2-6/","https://ideogram.ai/models/4.6/","https://seed.bytedance.com/en/blog/more-realistic-images-more-stable-editing-across-100-rounds-introducing-seedream-5-5","https://bfl.ai/blog/flux-3-image-klein/","https://docs.meshy.ai/en/api/models"];var link=official.includes(p.releaseSource?.url)?'<a class="nmeta" href="'+escape(p.releaseSource.url)+'" target="_blank" rel="noopener">'+(lang==='en'?'Official model source':'Officiell modellkälla')+'</a>':'';var reviewed=[...new Set([...(p.editorialReview?.sources||[]),...(p.catalogueFacts?.sources||[])])];var approved=['https://higgsfield.ai/camera-controls','https://higgsfield.ai/blog/higgsfield-pricing-explained','https://higgsfield.ai/creator-hub/changelog','https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5','https://seed.bytedance.com/en/seedance-enterprise/api','https://docs.byteplus.com/en/docs/modelark/model-pricing','https://developers.openai.com/api/docs/guides/image-generation','https://developers.openai.com/api/docs/pricing'];approved.push(...["https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version","https://docs.midjourney.com/hc/en-us/articles/27870484040333-Comparing-Midjourney-Plans","https://help.runwayml.com/hc/en-us/articles/46974685288467-Creating-with-Gen-4-5","https://help.runwayml.com/hc/en-us/articles/15124877443219-How-do-credits-work","https://deepmind.google/models/veo/","https://ai.google.dev/gemini-api/docs/pricing","https://bfl.ai/models/flux-3-image-klein","https://bfl.ai/pricing?category=flux+3+image","https://ideogram.ai/models/4.6/","https://developer.ideogram.ai/ideogram-api/models","https://docs.meshy.ai/en/api/models","https://docs.meshy.ai/en/api/pricing","https://elevenlabs.io/pricing","https://elevenlabs.io/music","https://www.heygen.com/pricing","https://www.adobe.com/products/firefly/plans.html","https://www.recraft.ai/pricing?tab=api","https://www.recraft.ai/blog/recraft-v4-1-more-beautiful-by-nature","https://deepmind.google/models/model-cards/nano-banana-2-1/","https://deepmind.google/models/model-cards/gemini-omni-1-2-flash/","https://developers.tripo3d.ai/en/models/v3-1","https://www.tripo3d.ai/blog/introducing-hd-model-v3-1"]);link+=reviewed.filter(u=>approved.includes(u)).map(function(u,i){return '<a class="nmeta" style="display:inline-block;margin-right:10px" href="'+escape(u)+'" target="_blank" rel="noopener">'+(lang==='en'?'Source ':'Källa ')+(i+1)+'</a>';}).join('');return '<div class="nmeta model-health" data-model-health="'+escape(p.id)+'" role="status">'+escape(fullLabel(p,now,lang))+'</div>'+link;}
 if(typeof module!=='undefined'&&module.exports)module.exports={status:status,label:label,markup:markup,publicLabel:publicLabel};
 if(!root||!root.document||typeof root.platCard!=='function')return;
 var original=root.platCard;
 root.platCard=function(p,pi){return original(p,pi).replace('<div class="nsum">',markup(p,Date.now(),root.LANG)+'<div class="nsum">');};
 function summary(){var data=root.siteState||{},now=Date.now(),en=root.LANG==='en';var text=en?'Trending is based on recent mentions in creative AI news.':'Trendar bygger på aktuella omnämnanden i kreativa AI-nyheter.';var stamp=data.trends?.calculatedAt;if(Number.isFinite(Date.parse(stamp)))text+=(en?' Updated: ':' Uppdaterad: ')+new Date(stamp).toLocaleString(en?'en-GB':'sv-SE',{dateStyle:'short',timeStyle:'short'})+'.';if(now-Date.parse(stamp)>26*3600000)text+=en?' Trend data needs refreshing.':' Trendunderlaget behöver uppdateras.';text+=en?' Trend position is not a quality rating.':' Trendplacering är inte ett kvalitetsbetyg.';return text;}
 if(typeof root.buildPlatforms==='function'){var build=root.buildPlatforms;root.buildPlatforms=function(){var result=build.apply(this,arguments),el=root.document.getElementById('plist');if(el){var note=root.document.createElement('div');note.className='nmeta model-health-summary';note.setAttribute('role','status');note.style.gridColumn='1 / -1';note.textContent=summary();el.prepend(note);}return result;};root.buildPlatforms();}
 function newsFailure(){
  var data=root.siteState||{},u=data.newsUpdate,en=root.LANG==='en',text='';
  if(u&&u.status==='failed')text=en?'Update failed — showing last saved news':'Uppdatering misslyckades — senast sparade nyheter visas';
  else if(u&&u.status==='deferred')text=en?'News partly checked — remaining review deferred by budget':'Nyheter delvis kontrollerade — återstående granskning väntar på budget';
  else if(Number.isFinite(Date.parse(data.newsCheckedAt)))text=(en?'News last checked: ':'Nyheter senast kontrollerade: ')+new Date(data.newsCheckedAt).toLocaleString(en?'en-GB':'sv-SE',{dateStyle:'short',timeStyle:'short'});
  var legacy=root.document.getElementById('news-stamp');if(legacy&&text)legacy.textContent=text;
  var host=root.document.getElementById('home-news'),notice=root.document.getElementById('news-health');
  if(host&&!notice){notice=root.document.createElement('div');notice.id='news-health';notice.className='nmeta';notice.setAttribute('role','status');host.before(notice);}
  if(notice){notice.textContent=text;notice.hidden=!text;}
 }
 if(typeof root.renderFeed==='function'){var feed=root.renderFeed;root.renderFeed=function(){var result=feed.apply(this,arguments);newsFailure();return result;};}
 if(typeof root.renderCmpCols==='function'){var compare=root.renderCmpCols;root.renderCmpCols=function(){var result=compare.apply(this,arguments),cols=root.document.querySelectorAll('#cmp-cols .cmp-col');cols.forEach(function(el,i){var p=(root.PLATS||[])[(root.cmpSet||[])[i]];if(p)el.insertAdjacentHTML('afterbegin',markup(p,Date.now(),root.LANG));});return result;};}
 if(typeof root.newsStamp==='function'){var stamp=root.newsStamp;root.newsStamp=function(){var result=stamp.apply(this,arguments);newsFailure();return result;};root.newsStamp();}
 function refreshLabels(){newsFailure();var models=new Map((root.PLATS||[]).map(function(p){return [p.id,p];}));root.document.querySelectorAll('[data-model-health]').forEach(function(el){var p=models.get(el.getAttribute('data-model-health'));if(p)el.textContent=fullLabel(p,Date.now(),root.LANG);});root.document.querySelectorAll('.model-health-summary').forEach(function(el){el.textContent=summary();});}
 // No polling or additional server requests. An open tab must also age honestly.
 root.setInterval(refreshLabels,60000);
 root.document.addEventListener('visibilitychange',function(){if(!root.document.hidden)refreshLabels();});
})(typeof window==='undefined'?null:window);
