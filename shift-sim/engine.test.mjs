import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as E from './v0.3.0/engine.js';
import {people,decisions} from './v0.3.0/shift-data.js';
import {createWardRenderer} from './v0.3.0/ward-art.js';
function started(){const s=E.fresh(123);s.started=true;return s;}
function doTask(s,t){
 if(t.status==='reported')return E.acceptReport(s,t.id);
 if(t.kind==='chart'||t.kind==='rechart'){const o=s.observed.find(o=>o.id===`${t.patient}-${t.kind==='chart'?'obs':'followup'}`);return E.saveChart(s,t.id,o.values);}
 if(t.kind==='fluid')return E.saveFluid(s,t.id,people[t.patient].fluid.type,people[t.patient].fluid.volume);
 return E.commit(s,t.id,{choice:decisions[t.patient].options[0].id});
}
test('Complete reference shift has 28 tasks, 64 energy, separate measurements and entries',()=>{
 const s=started();E.requestHelp(s);
 for(let i=0;i<100;i++){
  const t=s.tasks.filter(t=>E.ready(s,t)).sort((a,b)=>(a.due??999)-(b.due??999))[0];
  if(t)assert.equal(doTask(s,t).ok,true);
  else if(s.tasks.every(t=>t.status==='done'))break;
  else E.advance(s,E.nextEvent(s)-s.minutes);
 }
 assert.equal(s.tasks.filter(t=>t.status==='done').length,28);
 assert.equal(s.spent,64);assert.equal(s.energy,36);
 assert.equal(s.observed.length,8);assert.equal(s.entries.filter(e=>e.kind==='obs').length,8);
 assert.equal(s.entries.filter(e=>e.kind==='fluid').length,2);
 assert.equal(E.takeBreak(s),true);assert.equal(s.energy,61);
 assert.equal(E.takeBreak(s),false);assert.equal(s.energy,61);
});
test('Wrong chart data is not accepted; repeated actions cannot farm time, energy or records',()=>{
 const s=started();E.requestHelp(s);E.commit(s,'0-obs');
 assert.equal(E.saveChart(s,'0-chart',[0,0,0,0,0,0]).ok,false);
 assert.equal(s.entries.length,0);
 assert.equal(E.saveChart(s,'0-chart',people[0].readings).ok,true);
 const before=JSON.stringify(s);
 assert.equal(E.saveChart(s,'0-chart',people[0].readings).ok,false);
 assert.equal(JSON.stringify(s),before);
});
test('Waiting costs no energy, events ordered, routine action interrupted without double time',()=>{
 const s=started();E.advance(s,38);const r=E.commit(s,'1-care',{choice:'review'});
 assert.equal(r.interrupted,true);assert.equal(s.minutes,40);assert.equal(s.energy,100);
 assert.equal(E.task(s,'1-care').remaining,10);
 E.requestHelp(s);assert.equal(E.commit(s,'1-care',{choice:'review'}).ok,true);
 assert.equal(s.minutes,50);assert.equal(s.energy,96);
 assert.deepEqual(s.events.map(e=>e.type),['deterioration','response']);
});
test('Early, delayed and missed reassessment paths differ and help is free',()=>{
 const early=started();E.requestHelp(early);E.commit(early,'0-care',{choice:'urgent'});assert.equal(early.branch,'early');assert.equal(early.spent,4);
 const late=started();E.advance(late,60);E.requestHelp(late);assert.equal(late.branch,'delayed');assert.equal(late.spent,0);
 E.advance(early,80);assert.equal(early.branch,'missed-reassessment');assert.equal(early.missed,true);
 const count=early.events.length;E.advance(early,10);assert.equal(early.events.length,count);
});
test('Delegation needs report and RN evaluation; no duplicate completion',()=>{
 const s=started();E.requestHelp(s);E.advance(s,35);
 assert.equal(E.delegate(s,'1-obs'),true);assert.equal(E.task(s,'1-obs').status,'delegated');
 assert.equal(s.observed.length,0);E.advance(s,10);assert.equal(E.task(s,'1-obs').status,'reported');
 assert.equal(E.acceptReport(s,'1-obs').ok,true);assert.equal(s.spent,2);assert.equal(s.observed.length,1);
 assert.equal(E.acceptReport(s,'1-obs').ok,false);
});
test('Fluid direction validated and sums signed, with no duplicate totals',()=>{
 const s=started();E.requestHelp(s);E.commit(s,'0-care',{choice:'urgent'});E.advance(s,160);
 assert.equal(E.saveFluid(s,'0-fluid','input',180).ok,false);
 assert.equal(E.saveFluid(s,'0-fluid','output',180).ok,true);
 assert.deepEqual(E.fluidTotals(s,0),{input:0,output:180,balance:-180});
 assert.equal(E.saveFluid(s,'0-fluid','output',180).ok,false);
});
test('Save resume pauses, keeps stable choices and break state; bad versions rejected',()=>{
 const s=started();E.requestHelp(s);E.commit(s,'0-care',{choice:'urgent'});E.advance(s,10);E.takeBreak(s);
 const r=E.validateSave(JSON.parse(JSON.stringify(s)));assert.equal(r.paused,true);assert.deepEqual(r.orders,s.orders);assert.equal(r.breakState,'taken');
 assert.throws(()=>E.validateSave({...s,version:0}));
 assert.throws(()=>E.validateSave({...s,tasks:[]}));
 assert.throws(()=>E.validateSave({...s,plan:[]}));
});
test('Shift end does not complete unfinished work for free',()=>{
 const s=started();E.requestHelp(s);E.advance(s,479);
 const result=E.commit(s,'1-care',{choice:'review'});
 assert.equal(result.shiftEnded,true);assert.equal(s.minutes,480);
 assert.equal(E.task(s,'1-care').status,'pending');assert.equal(s.energy,100);
 assert.equal(E.commit(s,'1-care',{choice:'review'}).ok,false);
 assert.equal(E.takeBreak(s),false);
});
test('Paused commits and invalid saved measurements are rejected',()=>{
 const s=started();s.paused=true;
 assert.equal(E.commit(s,'0-obs').ok,false);assert.equal(s.minutes,0);
 s.observed.push({patient:0,at:0,values:'not readings'});
 assert.throws(()=>E.validateSave(s));
});
test('Ward renders four rooms, player and pause state without missing dependencies',()=>{
 const calls=[];
 const ctx=new Proxy({}, {get:(obj,key)=>obj[key]??((...args)=>calls.push([key,...args]))});
 const view={patients:people,player:{x:500,y:340},started:true,paused:false};
 const render=createWardRenderer(ctx,view,()=>true);
 render(0);view.paused=true;render(500);
 assert.ok(calls.some(c=>c[0]==='fillText'&&c[1]==='Margaret'));
 assert.ok(calls.some(c=>c[0]==='fillText'&&c[1]==='SHIFT PAUSED'));
});
