# iamp.ai – kreativ AI med automatisk bevakning

Originalets utseende, utförliga nyhetskort, videokapitel, Snabbfakta, Funktioner, Fördelar, Nackdelar och jämförelser är kvar. Topplistan heter Trendar. Fliken Kanaler använder samma register som nyhetsbevakningen.

## Automatik

- Nyheter och kanalfakta kontrolleras två gånger per dygn, 02:40 och 14:40 UTC.
- Modellfakta och upptäckt av nya modeller körs dagligen 05:20 UTC.
- Startsidan prioriterar ungefär 70 % foto/film, 20 % ljud/3D och högst 10 % bredare AI-teknik. Tomma ämnen fylls inte med ovidkommande tekniknyheter.
- Bevakningen hämtar de utvalda kanalernas senaste videor och kompletterar med ämnessökningar. Relevans klassificeras före det slutliga urvalet. Det finns ingen lägsta visningsgräns.
- Alla kapitel som faktiskt finns i videobeskrivningen kan visas, utan gränsen på åtta. Inga kapitel eller transkript hittas på. Texten grundas på hela publicistens beskrivning, inte på att agenten har sett videon.
- Nya modeller och versioner upptäcks i källmaterialet. Upp till två kandidater per dag undersöks. Kompletta profiler publiceras först när den officiella identiteten och faktakällorna kan beläggas. Otillräckligt underlag sparas för senare försök.
- Fyra befintliga modellprofiler per dag kontrolleras. Varje ändrat fält behöver en officiell källa och ett citat som också återfinns på den hämtade sidan. Tidigare fakta behålls vid fel. AI-tolkningar kan fortfarande bli fel; källspårningen gör ändringarna granskningsbara.
- Trendar sorteras efter unika färska videoomnämnanden under 30 dagar, med halverad vikt efter sju dagar och högst tre videor per kanal/modell. Detta mäter uppmärksamhet i bevakningen, inte hela marknaden.
- Originalets redaktionella betyg behålls. Nya profiler får **—** tills ett jämförbart kvalitetsunderlag finns; de får aldrig påhittade eller ärvda betyg. Pris, funktioner och dokumenterade styrkor/begränsningar går fortfarande att jämföra.

## Kanaler

`sources.json` är källregistret för både bevakning och kanalfliken. Det inkluderar originalkanalerna, de tidigare nyhetskällorna samt PiXimperfect, The Dor Brothers, William Faucher, Venus Theory och Two Minute Papers. Kanalbeskrivningar är redaktionella; prenumerantantal hämtas från YouTube. Varje video filtreras efter sidans ämnen, även från en favoritkanal.

Nya rekommendationer kontrollerades mot [PiXimperfect](https://www.piximperfect.com/), [The Dor Brothers](https://www.thedorbrothers.com/), [William Faucher](https://www.artstation.com/will_faucher), [Venus Theory](https://venustheory.com/) och [Two Minute Papers](https://users.cg.tuwien.ac.at/zsolnai/gfx/two-minute-papers-awesome-research-for-everyone/).

## Filer

- `index.html`: originalets sida med förbättrad dataladdning, Trendar och gemensamt kanalregister.
- `site-data.json`: ett sammanhängande paket med arkiv, modeller, kanalfakta och källkontroller.
- `news.json`: nyhetsarkiv för bakåtkompatibilitet.
- `update.mjs`, `data-core.mjs`: uppdatering och regler.
- `publish-data.mjs`: samlar endast besökarfiler i `_site/`.
- `*.test.mjs`, `*.test.cjs`: automatiska kontroller.
- `.github/workflows/update-news.yml`: nyheter och kanaler.
- `.github/workflows/monthly-review.yml`: trots det gamla filnamnet körs nu daglig modelluppdatering. Det gamla rapportjobbet ersätts.

De äldre skripten `ai-news.mjs` och `ai-review.mjs` ligger kvar för historik, men används inte av de nya jobben.

## Publicering och test

Behåll befintliga GitHub-hemligheter `YOUTUBE_API_KEY` och `ANTHROPIC_API_KEY`. Valfria variabler `NEWS_MODEL` och `PROFILE_MODEL` väljer API-modell. Inga nycklar ska finnas i webbplatsens filer. Standardbegränsningen är 36 fördjupade sammanfattningar och högst 20 publicerade nya artiklar per nyhetskörning; API-kostnaden beror på källornas mängd och vald modell.

Arbetsflödena kan köras manuellt på en arbetsgren. De sparar resultat och en nedladdningsbar förhandsversion, men publicerar **bara från main**. Publiceringsmiljön är github-pages. GitHub Pages behöver använda GitHub Actions som källa; domänen iamp.ai och CNAME behålls.

Kör `node --test *.test.mjs *.test.cjs` för kontroller. Kör sedan båda arbetsflödena på arbetsgrenen och granska deras rapporter innan sammanslagning med main. Att testerna passerar är inte samma sak som att externa API:er och källor har verifierats i en riktig körning.

Käll/API-fel får inte radera tidigare artiklar eller fullständiga modellfakta. Jobben delar en kö för att undvika att de skriver över varandra. Schemalagda GitHub-körningar kan fördröjas. Fel framgår av Actions och `update-report.json`.
