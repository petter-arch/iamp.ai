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

test('Profile workflow verifies actual fetched text and retains facts on source/API failure', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'iamp-openai-profile-'));
  try {
    for (const file of ['update.mjs', 'data-core.mjs', 'openai.mjs']) await copyFile(file, join(dir, file));
    const shipped = JSON.parse(await readFile('site-data.json', 'utf8'));
    const profile = {...shipped.platforms[0], url: 'https://example.com', sub: 'Tidigare text'};
    const state = {schemaVersion: 1, platforms: [profile], news: [], candidates: [], sources: []};
    await writeFile(join(dir, 'sources.json'), '{}');
    await writeFile(join(dir, 'mock.mjs'), String.raw`
import dns from 'node:dns/promises';
import {syncBuiltinESMExports} from 'node:module';
dns.lookup=async()=>[{address:'93.184.216.34',family:4}];
syncBuiltinESMExports();
globalThis.fetch=async(url,options)=>{
 if(url==='https://example.com/docs'){
  if(process.env.SCENARIO==='source-failure')return new Response('',{status:403});
  return new Response('This creative model supports image editing.',{headers:{'content-type':'text/plain'}});
 }
 if(url!=='https://api.openai.com/v1/responses')throw Error('Unexpected external call');
 const body=JSON.parse(options.body);
 if(process.env.SCENARIO==='api-failure')return new Response('',{status:401});
 let result;
 if(body.input.startsWith('Check this EXACT')){
  if(body.model!=='gpt-5.6-terra'||body.tools[0].type!=='web_search'||body.tools[0].filters.allowed_domains[0]!=='example.com'||body.reasoning.effort!=='low')throw Error('Invalid profile API configuration');
  result={patch:{sub:'Stöd för bildredigering'},evidence:{sub:[{url:'https://example.com/docs',quote:'This creative model supports image editing.'}]},_retrieved:{'https://example.com/docs':'Untrusted model-generated cache'}};
 }else if(body.input.startsWith('Independently verify')){
  if(!body.input.includes('This creative model supports image editing.'))throw Error('Missing actual source');
  result={approvedFields:['sub']};
 }else throw Error('Unexpected prompt');
 return new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(result)}]}]}));
};
`);
    for (const scenario of ['success', 'source-failure', 'api-failure']) {
      await writeFile(join(dir, 'site-data.json'), JSON.stringify(state));
      await run(process.execPath, ['--import', join(dir, 'mock.mjs'), join(dir, 'update.mjs'), '--profiles'], {
        cwd: dir, env: {...process.env, OPENAI_API_KEY: 'fixture-only', OPENAI_NEWS_MODEL: '', OPENAI_PROFILE_MODEL: '', SCENARIO: scenario}, timeout: 20000,
      });
      const actual = JSON.parse(await readFile(join(dir, 'site-data.json'), 'utf8'));
      const report = JSON.parse(await readFile(join(dir, 'update-report.json'), 'utf8'));
      assert.equal(actual.platforms[0].sub, scenario === 'success' ? 'Stöd för bildredigering' : profile.sub);
      assert.equal(actual.platforms[0].rating, profile.rating);
      assert.equal(actual.platforms[0].long, profile.long);
      assert.equal(report.errors.length === 0, scenario === 'success');
    }
    const before = await readFile(join(dir, 'site-data.json'), 'utf8');
    await assert.rejects(run(process.execPath, [join(dir, 'update.mjs')], {cwd: dir, env: {...process.env, OPENAI_API_KEY: ''}}), /OPENAI_API_KEY/);
    assert.equal(await readFile(join(dir, 'site-data.json'), 'utf8'), before);
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
});
