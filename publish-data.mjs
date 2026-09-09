import {mkdir,copyFile,writeFile} from 'node:fs/promises';
await mkdir('_site',{recursive:true});
for(const file of ['index.html','site-data.json','news.json','CNAME'])await copyFile(file,'_site/'+file);
await writeFile('_site/.nojekyll','');
