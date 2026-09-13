import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,copyFile,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
test('News pipeline preserves history, runs at most three writers together and deduplicates reruns',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'iamp-pipeline-'));
 try {
  for(const file of ['update.mjs','data-core.mjs','openai.mjs'])await copyFile(file,join(dir,file));
  const previous={id:'old-video',url:'https://www.youtube.com/watch?v=old-video',ttl:'Tidigare nyhet',sum:'Sammanfattning',full:'Hela tidigare texten ska bevaras.',deep:'Tidigare fördjupning',date:new Date(Date.now()-86400000).toISOString(),cat:'foto'};
  await writeFile(join(dir,'site-data.json'),JSON.stringify({schemaVersion:1,platforms:[],news:[previous],sources:[]}));
  await writeFile(join(dir,'sources.json'),JSON.stringify({channels:[{id:'fixture',handle:'@fixture',enabled:true}],maxSummaries:6,maxNewArticles:20}));
  await writeFile(join(dir,'mock.mjs'),String.raw`
import {writeFileSync} from 'node:fs';
const videos=Array.from({length:6},(_,i)=>({id:'fixture'+i,snippet:{title:'AI photo workflow '+i,description:'Generative AI edits the image using a precise mask. This is a practical creative workflow.',publishedAt:new Date(Date.now()-3600000-i*60000).toISOString(),channelTitle:'Fixture channel',thumbnails:{}},contentDetails:{duration:i===0?'PT30S':'PT10M'},statistics:{viewCount:'10'}}));
let active=0,max=0;
const response=data=>new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}});
globalThis.fetch=async(url,options)=>{
 const u=new URL(url);
 if(u.hostname==='www.googleapis.com'){
  if(u.pathname.endsWith('/channels'))return response({items:[{id:'fixture-channel',contentDetails:{relatedPlaylists:{uploads:'playlist'}},statistics:{subscriberCount:'100'}}]});
  if(u.pathname.endsWith('/playlistItems'))return response({items:videos.map(v=>({contentDetails:{videoId:v.id,videoPublishedAt:v.snippet.publishedAt}}))});
  if(u.pathname.endsWith('/search'))return response({items:[]});
  if(u.pathname.endsWith('/videos'))return response({items:videos.filter(v=>u.searchParams.get('id').split(',').includes(v.id))});
 }
 if(u.hostname==='api.openai.com'){
  const prompt=JSON.parse(options.body).input;let result;
  if(prompt.startsWith('Classify')){
   const input=JSON.parse(prompt.slice(prompt.lastIndexOf('\n')+1));
   result={videos:input.map(v=>({id:v.id,relevant:true,cat:'foto',evidenceIds:[0]}))};
  }else if(prompt.startsWith('Write idiomatic')){
   active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,15));active--;
   const source=JSON.parse(prompt.split('\nSource: ')[1]);
   result={publish:true,cat:'foto',ttl:'Ny bildfunktion '+source.title,sum:'En ny AI-funktion för bildarbete.',full:('Enligt kanalen kan den nya funktionen användas för att redigera bilder med en mask. Det är ett arbetsflöde som har stöd för AI och som visar hur bilden ändras.\n\n').repeat(4),deep:('Funktionen har stöd för bildredigering och kan användas med en mask. Enligt källan är detta ett sätt att arbeta med AI på bilder.\n\n').repeat(3),platformIds:[],newPlatforms:[],evidenceIds:[0],en:{ttl:'New image feature',sum:'Image editing workflow',full:'Detailed source-based text',deep:'More source detail'}};
  }else throw Error('Unexpected model request');
  return response({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result)}]}]});
 }
 throw Error('Unexpected network request: '+u.hostname);
};
process.on('exit',()=>writeFileSync('concurrency.json',JSON.stringify({max})));
`);
  const args=['--import',join(dir,'mock.mjs'),join(dir,'update.mjs')];
  const options={cwd:dir,env:{...process.env,OPENAI_API_KEY:'fixture-only',YOUTUBE_API_KEY:'fixture-only'},timeout:20000};
  await run(process.execPath,args,options);
  const first=JSON.parse(await readFile(join(dir,'site-data.json'),'utf8'));
  assert.equal(first.news.length,7);assert.deepEqual(first.news.find(n=>n.id==='old-video'),previous);
  const concurrency=JSON.parse(await readFile(join(dir,'concurrency.json'),'utf8'));
  assert.equal(concurrency.max,3);
  await run(process.execPath,args,options);
  const second=JSON.parse(await readFile(join(dir,'site-data.json'),'utf8'));
  assert.deepEqual(second.news,first.news);
 }finally{await rm(dir,{recursive:true,force:true});}
});
