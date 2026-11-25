import {readFile,writeFile,rename} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export const DATASET='lmarena-ai/leaderboard-dataset';
export const BOARDS=['text_to_image','image_edit','text_to_video','image_to_video'];
const endpoint='https://datasets-server.huggingface.co/rows';
export function normalizeRows(rows,now){
 const day=now.slice(0,10);
 const valid=rows.filter(r=>r.category==='overall'&&typeof r.model_name==='string'&&r.model_name.trim()&&typeof r.leaderboard_publish_date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(r.leaderboard_publish_date)&&r.leaderboard_publish_date<=day&&Number.isFinite(r.rating)&&Number.isInteger(r.rank)&&r.rank>0&&Number.isInteger(r.vote_count)&&r.vote_count>0);
 if(!valid.length)throw Error('No valid overall preference rows');
 const publishedAt=valid.map(r=>r.leaderboard_publish_date).sort().at(-1);
 const selected=valid.filter(r=>r.leaderboard_publish_date===publishedAt);
 const seen=new Set();
 const models=selected.sort((a,b)=>a.rank-b.rank).filter(r=>{if(seen.has(r.model_name))return false;seen.add(r.model_name);return true;}).map(r=>({name:r.model_name,rank:r.rank,rating:Math.round(r.rating),votes:r.vote_count,lower:Number.isFinite(r.rating_lower)?Math.round(r.rating_lower):null,upper:Number.isFinite(r.rating_upper)?Math.round(r.rating_upper):null}));
 return {publishedAt,models};
}
export async function fetchBoard(config,fetcher=fetch,now=new Date().toISOString()){
 if(!BOARDS.includes(config))throw Error('Unknown benchmark board');
 const rows=[];let offset=0,total;
 do{
  const url=new URL(endpoint);url.search=new URLSearchParams({dataset:DATASET,config,split:'latest',offset:String(offset),length:'100'}).toString();
  const response=await fetcher(url,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('Benchmark HTTP '+response.status);
  const data=await response.json();
  if(!Array.isArray(data.rows)||!Number.isInteger(data.num_rows_total)||data.num_rows_total<1||data.num_rows_total>3000)throw Error('Invalid benchmark response');
  if(total!==undefined&&total!==data.num_rows_total)throw Error('Benchmark changed during pagination');
  total=data.num_rows_total;
  if(!data.rows.length)throw Error('Incomplete benchmark response');
  rows.push(...data.rows.map(x=>x.row));offset+=data.rows.length;
 }while(offset<total);
 return {...normalizeRows(rows,now),status:'ok',checkedAt:now,source:'https://huggingface.co/datasets/'+DATASET+'/viewer/'+config+'/latest'};
}
export async function refreshBenchmarks(previous={},fetcher=fetch,now=new Date().toISOString()){
 const boards={...previous.boards};
 for(const config of BOARDS){
  try{boards[config]=await fetchBoard(config,fetcher,now);}
  catch(e){boards[config]={...boards[config],status:'unavailable',attemptedAt:now,error:String(e.message).slice(0,160)};}
 }
 return {source:'Arena (CC BY 4.0)',attemptedAt:now,boards};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const state=JSON.parse(await readFile('site-data.json','utf8'));
 state.benchmarks=await refreshBenchmarks(state.benchmarks);
 await writeFile('site-data.json.benchmarks.tmp',JSON.stringify(state,null,2)+'\n');
 await rename('site-data.json.benchmarks.tmp','site-data.json');
 console.log(JSON.stringify(Object.fromEntries(Object.entries(state.benchmarks.boards).map(([k,v])=>[k,{status:v.status,publishedAt:v.publishedAt,count:v.models?.length||0}]))));
}
