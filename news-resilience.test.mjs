import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,copyFile,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
test('RSS ingestion and rejection cache avoid repeated AI calls; outages persist diagnostics without false freshness',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'iamp-resilience-'));
 try{
  for(const f of ['update.mjs','data-core.mjs','openai.mjs'])await copyFile(f,join(dir,f));
  const old={platforms:[],news:[],sources:[],newsCheckedAt:'2026-01-01T00:00:00Z'};
  await writeFile(join(dir,'site-data.json'),JSON.stringify(old));
  await writeFile(join(dir,'sources.json'),JSON.stringify({channels:[{id:'fixture',handle:'@fixture',enabled:true}]}));
  await writeFile(join(dir,'mock.mjs'),String.raw`
import {writeFileSync} from 'node:fs';
let api=0,rss=0,metadata=0;const id='abcdefghijk',channel='UC'+'x'.repeat(22),now=new Date().toISOString();
const json=data=>new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}});
globalThis.fetch=async(url,options)=>{
 const u=new URL(url);
 if(u.hostname==='www.youtube.com'){rss++;return new Response('<feed><entry><yt:videoId>'+id+'</yt:videoId><published>'+now+'</published></entry></feed>');}
 if(u.hostname==='www.googleapis.com'){
  if(u.pathname.endsWith('/channels')){metadata++;return json({items:[{id:channel,contentDetails:{relatedPlaylists:{uploads:'upload'}},statistics:{subscriberCount:'10'}}]});}
  if(u.pathname.endsWith('/search'))return json({items:[]});
  if(u.pathname.endsWith('/videos'))return json({items:[{id,snippet:{title:'AI photo editing workflow',description:'Generative AI edits the image with a mask. Source details.',publishedAt:'2026-11-13T12:00:00Z',channelTitle:'Fixture',thumbnails:{}},contentDetails:{duration:'PT10M'},statistics:{}}]});
 }
 if(u.hostname==='api.openai.com'){
  api++;
  if(process.env.OUTAGE==='1')return new Response(JSON.stringify({error:{code:'insufficient_quota'}}),{status:429});
  const prompt=JSON.parse(options.body).input;
  const result=prompt.startsWith('Classify')?{videos:[{id,relevant:true,cat:'foto',evidenceIds:[0]}]}:{publish:false};
  return json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result)}]}]});
 }
 throw Error('Unexpected source: '+u.hostname+u.pathname);
};
process.on('exit',()=>writeFileSync('calls.json',JSON.stringify({api,rss,metadata})));
`);
  const args=['--import',join(dir,'mock.mjs'),'update.mjs'];
  const opts={cwd:dir,env:{...process.env,OPENAI_API_KEY:'fixture',YOUTUBE_API_KEY:'fixture'},timeout:20000};
  await run(process.execPath,args,opts);
  assert.deepEqual(JSON.parse(await readFile(join(dir,'calls.json'))),{api:2,rss:1,metadata:1});
  await run(process.execPath,args,opts);
  assert.deepEqual(JSON.parse(await readFile(join(dir,'calls.json'))),{api:0,rss:1,metadata:0});
  const good=JSON.parse(await readFile(join(dir,'site-data.json')));
  assert.equal(good.newsUpdate.status,'success');
  await rm(join(dir,'news-cache.json'));
  await assert.rejects(run(process.execPath,args,{...opts,env:{...opts.env,OUTAGE:'1'}}));
  const failed=JSON.parse(await readFile(join(dir,'site-data.json'))),report=JSON.parse(await readFile(join(dir,'update-report.json')));
  assert.deepEqual(failed.news,good.news);assert.equal(failed.newsCheckedAt,good.newsCheckedAt);assert.equal(failed.newsUpdate.status,'failed');assert.match(report.fatal,/quota/);assert.equal(report.rssChannels,1);
  assert.equal(JSON.parse(await readFile(join(dir,'calls.json'))).api,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});
