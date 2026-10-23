# iamp.ai – kreativ AI med automatisk bevakning

Originalets utseende, utförliga nyhetskort, videokapitel, Snabbfakta, Funktioner, Fördelar, Nackdelar och jämförelser är kvar. Topplistan heter Trendar. Fliken Kanaler använder samma register som nyhetsbevakningen.

## Automatik och aktualitet

- Nyheter och kanalfakta har två dagliga uppdateringsfönster, med ett billigt reservförsök per fönster. Det befintliga nyhetsflödet i `update.mjs` är oförändrat.
- **Hela den befintliga modellistan** kontrolleras dagligen, inte längre fyra modeller åt gången. Modelljobbet har också ett reservförsök och reagerar när nyhetsjobbet avslutas. Identiska underlag och redan gjorda kontroller hoppas över. GitHub kan fördröja schemalagda jobb; detta är inte en realtidsgaranti.
- `profile-refresh.mjs` är modelljobbets nya körväg. `update.mjs --profiles` finns kvar som äldre manuell kod men används inte av automatiken.
- Varje profil skiljer mellan kontrollförsök och lyckad verifiering. Ofullständiga, misslyckade och för gamla kontroller visas öppet på korten. En tom ändringslista eller en ny nyhetsstämpel betyder **inte** att modellfakta är verifierade. Ett öppet webbläsarfönster räknar också uppgifternas ålder utan nya serveranrop.
- Alla stödda faktadelar, även oförändrade, behöver officiella belägg och en separat granskning av hela påståendet. Modellidentitet måste styrkas innan fakta ändras. Pris, prisnivå och gratisstatus uppdateras tillsammans. Tidigare fakta och redaktionella betyg behålls vid fel; fel gör inte gammal information aktuell.
- En tidigare fullständig verifiering kan återanvändas när de direkt hämtade officiella källtexterna har samma kontrollsummor och profilens fakta inte har ändrats. Ny webbsökning tvingas minst varje vecka. Samma källsida hämtas bara en gång per körning. Högst tre profiler behandlas samtidigt.
- Nya kandidater prioriteras efter färska omnämnanden, inte köplats från flera veckor tillbaka. Högst åtta undersöks per körning. Misslyckanden får 1–7 dagars återförsökspaus; nytt källmaterial öppnar för ett tidigare försök. En kandidat är inte en verifierad profil och publiceras aldrig bara för att tömma kön.
- Nya profiler behöver fullständiga officiella belägg, detaljerade texter och separat faktagranskning. De får **—** i betyg tills jämförbart kvalitetsunderlag finns, aldrig påhittade eller ärvda poäng.
- Trendar räknas om efter varje innehållskörning: unika färska videoomnämnanden under 30 dagar, halverad vikt efter sju dagar, högst tre videor per kanal/modell. Detta mäter uppmärksamheten i bevakningen, inte hela marknaden.

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

Helkontrollen kan kosta mer än det gamla fyramodellsjobbet, särskilt första gången och när underlag inte går att verifiera. Källåteranvändning, högst åtta nya profiler per körning och en återförsökspaus begränsar onödiga anrop. Nyhetsgränserna är oförändrade: normalt högst 36 fördjupade sammanfattningar och 20 nya publicerade artiklar per nyhetskörning.

Arbetsflödena kan startas manuellt på en arbetsgren och sparar förhandsversioner. Publicering sker bara från `main`, med befintlig GitHub Pages-miljö och domänen iamp.ai. Innehållsjobben delar skrivlås. Vanliga kodändringar i modelljobbet startar också en kontroll från `main`.

Responses API använder `store:false`. Avbrutna svar, vägran, HTTP-fel och misslyckad webbsökning kontrolleras innan JSON används. 429 och serverfel försöks upp till tre gånger. Webbsökning debiteras separat. Sökresultat ersätter aldrig en misslyckad direkthämtning av officiella belägg.

Dokumentation: [Responses](https://developers.openai.com/api/docs/guides/text), [webbsökning](https://developers.openai.com/api/docs/guides/tools-web-search), [GitHub workflow-händelser](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
