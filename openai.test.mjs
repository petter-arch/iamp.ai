import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, copyFile, writeFile, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {responseText} from './openai.mjs';
const run = promisify(execFile);
const message = text => ({type: 'message', content: [{type: 'output_text', text}]});

test('Responses transport handles mixed output, authentication and error cases', async t => {
  const mock = t.mock.method(globalThis, 'fetch');
  let calls = 0;
  mock.mock.mockImplementation(async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.headers.authorization, 'Bearer fixture-only');
    const body = JSON.parse(options.body);
    assert.equal(body.store, false);
    assert.equal(body.reasoning.effort, 'none');
    return new Response(JSON.stringify({status: 'completed', output: [{type: 'reasoning'}, message('{"ok":'), message('true}')]}));
  });
  assert.equal(await responseText({apiKey: 'fixture-only', model: 'gpt-5.6-luna', input: 'JSON'}), '{"ok":\ntrue}');
  await assert.rejects(responseText({apiKey: ''}), /OPENAI_API_KEY/);
  assert.equal(calls, 1);
  for (const data of [
    {status: 'incomplete', output: [message('{"ok":true}')]},
    {status: 'failed', error: {message: 'private'}, output: []},
    {status: 'completed', output: []},
    {status: 'completed', output: [{type: 'message', content: [{type: 'refusal'}]}]},
    {status: 'completed', output: [{type: 'web_search_call', status: 'failed'}, message('{}')]},
  ]) {
    mock.mock.mockImplementation(async () => new Response(JSON.stringify(data)));
    await assert.rejects(responseText({apiKey: 'fixture-only'}), /OpenAI|Source search/);
  }
  mock.mock.mockImplementation(async () => new Response('sensitive upstream body', {status: 401}));
  await assert.rejects(responseText({apiKey: 'fixture-only'}), error => error.message === 'OpenAI HTTP 401');
  t.mock.method(globalThis, 'setTimeout', callback => { queueMicrotask(callback); return 0; });
  for (const status of [429, 503]) {
    let attempts = 0;
    mock.mock.mockImplementation(async () => ++attempts < 3
      ? new Response('', {status})
      : new Response(JSON.stringify({status: 'completed', output: [message('ok')]})));
    const pending = responseText({apiKey: 'fixture-only'});
    assert.equal(await pending, 'ok');
    assert.equal(attempts, 3);
  }
});

test('legacy paid Trendar command is blocked before reading data or making requests',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'iamp-disabled-profiles-'));
 try{
  for(const file of ['update.mjs','data-core.mjs','openai.mjs'])await copyFile(file,join(dir,file));
  await writeFile(join(dir,'mock.mjs'),"globalThis.fetch=async()=>{throw Error('Unexpected API request');};");
  await assert.rejects(run(process.execPath,['--import',join(dir,'mock.mjs'),'update.mjs','--profiles'],{cwd:dir,env:{...process.env,OPENAI_API_KEY:'fixture-only'}}),/Paid Trendar updates are disabled/);
  await assert.rejects(readFile(join(dir,'site-data.json')),/ENOENT/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
