#!/usr/bin/env node
// ai-news.mjs — daglig nyhetsmotor för iamp.ai (KANAL-LÄGE)
// ----------------------------------------------------------------------------
// Källor, i prioritetsordning:
//   1. DINA KANALER (CHANNELS nedan) — kreatörer du litar på. Alltid med.
//   2. UPPTÄCK (DISCOVER=true) — populära engelskspråkiga videor i dina ämnen,
//      liknande "heta" videor. Strikt engelska-filter + krav på många visningar.
//
// Varje nyhet får: video-länk (▶ Titta), Läs mer-länk (📖, Google-sökning om
// nyheten) och plattformskoppling (plat) när videon handlar om ett verktyg på
// Topplistan — då visas verktygets fakta + "Besök"-knapp i kortet.
//
// Miljövariabler (GitHub secrets): YOUTUBE_API_KEY, ANTHROPIC_API_KEY
// Kör lokalt:  YOUTUBE_API_KEY=xxx ANTHROPIC_API_KEY=yyy node ai-news.mjs
// ----------------------------------------------------------------------------

import { writeFile, readFile } from "node:fs/promises";

// ============================ KONFIG ========================================
const OUT          = "news.json";
const DAYS         = 10;    // hur färska videor som hämtas
const MAX_ITEMS    = 14;    // max nyheter totalt
const PER_CHANNEL  = 2;     // senaste videor per kanal
const MIN_SECONDS  = 90;    // hoppa över Shorts
const OUT_LANG     = "sv";  // språk på de skrivna nyheterna
const MODEL        = "claude-haiku-4-5-20251001";

// --- 1) DINA KANALER — klistra in @handtag eller kanal-ID (UC...) -----------
// Ex: "@TheAIAdvantage", "@mattvidpro", "UCxxxxxxxxxxxxxxxxxxxxxx"
const CHANNELS = [
  "@curiousrefuge",        // Curious Refuge — AI-film & kreativa AI-nyheter
  "@theAIsearch",          // AI Search — nya modeller & verktyg
  "@aisamsonreal",         // AI Samson — AI-nyheter & genomgångar
  "@futurepedia_io",       // Futurepedia — AI-verktyg & guider
  "@soroosh_hedayati",     // Soroosh Hedayati — kreativ AI
  "@mkbhd",                // MKBHD — tech i toppklass (AI-inslag)
  "@SkillLeapAI",          // Skill Leap AI — AI-verktyg & how-tos
  "@mreflow",              // Matt Wolfe — veckans AI-nyheter, bred & stor
  "@MattVidPro",           // MattVidPro AI — kreativ AI: bild & video
  "@TheoreticallyMedia",   // Theoretically Media — AI-film & video
  "@aiadvantage",          // The AI Advantage — praktiska verktygsnyheter
  "@aiexplained-official", // AI Explained — djupare modellanalys
];

// --- 2) UPPTÄCK — populära engelska videor i ämnena (som dina, fast fler) ---
const DISCOVER = true;           // false = ENBART dina kanaler
const MIN_VIEWS_DISCOVER = 20000; // tröskel så bara riktigt "heta" kommer med
const TOPICS = [
  { q: "AI image generation news",  cat: "foto", tag: "img", lab: "Bild",  ico: "📷" },
  { q: "AI video generation news",  cat: "film", tag: "vid", lab: "Film",  ico: "🎬" },
  { q: "AI 3D model generation",    cat: "3d",   tag: "mdl", lab: "3D",    ico: "🧊" },
  { q: "AI music voice generation", cat: "ljud", tag: "mdl", lab: "Ljud",  ico: "🎵" },
  { q: "new AI model release",      cat: "mdl",  tag: "mdl", lab: "Modeller", ico: "🧠" },
];
// ============================================================================

const YT = process.env.YOUTUBE_API_KEY;
const AK = process.env.ANTHROPIC_API_KEY;
if (!YT) { console.error("Saknar YOUTUBE_API_KEY"); process.exit(1); }

