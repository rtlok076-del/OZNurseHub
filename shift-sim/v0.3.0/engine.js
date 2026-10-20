import {VERSION,CASE_VERSION,people,taskSet,decisions} from './shift-data.js';
export const timeLabel=m=>`${String(13+Math.floor(m/60)).padStart(2,'0')}:${String(Math.floor(m%60)).padStart(2,'0')}`;
export function fresh(seed=Date.now()){
 const s={version:VERSION,caseVersion:CASE_VERSION,seed,started:false,paused:false,finished:false,minutes:0,energy:100,spent:0,breakState:'available',breakWindow:'middle',tasks:taskSet(),plan:[],orders:{},observed:[],entries:[],notes:[],events:[],log:[],decisions:[],helpAt:null,responseAt:null,responseArrived:false,branch:'pending',late:false,missed:false,consent:false,medCorrected:false,handedOver:false};
 s.plan=s.tasks.map(t=>t.id);
 for(const p of people){
  let n=(seed+p.id*13)>>>0;
  s.orders[p.id]=decisions[p.id].options.map(o=>o.id);
  for(let i=s.orders[p.id].length-1;i>0;i--){n=(n*1664525+1013904223)>>>0;const j=n%(i+1);[s.orders[p.id][i],s.orders[p.id][j]]=[s.orders[p.id][j],s.orders[p.id][i]];}
 }
 return s;
}
export function log(s,text){s.log.push({at:s.minutes,text});}
export function task(s,id){return s.tasks.find(t=>t.id===id);}
export function ready(s,t){return s.minutes<480&&t.status==='pending'&&t.at<=s.minutes&&t.requires.every(id=>task(s,id)?.status==='done');}
export function tasksFor(s,p){return s.tasks.filter(t=>t.patient===p);}
export function requestHelp(s){
 if(s.helpAt!==null)return false;
 s.helpAt=s.minutes;s.responseAt=s.minutes+10;s.branch=s.minutes<=40?'early':'delayed';
 log(s,'Urgent assistance requested for Margaret. Jess acknowledges, stays with the patient and coordinates review.');
 return true;
}
function schedule(s){
 const list=[];
 if(s.helpAt===null&&!s.late)list.push({at:40,type:'deterioration'});
 if(s.responseAt!==null&&!s.responseArrived)list.push({at:s.responseAt,type:'response'});
 const f=task(s,'0-followup');
 if(f.due!==null&&f.status!=='done'&&!s.missed)list.push({at:f.due,type:'missed'});
 for(const t of s.tasks)if(t.status==='delegated')list.push({at:t.reportAt,type:'report',id:t.id});
 return list.sort((a,b)=>a.at-b.at);
}
export function advance(s,amount,{interrupt=false}={}){
 if(s.finished)return {interrupted:false};
 let target=Math.min(480,s.minutes+amount),stopped=false;
 for(const e of schedule(s)){
  if(e.at>target)break;
  s.minutes=Math.max(s.minutes,e.at);
  if(e.type==='deterioration'){s.late=true;s.branch='delayed';log(s,'New urgent report: Margaret is more breathless. Stop routine work and obtain urgent help.');}
  if(e.type==='response'){s.responseArrived=true;log(s,'The responding team has reviewed Margaret. The monitoring plan and reassessment need follow-through.');}
  if(e.type==='missed'){s.missed=true;s.branch='missed-reassessment';log(s,'Margaret’s reassessment is overdue. Jess reports ongoing concern and requests a renewed review.');}
  if(e.type==='report'){task(s,e.id).status='reported';log(s,`Jess returned observations for ${people[task(s,e.id).patient].short}. Review her report; the task is not yet closed.`);}
  s.events.push(e);
  if(interrupt&&['deterioration','missed'].includes(e.type)){target=s.minutes;stopped=true;break;}
 }
 s.minutes=target;
 return {interrupted:stopped};
}
export function commit(s,id,payload={}){
 const t=task(s,id);
 if(!t||!ready(s,t)||!s.started||s.paused||s.finished)return {ok:false,reason:'This task is not available.'};
 if(t.kind==='care'&&!decisions[t.patient].options.some(o=>o.id===payload.choice))return {ok:false,reason:'Choose a response.'};
 if(t.kind==='care'&&t.patient===0)requestHelp(s);
 const duration=t.remaining??t.duration;
 const start=s.minutes;
 const result=advance(s,duration,{interrupt:t.patient!==0});
 if(result.interrupted){t.remaining=Math.max(0,duration-(s.minutes-start));log(s,`Paused ${t.title}. Remaining action time is retained; no energy charged yet.`);return {ok:false,interrupted:true};}
 if(start+duration>480){t.remaining=duration-(s.minutes-start);log(s,`${t.title} remains incomplete at shift end; include it in handover.`);return {ok:false,shiftEnded:true};}
 t.status='done';t.completedAt=s.minutes;delete t.remaining;
 const effort=payload.report?1:t.effort;
 s.energy=Math.max(0,s.energy-effort);s.spent+=effort;
 if(['obs','followup'].includes(t.kind)){
  let values=[...(t.kind==='obs'?people[t.patient].readings:people[t.patient].repeat)];
  if(t.patient===0&&t.kind==='followup'&&(s.late||s.missed))values=[27,92,108,104,66,38.1];
  s.observed.push({id:t.id,patient:t.patient,at:s.minutes,values,context:t.patient===0?'On prescribed oxygen; compare with target in the care plan.':'Scenario bedside observation set.'});
 }
 if(t.kind==='care'){
  const o=decisions[t.patient].options.find(o=>o.id===payload.choice);
  s.decisions.push({task:t.id,choice:o.id,quality:o.quality,response:o.response,at:s.minutes});
  const f=task(s,`${t.patient}-followup`);f.at=s.minutes+45;f.due=f.at+30;
 }
 log(s,`${people[t.patient].short}: ${t.title} completed.`);
 return {ok:true};
}
export function delegate(s,id){
 const t=task(s,id);
 if(!t||t.kind!=='obs'||t.patient===0||!ready(s,t)||s.paused||!s.started||s.finished)return false;
 if(s.tasks.some(t=>['delegated','reported'].includes(t.status)))return false;
 t.status='delegated';t.reportAt=s.minutes+10;s.energy=Math.max(0,s.energy-1);s.spent++;
 log(s,`Jess accepts ${people[t.patient].short}'s routine observations, will report in 10 minutes and escalate new concerns.`);
 return true;
}
export function acceptReport(s,id){
 const t=task(s,id);if(!t||t.status!=='reported'||s.paused||s.finished)return {ok:false};
 t.status='pending';const r=commit(s,id,{report:true});if(!r.ok)t.status='reported';return r;
}
export function nextEvent(s){
 const times=[480,...schedule(s).map(e=>e.at)];
 for(const t of s.tasks)if(t.status==='pending'&&t.requires.every(id=>task(s,id)?.status==='done')){
  if(t.at>s.minutes)times.push(t.at);
  if(t.due!==null&&t.due>s.minutes)times.push(t.due);
 }
 return Math.min(...times.filter(at=>at>s.minutes));
}
export function takeBreak(s){
 if(s.breakState==='taken'||s.paused||!s.started||s.finished||s.minutes>465)return false;
 if(!s.responseArrived||!task(s,'0-care')||task(s,'0-care').status!=='done')return false;
 s.breakState='cover-arranged';
 // Jess accepts currently active tasks while the player is away.
 for(const t of s.tasks)if(t.status!=='done'&&t.at<=s.minutes&&t.due!==null)t.due+=15;
 advance(s,15);
 s.energy=Math.min(100,s.energy+25);s.breakState='taken';log(s,'Jess accepted cover and outstanding concerns. Covered break taken; return update received.');
 return true;
}
export function validateSave(s){
 if(!s||s.version!==VERSION||s.caseVersion!==CASE_VERSION)throw new Error('This save belongs to a different version.');
 const template=taskSet();
 if(!Array.isArray(s.tasks)||s.tasks.length!==28||!Number.isFinite(s.minutes)||s.minutes<0||s.minutes>480||!Number.isFinite(s.energy)||s.energy<0||s.energy>100)throw new Error('This save is incomplete.');
 for(const t of template){const stored=s.tasks.find(x=>x.id===t.id);if(!stored||stored.kind!==t.kind||stored.patient!==t.patient||!['pending','done','delegated','reported'].includes(stored.status)||!Number.isFinite(stored.at))throw new Error('Task data could not be restored.');}
 for(const k of ['plan','observed','entries','notes','events','log','decisions'])if(!Array.isArray(s[k]))throw new Error('Saved records could not be restored.');
 const valuesOK=v=>Array.isArray(v)&&v.length===6&&v.every(Number.isFinite);
 if(s.observed.some(o=>!people[o.patient]||!valuesOK(o.values)||!Number.isFinite(o.at)))throw new Error('Saved observations are invalid.');
 if(s.entries.some(e=>!people[e.patient]||!Array.isArray(e.history)||!Number.isFinite(e.at)||(e.kind==='obs'?!valuesOK(e.values):e.kind==='fluid'?!Number.isFinite(e.volume)||!['input','output'].includes(e.type):true)))throw new Error('Saved chart entries are invalid.');
 if(s.log.some(e=>typeof e.text!=='string'||!Number.isFinite(e.at)))throw new Error('Saved event log is invalid.');
 if(new Set(s.plan).size!==28||!s.plan.every(id=>template.some(t=>t.id===id)))throw new Error('Saved plan is invalid.');
 if(!['available','cover-arranged','taken'].includes(s.breakState))throw new Error('Saved break state is invalid.');
 for(const p of people)if(!Array.isArray(s.orders?.[p.id])||s.orders[p.id].length!==3||new Set(s.orders[p.id]).size!==3||!s.orders[p.id].every(id=>decisions[p.id].options.some(o=>o.id===id)))throw new Error('Saved choices are invalid.');
 s.paused=true;return s;
}
export function fluidTotals(s,p){
 const entries=s.entries.filter(e=>e.patient===p&&e.kind==='fluid');
 const input=entries.filter(e=>e.type==='input').reduce((a,e)=>a+e.volume,0),output=entries.filter(e=>e.type==='output').reduce((a,e)=>a+e.volume,0);
 return {input,output,balance:input-output};
}
export function saveChart(s,id,values){
 const t=task(s,id),source=s.observed.find(o=>o.id===`${t?.patient}-${t?.kind==='chart'?'obs':'followup'}`);
 if(!t||!['chart','rechart'].includes(t.kind)||!source||values.length!==6||values.some((v,i)=>!Number.isFinite(v)||v!==source.values[i]))return {ok:false,reason:'Compare each entry with the measured source. Blank is not zero.'};
 const r=commit(s,id);if(r.ok)s.entries.push({id,kind:'obs',patient:t.patient,at:source.at,recordedAt:s.minutes,values:[...values],history:[]});return r;
}
export function saveFluid(s,id,type,volume){
 const t=task(s,id),p=people[t?.patient];
 if(!t||t.kind!=='fluid'||!p.fluid||type!==p.fluid.type||volume!==p.fluid.volume)return {ok:false,reason:'Check the measured source, direction and volume.'};
 const r=commit(s,id);if(r.ok)s.entries.push({id,kind:'fluid',patient:p.id,at:s.minutes,recordedAt:s.minutes,type,category:p.fluid.category,volume,history:[]});return r;
}
