import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from './v0.5.0/engine.js';
import {people,decisions} from './v0.5.0/shift-data.js';
import {createWardRenderer} from './v0.5.0/ward-art.js';
function started(){const s=E.fresh(123);s.started=true;return s;}
function doTask(s,t){
 if(t.status==='reported')return E.acceptReport(s,t.id);
 if(t.kind==='chart'||t.kind==='rechart'){const o=s.observed.find(o=>o.id===`${t.patient}-${t.kind==='chart'?'obs':'followup'}`);return E.saveChart(s,t.id,o.values);}
 if(t.kind==='fluid')return E.saveFluid(s,t.id,people[t.patient].fluid.type,people[t.patient].fluid.volume);
 return E.commit(s,t.id,{choice:decisions[t.patient].options[0].id});
}

function reveal(s,p=0){assert.equal(E.commit(s,`${p}-obs`).ok,true);E.advance(s,s.concerns[p].at-s.minutes);}
test('New concerns are hidden until 15–20 minutes after completed observations',()=>{
 const delays=new Set();
 for(let seed=0;seed<24;seed++){
  const s=E.fresh(seed);s.started=true;
  assert.equal(s.routinePlan.length,6);assert.equal(E.visibleTask(s,E.task(s,'0-care')),false);
  E.advance(s,50);assert.equal(s.events.length,0);assert.equal(E.requestHelp(s),false);
  E.commit(s,'0-obs');const at=s.minutes,delay=s.concerns[0].at-at;delays.add(delay);
  assert.ok(delay>=15&&delay<=20);E.advance(s,delay-1);assert.equal(E.ready(s,E.task(s,'0-care')),false);
  E.advance(s,1);assert.equal(E.ready(s,E.task(s,'0-care')),true);assert.equal(s.alerts.length,1);
  assert.equal(E.visibleTask(s,E.task(s,'0-followup')),false);
 }
 assert.equal(delays.size,6);
});
test('Reference shift completes all 30 tasks and separate chart entries with 72 energy',()=>{
 const s=started();
 for(let i=0;i<150;i++){
  const t=s.tasks.filter(t=>E.ready(s,t)).sort((a,b)=>(a.due??999)-(b.due??999))[0];
  if(t){const r=doTask(s,t);assert.ok(r.ok||r.interrupted);}
  else if(s.tasks.every(t=>t.status==='done'))break;
  else E.advance(s,E.nextEvent(s)-s.minutes);
 }
 assert.equal(s.tasks.filter(t=>t.status==='done').length,30);
 assert.equal(s.spent,72);assert.equal(s.energy,28);
 assert.equal(s.observed.length,8);assert.equal(s.entries.filter(e=>e.kind==='obs').length,8);
 assert.equal(s.entries.filter(e=>e.kind==='fluid').length,2);
 assert.equal(E.takeBreak(s),true);assert.equal(s.energy,53);assert.equal(E.takeBreak(s),false);
});
test('Routine windows affect availability without exposing or moving clinical events',()=>{
 const s=started();E.setRoutineWindow(s,'pressure','early');assert.equal(E.ready(s,E.task(s,'0-pressure')),true);
 E.setRoutineWindow(s,'med','late');assert.equal(E.task(s,'1-med').at,320);
 E.commit(s,'0-obs');const onset=s.concerns[0].at;E.setRoutineWindow(s,'obs','late');
 assert.equal(s.concerns[0].at,onset);assert.equal(E.task(s,'0-obs').completedAt,5);
 assert.equal(E.setRoutineWindow(s,'care','late'),false);
});
test('A new call bell interrupts routine care and retains remaining time without double charging',()=>{
 const s=started();E.setRoutineWindow(s,'pressure','early');E.commit(s,'1-obs');
 E.advance(s,s.concerns[1].at-s.minutes-2);const before=s.spent;
 const r=E.commit(s,'0-pressure');assert.equal(r.interrupted,true);assert.equal(s.spent,before);
 assert.equal(E.task(s,'0-pressure').remaining,8);assert.equal(s.alerts[0].patient,1);
 assert.equal(E.commit(s,'0-pressure').ok,true);assert.equal(s.spent,before+4);
});
test('Large time advances process onset and subsequent deterioration in order',()=>{
 const s=started();E.commit(s,'0-obs');E.advance(s,100);
 assert.deepEqual(s.events.map(e=>e.type),['concern','deterioration']);assert.equal(s.late,true);
 E.requestHelp(s);assert.equal(s.branch,'delayed');
});
test('Early assistance and reassessment deadlines remain relative to the event',()=>{
 const s=started();reveal(s);const before=s.spent;E.requestHelp(s);assert.equal(s.spent,before);
 assert.equal(E.commit(s,'0-care',{choice:'urgent'}).ok,true);assert.equal(s.branch,'early');
 assert.equal(E.visibleTask(s,E.task(s,'0-followup')),true);
 E.advance(s,80);assert.equal(s.missed,true);const count=s.events.length;E.advance(s,10);assert.equal(s.events.length,count);
});
test('Delegated observation report schedules one concern only after RN review',()=>{
 const s=started();assert.equal(E.delegate(s,'1-obs'),true);E.advance(s,10);
 assert.equal(s.concerns[1],undefined);assert.equal(E.acceptReport(s,'1-obs').ok,true);
 const at=s.concerns[1].at;assert.ok(at-s.minutes>=15&&at-s.minutes<=20);
 assert.equal(E.acceptReport(s,'1-obs').ok,false);assert.equal(s.concerns[1].at,at);
});
test('Saved routine order and scheduled onset survive reload without rerolling',()=>{
 const s=started();E.commit(s,'0-obs');s.routinePlan.reverse();E.setRoutineWindow(s,'break','late');
 const restored=E.validateSave(JSON.parse(JSON.stringify(s)));assert.equal(restored.paused,true);
 assert.deepEqual(restored.concerns,s.concerns);assert.deepEqual(restored.routinePlan,s.routinePlan);
 restored.paused=false;E.advance(restored,restored.concerns[0].at-restored.minutes);assert.equal(restored.alerts.length,1);
 assert.throws(()=>E.validateSave({...s,version:3}));assert.throws(()=>E.validateSave({...s,routinePlan:[]}));
});
test('Wrong chart data and repeated entries cannot consume time or create duplicate records',()=>{
 const s=started();E.commit(s,'0-obs');assert.equal(E.saveChart(s,'0-chart',[0,0,0,0,0,0]).ok,false);
 assert.equal(E.saveChart(s,'0-chart',people[0].readings).ok,true);const before=JSON.stringify(s);
 assert.equal(E.saveChart(s,'0-chart',people[0].readings).ok,false);assert.equal(JSON.stringify(s),before);
});
test('Fluid direction validated and totals retain their sign',()=>{
 const s=started();E.setRoutineWindow(s,'fluid','early');
 assert.equal(E.saveFluid(s,'0-fluid','input',180).ok,false);assert.equal(E.saveFluid(s,'0-fluid','output',180).ok,true);
 assert.deepEqual(E.fluidTotals(s,0),{input:0,output:180,balance:-180});assert.equal(E.saveFluid(s,'0-fluid','output',180).ok,false);
});
test('Break is not gated on a future problem, but active concerns block it and it cannot repeat',()=>{
 const s=started();assert.equal(E.takeBreak(s),true);assert.equal(E.takeBreak(s),false);
 const t=started();reveal(t);assert.equal(E.canBreak(t),false);assert.equal(E.takeBreak(t),false);
 E.commit(t,'0-care',{choice:'urgent'});assert.equal(E.takeBreak(t),true);
});
test('End of shift and pause do not complete work for free',()=>{
 const s=started();s.paused=true;assert.equal(E.commit(s,'0-obs').ok,false);s.paused=false;
 E.advance(s,479);const r=E.commit(s,'0-pressure');assert.equal(r.shiftEnded,true);
 assert.equal(E.task(s,'0-pressure').status,'pending');assert.equal(s.energy,100);assert.equal(E.takeBreak(s),false);
});
test('Ward renders all four patients with the pause overlay',()=>{
 const calls=[];const ctx=new Proxy({}, {get:(obj,key)=>obj[key]??((...args)=>calls.push([key,...args]))});
 const view={patients:people,player:{x:500,y:340},started:true,paused:false};
 const render=createWardRenderer(ctx,view,()=>true);render(0);view.paused=true;render(500);
 assert.ok(calls.some(c=>c[0]==='fillText'&&c[1]==='Margaret'));assert.ok(calls.some(c=>c[0]==='fillText'&&c[1]==='SHIFT PAUSED'));
});

test('Emergency trolley requires an emergency response call and confirmed bedside cover; delivery does not complete care',()=>{
 const s=started();assert.equal(E.collectTrolley(s),false);assert.equal(E.arrangeEmergencyCover(s),false);
 reveal(s);assert.equal(E.arrangeEmergencyCover(s),true);assert.equal(s.trolley.merCalled,true);assert.equal(s.trolley.cover,true);
 assert.equal(E.collectTrolley(s),true);assert.equal(E.collectTrolley(s),false);assert.equal(E.deliverTrolley(s),true);assert.equal(E.deliverTrolley(s),false);
 assert.equal(E.task(s,'0-care').status,'pending');assert.equal(s.trolley.status,'bedside');
 assert.equal(E.validateSave(JSON.parse(JSON.stringify(s))).trolley.status,'bedside');
});
