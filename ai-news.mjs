#!/usr/bin/env node
// ai-news.mjs — daglig nyhetsmotor för iamp.ai
// ----------------------------------------------------------------------------
// Vad den gör (1 gång/dygn via GitHub Actions, se update-news.yml):
//   1. Hämtar de MEST POPULÄRA SENASTE YouTube-videorna i dina ämnen
//      (gratis YouTube Data API v3) + ev. dina följda kanaler.
//   2. Summerar varje klipp kort med en billig AI-modell (några ören/dygn).
//   3. Skriver news.json i SAMMA format som NEWS-arrayen i iamp_ai.html.
//      Sajten läser filen vid laddning (NEWS_FEED='news.json') och visar
//      korten med "fördjupa" + ▶-länk till videon.
//
// Miljövariabler (läggs som GitHub Actions "secrets"):
//   YOUTUBE_API_KEY    (gratis — console.cloud.google.com → YouTube Data API v3)
//   ANTHROPIC_API_KEY  (för summeringen; utan den faller den tillbaka på
//                       videons egen titel/beskrivning, helt gratis)
//
// Kör lokalt:  YOUTUBE_API_KEY=xxx ANTHROPIC_API_KEY=yyy node ai-news.mjs
// ----------------------------------------------------------------------------

import { writeFile } from "node:fs/promises";

// ============================ KONFIG ========================================
const OUT         = "news.json";
const DAYS        = 14;   // "senaste": videor publicerade de senaste X dagarna
const PER_TOPIC   = 6;    // kandidater att hämta per ämne
const MAX_ITEMS   = 12;   // max antal nyheter i den färdiga listan
const MIN_SECONDS = 90;   // hoppa över Shorts (kortare än så)
const OUT_LANG    = "sv"; // "sv" eller "en" — språk på de genererade nyheterna
const MODEL       = "claude-haiku-4-5-20251001"; // billig modell; verifiera namnet på docs.claude.com

// Dina ämnen. q = sökord på YouTube. cat/tag/lab/ico styr hur kortet visas.
const TOPICS = [
  { q: "AI image generation model",   cat: "foto",       tag: "img", lab: "Foto / Bild",  ico: "📷" },
  { q: "AI video generation model",   cat: "film",       tag: "vid", lab: "Film / Video", ico: "🎬" },
  { q: "AI 3D model generation",      cat: "3d",         tag: "mdl", lab: "3D",           ico: "🧊" },
  { q: "AI music generation",         cat: "ljud",       tag: "mdl", lab: "Ljud",         ico: "🎵" },
  { q: "best AI tools productivity",  cat: "produktivt", tag: "mdl", lab: "Produktivt",   ico: "⚡" },
];

// Valfritt: kanaler du alltid vill bevaka. Lägg in kanal-ID (börjar med "UC...").
// Hittas via en kanalsida → "Dela" → kopiera kanal-ID, eller via Takeout-export.
const CHANNELS = [
  // "UCxxxxxxxxxxxxxxxxxxxxxx",
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

// ISO 8601-varaktighet ("PT5M30S") -> sekunder
function durSeconds(iso) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "");
  if (!m) return 0;
  return (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0));
}

async function searchTopic(t) {
  const u = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=viewCount"
    + "&maxResults=" + PER_TOPIC
    + "&publishedAfter=" + encodeURIComponent(sinceISO)
    + "&q=" + encodeURIComponent(t.q)
    + "&relevanceLanguage=en&key=" + YT;
  const d = await getJSON(u);
  return (d.items || []).map(it => ({ id: it.id.videoId, topic: t }));
}

async function searchChannel(ch) {
  const u = "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=date"
    + "&maxResults=3"
    + "&publishedAfter=" + encodeURIComponent(sinceISO)
    + "&channelId=" + ch + "&key=" + YT;
  const d = await getJSON(u);
  return (d.items || []).map(it => ({ id: it.id.videoId, topic: TOPICS[0] }));
}

async function details(ids) {
  const out = {};
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const u = "https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id="
      + chunk.join(",") + "&key=" + YT;
    const d = await getJSON(u);
    (d.items || []).forEach(v => { out[v.id] = v; });
  }
  return out;
}