const sinceISO = new Date(Date.now() - DAYS * 86400000).toISOString();

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status + " " + url.split("?")[0]);
  return r.json();
}
function durSeconds(iso) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "");
  if (!m) return 0;
  return (+(m[1]||0))*3600 + (+(m[2]||0))*60 + (+(m[3]||0));
}
// Engelska-heuristik: språkfält eller ren ASCII-titel
function looksEnglish(v) {
  const sn = v.snippet || {};
  const lang = (sn.defaultAudioLanguage || sn.defaultLanguage || "").toLowerCase();
  if (lang) return lang.startsWith("en");
  const t = sn.title || "";
  const ascii = t.replace(/[^\x00-\x7F]/g, "").length;
  return t.length > 0 && ascii / t.length > 0.9;
}

// --- Kanaler: @handtag/URL/ID -> uploads-spellista -> senaste videor --------
function cleanChannelRef(s) {
  s = s.trim().replace(/^https?:\/\/(www\.)?youtube\.com\//, "").replace(/\/.*$/, "");
  return s;
}
async function resolveChannel(ref) {
  ref = cleanChannelRef(ref);
  let u;
  if (/^UC[\w-]{20,}$/.test(ref)) u = "https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=" + ref + "&key=" + YT;
  else u = "https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&forHandle=" + encodeURIComponent(ref.replace(/^@/, "")) + "&key=" + YT;
  const d = await getJSON(u);
  const c = (d.items || [])[0];
  if (!c) throw new Error("kanal hittades inte: " + ref);
  return { id: c.id, name: c.snippet.title, uploads: c.contentDetails.relatedPlaylists.uploads };
}
async function channelVideos(ch) {
  const u = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=" + (PER_CHANNEL * 3)
    + "&playlistId=" + ch.uploads + "&key=" + YT;
  const d = await getJSON(u);
  return (d.items || [])
    .filter(it => (it.contentDetails.videoPublishedAt || "") >= sinceISO)
    .slice(0, PER_CHANNEL)
    .map(it => ({ id: it.contentDetails.videoId, topic: null, trusted: true }));
}
async function searchTopic(t) {
  const u = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=viewCount"
    + "&maxResults=6&publishedAfter=" + encodeURIComponent(sinceISO)
    + "&q=" + encodeURIComponent(t.q)
    + "&relevanceLanguage=en&regionCode=US&key=" + YT;
  const d = await getJSON(u);
  return (d.items || []).map(it => ({ id: it.id.videoId, topic: t, trusted: false }));
}
async function details(ids) {
  const out = {};
  for (let i = 0; i < ids.length; i += 50) {
    const u = "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id="
      + ids.slice(i, i + 50).join(",") + "&key=" + YT;
    const d = await getJSON(u);
    (d.items || []).forEach(v => { out[v.id] = v; });
  }
  return out;
}
function buzzFromViews(views) {
  const n = +(views || 0);
  if (n <= 0) return 45;
  return Math.max(45, Math.min(99, Math.round(40 + 12 * Math.log10(n))));
}

// --- Plattformsnamn från sajten (för plat-koppling) --------------------------
async function sitePlatformNames() {
  try {
    const html = await readFile("index.html", "utf8");
    const m = html.match(/var PLATS=(\[[\s\S]*?\]);\s*var /);
    if (!m) return [];
    return (0, eval)(m[1]).map(p => p.n);
  } catch { return []; }
}

const CATMAP = { foto:{tag:"img",lab:"Bild",ico:"📷"}, film:{tag:"vid",lab:"Film",ico:"🎬"},
  "3d":{tag:"mdl",lab:"3D",ico:"🧊"}, ljud:{tag:"mdl",lab:"Ljud",ico:"🎵"},
  mdl:{tag:"mdl",lab:"Modeller",ico:"🧠"}, robot:{tag:"mdl",lab:"Robotar",ico:"🤖"} };

function fallbackSummary(v) {
  const title = v.snippet.title;
  const line = (String(v.snippet.description || "").split("\n").find(s => s.trim().length > 30) || title).trim().slice(0, 180);
  return { ttl: title, sum: line, full: line, plat: "", q: title, cat: "mdl" };
}

async function summarize(v, platformNames) {
  if (!AK) return fallbackSummary(v);
  const sys = 'Du är redaktör för en svensk nyhetssida om kreativ AI. Utifrån videons titel och beskrivning: skriv en kort saklig nyhet på ' + (OUT_LANG === "sv" ? "svenska" : "engelska") + '. Hitta inte på fakta. Svara ENBART med giltig JSON: {"ttl": rubrik max ~9 ord, "sum": en mening, "full": 2-3 meningar, "cat": en av foto|film|3d|ljud|mdl|robot, "plat": EXAKT ett namn ur plattformslistan om videon tydligt handlar om det verktyget, annars tom sträng, "q": bra engelsk Google-sökfras (3-6 ord) för att läsa mer om just denna nyhet}.';
  const body = {
    model: MODEL, max_tokens: 500, system: sys,
    messages: [{ role: "user", content:
      "Plattformslista: " + platformNames.join(", ") +
      "\nKanal: " + v.snippet.channelTitle +
      "\nTitel: " + v.snippet.title +
      "\nBeskrivning:\n" + (v.snippet.description || "").slice(0, 1600) }],
  };
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": AK, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    const txt = (d.content || []).map(c => c.text || "").join("").replace(/```json|```/g, "").trim();
    const j = JSON.parse(txt);
    return {
      ttl: j.ttl || v.snippet.title, sum: j.sum || "", full: j.full || j.sum || "",
      plat: platformNames.includes(j.plat) ? j.plat : "",
      q: j.q || v.snippet.title,
      cat: CATMAP[j.cat] ? j.cat : "mdl",
    };
  } catch (e) { console.error("summarize fallback:", e.message); return fallbackSummary(v); }
}

