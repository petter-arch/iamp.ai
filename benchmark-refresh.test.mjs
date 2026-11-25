import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRows,fetchBoard,refreshBenchmarks,BOARDS} from './benchmark-refresh.mjs';
const now='2026-11-25T07:00:00Z';
const row=(name,rank,date='2026-11-20',extra={})=>({model_name:name,category:'overall',leaderboard_publish_date:date,rank,rating:1400,vote_count:1234,...extra});
test('only current overall rows, exact versions and real votes are retained',()=>{
 const result=normalizeRows([row('GPT-Image-2.5 Sunburst',1),row('GPT-Image-2.6 Sunburst (Medium)',2),row('older',1,'2026-11-01'),row('future',1,'2026-12-01'),row('category',1,'2026-11-20',{category:'art'}),row('missing votes',3,'2026-11-20',{vote_count:null})],now);
 assert.equal(result.publishedAt,'2026-11-20');
 assert.deepEqual(result.models.map(x=>[x.name,x.rank,x.votes]),[['GPT-Image-2.5 Sunburst',1,1234],['GPT-Image-2.6 Sunburst (Medium)',2,1234]]);
});
test('pagination gathers all rows and a failed request retains old data with unavailable status',async()=>{
 let calls=0;
 const data=await fetchBoard(BOARDS[0],async url=>{calls++;return {ok:true,json:async()=>({num_rows_total:2,rows:[{row:row('Model '+url.searchParams.get('offset'),calls)}]})};},now);
 assert.equal(calls,2);assert.equal(data.models.length,2);
 const failed=await refreshBenchmarks({boards:{[BOARDS[0]]:data}},async()=>{throw Error('network');},now);
 assert.equal(failed.boards[BOARDS[0]].status,'unavailable');
 assert.deepEqual(failed.boards[BOARDS[0]].models,data.models);
});
