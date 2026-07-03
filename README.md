# iamp.ai — kreativ AI-nyheter & topplista

## Filer
- `index.html` — hela sajten (en fil). GitHub Pages visar den automatiskt.
- `ai-news.mjs` — daglig nyhetsagent: hämtar färska YouTube-videor och låter Claude skriva svenska nyhetskort till `news.json`.
- `news.json` — nyhetsdata som sajten läser in vid laddning (uppdateras av agenten).
- `.github/workflows/update-news.yml` — kör agenten automatiskt varje dag 06:00 UTC.

## Kom igång (5 steg)
1. Skapa ett nytt repo på github.com (Public), t.ex. `iamp-ai`.
2. Ladda upp allt innehåll i den här mappen (dra och släpp i GitHub: "Add file → Upload files"). OBS: mappen `.github/workflows/` måste följa med.
3. Lägg in två hemligheter under **Settings → Secrets and variables → Actions → New repository secret**:
   - `YOUTUBE_API_KEY` — skapa gratis i Google Cloud Console (aktivera "YouTube Data API v3").
   - `ANTHROPIC_API_KEY` — skapa på console.anthropic.com.
4. Slå på **Settings → Pages** → Source: "Deploy from a branch" → Branch: `main` / root. Efter någon minut är sajten live på `https://DITTNAMN.github.io/iamp-ai/`.
5. Testa agenten direkt: fliken **Actions → Update news feed → Run workflow**. Efter körningen uppdateras `news.json` och sajten visar färska nyheter.

## Kostnad
YouTube API är gratis (kvot räcker gott). Claude-anropen med Haiku kostar ören per dag.

## Egen domän (iamp.ai)
Settings → Pages → Custom domain → skriv in din domän och peka DNS (CNAME) enligt GitHubs instruktion. 
 
