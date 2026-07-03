// ai-review.mjs — Månadsgranskning av Topplistan (halvautomatisk, nivå 2)
// Läser PLATS ur index.html, låter Claude med webbsökning granska aktualiteten
// och skriver en ändringsrapport (review-report.md). INGET ändras automatiskt —
// rapporten blir ett GitHub-ärende som du läser och godkänner.
//
// Krav: ANTHROPIC_API_KEY i miljön. Körs av .github/workflows/monthly-review.yml

import { readFileSync, writeFileSync } from "node:fs";

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) { console.error("ANTHROPIC_API_KEY saknas"); process.exit(1); }

const MODEL = process.env.REVIEW_MODEL || "claude-sonnet-4-6";

// ---- 1. Läs topplistan ur sajtfilen ----
const html = readFileSync("index.html", "utf8");
const m = html.match(/var PLATS=(\[[\s\S]*?\]);\s*var /);
if (!m) { console.error("Hittade inte PLATS i index.html"); process.exit(1); }
let PLATS;
try { PLATS = (0, eval)(m[1]); } catch (e) { console.error("Kunde inte tolka PLATS:", e.message); process.exit(1); }

const compact = PLATS.map(p => ({
  namn: p.n, betyg: p.rating, pris: p.price, kategorier: p.cats, taggar: p.tags
}));

// ---- 2. Be Claude granska med webbsökning ----
const prompt = `Du är redaktör för iamp.ai, en svensk topplista över kreativa AI-verktyg (bild, video, 3D, ljud).
Här är hela nuvarande topplistan (namn, betyg 0-100, pris, kategorier, taggar):

${JSON.stringify(compact, null, 1)}

Dagens datum: ${new Date().toISOString().slice(0, 10)}.

Granska listans AKTUALITET med webbsökning. Sök effektivt (max ~8 sökningar, gruppera per kategori). Rapportera:
1. **Inaktuellt** — verktyg där ny version släppts, namn ändrats, pris ändrats eller som tappat relevans. Ange källa.
2. **Saknas** — nya betydande verktyg/modeller (senaste 2 månaderna) som borde in på listan, med föreslaget betyg och kort motivering.
3. **Betygsförslag** — max 5 justeringar där benchmarks/mottagande tydligt motiverar ändring (t.ex. "höj X 84→87, pga ...").
4. **Ingen åtgärd** — bekräfta kort vad som fortfarande stämmer.

Viktigt: var källkritisk — vikta ned aggregator-sajter som marknadsför egna tjänster. Svara på svenska i ren Markdown med rubrikerna ovan. Var koncis och konkret; varje punkt ska gå att agera på.`;

const body = {
  model: MODEL,
  max_tokens: 4000,
  messages: [{ role: "user", content: prompt }],
  tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }]
};

const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": API_KEY,
    "anthropic-version": "2023-06-01"
  },
  body: JSON.stringify(body)
});

if (!res.ok) { console.error("API-fel:", res.status, await res.text()); process.exit(1); }
const data = await res.json();
const report = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
if (!report) { console.error("Tomt svar från modellen"); process.exit(1); }

// ---- 3. Skriv rapporten ----
const head = `# Månadsgranskning av Topplistan — ${new Date().toISOString().slice(0, 10)}\n\n` +
  `> Automatisk granskning (modell: ${MODEL}). Läs igenom och be Claude i chatten göra de ändringar du godkänner.\n\n`;
writeFileSync("review-report.md", head + report + "\n");
console.log("review-report.md skriven (" + report.length + " tecken)");
