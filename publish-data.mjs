import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('_site',{recursive:true});
for(const file of ['site-data.json','news.json','CNAME','profile-health.js'])await copyFile(file,'_site/'+file);
const html=await readFile('index.html','utf8');
if(!html.includes('</body>'))throw Error('Missing body terminator; refusing an incomplete publication');
const version=createHash('sha256').update(await readFile('profile-health.js')).digest('hex').slice(0,12);
// Keep the approved original layout intact; add the small status enhancement
// after its existing script. Cache-bust the enhancement on each code change.
await writeFile('_site/index.html',html.replace('</body>','<script src="profile-health.js?v='+version+'"></script>\n</body>'));
await writeFile('_site/.nojekyll','');
