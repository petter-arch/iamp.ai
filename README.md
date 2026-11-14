# iamp.ai – kreativ AI med automatisk bevakning

Originalets utseende, utförliga nyhetskort, videokapitel, Snabbfakta, Funktioner, Fördelar, Nackdelar och jämförelser är kvar. Topplistan heter Trendar. Fliken Kanaler använder samma register som nyhetsbevakningen.

## Automatik och aktualitet

- Trendar bevakar officiella källor dagligen utan OpenAI-anrop. Samma URL hämtas en gång per körning. Saknas tidigare källor hämtas produktens officiella startsida som en bevakningsbaslinje. En åtkomlig eller oförändrad sida gör aldrig tidigare overifierade fakta verifierade.
- `model-report.json` skiljer källbevakning (`monitor`) från faktaverifiering (`health`). `attempted` räknar behandlade profiler, inte lyckade faktagranskningar. Fel och ändrade källor behåller tidigare fakta och synlig varning.
- En fullständig tidigare faktagranskning kan återanvändas endast när dess källor och profilfakta är identiska och granskningen är högst sju dagar gammal. Gratisbevakningen kan inte ersätta en ny fullständig granskning efter detta.
- Nyheter har två dagliga fönster med ett reservförsök. Ett lyckat resultat de senaste åtta timmarna hoppar över reservkörningen. Kodändringar och manuella körningar går förbi tidsgrinden. Innehållsjobben delar skrivlås.
- Nyhetsjobbet hämtar kanalernas offentliga RSS-flöden med YouTube-API som reserv. Kanalmetadata återanvänds i sju dagar; ämnessökning och videodetaljer använder fortsatt YouTubes API-kvot.
- Klassificeringar och godkända eller avböjda artikelutkast cachas i `news-cache.json`, bundet till källtext, vald modell och policyversion. Artikelcache tar också hänsyn till modellregistret. Cachen sparas efter lyckade svar och återanvänds högst 14 dagar, även efter ett senare fel. Ändrade underlag bedöms på nytt. Ingen cache publiceras till besökarna.
- Vid API-fel behålls senaste publicerade nyheter och deras lyckade kontrolltid. Felrapport och källmetadata sparas, körningen förblir röd och webbplatsen kan visa misslyckad uppdatering. Vid 429/401/403 stoppas fler nya AI-uppgifter i samma körning efter transportens befintliga återförsök.
- Nya modeller publiceras bara efter fullständig officiell faktakontroll, utan påhittade betyg. Automatisk ny modellgranskning är avstängd i gratisbevakningen. Trendar mäter viktade videoomnämnanden under 30 dagar, inte oberoende kvalitet.

## Nyheter och kanaler

Startsidan prioriterar ungefär 70 % foto/film, 20 % ljud/3D och högst 10 % bredare AI-teknik. Tomma ämnen fylls inte med ovidkommande tekniknyheter. Bevakningen hämtar de valda kanalernas senaste videor och kompletterar med ämnessökningar, utan lägsta visningsgräns. Relevans kontrolleras före urvalet.

`sources.json` är registret för både bevakning och kanalflik. Det inkluderar originalkanalerna, tidigare nyhetskällor samt PiXimperfect, The Dor Brothers, William Faucher, Venus Theory och Two Minute Papers. Beskrivningar är redaktionella; prenumerantantal hämtas från YouTube. AI måste vara huvudämnet även hos favoritkanaler. Genererade artiklar kontrolleras för svenska. Poster markerade för omgranskning bevaras men visas inte, påverkar inte Trendar och används inte för ny modellupptäckt.

Alla tillgängliga kapitel i videobeskrivningen kan visas. Inga kapitel eller transkript hittas på. Artiklarna grundas på publicistens beskrivning, inte på att agenten har sett videon.

## Filer och test

- `index.html`: den befintliga sidans layout och funktioner.
- `profile-health.js`: små statusrader som läggs till vid publicering, utan ändring av originalets layoutkod.
- `site-data.json`: sammanhängande paket med nyhetsarkiv, modeller, kanaler, faktakällor och `profileChecks`.
- `news.json`: kompatibilitetsarkiv.
- `update.mjs`, `data-core.mjs`: befintligt nyhetsflöde och gemensamma regler.
- `profile-refresh.mjs`: hela modellistans kontroller, källcache och kandidatprioritering.
- `openai.mjs`: gemensam Responses API-transport med inbyggd fetch, utan nytt paketberoende.
- `update-report.json`: nyhetsrapport. `model-report.json`: separat modellrapport som inte skrivs över av nästa nyhetsjobb.
- `publish-data.mjs`: kopierar enbart besökarfiler till `_site/` och lägger till versionsmärkt statusskript.
- `.github/workflows/monthly-review.yml`: dagligt modelljobb trots äldre filnamn.
- `.github/workflows/update-news.yml`: nyheter och kanaler. `.github/workflows/deploy-pages.yml`: publicering.

Kör `node --test *.test.mjs *.test.cjs`. De nya testerna omfattar hela listan, begränsad parallellism, isolerade fel, cache, tomma svar, identitet, prisgrupper, kandidatkö, betygsskydd, statustexter och publiceringspaketet. Lokala testdubblar bevisar inte att externa API:er eller officiella webbplatser fungerar. Kör modelljobbet och granska `model-report.json` även om Actions är grönt. Fältfel syns i rapporten och på webbplatsen. En tidsbudget kan lämna poster okontrollerade; de räknas då som överhoppade, inte lyckade.

## Drift och publicering

Behåll befintliga repository secrets `YOUTUBE_API_KEY` och `OPENAI_API_KEY`. Inga nycklar ska ligga i filer eller loggar. `OPENAI_NEWS_MODEL` och `OPENAI_PROFILE_MODEL` väljer modeller; standard är `gpt-5.6-luna` respektive `gpt-5.6-terra`. Nyckeln behöver rätt modellåtkomst och API-saldo. Detta använder befintlig integration, inte en ny nyckel eller en ny server.

Den schemalagda Trendar-bevakningen gör inga OpenAI-anrop. Betald Trendar-granskning är avstängd i koden. Både `profile-refresh.mjs` och den äldre `update.mjs --profiles` är spärrade från betalda profilanrop, även om miljövariabler anger något annat. Kodpushar kör bara offline-tester och gratis Trendar-bevakning; betald nyhetsskrivning startar endast enligt schema eller manuellt. Nyhetsskrivningen använder fortfarande OpenAI; cache minskar upprepade anrop men kostnadsbesparingen i produktion är ännu inte uppmätt. Nyhetsgränserna är oförändrade: normalt högst 36 fördjupade sammanfattningar och 20 nya publicerade artiklar per nyhetskörning.

Arbetsflödena kan startas manuellt på en arbetsgren och sparar förhandsversioner. Publicering sker bara från `main`, med befintlig GitHub Pages-miljö och domänen iamp.ai. Innehållsjobben delar skrivlås. Vanliga kodändringar i modelljobbet startar också en kontroll från `main`.

Responses API använder `store:false`. Avbrutna svar, vägran, HTTP-fel och misslyckad webbsökning kontrolleras innan JSON används. 429 och serverfel försöks upp till tre gånger. Webbsökning debiteras separat. Sökresultat ersätter aldrig en misslyckad direkthämtning av officiella belägg.

Dokumentation: [Responses](https://developers.openai.com/api/docs/guides/text), [webbsökning](https://developers.openai.com/api/docs/guides/tools-web-search), [GitHub workflow-händelser](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
