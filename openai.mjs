// Shared Responses API transport. Node 22 provides fetch; no SDK dependency needed.
export async function responseText({apiKey = process.env.OPENAI_API_KEY, ...request}) {
  if (!apiKey) throw Error('OPENAI_API_KEY is required; existing files unchanged.');
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {'content-type': 'application/json', authorization: `Bearer ${apiKey}`},
      signal: AbortSignal.timeout(90000),
      body: JSON.stringify({store: false, reasoning: {effort: request.tools?.length ? 'low' : 'none'}, ...request}),
    });
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      continue;
    }
    break;
  }
  // Do not log API bodies, request headers, or keys.
  if (!response.ok) throw Error('OpenAI HTTP ' + response.status);
  const data = await response.json();
  if (data.error || data.status !== 'completed') throw Error('OpenAI response failed or incomplete');
  if (!Array.isArray(data.output)) throw Error('Missing OpenAI output');
  if (data.output.some(item => item.type === 'web_search_call' && item.status !== 'completed')) throw Error('Source search failed');
  const content = data.output.filter(item => item.type === 'message').flatMap(item => item.content || []);
  if (content.some(item => item.type === 'refusal')) throw Error('OpenAI refused the request');
  const text = content.filter(item => item.type === 'output_text').map(item => item.text).join('\n').trim();
  if (!text) throw Error('Empty OpenAI output');
  return text;
}
