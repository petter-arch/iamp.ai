import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {applyOfficialReleases} from './release-watch.mjs';
import {trends} from './data-core.mjs';
await mkdir('_site',{recursive:true});
for(const file of ['news.json','CNAME','profile-health.js'])await copyFile(file,'_site/'+file);
const data=JSON.parse(await readFile('site-data.json','utf8'));
if(applyOfficialReleases(data))data.trends={calculatedAt:new Date().toISOString(),windowDays:30,halfLifeDays:7,scores:trends(data.news,data.platforms,new Date().toISOString())};
await writeFile('_site/site-data.json',JSON.stringify(data,null,2)+'\n');
const html=await readFile('index.html','utf8');
if(!html.includes('</body>'))throw Error('Missing body terminator; refusing an incomplete publication');
const version=createHash('sha256').update(await readFile('profile-health.js')).digest('hex').slice(0,12);
// Keep the approved original layout intact; add the small status enhancement
// after its existing script. Cache-bust the enhancement on each code change.
await writeFile('_site/index.html',html.replace('</body>','<script src="profile-health.js?v='+version+'"></script>\n</body>'));
await writeFile('_site/.nojekyll','');
