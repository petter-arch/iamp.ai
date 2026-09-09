const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const file='index.html';
const html=fs.readFileSync(file,'utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
class Element{
 constructor(id){this.id=id;this.innerHTML='';this.value='';this.textContent='';this.dataset={};this.style={setProperty(){}};this.attrs={};this.listeners={};this.classList={add(){},remove(){},toggle(){},contains(){return false}};this.scrollWidth=0;}
 addEventListener(k,f){(this.listeners[k]??=[]).push(f)} removeEventListener(){} setAttribute(k,v){this.attrs[k]=v} getAttribute(k){return this.attrs[k]||null} appendChild(){} remove(){} focus(){} closest(){return this} contains(){return false} getBoundingClientRect(){return {top:0,left:0,width:100,height:100}} querySelectorAll(){return []} querySelector(){return null} getContext(){return {}} 
}
const els=Object.fromEntries([...ids].map(id=>[id,new Element(id)]));
const doc={getElementById(id){return els[id]||null},querySelectorAll(){return []},querySelector(s){return s==='.top'?els[Object.keys(els)[0]]:null},addEventListener(){},removeEventListener(){},body:new Element('body'),documentElement:new Element('html'),createElement(){return new Element('created')},createElementNS(){return new Element('created')}};
const context={document:doc,window:{innerWidth:1280,innerHeight:850,scrollTo(){}},navigator:{language:'sv',languages:['sv']},localStorage:{getItem(){return null},setItem(){}},location:{search:''},URL,URLSearchParams,Date,console,setTimeout(){},setInterval(){},clearInterval(){},clearTimeout(){},requestAnimationFrame(){},cancelAnimationFrame(){},fetch(){return Promise.reject(Error('Offline test'))},getComputedStyle(){return {getPropertyValue(){return ''}}}};
vm.createContext(context);vm.runInContext(script,context,{timeout:5000});

const state=JSON.parse(fs.readFileSync('site-data.json','utf8'));
context.adoptData(state);
assert(context.PLATS.length>=48);
for(const n of state.news){const card=context.newsCard(n,false);for(const part of n.parts||[])assert(card.includes(context.escapeHtml(context.T(part.l))));assert(card.includes(n.full.split('\n\n')[0]));}
for(const p of state.platforms){const detail=context.platDetail(p,state.platforms.indexOf(p));for(const k of ['pros','cons','tags','caps'])for(const v of p[k])assert(detail.includes(v));}
context.showArchive=true;context.feedCat='alla';assert.equal(context.feedData().length,state.news.length);
context.feedCat='tech';assert(context.feedData().every(n=>n.cat==='tech'||n.cat==='robot'));
context.cmpToggle(0);context.cmpToggle(1);context.renderCmpCols();assert(els['cmp-cols'].innerHTML.includes(state.platforms[0].caps[0]));
assert.throws(()=>context.adoptData({...state,news:[]}));
assert.throws(()=>context.adoptData({...state,platforms:state.platforms.slice(1)}));
context.adoptData({...state,updatedAt:'2026-09-09T08:00:00Z'});
context.fetchNews().then(ok=>{assert.equal(ok,false);assert.equal(context.lastUpdated.toISOString(),'2026-09-09T08:00:00.000Z');});
assert.equal(context.CHANNELS.reduce((a,g)=>a+g.items.length,0),state.sources.length);
for(const name of ['PiXimperfect','The Dor Brothers','William Faucher','Venus Theory','Two Minute Papers'])assert(els.tgrid.innerHTML.includes(name));
const unrated={...state.platforms[0],rating:null,tech:null,speed:null,pricev:null};
assert(context.platCard(unrated,0).includes('—'));assert(!context.platCard(unrated,0).includes('>null<'));
context.PLATS[0]=unrated;context.renderCmpCols();assert(!els['cmp-chart'].innerHTML.includes('>null<'));
console.log('PASS: full details, all chapters, new channels, comparisons and last-good fallback.');
