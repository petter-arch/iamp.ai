# iamp.ai – kreativ AI med automatisk bevakning

Originalets utseende, utförliga nyhetskort, videokapitel, Snabbfakta, Funktioner, Fördelar, Nackdelar och jämförelser är kvar. Topplistan heter Trendar. Fliken Kanaler använder samma register som nyhetsbevakningen.

## Automatik

- Nyheter och kanalfakta kontrolleras två gånger per dygn, 02:40 och 14:40 UTC.
- Modellfakta och upptäckt av nya modeller körs dagligen 05:20 UTC.
- Startsidan prioriterar ungefär 70 % foto/film, 20 % ljud/3D och högst 10 % bredare AI-teknik. Tomma ämnen fylls inte med ovidkommande tekniknyheter.
- Bevakningen hämtar de utvalda kanalernas senaste videor och kompletterar med ämnessökningar. Relevans klassificeras före det slutliga urvalet. Det finns ingen lägsta visningsgräns.
- Alla kapitel som faktiskt finns i videobeskrivningen kan visas, utan gränsen på åtta. Inga kapitel eller transkript hittas på. Texten grundas på hela publicistens beskrivning, inte på att agenten har sett videon.
- Nya modeller och versioner upptäcks i källmaterialet. Upp till två kandidater per dag undersöks. Kompletta profiler publiceras först när den officiella identiteten och faktakällorna kan beläggas. Otillräckligt underlag sparas för senare försök.
- Fyra befintliga modellprofiler per dag kontrolleras. Varje ändrat fält behöver en officiell källa och ett citat som också återfinns på den hämtade sidan. En andra AI-kontroll granskar att hela påståendet stöds. Tidigare fakta behålls vid fel. Officiella sidor läses direkt för citatkontrollen. Om en sida blockerar direkthämtning behålls tidigare fakta; sökresultat ersätter inte källtext. AI-tolkningar kan fortfarande bli fel; källspårningen gör ändringarna granskningsbara.
- Trendar sorteras efter unika färska videoomnämnanden under 30 dagar, med halverad vikt efter sju dagar och högst tre videor per kanal/modell. Detta mäter uppmärksamhet i bevakningen, inte hela marknaden.
- Originalets redaktionella betyg behålls. Nya profiler får **—** tills ett jämförbart kvalitetsunderlag finns; de får aldrig påhittade eller ärvda betyg. Pris, funktioner och dokumenterade styrkor/begränsningar går fortfarande att jämföra.

## Kanaler

`sources.json` är källregistret för både bevakning och kanalfliken. Det inkluderar originalkanalerna, de tidigare nyhetskällorna samt PiXimperfect, The Dor Brothers, William Faucher, Venus Theory och Two Minute Papers. Kanalbeskrivningar är redaktionella; prenumerantantal hämtas från YouTube. Varje video filtreras efter sidans ämnen, även från en favoritkanal. AI måste vara huvudämnet, med ett citat från källan. Genererade texter kontrolleras för svenska. Artiklar markerade för omgranskning bevaras i underlaget men visas inte och påverkar inte Trendar.

