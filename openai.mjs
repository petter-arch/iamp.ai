// Shared Responses API transport. Node 22 provides fetch; no SDK dependency needed.
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function retryDelay(header, attempt) {
  const seconds = Number(header);
  if (header && Number.isFinite(seconds) && seconds >= 0) return Math.min(60000, seconds * 1000 + Math.random() * 1000);
  const date = Date.parse(header || '');
  if (Number.isFinite(date)) return Math.min(60000, Math.max(0, date - Date.now()) + Math.random() * 1000);
  return Math.min(30000, 2000 * 2 ** attempt + Math.random() * 1000);
}
export async function responseText({apiKey = process.env.OPENAI_API_KEY, beforeRequest, ...request}) {
  if (!apiKey) throw Error('OPENAI_API_KEY is required; existing files unchanged.');
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    if(beforeRequest)await beforeRequest(request);
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {'content-type': 'application/json', authorization: `Bearer ${apiKey}`},
      signal: AbortSignal.timeout(90000),
      body: JSON.stringify({store: false, reasoning: {effort: request.tools?.length ? 'low' : 'none'}, ...request}),
    });
    if (response.ok) break;
    // Read only the structured error code, never log the response body or credentials.
    let code = '';
    if (response.status === 429) {
      try { code = (await response.clone().json())?.error?.code || ''; } catch {}
    }
    const quotaCodes = new Set(['insufficient_quota', 'credit_balance_exhausted', 'organization_usage_limit_exceeded', 'organization_spend_limit_exceeded', 'project_spend_limit_exceeded']);
    if (quotaCodes.has(code)) throw Error('OpenAI quota/billing limit: ' + code);
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      await sleep(retryDelay(response.headers.get('retry-after'), attempt));
      continue;
    }
    throw Error('OpenAI HTTP ' + response.status + (code ? ' (' + code + ')' : ''));
  }
  if (!response.ok) throw Error('OpenAI HTTP ' + response.status);
  const data = await response.json();
  if (data.error || data.status !== 'completed') throw Error('OpenAI response failed or incomplete');
  if (!Array.isArray(data.output)) throw Error('Missing OpenAI output');
  if (data.output.some(item => item.type === 'web_search_call' && item.status !== 'completed')) throw Error('Source search failed');
  const parts = data.output.filter(item => item.type === 'message').flatMap(item => item.content || []);
  if (parts.some(item => item.type === 'refusal')) throw Error('OpenAI refused the request');
  const text = parts.filter(item => item.type === 'output_text').map(item => item.text).join('\n').trim();
  if (!text) throw Error('Empty OpenAI output');
  return text;
}
