import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,copyFile,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
test('Profile pipeline migrates verified successors, reports uncertainty and safely retries',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'iamp-successor-'));
 try {
  for(const file of ['update.mjs','data-core.mjs','openai.mjs','successor.mjs'])await copyFile(file,join(dir,file));
  const previous={id:'model-1',n:'Model 1',url:'https://example.com',cats:'image',price:'Old price',long:'Original complete facts',deep:'Old details',rating:90};
  const news=[{id:'legacy',date:new Date().toISOString(),platformIds:['model-1'],plat:'Model 1'}];
  const state={platforms:[previous],news,sources:[]};
  await writeFile(join(dir,'sources.json'),'{}');
  await writeFile(join(dir,'mock.mjs'),String.raw`
import dns from 'node:dns/promises';
import {syncBuiltinESMExports} from 'node:module';
dns.lookup=async()=>[{address:'93.184.216.34',family:4}];syncBuiltinESMExports();
const scenario=process.env.SCENARIO;
const quote='Model 2 replaces Model 1 as the current image editor.';
globalThis.fetch=async(url,options)=>{
 if(url==='https://example.com/release')return scenario==='blocked'?new Response('',{status:403}):new Response(quote,{headers:{'content-type':'text/plain'}});
 if(url!=='https://api.openai.com/v1/responses')throw Error('Unexpected call');
 const prompt=JSON.parse(options.body).input;let result;
 if(prompt.startsWith('Check this EXACT')){
  const old=JSON.parse(prompt.split('Original profile: ')[1]);
  if(old.n==='Model 2')result={successor:{status:'none'},patch:{},evidence:{}};
  else {
   const profile={n:'Model 2',url:'https://example.com/release',cats:'image',sub:'Bildredigering',long:'Verifierad utförlig information om den nya modellen. '.repeat(7),deep:'Detaljer om bildredigering i den nya modellen. '.repeat(4),price:'Betalplan',tier:'paid',pros:['Redigering'],cons:['Kräver betalplan'],tags:['Bild'],caps:['Bildredigering']};
   const evidence=Object.fromEntries(Object.keys(profile).map(k=>[k,[{url:profile.url,quote}]]));
   result={successor:{status:'possible',name:'Model 2',profile,evidence,relationship:[{url:profile.url,quote}]},patch:{sub:'MUST NOT LEAK INTO OLD FACTS'},evidence:{}};
   if(scenario==='missing-profile')delete result.successor.profile;
   if(scenario==='fake-quote')result.successor.relationship[0].quote='An invented official replacement statement.';
   if(scenario==='unknown-check')delete result.successor;
  }
 }else if(prompt.startsWith('Verify an official successor'))result={verified:scenario!=='uncertain',from:'Model 1',to:'Model 2'};
 else if(prompt.startsWith('Independently verify')){
  const data=JSON.parse(prompt.slice(prompt.indexOf('\n')+1));
  result={approvedFields:Object.keys(data.patch).filter(k=>scenario!=='partial'||k!=='cons')};
 }else throw Error('Unexpected prompt');
 return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result)}]}]}));
};
`);
  for(const scenario of ['verified','blocked','uncertain','partial','fake-quote','missing-profile','unknown-check']) {
   await writeFile(join(dir,'site-data.json'),JSON.stringify(state));
   const options={cwd:dir,env:{...process.env,OPENAI_API_KEY:'fixture',SCENARIO:scenario},timeout:20000};
   const args=['--import',join(dir,'mock.mjs'),join(dir,'update.mjs'),'--profiles'];
   await run(process.execPath,args,options);
   const data=JSON.parse(await readFile(join(dir,'site-data.json'),'utf8'));
   const report=JSON.parse(await readFile(join(dir,'update-report.json'),'utf8'));
   assert.deepEqual(data.news,news);assert.deepEqual(JSON.parse(await readFile(join(dir,'news.json'),'utf8')),news);
   if(scenario==='verified') {
    assert.equal(data.platforms[0].id,'model-2');assert.equal(data.platforms[0].rating,null);assert(data.trends.scores['model-2']>.99);
    assert.equal(report.successors[0].status,'migrated');assert.equal(report.updated,1);
    await run(process.execPath,args,options);
    const rerun=JSON.parse(await readFile(join(dir,'site-data.json'),'utf8'));
    assert.equal(rerun.platforms.length,1);assert.equal(rerun.platforms[0].versionHistory.length,1);
   }else{
    for(const [k,v]of Object.entries(previous))assert.deepEqual(data.platforms[0][k],v,scenario+' '+k);
    assert.equal(report.updated,0);assert(report.errors.length>0);
    assert.equal(report.successors[0].status,scenario==='unknown-check'?'check-failed':'unverified');
   }
  }
 }finally{await rm(dir,{recursive:true,force:true});}
});
