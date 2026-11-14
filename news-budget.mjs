import {readFile,writeFile,rename} from 'node:fs/promises';
// Conservative reservation, not a billing statement. Fixed approved model only.
// Official rates checked 2026-11-14: input $0.20/M, output $1.20/M;
// reserve input at $0.50/M to include the more expensive cache-write rate.
// https://developers.openai.com/api/docs/models/gpt-5.6-luna
export const NEWS_LIMITS={dayMicrousd:500000,monthMicrousd:5000000,runRequests:48,dayRequests:96};
export async function newsBudget({file='news-budget.json',now=new Date().toISOString(),limits=NEWS_LIMITS}={}){
 let ledger={version:1,days:{},months:{}};
 try{ledger=JSON.parse(await readFile(file,'utf8'));if(ledger.version!==1||!ledger.days||!ledger.months)throw Error('Invalid ledger');}catch(e){if(e.code!=='ENOENT')throw Error('News spending ledger unreadable; paid calls disabled');}
 const day=now.slice(0,10),month=now.slice(0,7);let runRequests=0,serial=Promise.resolve();
 const get=(entries,key)=>{const x=entries[key]||{requests:0,reservedMicrousd:0};if(!Number.isSafeInteger(x.requests)||x.requests<0||!Number.isSafeInteger(x.reservedMicrousd)||x.reservedMicrousd<0)throw Error('Invalid news spending ledger');return x;};
 const summary=()=>({model:'gpt-5.6-luna',runRequests,day:{...get(ledger.days,day)},month:{...get(ledger.months,month)},limits,method:'conservative-pre-request-reservation',ratesCheckedAt:'2026-11-14'});
 async function reserve(request){
  const work=serial.then(async()=>{
   if(request.model!=='gpt-5.6-luna'||request.tools?.length||typeof request.input!=='string'||request.service_tier!=='default')throw Error('News API policy forbids this model, tool, input or service tier');
   if(!Number.isInteger(request.max_output_tokens)||request.max_output_tokens<1||request.max_output_tokens>6500)throw Error('News output token limit exceeded');
   const inputBound=Buffer.byteLength(JSON.stringify({input:request.input,instructions:request.instructions||''}),'utf8')+4096;
   if(inputBound>200000)throw Error('News input size limit exceeded');
   const reservation=Math.ceil(inputBound*0.5+request.max_output_tokens*1.2);
   const d=get(ledger.days,day),m=get(ledger.months,month);
   if(runRequests>=limits.runRequests||d.requests>=limits.dayRequests||d.reservedMicrousd+reservation>limits.dayMicrousd||m.reservedMicrousd+reservation>limits.monthMicrousd)throw Error('News spending safety limit reached; no request sent');
   ledger.days[day]={requests:d.requests+1,reservedMicrousd:d.reservedMicrousd+reservation};ledger.months[month]={requests:m.requests+1,reservedMicrousd:m.reservedMicrousd+reservation};
   ledger.days=Object.fromEntries(Object.entries(ledger.days).sort().slice(-40));ledger.months=Object.fromEntries(Object.entries(ledger.months).sort().slice(-12));
   await writeFile(file+'.tmp',JSON.stringify(ledger,null,2)+'\n');await rename(file+'.tmp',file);runRequests++;
  });serial=work.catch(()=>{});return work;
 }
 return {reserve,summary};
}