Nya rekommendationer kontrollerades mot [PiXimperfect](https://www.piximperfect.com/), [The Dor Brothers](https://www.thedorbrothers.com/), [William Faucher](https://www.artstation.com/will_faucher), [Venus Theory](https://venustheory.com/) och [Two Minute Papers](https://users.cg.tuwien.ac.at/zsolnai/gfx/two-minute-papers-awesome-research-for-everyone/).

## Filer

- `index.html`: originalets sida med förbättrad dataladdning, Trendar och gemensamt kanalregister.
- `site-data.json`: ett sammanhängande paket med arkiv, modeller, kanalfakta och källkontroller.
- `news.json`: nyhetsarkiv för bakåtkompatibilitet.
- `update.mjs`, `data-core.mjs`: uppdatering och regler. `openai.mjs`: Responses API via inbyggd fetch, utan nya paket.
- `publish-data.mjs`: samlar endast besökarfiler i `_site/`.
- `*.test.mjs`, `*.test.cjs`: automatiska kontroller.
- `.github/workflows/update-news.yml`: nyheter och kanaler.
- `.github/workflows/monthly-review.yml`: trots det gamla filnamnet körs nu daglig modelluppdatering. Det gamla rapportjobbet ersätts.

De äldre skripten `ai-news.mjs` och `ai-review.mjs` ligger kvar som äldre manuella verktyg och använder också OpenAI, men används inte av de nya jobben.

## Publicering och test

Behåll befintlig GitHub-hemlighet `YOUTUBE_API_KEY` och lägg till `OPENAI_API_KEY`. Valfria variabler `OPENAI_NEWS_MODEL` och `OPENAI_PROFILE_MODEL` väljer API-modell; standard är `gpt-5.6-luna` för nyheter och `gpt-5.6-terra` för webbaserad profilkontroll. Gamla modellvariabler används inte. API-nyckeln behöver åtkomst till båda modellerna och tillgängligt API-saldo. Inga nycklar ska finnas i webbplatsens filer. Standardbegränsningen är 36 fördjupade sammanfattningar och högst 20 publicerade nya artiklar per nyhetskörning; API-kostnaden beror på källornas mängd och vald modell.

Arbetsflödena kan köras manuellt på en arbetsgren. De sparar resultat och en nedladdningsbar förhandsversion, men publicerar **bara från main**. Publiceringsmiljön är github-pages. GitHub Pages behöver använda GitHub Actions som källa; domänen iamp.ai och CNAME behålls.

Kör `node --test *.test.mjs *.test.cjs` för kontroller. Kör sedan båda arbetsflödena på arbetsgrenen och granska deras rapporter innan sammanslagning med main. Att testerna passerar är inte samma sak som att externa API:er och källor har verifierats i en riktig körning.

Käll/API-fel får inte radera tidigare artiklar eller fullständiga modellfakta. Jobben delar en kö för att undvika att de skriver över varandra. Schemalagda GitHub-körningar kan fördröjas. Fel framgår av Actions och `update-report.json`.

## Aktivera OpenAI-bytet

1. Lägg till en repository secret med namnet `OPENAI_API_KEY` i Settings → Secrets and variables → Actions. Klistra bara in nyckeln där. Behåll `YOUTUBE_API_KEY`.
2. För över ändrade kodfiler, båda workflows och de nya filerna `openai.mjs` och `openai.test.mjs` till repot. Använd gärna en arbetsgren först. Datafiler och sidans HTML behöver inte bytas ut.
3. Kör Actions → Update news feed → Run workflow på arbetsgrenen, därefter Update Trendar models. Kontrollera både jobbstatus och `update-report.json` (profilfel kan loggas även om jobbet är grönt).
4. Efter granskning: slå samman ändringen till main för att använda den i det befintliga schemat. En manuell körning på main kan publicera på iamp.ai.

OpenAI använder Responses API med `store: false`. Textsvar, avbrutna svar, vägran, HTTP-fel och misslyckad webbsökning kontrolleras innan JSON tas emot. 429 och serverfel försöks upp till tre gånger. Webbsökning har separat kostnad. Ett riktigt API-test kräver din nyckel och har inte utförts i den lokala migreringen.

Dokumentation: [Responses-textsvar](https://developers.openai.com/api/docs/guides/text), [webbsökning](https://developers.openai.com/api/docs/guides/tools-web-search), [Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna), [Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra).

## Verifierade efterföljare

Profilkontrollen söker även efter en officiellt lanserad efterföljare. Ett högre versionsnummer, en jämförelse eller en ny API-variant räcker inte. Domänerna utgår från den tidigare profilens officiella webbplats; varje citat hämtas direkt och kontrolleras. En separat granskning måste styrka relationen mellan de exakta versionerna och faktagranskningen måste godkänna varje fält i en komplett efterföljarprofil. Byte till en ny leverantörsdomän kräver redaktionell hantering.

Bytet sker atomärt: namn, härlett ID, URL och samtliga fakta byts tillsammans. Inga gamla fakta eller betyg ärvs. Den kompletta tidigare profilen sparas i `versionHistory`, med namn i `aliases` och tidigare ID:n i `idAliases`. Historiska nyhetstexter och referenser ändras inte; både Trendar och webbsidans dataladdning kan följa alias genom flera byten. Trendar mäter därmed uppmärksamheten kring produktens verifierade versionskedja, inte enbart den senaste versionen. Kollisioner med andra profiler stoppar migreringen för manuell granskning.

`update-report.json` innehåller `successors` med `migrated`, `unverified`, `none` eller `check-failed`. Vid en möjlig men obestyrkt efterföljare sparas kandidatnamn och orsak också i profilens `successorCheck`; hela tidigare profilen behålls och inga patchfält från det svaret används. Upptäckta kandidater som tillhör befintliga profiler hänvisas till denna kontroll. Ett misslyckat försök räknas inte som en uppdatering. Kontrollen försöker igen när profilen återkommer i rotationen.

ChatGPT Images uppdaterades redaktionellt till 2.5 den 29 september 2026 efter läsning av [2.0-sidans uttryckliga hänvisning till efterföljaren](https://openai.com/index/introducing-chatgpt-images-2-0/), [lanseringen av 2.5](https://openai.com/index/introducing-chatgpt-images-2-5/) och [aktuell hjälp](https://help.openai.com/en/articles/11084440-images-in-chatgpt). Källor och granskningssätt finns i posten. Gamla 2.0-fakta och redaktionella betyg finns i historiken; 2.5 är obetygsatt. Denna redaktionella kontroll är inte en körning av det schemalagda API-jobbet.