// Visningar -> "buzz" 40–99 (logaritmiskt, så miljoner inte spränger skalan)
function buzzFromViews(views) {
  const n = +(views || 0);
  if (n <= 0) return 45;
  return Math.max(45, Math.min(99, Math.round(40 + 12 * Math.log10(n))));
}

function fallbackSummary(desc, title) {
  const line = (String(desc || "").split("\n").find(s => s.trim().length > 30) || desc || title || "").trim();
  const short = line.slice(0, 180);
  return { ttl: title, sum: short, full: short };
}

async function summarize(v) {
  const title = v.snippet.title;
  const desc = (v.snippet.description || "").slice(0, 1800);
  const chan = v.snippet.channelTitle;
  if (!AK) return fallbackSummary(desc, title);

  const sys = OUT_LANG === "sv"
    ? 'Du är redaktör för en nyhetssida om kreativ AI. Skriv en kort, saklig nyhetsuppdatering på svenska utifrån videons titel och beskrivning. Hitta inte på fakta som inte stöds av texten. Svara ENBART med giltig JSON: {"ttl": kort rubrik (max ca 9 ord), "sum": en mening, "full": 2-3 meningar}.'
    : 'You are an editor for a creative-AI news site. Write a short, factual news update in English based on the video title and description. Do not invent facts beyond the text. Reply ONLY with valid JSON: {"ttl": short headline (max ~9 words), "sum": one sentence, "full": 2-3 sentences}.';

  const body = {
    model: MODEL,
    max_tokens: 400,
    system: sys,
    messages: [{ role: "user", content: "Kanal: " + chan + "\nTitel: " + title + "\nBeskrivning:\n" + desc }],
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
    return { ttl: j.ttl || title, sum: j.sum || "", full: j.full || j.sum || "" };
  } catch (e) {
    console.error("summarize fallback:", e.message);
    return fallbackSummary(desc, title);
  }
}

(async () => {
  // 1) samla kandidater
  let cands = [];
  for (const t of TOPICS) {
    try { cands = cands.concat(await searchTopic(t)); }
    catch (e) { console.error("topic", t.q, e.message); }
  }
  for (const ch of CHANNELS) {
    try { cands = cands.concat(await searchChannel(ch)); }
    catch (e) { console.error("channel", ch, e.message); }
  }

  // dedupe på video-id
  const seen = {}, uniq = [];
  for (const c of cands) { if (c.id && !seen[c.id]) { seen[c.id] = 1; uniq.push(c); } }
  if (!uniq.length) { console.error("Inga videor hittades."); await writeFile(OUT, "[]"); return; }

  // 2) detaljer (visningar, beskrivning, längd)
  const det = await details(uniq.map(c => c.id));
  let rows = uniq
    .map(c => ({ ...c, v: det[c.id] }))
    .filter(r => r.v && durSeconds(r.v.contentDetails && r.v.contentDetails.duration) >= MIN_SECONDS);

  // 3) mest sedda först, ta topp
  rows.sort((a, b) => (+(b.v.statistics?.viewCount || 0)) - (+(a.v.statistics?.viewCount || 0)));
  rows = rows.slice(0, MAX_ITEMS);

  // 4) summera + bygg nyhetsobjekt (samma fält som NEWS i iamp_ai.html)
  const items = [];
  for (const r of rows) {
    const v = r.v, t = r.topic;
    const s = await summarize(v);
    items.push({
      tag: t.tag,
      lab: t.lab,
      ico: t.ico,
      ttl: s.ttl,
      meta: v.snippet.channelTitle + " · " + (v.snippet.publishedAt || "").slice(0, 10),
      plat: "",
      url: "https://www.youtube.com/watch?v=" + v.id,
      img: "https://img.youtube.com/vi/" + v.id + "/hqdefault.jpg",
      feed: "",
      sum: s.sum,
      full: s.full,
      buzz: buzzFromViews(v.statistics && v.statistics.viewCount),
      cat: t.cat,
      date: v.snippet.publishedAt || new Date().toISOString(),
      chans: [v.snippet.channelTitle],
      deep: "",
    });
  }

  // nyaste först
  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  await writeFile(OUT, JSON.stringify(items, null, 1));
  console.log("Skrev " + items.length + " nyheter till " + OUT);
})();
