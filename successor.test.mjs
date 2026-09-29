import test from 'node:test';
import assert from 'node:assert/strict';
import {verifySuccessor,successorFields} from './successor.mjs';
import {trends} from './data-core.mjs';
const now='2026-09-29T12:00:00Z',url='https://example.com/release';
const old={id:'model-1',n:'Model 1',url,aliases:['Original'],idAliases:['original'],rating:90,price:'Old price',long:'Old full facts',deep:'Old detail',fieldChecks:{price:{checkedAt:'old'}}};
const profile={n:'Model 2',url,cats:'image',sub:'Bildredigering',long:'En utförlig beskrivning av den nya modellens verifierade bildfunktioner. '.repeat(5),deep:'Modellen kan användas för bildredigering med text. '.repeat(4),price:'Betalplan',tier:'paid',tags:['Bild'],caps:['Bildredigering'],pros:['Redigering'],cons:['Betalplan'],id:'malicious',rating:100};
const quote='Model 2 replaces Model 1 for image editing.';
const proof=[{url,quote}];
const candidate=()=>({status:'possible',name:profile.n,profile:{...profile},relationship:structuredClone(proof),evidence:Object.fromEntries(successorFields.map(k=>[k,structuredClone(proof)]))});
const services=()=>({official:u=>u===url,fetchSource:async()=>quote,quoteMatches:(s,q)=>s.includes(q),auditFacts:async()=>successorFields,auditRelationship:async()=>({verified:true,from:old.n,to:profile.n})});
test('Verified successor replaces atomically, archives facts, derives ID and never inherits scores',async()=>{
 const before=structuredClone(old),c=candidate();
 const next=await verifySuccessor(old,c,[old],now,services());
 assert.deepEqual(old,before);assert.equal(next.id,'model-2');assert.equal(next.rating,null);assert.equal(next.price,profile.price);
 assert.deepEqual(next.versionHistory[0].profile,old);assert.deepEqual(next.idAliases,['model-1','original']);assert.deepEqual(next.aliases,['Model 1','Original']);
 assert(next.fieldChecks.n);assert.equal(next.fieldChecks.price.checkedAt,now);
 const news=[{id:'a',platformIds:['model-1','model-2'],date:now},{id:'b',platformIds:['original'],date:now},{id:'c',plat:'Model 1',date:now},{id:'d',plat:'Model 3',date:now}];
 assert.equal(trends(news,[next],now)['model-2'],3);
 const rerun=services();rerun.auditRelationship=async()=>({verified:true,from:next.n,to:c.name});
 await assert.rejects(verifySuccessor(next,c,[next],now,rerun),/historical version/);
});
test('Uncertain, incomplete, unavailable and conflicting evidence cannot migrate or mutate facts',async t=>{
 for(const scenario of ['missing-relation','unofficial','invented-quote','blocked-source','no-relation','wrong-version','partial-facts','incomplete-profile','collision','alias-collision','historical'])await t.test(scenario,async()=>{
  const c=candidate(),s=services(),registry=[old],before=structuredClone(old);
  if(scenario==='missing-relation')c.relationship=[];
  if(scenario==='unofficial')c.profile.url='https://lookalike.example';
  if(scenario==='invented-quote')c.evidence.n[0].quote='This quote is fabricated';
  if(scenario==='blocked-source')s.fetchSource=async()=>{throw Error('HTTP 403');};
  if(scenario==='no-relation')s.auditRelationship=async()=>({verified:false});
  if(scenario==='wrong-version')s.auditRelationship=async()=>({verified:true,from:'Model 0',to:profile.n});
  if(scenario==='partial-facts')s.auditFacts=async()=>['n'];
  if(scenario==='incomplete-profile')c.profile.cons=[];
  if(scenario==='collision')registry.push({id:'model-2',n:'Other'});
  if(scenario==='alias-collision')registry.push({id:'other',n:'Other',idAliases:['original']});
  if(scenario==='historical'){c.name='Original';c.profile.n='Original';s.auditRelationship=async()=>({verified:true,from:old.n,to:'Original'});}
  await assert.rejects(verifySuccessor(old,c,registry,now,s));assert.deepEqual(old,before);
 });
});
test('Multiple migrations retain the full alias chain and immutable historical facts',async()=>{
 const first=await verifySuccessor(old,candidate(),[old],now,services());
 const c=candidate();c.name=c.profile.n='Model 3';
 const s=services();s.auditRelationship=async()=>({verified:true,from:first.n,to:c.name});
 const second=await verifySuccessor(first,c,[first],now,s);
 assert.deepEqual(second.idAliases,['model-2','model-1','original']);assert.equal(second.versionHistory.length,2);
 assert.equal(second.versionHistory[0].profile.price,'Old price');
});
