import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdtemp,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {refreshState,FIELDS,DAY,candidatesFor,candidateDue,health,quoteInSource,officialURL,publicAddress} from './profile-refresh.mjs';
const require=createRequire(import.meta.url),ui=require('./profile-health.js'),run=promisify(execFile);
const NOW='2026-10-23T08:00:00.000Z',MS=Date.parse(NOW),KEYS=['n','cats',...FIELDS];
const TEXT='Fixture 1 is an AI image editing model. This official documentation describes its supported features and current pricing.';
const URL='https://example.com/docs';
const p=(id='fixture-1')=>({id,n:'Fixture 1',url:'https://example.com',cats:'image',price:'10 USD per månad',sub:'Bildredigering',long:'Det här är en utförlig beskrivning av bildverktyget. '.repeat(9),deep:'Fördjupning om bildverktygets möjligheter och begränsningar. '.repeat(5),tags:['Bild'],caps:['Redigering'],pros:['Maskredigering'],cons:['Kräver internet'],tier:'paid',free:false,rating:88,tech:90,speed:70,pricev:80,fieldChecks:{}});
const state=(platforms=[p()])=>({schemaVersion:1,updatedAt:'2026-10-01T00:00:00Z',newsCheckedAt:'2026-10-23T07:00:00Z',platforms,news:[],sources:[],candidates:[]});
const evidence=(fields=KEYS)=>Object.fromEntries(fields.map(f=>[f,[{url:URL,quote:'Fixture 1 is an AI image editing model.'}]]));
const completeAsk=async(prompt,{search,phase})=>(search||phase==='proposal')?{patch:{},evidence:evidence()}:{approvedFields:KEYS};
const options={now:NOW,clock:()=>MS,readSource:async()=>TEXT};

