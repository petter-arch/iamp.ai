# iamp.ai — kreativ AI-nyheter & topplista

## Filer
- `index.html` — hela sajten (en fil). GitHub Pages visar den automatiskt.
- `ai-news.mjs` — nyhetsagent: hämtar färska YouTube-videor och låter Claude skriva svenska nyhetskort till `news.json`.
- `ai-review.mjs` — granskar topplistan mot aktuella källor och skriver `review-report.md`.
- `news.json` — nyhetsdata som sajten läser in vid laddning (uppdateras av agenten).
- `.github/workflows/update-news.yml` — kör nyhetsagenten två gånger per dygn.
- `.github/workflows/monthly-review.yml` — kör topplistegranskningen den 1:a varje månad och öppnar ett ärende med rapporten.

## Automatik och tider

| Jobb | Cron (UTC) | Svensk sommartid | Svensk vintertid |
|---|---|---|---|
| Update news feed | `40 2 * * *` | ca 04:45 | ca 03:45 |
| Update news feed | `40 14 * * *` | ca 16:45 | ca 15:45 |
| Monthly topplista review | `0 7 1 * *` | ca 09:00 den 1:a | ca 08:00 den 1:a |

Att veta om schemalagda jobb i GitHub Actions:

- **Cron går alltid i UTC.** Ingen hänsyn tas till sommartid, så tiderna ovan glider en timme i slutet av oktober och mars. Vill du hålla svensk klocka konstant får du ändra timsiffran manuellt två gånger om året.
- **Udda minuttal är medvetet.** Jobb schemalagda på hel timme hamnar i kö och kan starta över två timmar för sent. `:40` minskar den risken.
- **Nyhetsjobbet committar bara om något faktiskt ändrats**, så det blir inga tomma commits.

## Manuell körning
Fliken **Actions** → välj workflow → **Run workflow**. Fungerar för båda jobben.

## Månadsgranskningen — läs den, följ den inte blint
Den 1:a varje månad öppnas ett ärende under **Issues** med en genomgång av topplistan. Rapporten är AI-genererad och ska behandlas som spaning, inte som facit. Erfarenheter så här långt:

- Den läser den `index.html` som ligger uppe just då, så den kan anmärka på saker du redan hunnit fixa.
- Den citerar ibland benchmarksiffror som var aktuella flera månader tidigare.
- Den har föreslagit poster som inte finns och versionsnummer som inte går att belägga.

Verifiera varje punkt mot källa innan du ändrar ett betyg. Betygen i `PLATS` är din bedömning — låt inget skript skriva dem.

## Kom igång (5 steg)
1. Skapa ett nytt repo på github.com (Public), t.ex. `iamp-ai`.
2. Ladda upp allt innehåll i den här mappen ("Add file → Upload files"). OBS: mappen `.github/workflows/` måste följa med — filer som hamnar i roten körs inte.
3. Lägg in två hemligheter under **Settings → Secrets and variables → Actions → New repository secret**:
   - `YOUTUBE_API_KEY` — skapa gratis i Google Cloud Console (aktivera "YouTube Data API v3").
   - `ANTHROPIC_API_KEY` — skapa på console.anthropic.com.
4. Slå på **Settings → Pages** → Source: "Deploy from a branch" → Branch: `main` / root. Efter någon minut är sajten live på `https://DITTNAMN.github.io/iamp-ai/`.
5. Testa agenten direkt: **Actions → Update news feed → Run workflow**. Efter körningen uppdateras `news.json` och sajten visar färska nyheter.

## Kostnad
YouTube API är gratis (kvoten räcker gott). Claude-anropen kostar ören per dag.

## Egen domän (iamp.ai)
Settings → Pages → Custom domain → skriv in din domän och peka DNS (CNAME) enligt GitHubs instruktion.
