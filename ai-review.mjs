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

VIKTIGAST — kreatörskonsensus: iamp.ai:s redaktionella kompass är vad de ledande kreativa AI-kanalerna på YouTube framhåller som bäst just nu. Våra betrodda källor: Curious Refuge, AI Search, AI Samson, Futurepedia, Matt Wolfe, MattVidPro, Theoretically Media, The AI Advantage, AI Explained, Skill Leap AI. Sök aktivt efter vad dessa (och Artificial Analysis-benchmarks) pekar ut som bästa verktyg per kategori (video, bild, 3D, ljud), t.ex. "Curious Refuge best AI video model" eller "AI Search best AI tools". Betygen ska spegla denna konsensus: det som dessa källor + benchmarks samstämmigt lyfter som bäst ska ligga högst i sin kategori. Enstaka bloggar och aggregator-sajter väger lätt; kreatörskonsensus + benchmarks väger tungt.

Granska därefter listans AKTUALITET med webbsökning (max ~10 sökningar totalt, gruppera smart). Rapportera:
1. **Inaktuellt** — verktyg där ny version släppts, namn ändrats, pris ändrats eller som tappat relevans. Ange källa.
2. **Saknas** — nya betydande verktyg/modeller (senaste 2 månaderna) som borde in på listan, med föreslaget betyg och kort motivering.
3. **Betygsförslag** — max 6 justeringar. Ange för varje: vilka av våra källor/benchmarks som stödjer ändringen. Kontrollera särskilt att kategori-ettorna stämmer med kreatörskonsensus — om sidans egen text säger "toppar benchmarks" ska betyget spegla det.
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
