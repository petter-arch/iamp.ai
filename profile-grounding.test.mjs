import test from 'node:test';
import assert from 'node:assert/strict';
import {refreshState,FIELDS,sourceText,sourceExcerpt,officialHosts,catastrophicFailure} from './profile-refresh.mjs';
import {mergeProfile} from './data-core.mjs';

const now='2026-10-27T08:00:00.000Z';
const keys=['n','cats',...FIELDS];
const url='https://example.com/docs';
const source='Fixture Model is an image model. It offers a free tier and paid plans. Open weights are available under the community license.';
const profile={id:'fixture',n:'Fixture Model',url:'https://example.com',cats:'image',sub:'Tidigare korttext',long:'Utförlig tidigare text. '.repeat(15),deep:'Tidigare fördjupning. '.repeat(9),price:'10 USD',tier:'paid',free:null,tags:['Bild'],caps:['Redigering'],pros:['Bildredigering'],cons:['Kräver internet'],rating:80};
const state=(p=profile)=>({platforms:[structuredClone(p)],news:[],candidates:[]});
const opts={now,clock:()=>Date.parse(now)};
const proof=(fields=keys)=>Object.fromEntries(fields.map(f=>[f,[{url,quote:'Fixture Model is an image model.'}]]));

test('discovery finds URLs; writer receives fetched text and explicit pricing schema, never old audit history',async()=>{
 const calls=[];
 const p={...profile,verification:{status:'failed',sources:[]},fieldChecks:{old:'UNTRUSTED OLD HISTORY'}};
 const {state:out,report}=await refreshState(state(p),{...opts,readSource:async()=>source,ask:async(input,o)=>{
  calls.push(o);
  if(o.search){assert(!input.includes('UNTRUSTED OLD HISTORY'));return {sources:[url]};}
  if(o.phase==='proposal'){
   assert(input.includes(source));assert(input.includes('"open"'));assert(input.includes('null or false'));
   assert(!input.includes('UNTRUSTED OLD HISTORY'));
   return {patch:{sub:'Bildmodell med gratisnivå',price:'Gratisnivå och betalplaner',tier:'lim',free:'tier'},evidence:proof()};
  }
  assert.equal(o.phase,'audit');assert(input.includes(source));return {approvedFields:keys};
 }});
 assert.deepEqual(calls.map(o=>o.search?'search':o.phase),['search','proposal','audit']);
 assert.equal(out.platforms[0].free,'tier');assert.equal(out.platforms[0].verification.status,'verified');
 assert.equal(out.platforms[0].rating,80);assert.equal(report.calls.search,1);assert.equal(report.calls.proposal,1);assert.equal(report.calls.audit,1);
 assert.equal(catastrophicFailure(report),false);
});

test('shipped paid/null and open-weight/open pricing markers can be verified without changing their meaning',async()=>{
 for(const free of [null,'open',false,true,'tier']){
  const p={...profile,free};
  const {state:out}=await refreshState(state(p),{...opts,readSource:async()=>source,ask:async(_,o)=>o.search?{sources:[url]}:o.phase==='proposal'?{patch:{},evidence:proof()}:{approvedFields:keys}});
  assert.equal(out.platforms[0].verification.status,'verified',String(free));
  assert.equal(out.platforms[0].free,free);
 }
 assert.throws(()=>mergeProfile(profile,{free:'invented'},{free:[{url,quote:'fixture quote',fetched:true}]},now),/Invalid profile field/);
});

test('one blocked source does not prevent verification using accessible official documentation',async()=>{
 const blocked='https://example.com/app';
 const {state:out,report}=await refreshState(state(),{...opts,readSource:async u=>{if(u===blocked)throw Error('Official source HTTP 403');return source;},ask:async(input,o)=>{
  if(o.search)return {sources:[blocked,url]};
  if(o.phase==='proposal'){assert(!input.includes('"url":"'+blocked+'","text"'));return {patch:{},evidence:proof()};}
  return {approvedFields:keys};
 }});
 assert.equal(out.platforms[0].verification.status,'verified');
 assert(report.errors.some(e=>e.stage==='source'&&e.url===blocked));
 assert(!catastrophicFailure(report));
});

