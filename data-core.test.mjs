import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chapters,mergeNews,trends,mergeProfile,fairSelection,validateArticle,idFor,focusedSelection,validateNewProfile} from './data-core.mjs';
const now='2026-09-09T12:00:00Z';
const p={id:'suno',n:'Suno',price:'Original price',long:'Long original detail',pros:['Original pro'],cons:['Original con'],rating:90,tech:89};
test('All chapters retained, duplicate and out-of-duration timestamps excluded',()=>{
 const d=Array.from({length:12},(_,i)=>`${i}:00 Chapter ${i}`).join('\n');
 const result=chapters(d+'\n0:00 Duplicate\n99:00 Beyond video\n3:99 Invalid',720);
 assert.equal(result.length,12);assert.deepEqual(result[11],{t:660,l:'Chapter 11'});
 assert.equal(chapters('01:02:03 Long chapter',4000)[0].t,3723);
});
test('No discoveries and repeated videos never erase archive or full detail',()=>{
 const a={url:'https://www.youtube.com/watch?v=abcdefghijk',ttl:'Title',date:now,full:'Long text',deep:'More detail',parts:[{t:0,l:'Intro'}]};
 assert.deepEqual(mergeNews([a],[]),[a]);
 const result=mergeNews([a],[{...a,ttl:'Corrected title'}]);assert.equal(result.length,1);assert.equal(result[0].deep,a.deep);
});
test('Old, future, duplicated and unmatched version mentions do not inflate trends',()=>{
 const n={url:'a',date:now,plat:'Suno',chans:['A']};
 assert.equal(trends([n,n,{...n,url:'old',date:'2026-06-01'},{...n,url:'future',date:'2026-09-10'},{...n,url:'version',plat:'Suno Next'}],[p],now).suno,1);
 assert.equal(trends([{...n,date:'2026-09-02T12:00:00Z'}],[p],now).suno,.5);
 assert.equal(trends(Array.from({length:10},(_,i)=>({...n,url:String(i)})),[p],now).suno,3);
});
test('Every category receives independent slots including audio and technology',()=>{
 const all=['film','ljud','tech'].flatMap(cat=>Array.from({length:5},()=>({cat,date:now})));
 const selected=fairSelection(all,2);assert.equal(selected.length,6);assert.equal(selected.filter(n=>n.cat==='tech').length,2);
});
test('Source failure or empty facts cannot wipe details; ratings never rewritten',()=>{
 assert.throws(()=>mergeProfile(p,{price:'New'},{price:[]},now));
 const proof={price:[{url:'https://suno.com/pricing',quote:'Source quote',fetched:true}]};
 const next=mergeProfile(p,{price:'New',rating:100},proof,now);
 assert.equal(next.price,'New');assert.equal(next.rating,90);assert.deepEqual(next.pros,p.pros);assert.equal(next.long,p.long);
 assert.throws(()=>mergeProfile(p,{pros:[]},{pros:proof.price},now));
});
test('Unrelated categories, HTML and fake future dates are rejected',()=>{
 const n={cat:'tech',ttl:'Title',sum:'Summary',full:'Full source text',deep:'Details',url:'https://www.youtube.com/watch?v=abcdefghijk',date:now};
 assert.equal(validateArticle(n,now),n);
 assert.throws(()=>validateArticle({...n,cat:'phones'},now));
 assert.throws(()=>validateArticle({...n,full:'<script>'},now));
 assert.throws(()=>validateArticle({...n,date:'2030-01-01'},now));
});
test('All shipped profiles have unique stable IDs and full comparison fields',async()=>{
 const d=JSON.parse(await readFile('site-data.json','utf8'));
 assert(d.platforms.length>=48);assert.equal(new Set(d.platforms.map(idFor)).size,d.platforms.length);
 for(const x of d.platforms){for(const k of ['pros','cons','tags','caps'])assert(Array.isArray(x[k])&&x[k].length,x.n+' '+k);for(const k of ['long','price'])assert(x[k],x.n+' '+k);}
});
test('Editorial focus stays 70/20/10 with enough sources, and never fills gaps with broad AI',()=>{
 const pool=['foto','film','ljud','3d','tech'].flatMap(cat=>Array.from({length:20},(_,i)=>({id:cat+i,cat,date:now,trusted:true})));
 const result=focusedSelection(pool,20);
 assert.equal(result.filter(n=>['foto','film'].includes(n.cat)).length,14);
 assert.equal(result.filter(n=>['ljud','3d'].includes(n.cat)).length,4);
 assert.equal(result.filter(n=>n.cat==='tech').length,2);
 assert.equal(focusedSelection(pool.filter(n=>n.cat==='tech'),20).length,0);
});
test('New models retain full facts but never inherit or invent quality scores',()=>{
 const model={n:'Test Model 2',url:'https://example.com/model',cats:'video',sub:'Source-supported purpose',long:'Detailed source description',deep:'Further details',price:'Price not verified',tier:'unknown',pros:['Supported strength'],cons:['Documented limit'],tags:['Film'],caps:['Text-to-video'],rating:99,tech:100};
 const result=validateNewProfile(model);assert.equal(result.rating,null);assert.equal(result.tech,null);assert.equal(result.n,'Test Model 2');assert.equal(result.long,model.long);
 assert.throws(()=>validateNewProfile({...model,caps:[]}));
 assert.throws(()=>validateNewProfile({...model,url:'javascript:alert(1)'}));
});


test('Publication filters reject English copy, unrelated film sources and invented AI evidence', async()=>{
 const {isSwedishArticle,supportedAIQuote,retainSourceOnFailure}=await import('./data-core.mjs');
 assert.equal(isSwedishArticle("Film Riot's latest episode explores realistic VFX and controlled imperfection rather than flawless execution."),false);
 assert.equal(isSwedishArticle('Enligt kanalen är detta en ny AI-funktion som kan användas för bildbehandling och den har stöd för masker.'),true);
 assert.equal(supportedAIQuote('An innovative colour engine powers this LED light','A lamp review','An innovative colour engine powers this LED light'),false);
 assert.equal(supportedAIQuote('AI generates hair behind the mask','New Photoshop feature','AI generates hair behind the mask'),true);
 assert.equal(supportedAIQuote('AI generates hair behind the mask','A lamp review','Full spectrum LED lighting'),false);
 const source=retainSourceOnFailure({handle:'@correct',subscriberCount:null,checkedAt:null},{handle:'@old',subscriberCount:123,checkedAt:'2026-09-01'},'HTTP 503');
 assert.equal(source.handle,'@correct');assert.equal(source.subscriberCount,123);assert.equal(source.checkedAt,'2026-09-01');
});
