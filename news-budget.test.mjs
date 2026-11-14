import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {newsBudget} from './news-budget.mjs';
const request={model:'gpt-5.6-luna',input:'Source',max_output_tokens:100,service_tier:'default'};
test('news budget rejects expensive models/tools and persists shared caps across concurrent calls and reruns',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'iamp-budget-'));const file=join(dir,'ledger.json'),now='2026-11-14T13:00:00Z';
 try{
  const limits={dayMicrousd:10000,monthMicrousd:20000,runRequests:2,dayRequests:3};
  const b=await newsBudget({file,now,limits});
  await assert.rejects(b.reserve({...request,model:'gpt-5.6-terra'}),/policy/);await assert.rejects(b.reserve({...request,tools:[{type:'web_search'}]}),/policy/);
  const results=await Promise.allSettled([b.reserve(request),b.reserve(request),b.reserve(request)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,2);
  const again=await newsBudget({file,now,limits});await again.reserve(request);await assert.rejects(again.reserve(request),/safety limit/);
  assert.equal(again.summary().day.requests,3);
  const next=await newsBudget({file,now:'2026-11-15T13:00:00Z',limits:{...limits,monthMicrousd:again.summary().month.reservedMicrousd}});await assert.rejects(next.reserve(request),/safety limit/);
  await writeFile(file,'broken');await assert.rejects(newsBudget({file,now}),/unreadable/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