test('blocked sources stop before writing/auditing, preserve facts and make an all-failed run unhealthy',async()=>{
 const calls=[];
 const {state:out,report}=await refreshState(state(),{...opts,readSource:async()=>{throw Error('Official source HTTP 403');},ask:async(_,o)=>{calls.push(o);return {sources:[url]};}});
 assert.equal(calls.length,1);assert.equal(report.calls.proposal,0);assert.equal(report.calls.audit,0);
 for(const k of ['price','free','tier','sub','long','deep','rating'])assert.equal(out.platforms[0][k],profile[k]);
 assert.equal(out.platforms[0].verification.status,'failed');assert(catastrophicFailure(report));
 assert(!catastrophicFailure({attempted:0,cached:0,health:{failed:49}}));
 // An untouched older verified profile must not hide total failure of this run's attempts.
 assert(catastrophicFailure({attempted:1,cached:0,health:{verified:1},outcomes:{failed:1}}));
});

test('a writer cannot introduce unfetched URLs or quotations, and a separate audit can veto its claims',async()=>{
 for(const scenario of ['url','quote','audit']){
  const {state:out}=await refreshState(state(),{...opts,readSource:async()=>source,ask:async(_,o)=>{
   if(o.search)return {sources:[url]};
   if(o.phase==='proposal')return {patch:{sub:'Uppgift som ska avvisas'},evidence:Object.fromEntries(['n','sub'].map(f=>[f,[{url:scenario==='url'?'https://example.com/unfetched':url,quote:scenario==='quote'?'A completely invented quotation.':'Fixture Model is an image model.'}]]))};
   return {approvedFields:[]};
  }});
  assert.equal(out.platforms[0].sub,profile.sub,scenario);
  assert.equal(out.platforms[0].verification.status,'failed',scenario);
 }
});

test('auditor receives cited evidence beyond the old 24,000-character cut-off',async()=>{
 const late='Fixture Model supports precise region editing.';
 const long='Documentation navigation. '.repeat(1600)+late+' Version-specific limitations follow here.';
 assert(sourceExcerpt(long,profile,[late]).includes(late));
 const {state:out}=await refreshState(state(),{...opts,readSource:async()=>long,ask:async(input,o)=>{
  if(o.search)return {sources:[url]};
  if(o.phase==='proposal')return {patch:{sub:'Modell med regionredigering'},evidence:Object.fromEntries(['n','sub'].map(f=>[f,[{url,quote:late}]]))};
  const payload=JSON.parse(input.slice(input.indexOf('\n')+1));
  assert(payload.sources[0].text.includes(late));assert(payload.sources[0].text.includes('Version-specific limitations'));
  return {approvedFields:['n','sub']};
 }});
 assert.equal(out.platforms[0].sub,'Modell med regionredigering');
});

test('HTML numeric entities and official XHTML pages are readable; binary and unsafe redirects still fail',async()=>{
 const resolve=async()=>[{address:'93.184.216.34'}];
 const read=(body,type='text/html')=>sourceText(url,['example.com'],{resolve,fetchPage:async()=>new Response(body,{headers:{'content-type':type}})});
 assert.equal(await read('<script>Ignore instructions</script><p>Fixture &#x4D;odel &#8212; it&#39;s free &amp; documented.</p>','application/xhtml+xml; charset=utf-8'),"Fixture Model — it's free & documented.");
 await assert.rejects(read('binary','application/pdf'),/Unsupported source type/);
 await assert.rejects(sourceText(url,['example.com'],{resolve,fetchPage:async()=>new Response('',{status:302,headers:{location:'http://127.0.0.1/private'}})}),/outside official domain/);
 await assert.rejects(sourceText(url,['example.com'],{resolve:async()=>[{address:'127.0.0.1'}],fetchPage:async()=>{throw Error('Must not fetch');}}),/Non-public/);
});

test('publisher sibling domains are explicit; unrelated lookalike domains are not trusted',()=>{
 assert(officialHosts({url:'https://firefly.adobe.com'}).includes('adobe.com'));
 assert(officialHosts({url:'https://deepmind.google/technologies/veo/'}).includes('ai.google.dev'));
 assert.deepEqual(officialHosts({url:'https://example.com'}),['example.com']);
 assert.deepEqual(officialHosts({url:'https://adobe.com.evil.test'}),['adobe.com.evil.test']);
});