(async () => {
  const platformNames = await sitePlatformNames();

  // 1) dina kanaler (betrodda — inget engelskafilter)
  let cands = [];
  for (const ref of CHANNELS) {
    try { const ch = await resolveChannel(ref); cands = cands.concat(await channelVideos(ch)); }
    catch (e) { console.error("kanal", ref, e.message); }
  }
  // 2) upptäck (endast engelska + högt visningskrav)
  if (DISCOVER) for (const t of TOPICS) {
    try { cands = cands.concat(await searchTopic(t)); }
    catch (e) { console.error("topic", t.q, e.message); }
  }

  const seen = {}, uniq = [];
  for (const c of cands) if (c.id && !seen[c.id]) { seen[c.id] = 1; uniq.push(c); }
  if (!uniq.length) { console.error("Inga videor."); await writeFile(OUT, "[]"); return; }

  const det = await details(uniq.map(c => c.id));
  let rows = uniq.map(c => ({ ...c, v: det[c.id] })).filter(r => {
    if (!r.v) return false;
    if (durSeconds(r.v.contentDetails && r.v.contentDetails.duration) < MIN_SECONDS) return false;
    if (r.trusted) return true; // dina kanaler: alltid ok
    if (!looksEnglish(r.v)) return false;
    return (+(r.v.statistics?.viewCount || 0)) >= MIN_VIEWS_DISCOVER;
  });

  // dina kanaler först, sedan mest sedda
  rows.sort((a, b) => (b.trusted - a.trusted) || (+(b.v.statistics?.viewCount || 0)) - (+(a.v.statistics?.viewCount || 0)));
  rows = rows.slice(0, MAX_ITEMS);

  const items = [];
  for (const r of rows) {
    const v = r.v;
    const s = await summarize(v, platformNames);
    const map = CATMAP[s.cat] || CATMAP.mdl;
    items.push({
      tag: map.tag, lab: map.lab, ico: map.ico,
      ttl: s.ttl,
      meta: v.snippet.channelTitle + " · " + (v.snippet.publishedAt || "").slice(0, 10),
      plat: s.plat,
      url: "https://www.youtube.com/watch?v=" + v.id,
      img: "https://img.youtube.com/vi/" + v.id + "/hqdefault.jpg",
      more: "https://www.google.com/search?q=" + encodeURIComponent(s.q),
      feed: "", sum: s.sum, full: s.full,
      buzz: buzzFromViews(v.statistics && v.statistics.viewCount),
      cat: s.cat,
      date: v.snippet.publishedAt || new Date().toISOString(),
      chans: [v.snippet.channelTitle], deep: "",
    });
  }
  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  await writeFile(OUT, JSON.stringify(items, null, 1));
  console.log("Skrev " + items.length + " nyheter (" + rows.filter(r=>r.trusted).length + " från dina kanaler).");
})();
