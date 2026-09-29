import {idFor,validateNewProfile} from './data-core.mjs';

// A successor is a new, complete profile, never old facts under a new name.
export const successorFields=['n','url','cats','sub','long','deep','price','tier','pros','cons','tags','caps'];
export const profileIds=p=>[idFor(p),...(p.idAliases||[])];
export const profileNames=p=>[p.n,...(p.aliases||[])];
export function migrateSuccessor(previous,profile,evidence,relationship,platforms,now) {
  const facts=Object.fromEntries(successorFields.map(k=>[k,profile[k]]));
  const next=validateNewProfile(facts); // Ignore model-supplied IDs, aliases, scores and metadata.
  if(next.n===previous.n||profileIds(previous).includes(next.id)||profileNames(previous).includes(next.n))throw Error('Successor is current or historical version');
  const names=profileNames(previous).concat(next.n).map(n=>n.toLowerCase());
  const ids=profileIds(previous).concat(next.id);
  if(platforms.some(p=>p.id!==previous.id&&(profileIds(p).some(id=>ids.includes(id))||profileNames(p).some(n=>names.includes(n.toLowerCase())))))throw Error('Successor identity or alias collision');
  for(const field of [...successorFields,'relationship']) {
    const proofs=field==='relationship'?relationship:evidence[field];
    if(!Array.isArray(proofs)||!proofs.length||proofs.some(e=>e.fetched!==true||!e.url||!e.quote))throw Error('Missing retrieved successor evidence: '+field);
  }
  const {versionHistory=[],...snapshot}=previous;
  return {...next,aliases:[...new Set(profileNames(previous))],idAliases:[...new Set(profileIds(previous))],
    fieldChecks:Object.fromEntries(successorFields.map(field=>[field,{checkedAt:now,sources:evidence[field].map(({url,quote})=>({url,quote}))}])),
    versionHistory:[...versionHistory,{profile:snapshot,replacedAt:now,sources:relationship.map(({url,quote})=>({url,quote}))}],
    successorCheck:{status:'migrated',from:previous.n,to:next.n,checkedAt:now,sources:relationship.map(({url,quote})=>({url,quote}))},
    addedAt:previous.addedAt||now,lastAttemptAt:now};
}

export async function verifySuccessor(previous,candidate,platforms,now,{official,fetchSource,quoteMatches,auditFacts,auditRelationship}) {
  if(candidate?.status!=='possible'||typeof candidate.name!=='string'||candidate.name!==candidate.profile?.n)throw Error('Incomplete successor candidate');
  const profile=validateNewProfile(Object.fromEntries(successorFields.map(k=>[k,candidate.profile[k]])));
  if(!official(profile.url))throw Error('Successor outside established official domains');
  for(const field of ['long','deep'])if(profile[field].length<Math.max(field==='long'?300:150,Math.min(200,(previous[field]||'').length*.7)))throw Error('Incomplete successor detail');
  const cache=new Map(),evidence={};
  for(const field of [...successorFields,'relationship']) {
    const proofs=field==='relationship'?candidate.relationship:candidate.evidence?.[field];
    if(!Array.isArray(proofs)||!proofs.length)throw Error('Missing successor evidence: '+field);
    evidence[field]=[];
    for(const proof of proofs) {
      if(!official(proof.url)||typeof proof.quote!=='string'||proof.quote.length<15)throw Error('Invalid official successor citation: '+field);
      if(!cache.has(proof.url))cache.set(proof.url,await fetchSource(proof.url));
      if(!quoteMatches(cache.get(proof.url),proof.quote))throw Error('Successor quote not found: '+field);
      evidence[field].push({url:proof.url,quote:proof.quote,fetched:true});
    }
  }
  // Numerical ordering and same-provider announcements alone are not a relationship.
  const relation=await auditRelationship(previous,profile,evidence.relationship,cache);
  if(relation?.verified!==true||relation.from!==previous.n||relation.to!==profile.n)throw Error('Official successor relationship not established');
  const facts=Object.fromEntries(successorFields.map(k=>[k,profile[k]]));
  const approved=await auditFacts(profile,facts,evidence,cache);
  if(successorFields.some(k=>!approved.includes(k)))throw Error('Incomplete independent verification of successor facts');
  return migrateSuccessor(previous,profile,evidence,evidence.relationship,platforms,now);
}