test('all 49 existing profiles are attempted, failures isolated, at most three concurrent',async()=>{
 let active=0,max=0;
 const platforms=Array.from({length:49},(_,i)=>({...p('p'+i),n:'Model '+i}));
 const ask=async prompt=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,2));active--;if(prompt.includes('"n":"Model 4"'))throw Error('Source unavailable');return {patch:{},evidence:{}};};
 const original=state(platforms),copy=structuredClone(original);
 const {state:out,report}=await refreshState(original,{...options,ask});
 assert.equal(report.attempted,49);assert.equal(report.skipped,0);assert.equal(max,3);assert.equal(out.platforms.length,49);
 assert(out.platforms.every(x=>x.lastAttemptAt===NOW));assert.equal(out.platforms[4].long,platforms[4].long);assert.equal(out.platforms[4].verification.status,'failed');assert.deepEqual(original,copy);
 assert.equal(out.profileChecks.newsCheckedAt,original.newsCheckedAt);
});
test('empty patch without evidence never becomes a successful verification',async()=>{
 const {state:out}=await refreshState(state(),{...options,ask:async()=>({patch:{},evidence:{}})});
 assert.equal(out.platforms[0].verification.status,'failed');assert.equal(out.platforms[0].verification.checkedAt,null);assert.equal(out.platforms[0].rating,88);assert.equal(out.updatedAt,'2026-10-01T00:00:00Z');
});
test('unchanged facts CAN be verified, but only with complete fetched and audited evidence',async()=>{
 const {state:out}=await refreshState(state(),{...options,ask:completeAsk});
 assert.equal(out.platforms[0].verification.status,'verified');assert.equal(out.platforms[0].verification.checkedAt,NOW);assert.equal(out.platforms[0].fieldChecks.price.checkedAt,NOW);assert.equal(health(out.platforms[0],NOW),'verified');
});
test('unchanged verified sources reuse the audit; edited facts, changed sources and weekly expiry do not',async()=>{
 const first=await refreshState(state(),{...options,ask:completeAsk});
 let calls=0;const ask=async(...a)=>{calls++;return completeAsk(...a);};
 const nextDay={...options,now:new Date(MS+DAY).toISOString(),clock:()=>MS+DAY,ask};
 const cached=await refreshState(first.state,nextDay);assert.equal(cached.report.cached,1);assert.equal(calls,0);
 await refreshState(first.state,{...nextDay,readSource:async()=>TEXT+' New pricing.'});assert.equal(calls,3);
 calls=0;const edited=structuredClone(first.state);edited.platforms[0].sub='Manuellt ändrad';await refreshState(edited,nextDay);assert.equal(calls,3);
 calls=0;await refreshState(first.state,{...nextDay,now:new Date(MS+8*DAY).toISOString(),clock:()=>MS+8*DAY});assert.equal(calls,3);
});
test('failed source recheck keeps prior verified time and all previous facts',async()=>{
 const first=await refreshState(state(),{...options,ask:completeAsk});
 const {state:out}=await refreshState(first.state,{...options,now:new Date(MS+DAY).toISOString(),clock:()=>MS+DAY,readSource:async()=>{throw Error('HTTP 403');},ask:completeAsk});
 assert.equal(out.platforms[0].verification.checkedAt,NOW);assert.equal(out.platforms[0].verification.status,'failed');assert.deepEqual(out.platforms[0].pros,first.state.platforms[0].pros);
});
test('source requests coalesce across concurrent profiles',async()=>{
 let reads=0;await refreshState(state([p('one'),p('two'),p('three')]),{...options,ask:completeAsk,readSource:async()=>{reads++;return TEXT;}});assert.equal(reads,2);
});
test('partial audits cannot change identity, ratings or an incompletely verified price',async()=>{
 const ask=async(_,{search,phase})=>(search||phase==='proposal')?{patch:{sub:'Verifierad ny korttext',price:'0 USD',n:'Other version',rating:100},evidence:evidence(['n','sub','price'])}:{approvedFields:['n','sub','price']};
 const {state:out}=await refreshState(state(),{...options,ask});const x=out.platforms[0];
 assert.equal(x.n,'Fixture 1');assert.equal(x.rating,88);assert.equal(x.price,p().price);assert.equal(x.sub,'Verifierad ny korttext');assert.equal(x.verification.status,'partial');assert.equal(x.verification.checkedAt,null);assert.equal(x.fieldChecks.price,undefined);
});
test('wrong-version evidence and absent source quotations cannot mutate facts',async()=>{
 for(const identity of [false,true]){
 const ask=async(_,{search,phase})=>(search||phase==='proposal')?{patch:{sub:'Fel version'},evidence:evidence(['n','sub'])}:{approvedFields:['sub']};
 const {state:out}=await refreshState(state(),{...options,ask,readSource:async()=>identity?'Unrelated documentation':TEXT});assert.equal(out.platforms[0].sub,p().sub);assert.equal(out.platforms[0].verification.status,'failed');
 }
});
test('fresh mentions lead the queue; exact known aliases and unapproved news are excluded',()=>{
 const s=state();s.platforms[0].aliases=['Known alias'];s.candidates=[{name:'Old candidate',firstSeen:'2026-09-01',sourceVideos:[]},{name:'Fresh model',firstSeen:'2026-09-01',sourceVideos:[]}];s.news=[{date:'2026-10-23',url:'https://www.youtube.com/watch?v=new',newPlatforms:['Fresh model','Known alias']},{editorialStatus:'pending-recheck',date:NOW,newPlatforms:['Rejected model']}];
 const queue=candidatesFor(s,NOW);assert.equal(queue[0].name,'Fresh model');assert.equal(queue.length,2);
});
test('candidate failures back off; new evidence re-enables a retry; limit is enforced',async()=>{
 const s=state([]);s.candidates=Array.from({length:12},(_,i)=>({name:'Candidate '+i,firstSeen:NOW,sourceVideos:[]}));
 const {state:out,report}=await refreshState(s,{...options,newLimit:8,ask:async()=>({verified:false})});assert.equal(report.candidatesAttempted,8);assert.equal(out.candidates.filter(c=>c.nextAttemptAt).length,8);
 const c=out.candidates[0];assert.equal(candidateDue(c,NOW),false);assert.equal(candidateDue({...c,lastSeenAt:new Date(MS+1000).toISOString()},new Date(MS+2000).toISOString()),true);
});
test('fully verified new profile gets no inherited/generated scores and resolves matching mentions',async()=>{
 const s=state([]);s.news=[{id:'clip',date:NOW,url:'https://www.youtube.com/watch?v=clip',newPlatforms:['Fixture 1'],chans:['Test']}];
 const ask=async(_,{search,phase})=>(search||phase==='proposal')?{verified:true,profile:{...p(),rating:100,aliases:['Other model'],verification:{status:'verified'}},evidence:evidence()}:{approvedFields:KEYS};
 const {state:out,report}=await refreshState(s,{...options,ask});assert.equal(report.newModels,1);assert.equal(out.platforms[0].rating,null);assert.equal(out.platforms[0].aliases,undefined);assert.equal(out.platforms[0].verification.status,'verified');assert.deepEqual(out.news[0].platformIds,['fixture-1']);assert.equal(out.trends.scores['fixture-1'],1);
});
test('a due-only run does not re-query today\'s profiles; budget exhaustion is explicit',async()=>{
 const first=await refreshState(state(),{...options,ask:completeAsk});
 const due=await refreshState(first.state,{...options,dueOnly:true,ask:async()=>{throw Error('Must not run');}});assert.equal(due.report.attempted,0);
 const limited=await refreshState(state(),{...options,timeBudgetMs:0,ask:completeAsk});assert.equal(limited.report.attempted,0);assert.equal(limited.report.skipped,1);assert.equal(limited.state.platforms[0].lastAttemptAt,undefined);
});
test('official sources reject bad domains, credentials, ports and private addresses',()=>{
 assert(officialURL('https://docs.example.com/a',['example.com']));
 for(const url of ['http://example.com','https://example.com.evil.test','https://user:pass@example.com','https://example.com:8080'])assert(!officialURL(url,['example.com']));
 for(const ip of ['127.0.0.1','10.1.1.1','100.64.1.1','172.16.1.1','192.168.1.1','169.254.169.254','::1','::ffff:127.0.0.1','fc00::1','fe80::1','2001:db8::1'])assert(!publicAddress(ip),ip);
 assert(publicAddress('8.8.8.8'));assert(publicAddress('2606:4700:4700::1111'));
 assert(quoteInSource('A source with curly “quotes” and extra spaces.','curly "quotes" and extra spaces.'));assert(!quoteInSource(TEXT,'Unsupported quotation.'));
});
test('UI labels do not turn an attempt, a news refresh or an old audit into fresh verification',()=>{
 const x=p();assert.equal(ui.status(x,MS),'unknown');x.lastAttemptAt=NOW;assert.equal(ui.status(x,MS),'unknown');x.verification={status:'verified',attemptedAt:NOW,checkedAt:NOW,fields:KEYS};assert.equal(ui.status(x,MS),'verified');assert.equal(ui.status(x,MS+27*3600000),'stale');
 x.verification.status='failed';assert(ui.label(x,MS,'sv').includes('misslyckades'));assert(ui.label(x,MS,'en').includes('failed'));
 x.id='bad"<script>';assert(!ui.markup(x,MS,'sv').includes('<script>'));
});
test('publication preserves original page and adds one cache-busted health script',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'iamp-publish-'));
 try{for(const file of ['index.html','site-data.json','news.json','CNAME','profile-health.js','publish-data.mjs'])await copyFile(file,join(dir,file));await run(process.execPath,['publish-data.mjs'],{cwd:dir});const html=await readFile(join(dir,'_site/index.html'),'utf8'),original=await readFile('index.html','utf8');assert.equal(html.replace(/<script src="profile-health\.js\?v=[a-f0-9]+"><\/script>\n/,''),original);assert.equal((html.match(/src="profile-health/g)||[]).length,1);assert.equal(await readFile(join(dir,'_site/profile-health.js'),'utf8'),await readFile('profile-health.js','utf8'));}finally{await rm(dir,{recursive:true,force:true});}
});

