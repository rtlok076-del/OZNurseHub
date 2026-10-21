import {bedside,patientSpeech,monitor} from './bedside.js';
import {wirePlotChart} from './observation-chart.js';
import {mapTarget,walkRoute,stepWalk,trolleyPoint,bedsidePoint} from './navigation.js';
import {people,measures,decisions,followups,CASE_VERSION,routineGroups,groupFor} from './shift-data.js';
import {wirePlannerDrag} from './planner-drag.js';
import * as E from './engine.js';
import {createWardRenderer} from './ward-art.js';
const $=s=>document.querySelector(s), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SAVE='ward-shift-playtest', canvas=$('#ward'),dialog=$('#interaction');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let arrivalAction=null;
let s=E.fresh(),verified=null,current=null,storageError=false,saveCandidate=null,persistenceEnabled=false;
const visual={patients:people.map(p=>({...p})),player:{x:500,y:360},paused:false,started:false,path:[],keys:new Set()};
const draw=createWardRenderer(canvas.getContext('2d'),visual,p=>s.tasks.some(t=>t.patient===p.id&&t.kind==='care'&&E.ready(s,t)));
function message(t){$('#message').textContent=t;}
function persist(){if(!persistenceEnabled)return;try{localStorage.setItem(SAVE,JSON.stringify(s));storageError=false;}catch{storageError=true;message('Browser storage is unavailable. Keep this page open; this shift cannot be saved.');}}
function update(){
 $('#time').textContent=E.timeLabel(s.minutes);$('#progress').value=s.minutes;$('#energy').value=s.energy;$('#energy-value').textContent=`${s.energy}%`;
 $('#phase').textContent=s.finished?'Shift debrief':s.paused?'Paused · resume when ready':s.started?'Supported shift · playtest 0.5':'Read handover & make a plan';
 $('#pause').disabled=!s.started||s.finished;$('#pause').textContent=s.paused?'▶ Resume':'Ⅱ Pause';
 for(const id of ['plan','handover','break','next'])$('#'+id).disabled=!s.started||s.finished||(s.paused&&id!=='plan');
 $('#break').disabled||=s.breakState==='taken';$('#break').textContent=s.breakState==='taken'?'Break taken ✓':s.started&&s.minutes>={early:0,middle:160,late:320}[s.breakWindow]?'Break planned':'Take a break';
 $('#next').disabled||=s.minutes>=480;
 $('#urgent').disabled=!s.started||s.finished;
 const pending=s.tasks.filter(t=>E.ready(s,t)||t.status==='reported').sort((a,b)=>{
  const urgent=t=>(t.patient===0&&t.kind==='care')||(t.due!==null&&t.due<=s.minutes+15);
  return Number(urgent(b))-Number(urgent(a))||s.routinePlan.findIndex(g=>g.id===groupFor(a))-s.routinePlan.findIndex(g=>g.id===groupFor(b))||s.plan.indexOf(a.id)-s.plan.indexOf(b.id);
 });
 $('#call-count').textContent=pending.length;$('#ward-status').textContent=`${s.tasks.filter(t=>t.status==='done').length} / ${s.tasks.length} tasks completed`;
 $('#calls').innerHTML=pending.map(t=>`<button class="call ${t.due!==null&&s.minutes>t.due?'critical':''}" data-task="${t.id}" ${s.paused?'disabled':''}><b>${people[t.patient].short} · ${people[t.patient].bed} <span>↗</span></b><p>${esc(t.title)}</p><small>${t.status==='reported'?'Report ready · RN review needed':t.kind==='care'?(t.patient===0?'Urgent · assess now':'New patient concern'):t.due!==null?`Follow up by ${E.timeLabel(t.due)}`:`${t.duration} min · ${t.effort} energy`}</small></button>`).join('')||'<div class="empty">No released tasks waiting. Check your plan or continue to the next event.</div>';
 $('#patient-nav').innerHTML=people.map(p=>`<button data-patient="${p.id}" ${!s.started||s.paused||s.finished?'disabled':''}><b>${p.bed} · ${p.short}</b><small>${E.tasksFor(s,p.id).filter(t=>t.status==='done').length}/${E.tasksFor(s,p.id).length} tasks · ongoing care</small></button>`).join('');
 $('#low-energy').hidden=s.energy>=30;$('#storage').hidden=!storageError;
 visual.started=s.started;visual.paused=s.paused;visual.trolley=s.trolley;$('#equipment').disabled=!s.started||s.finished||s.paused;
 if($('#dialog-pause'))$('#dialog-pause').textContent=s.paused?'Resume shift':'Pause shift';
 visual.patients.forEach(p=>{p.done=E.tasksFor(s,p.id).every(t=>t.status==='done');p.late=p.id===0&&(s.late||s.missed);});
 document.querySelectorAll('[data-task]').forEach(b=>b.onclick=()=>openTask(b.dataset.task));
 document.querySelectorAll('[data-patient]').forEach(b=>b.onclick=()=>visit(Number(b.dataset.patient)));
}
function saveUpdate(){persist();update();}
function show(html,{patient=null}={}){
 visual.path=[];arrivalAction=null;current=patient;$('#interaction-body').innerHTML=(s.started?`<div class="modal-tools"><button id="dialog-back" class="quiet">← Ward</button><button id="dialog-help" class="quiet">Urgent assistance / Jess</button><button id="dialog-pause" class="quiet">${s.paused?'Resume shift':'Pause shift'}</button></div>`:'')+html;
 if(!dialog.open)dialog.showModal();
 dialog.scrollTop=0;
 if(s.started)persist();
 if($('#dialog-back'))$('#dialog-back').onclick=close;
 if($('#dialog-help'))$('#dialog-help').onclick=helpNow;
 if($('#dialog-pause'))$('#dialog-pause').onclick=()=>{s.paused=!s.paused;saveUpdate();};
}
function close(){dialog.close();verified=null;current=null;canvas.focus({preventScroll:true});saveUpdate();presentAlert();}
function button(id,text,cls='primary'){return `<button id="${id}" class="${cls}">${text}</button>`;}
function heading(p,label){return `<span class="eyebrow">${esc(label)} · BED ${p.bed}</span><h2>${p.name}</h2><p>${p.condition}</p>`;}
function footerBack(fn){$('#back').onclick=fn||close;}
function feedback(title,text,next){
 show(`<span class="eyebrow">TEAM RESPONSE</span><h2>${title}</h2><p>${esc(text)}</p>${button('feedback-next','Continue →')}`);
 $('#feedback-next').onclick=next||close;
}
function outcome(r,fn){
 saveUpdate();
 if(r.ok){fn();return;}
 if(r.shiftEnded){finalHandover();return;}
 if(r.interrupted){
  verified=null;
  if(s.alerts.length){dialog.close();presentAlert();}
  else {show(`<span class="eyebrow">NEW URGENT INFORMATION</span><h2>Pause routine care.</h2><p>${esc(s.log.at(-2)?.text||'A patient needs another review.')}</p><p>Your task remains pending. Remaining time is retained; energy has not been charged.</p>${button('urgent-now','Review Margaret with Jess')}`);$('#urgent-now').onclick=()=>{current=0;helpNow();};}
 }else{const e=$('#form-error');if(e)e.textContent=r.reason||'Resume the shift or check the task prerequisites.';else message(r.reason||'Task not available.');}
}
function helpNow(){
 if(!s.started||s.finished)return;
 const target=current??0;
 const urgentMargaret=target===0&&!!s.concerns[0]?.revealed;
 if(urgentMargaret&&s.helpAt===null)E.requestHelp(s);
 else E.log(s,`Asked Jess for additional assistance with ${people[target].short}. Concern acknowledged; agree roles and follow-up.`);
 s.paused=false;saveUpdate();
 feedback('Jess acknowledges your concern.',urgentMargaret?'A clinician stays with Margaret while the team coordinates review. Continue focused assessment and confirm the response plan.':`Jess joins you to review ${people[target].short}'s needs. Agree roles, communicate the concern and confirm follow-up. Asking for help costs no points or energy.`,()=>patientView(target));
}
function handover(initial=false){
 show(`<span class="eyebrow">${initial?'13:00 · INCOMING HANDOVER':'SHIFT NOTES & HANDOVER'}</span><h2>${initial?'Meet your four patients.':'What does the next nurse need?'}</h2>${people.map(p=>`<div class="handover-row"><b>${p.bed} · ${p.name} · ${p.age}</b><p>${p.handover}</p>${!initial?`<small>${E.tasksFor(s,p.id).filter(t=>t.status==='done').length}/${E.tasksFor(s,p.id).length} tasks complete. ${s.notes.find(n=>n.patient===p.id)?'Progress note recorded.':'Progress note outstanding.'}</small>`:''}</div>`).join('')}${!initial?`<details><summary>Actual shift event log (${s.log.length})</summary>${s.log.map(l=>`<p class="small">${E.timeLabel(l.at)} · ${esc(l.text)}</p>`).join('')}</details>`:''}<div class="dialog-actions">${button('handover-next',initial?'Plan my shift →':'Back to ward')}${!initial?button('finish','Prepare final handover','quiet'):''}</div>`);
 $('#handover-next').onclick=()=>initial?planner(true):close();
 if(!initial)$('#finish').onclick=finalHandover;
}
function planner(initial=false){
 const windows={early:'Early · 13:00',middle:'Middle · 15:40',late:'Late · 18:20'};
 show(`<span class="eyebrow">YOUR ROUTINE PLAN</span><h2>A simple plan for your shift.</h2><p>Drag the dotted handle to change priority. Choose a broad time for each round. New patient needs will appear during the shift.</p><div id="plan-announcement" class="sr-only" role="status"></div><div class="plan-list" id="routine-list">${s.routinePlan.map(g=>`<div class="routine-tile" data-group="${g.id}"><button class="drag-handle" aria-label="Reorder ${g.title}. Use up or down arrow keys." title="Drag to reorder">⠿</button><div class="routine-content"><b>${g.title}</b><small>${g.detail}</small><label class="sr-only" for="routine-${g.id}">${g.title} time</label><select id="routine-${g.id}" data-routine-window="${g.id}">${Object.entries(windows).map(([k,v])=>`<option value="${k}" ${g.window===k?'selected':''}>${v}</option>`).join('')}</select></div></div>`).join('')}</div><p class="small muted">Times are reminders, not clinical orders. Medication timing follows the current chart; notes require completed care. You can adapt your plan during the shift.</p><div class="dialog-actions planner-actions">${button('suggest','Use suggested plan','quiet')}${button('plan-done',initial?'Start my shift →':'Save & return')}</div>`);
 wirePlannerDrag($('#routine-list'),(ids,focusId)=>{s.routinePlan=ids.map(id=>s.routinePlan.find(g=>g.id===id));persist();$('#plan-announcement').textContent=`${s.routinePlan.find(g=>g.id===focusId)?.title||'Plan'} moved. Priority ${ids.indexOf(focusId)+1} of ${ids.length}.`;});
 document.querySelectorAll('[data-routine-window]').forEach(e=>e.onchange=()=>{E.setRoutineWindow(s,e.dataset.routineWindow,e.value);persist();});
 $('#suggest').onclick=()=>{s.routinePlan=routineGroups.map(g=>({...g}));for(const g of s.routinePlan)E.setRoutineWindow(s,g.id,g.window);persist();planner(initial);};
 $('#plan-done').onclick=()=>{if(initial){s.started=true;E.log(s,'Handover received and routine shift plan established.');}close();};
}
function presentAlert(){
 if(!s.started||s.finished||dialog.open||!s.alerts.length)return;
 const alert=s.alerts.shift();persist();
 show(`<span class="eyebrow">${E.timeLabel(alert.at)} · CALL BELL</span><h2>${people[alert.patient].short} needs you.</h2><p>${esc(alert.text)}</p><p class="notice">Reading pauses the clock. Review the patient and adapt your routine plan.</p>${button('review-alert','Go to patient')}${button('back','Return to ward','quiet full')}`,{patient:alert.patient});
 $('#review-alert').onclick=()=>{verified=null;patientView(alert.patient);};footerBack();
}
function visit(id){
 if(!s.started||s.paused||s.finished)return;
 verified=null;
 // Direct bedside access keeps phone navigation responsive; character position marks the visit.
 visual.player=bedsidePoint(id);if(id===0&&s.trolley.status==='collected')E.deliverTrolley(s);patientView(id);saveUpdate();
}
function patientView(id){
 s.alerts=s.alerts.filter(a=>a.patient!==id);const p=people[id],tasks=E.tasksFor(s,id).filter(t=>E.visibleTask(s,t));
 show(`${bedside(p,patientSpeech(p,s))}<div class="dialog-actions">${button('records','Charts & records','quiet')}${button('bed-help','Ask Jess for help','quiet')}</div><p class="tagline">${verified===id?'Identity confirmed for this encounter.':'Identity checks are required for routine care. Urgent assistance is always available.'}</p>${tasks.map(t=>`<div class="task-row"><div><b>${esc(t.title)}</b><small>${t.status==='done'?`Completed ${E.timeLabel(t.completedAt)}`:t.status==='delegated'?`Jess accepted · report expected ${E.timeLabel(t.reportAt)}`:t.status==='reported'?'Report returned · awaiting your review':`${t.remaining??t.duration} min · ${t.effort} energy · ${E.ready(s,t)?'ready':t.kind==='followup'&&E.task(s,`${id}-care`).status!=='done'?'scheduled after care review':t.at>s.minutes?`available ${E.timeLabel(t.at)}`:'complete earlier care first'}`}</small></div>${button(`task-${t.id}`,t.status==='done'?'✓':t.status==='reported'?'Review':'Open','secondary')}</div>`).join('')}${button('back','Back to ward','quiet full')}`,{patient:id});
 for(const t of tasks){const b=$(`#task-${t.id}`);b.disabled=t.status==='done'||t.status==='delegated'||(!E.ready(s,t)&&t.status!=='reported');b.onclick=()=>openTask(t.id);}
 $('#records').onclick=()=>{verified=null;records(id);};$('#bed-help').onclick=helpNow;footerBack();
}
function identify(id,next){
 const p=people[id];
 show(`${heading(p,'CONFIRM IDENTITY')}<p>Compare the patient’s stated details, wristband and chart. Use three identifiers. Bed number is a location.</p><div class="source"><b>Patient statement</b><p>“My name is ${p.name}. My date of birth is ${p.dob}.”</p><b>Wristband</b><p>${p.name} · ${p.dob} · ${p.mrn}</p><b>Chart header</b><p>${p.name} · ${p.dob} · ${p.mrn}</p></div><form id="identity-form"><label for="id-name">Patient name</label><select id="id-name" required><option value="">Select the matching name</option>${people.map(x=>`<option>${x.name}</option>`).join('')}</select><label for="id-dob">Date of birth</label><select id="id-dob" required><option value="">Select the matching date</option>${people.map(x=>`<option>${x.dob}</option>`).join('')}</select><label for="id-mrn">Medical record number</label><select id="id-mrn" required><option value="">Select the matching record</option>${people.map(x=>`<option>${x.mrn}</option>`).join('')}</select><p id="form-error" role="alert"></p><button class="primary">Confirm identifiers · 1 min / 0 energy</button></form><div class="dialog-actions">${button('id-help','Urgent assistance','quiet')}${button('back','Return to patient','quiet')}</div>`,{patient:id});
 $('#identity-form').onsubmit=e=>{e.preventDefault();if($('#id-name').value!==p.name||$('#id-dob').value!==p.dob||$('#id-mrn').value!==p.mrn){$('#form-error').textContent='These details do not all match. Recheck the statement, wristband and chart.';return;}if(s.paused){$('#form-error').textContent='Resume the shift first.';return;}E.advance(s,1);verified=id;E.log(s,`Confirmed name, date of birth and MRN for ${p.short}.`);saveUpdate();next();};
 $('#id-help').onclick=helpNow;footerBack(()=>patientView(id));
}
function openTask(id){
 const t=E.task(s,id);if(!t||s.paused||s.finished)return;
 if(verified!==t.patient){identify(t.patient,()=>openTask(id));return;}
 current=t.patient;
 if(t.status==='reported'){reportTask(t);return;}
 if(!E.ready(s,t)){patientView(t.patient);return;}
 if(t.kind==='chart'||t.kind==='rechart'){chartTask(t);return;}
 if(t.kind==='fluid'){fluidTask(t);return;}
 if(t.kind==='note'){noteTask(t);return;}
 if(t.kind==='med'){medTask(t);return;}
 if(t.kind==='consent'){consentTask(t);return;}
 if(t.kind==='care'){careTask(t);return;}
 if(t.kind==='pressure'){pressureTask(t);return;}
 observationTask(t);
}
function cost(t){return `<p class="cost">Action cost: ${t.remaining??t.duration} simulated minutes · ${t.effort} energy. Reading is paused.</p>`;}
function vitals(values){return `<div class="vitals">${measures.map((m,i)=>`<span><small>${m.label}</small>${values[i]} ${m.unit}</span>`).join('')}</div>`;}
function observationTask(t){
 const p=people[t.patient],follow=t.kind==='followup';
 show(`${bedside(p,follow?'You’re back to check how I’m doing?':patientSpeech(p,s))}<p>${follow?followups[t.patient]:'Confirm the patient, explain the observations and obtain the bedside readings. Opening this page does not perform or document care.'}</p>${follow&&t.patient===0?`<div class="notice">${s.missed?'Reassessment was delayed: Jess reports ongoing concern.':'Review the response and confirm the next monitoring plan.'} ${s.late?'There was a delay before urgent help.':''}</div>`:''}${cost(t)}<p id="form-error" role="alert"></p>${button('perform',follow?'Reassess patient & review response':'Perform bedside observations')}${!follow&&t.patient!==0?button('delegate','Ask Jess to take observations','quiet full'):''}${button('back','Return to patient','quiet full')}`,{patient:t.patient});
 $('#perform').onclick=()=>outcome(E.commit(s,t.id),()=>showReadings(t));
 if($('#delegate'))$('#delegate').onclick=()=>delegation(t);footerBack(()=>patientView(t.patient));
}
function showReadings(t){
 const o=s.observed.find(o=>o.id===t.id);
 show(`${bedside(people[t.patient],patientSpeech(people[t.patient],s))}${monitor(o.values,E.timeLabel(o.at))}<p>${o.context}</p><p>${t.kind==='followup'&&t.patient===0&&(s.missed||s.late)?'Ongoing concern: Jess acknowledges renewed escalation and confirms further bedside review. This is not an all-clear.':'Confirm the next review plan and communicate new concerns.'}</p><p>Care is performed. These findings still need to be entered in the observation chart.</p>${button('record-now','Record these observations')}${button('back','Return to patient','quiet full')}`,{patient:t.patient});
 $('#record-now').onclick=()=>openTask(`${t.patient}-${t.kind==='obs'?'chart':'rechart'}`);footerBack(()=>patientView(t.patient));
}
function delegation(t){
 const busy=s.tasks.some(t=>['delegated','reported'].includes(t.status));
 show(`${heading(people[t.patient],'DELEGATE & FOLLOW UP')}<p>Jess is the RN team leader and is competent to take this routine observation set. Margaret’s urgent assessment is not offered for routine delegation.</p><div class="source"><b>${busy?'Jess has an outstanding report to complete.':'Jess can accept this task.'}</b><p>Request: obtain observations for ${people[t.patient].name}, report findings in 10 simulated minutes and call immediately for a new concern. You remain responsible for reviewing the report.</p></div>${button('accept-delegation','Confirm request & Jess’s acceptance · 1 energy')}${button('back','Back','quiet full')}`,{patient:t.patient});
 $('#accept-delegation').disabled=busy;$('#accept-delegation').onclick=()=>{if(E.delegate(s,t.id)){saveUpdate();feedback('Jess accepts the task.','A report will appear on your radar in 10 simulated minutes. You still need to review it.',()=>patientView(t.patient));}};footerBack(()=>openTask(t.id));
}
function reportTask(t){
 show(`${heading(people[t.patient],'JESS’S RETURN REPORT')}${vitals(people[t.patient].readings)}<p>Jess confirms identity, explains how the readings were obtained and reports no additional immediate concern. Review them against the patient’s baseline and current presentation.</p><p>Review and follow-through: 5 simulated minutes / 1 energy. Recording remains a separate task.</p>${button('review-report','Review report & confirm follow-up')}${button('back','Back','quiet full')}`,{patient:t.patient});
 $('#review-report').onclick=()=>outcome(E.acceptReport(s,t.id),()=>showReadings(t));footerBack(()=>patientView(t.patient));
}
function careTask(t){
 const d=decisions[t.patient];
 show(`${bedside(people[t.patient],patientSpeech(people[t.patient],s))}<p>${d.prompt}</p><details><summary>Review available information</summary><p>${people[t.patient].handover}</p>${vitals(s.observed.find(o=>o.patient===t.patient)?.values||people[t.patient].baseline)}<small>${s.observed.some(o=>o.patient===t.patient)?'Initial observations before this new concern; reassess the current presentation':'Handover baseline only; new observations not yet obtained'}</small></details>${cost(t)}${s.orders[t.patient].map(id=>{const o=d.options.find(o=>o.id===id);return `<button class="choice" data-choice="${id}">${o.text}</button>`;}).join('')}${button('back','Return to patient','quiet full')}`,{patient:t.patient});
 document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{
  const o=d.options.find(o=>o.id===b.dataset.choice),r=E.commit(s,t.id,{choice:o.id});
  outcome(r,()=>feedback(o.quality==='appropriate'?'The care plan moves forward.':'A gap to address now.',o.response+` Reassessment is scheduled for ${E.timeLabel(E.task(s,`${t.patient}-followup`).at)}.`,()=>patientView(t.patient)));
 });footerBack(()=>patientView(t.patient));
}
function chartTask(t){
 const source=s.observed.find(o=>o.id===`${t.patient}-${t.kind==='chart'?'obs':'followup'}`),previous=s.entries.filter(e=>e.patient===t.patient&&e.kind==='obs').at(-1);
 show(`<span class="eyebrow">${people[t.patient].name} · OBSERVATION PLOTTING</span>${monitor(source.values,E.timeLabel(source.at),'MEASURED SOURCE')}<details class="chart-guide"><summary>About this practice chart</summary><p>Practice bands, simplified for learning. Use your facility&rsquo;s approved observation chart. Colour alone does not determine the response; concerns can require help at any reading.</p><p>Purple: emergency response band · pink: urgent review band · yellow: increased monitoring band. Out-of-range exact readings remain in the signed record. Oxygen delivery, pain and sedation are outside this plotting exercise.</p></details><div id="plot-host"></div>${cost(t)}`,{patient:t.patient});
 wirePlotChart($('#plot-host'),{values:source.values,at:E.timeLabel(source.at),previous:previous?{...previous,label:E.timeLabel(previous.at)}:null,onSave:rows=>outcome(E.savePlottedChart(s,t.id,rows),()=>{verified=null;feedback('Observations plotted and signed.','Your marks and the exact measured readings are saved in the patient record.',()=>records(t.patient));}),onBack:()=>patientView(t.patient)});
}
function fluidTask(t){
 const p=people[t.patient];
 show(`${heading(p,'FLUID BALANCE')}<div class="source"><b>Measured source</b><p>${p.fluidSource}</p></div><form id="fluid-form"><label for="fluid-type">Direction</label><select id="fluid-type" required><option value="">Choose input or output</option><option value="input">Input</option><option value="output">Output</option></select><label for="fluid-volume">Measured volume (mL)</label><input id="fluid-volume" type="number" min="1" max="5000" step="1" inputmode="numeric" required>${cost(t)}<p id="form-error" role="alert"></p><button class="primary">Record measured fluid</button></form>${button('back','Return without recording','quiet full')}`,{patient:t.patient});
 $('#fluid-form').onsubmit=e=>{e.preventDefault();outcome(E.saveFluid(s,t.id,$('#fluid-type').value,Number($('#fluid-volume').value)),()=>{verified=null;records(t.patient);});};footerBack(()=>patientView(t.patient));
}
function pressureTask(t){
 show(`${heading(people[t.patient],'PLANNED PRESSURE AREA CARE')}<p>Review the individual care plan, explain the care and obtain consent. With the assistance and equipment specified in the plan, support repositioning and check comfort and skin condition.</p><p>In this scenario the patient agrees, the planned assistance is available and no new skin concern is found. Document the care and agree the next check with the team.</p>${cost(t)}${button('pressure-done','Complete planned care & document')}${button('back','Return to patient','quiet full')}`,{patient:t.patient});
 $('#pressure-done').onclick=()=>outcome(E.commit(s,t.id),()=>feedback('Pressure care recorded.','Planned repositioning and skin check completed with consent and assistance. Comfort checked; ongoing care remains in the patient’s plan.',()=>patientView(t.patient)));footerBack(()=>patientView(t.patient));
}
function medTask(t){
 const p=people[t.patient];
 show(`${heading(p,'MEDICATION SAFETY')}<div class="source"><b>Patient wristband</b><p>${p.name} · ${p.dob} · ${p.mrn}</p><b>Medication chart currently open</b><p>Noah Wilson · 7 August 1980 · WS-41902</p></div><p>A chart with a similar name is open. The next step is to resolve identification before reviewing a prescription.</p><button class="choice" id="med-correct">Stop, match all identifiers and obtain the correct chart before proceeding.</button><button class="choice" id="med-check">Ask a colleague to independently check the identity discrepancy with you.</button><button class="choice" id="med-wrong">Confirm the first name and date of birth, then review the displayed prescription.</button>${cost(t)}${button('back','Return to patient','quiet full')}`,{patient:t.patient});
 const correct=()=>{show(`${heading(p,'CORRECT CHART VERIFIED')}<div class="source"><p>${p.name} · ${p.dob} · ${p.mrn}</p><p>Allergy field: no known medication allergies documented; confirm with Noah. The current plan and administration record are now available.</p></div><p>This exercise records the resolved identity discrepancy and review of the current plan; it does not simulate administering a drug or dose.</p>${button('med-finish','Confirm checks, document discrepancy & communicate')}${button('back','Back','quiet full')}`,{patient:t.patient});$('#med-finish').onclick=()=>outcome(E.commit(s,t.id),()=>{s.medCorrected=true;saveUpdate();feedback('Identity discrepancy resolved.','The correct chart is now matched. The discrepancy and clarification are documented; medication administration has not been recorded.',()=>patientView(t.patient));});footerBack(()=>patientView(t.patient));};
 $('#med-correct').onclick=correct;$('#med-check').onclick=correct;
 $('#med-wrong').onclick=()=>{E.log(s,'Medication identity discrepancy needed another review; no medication administered.');persist();feedback('The record number does not match.','A partial match is insufficient. Resolve the discrepancy before proceeding; this attempt has not administered medication.',()=>medTask(t));};footerBack(()=>patientView(t.patient));
}
function consentTask(t){
 show(`${heading(people[t.patient],'CONSENT & FAMILY COMMUNICATION')}<p>Sofia says: “You can tell my sister I’m comfortable and waiting for an update, but I want to discuss the results myself.”</p><p>Her sister calls requesting the results. Select the response that respects Sofia’s stated preference.</p><button class="choice" id="consent-good">Verify the caller and share only the update Sofia agreed to; arrange her preferred follow-up.</button><button class="choice" id="consent-also">Offer to help Sofia speak with her sister directly, and confirm what support she wants.</button><button class="choice" id="consent-bad">Give a brief summary of results because Sofia agreed to a family update.</button>${cost(t)}${button('back','Back','quiet full')}`,{patient:t.patient});
 const done=()=>outcome(E.commit(s,t.id),()=>{s.consent=true;saveUpdate();feedback('Sofia’s preference is respected.','The agreed sharing limits and follow-up are recorded for your progress note.',()=>patientView(t.patient));});
 $('#consent-good').onclick=done;$('#consent-also').onclick=done;$('#consent-bad').onclick=()=>{E.log(s,'Clarified that consent for a general update does not include results.');persist();feedback('Check the scope of consent.','Sofia specifically reserved the results discussion. No information has been shared in this exercise.',()=>consentTask(t));};footerBack(()=>patientView(t.patient));
}
function noteTask(t){
 const recent=s.log.filter(l=>l.text.includes(people[t.patient].short)).slice(-6);
 show(`${heading(people[t.patient],'PROGRESS NOTE')}<p>Build a factual note from care already performed. Select the observation, response and follow-up that the record supports.</p><div class="source">${recent.map(l=>`<p class="small">${E.timeLabel(l.at)} · ${esc(l.text)}</p>`).join('')}</div><form id="note-form"><label for="note-findings">Findings</label><select id="note-findings" required><option value="">Select</option><option value="observed">Initial and reassessment findings recorded with times.</option><option value="normal">All observations normal throughout the shift.</option></select><label for="note-action">Action and response</label><select id="note-action" required><option value="">Select</option><option value="record">Document the completed care, team review and observed response.</option><option value="resolved">All clinical concerns resolved; no further review needed.</option></select><label for="note-plan">Outstanding plan</label><select id="note-plan" required><option value="">Select</option><option value="follow">Continue agreed monitoring and communicate outstanding needs at handover.</option><option value="none">No further monitoring required because the tasks are complete.</option></select>${cost(t)}<p id="form-error" role="alert"></p><button class="primary">Sign progress note</button></form>${button('back','Back','quiet full')}`,{patient:t.patient});
 $('#note-form').onsubmit=e=>{e.preventDefault();if($('#note-findings').value!=='observed'||$('#note-action').value!=='record'||$('#note-plan').value!=='follow'){$('#form-error').textContent='The record supports ongoing monitoring, not a blanket all-clear. Use factual findings and actual care.';return;}
 outcome(E.commit(s,t.id),()=>{s.notes.push({patient:t.patient,at:s.minutes,text:`Initial and reassessment findings charted. ${decisions[t.patient].options.find(o=>o.id===s.decisions.find(d=>d.task===`${t.patient}-care`)?.choice)?.response||'Care reviewed.'} Continue agreed monitoring and hand over outstanding needs.`});saveUpdate();feedback('Progress note signed.','Your note records care and response, with continued monitoring and handover.',()=>patientView(t.patient));});};footerBack(()=>patientView(t.patient));
}
function chartSvg(entries,index){
 const nums=entries.map(e=>e.values[index]),min=Math.min(...nums)-2,max=Math.max(...nums)+2;
 const points=entries.map((e,i)=>[40+i*(220/Math.max(1,entries.length-1)),95-(e.values[index]-min)/(max-min)*65]);
 return `<svg viewBox="0 0 300 130" role="img" aria-label="${measures[index].label} trend; exact readings in the table"><line x1="30" y1="100" x2="275" y2="100" stroke="#9aaa9d"/><polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#257c70" stroke-width="3"/>${points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="4" fill="#257c70"/><text x="${x}" y="${y-10}" text-anchor="middle" font-size="12">${nums[i]}</text><text x="${x}" y="118" text-anchor="middle" font-size="10">${E.timeLabel(entries[i].at)}</text>`).join('')}</svg>`;
}
function records(id){
 const p=people[id],obs=s.entries.filter(e=>e.patient===id&&e.kind==='obs'),fluid=s.entries.filter(e=>e.patient===id&&e.kind==='fluid'),tot=E.fluidTotals(s,id);
 show(`${heading(p,'CHARTS & RECORDS')}<p class="notice">Fictional trend display, not a clinical observation chart or EWS. Only signed entries appear. Each graph has its own range; compare exact values and context.</p>${obs.length?`<div class="trend-grid">${measures.map((m,i)=>`<div><b>${m.label} (${m.unit})</b>${chartSvg(obs,i)}</div>`).join('')}</div><div class="table-scroll"><table><caption>Recorded observations</caption><thead><tr><th>Measured</th>${measures.map(m=>`<th>${m.label}</th>`).join('')}<th>Amend</th></tr></thead><tbody>${obs.map(e=>`<tr><td>${E.timeLabel(e.at)}</td>${e.values.map(v=>`<td>${v}</td>`).join('')}<td><button data-amend="${e.id}">Amend</button></td></tr>`).join('')}</tbody></table></div>`:'<p>No observations recorded yet. Unrecorded is not zero.</p>'}<h3>Fluid balance</h3>${fluid.length?`<p>Recorded input: ${tot.input} mL · output: ${tot.output} mL · balance: ${tot.balance>0?'+':''}${tot.balance} mL</p><p class="small">Totals cover recorded measurements only, not a complete clinical fluid balance.</p>${fluid.map(e=>`<p>${E.timeLabel(e.at)} · ${e.category}: ${e.volume} mL <button data-amend="${e.id}">Amend entry</button></p>`).join('')}`:'<p>No measured fluid entries recorded. Totals are unavailable.</p>'}<h3>Signed progress note</h3><p>${esc(s.notes.find(n=>n.patient===id)?.text||'Not yet documented.')}</p><details><summary>Amendment history</summary>${s.entries.filter(e=>e.patient===id).flatMap(e=>e.history.map(h=>`<p>${E.timeLabel(h.at)} · ${esc(h.reason)} · previous: ${esc(JSON.stringify(h.previous))}</p>`)).join('')||'<p>No amendments.</p>'}</details>${button('back','Return to patient','quiet full')}`,{patient:id});
 document.querySelectorAll('[data-amend]').forEach(b=>b.onclick=()=>identify(id,()=>amend(b.dataset.amend)));footerBack(()=>{verified=null;patientView(id);});
}
function amend(id){
 const entry=s.entries.find(e=>e.id===id);
 show(`${heading(people[entry.patient],'AMEND SIGNED ENTRY')}<p>The original entry remains in the audit history. Recheck the source before recording a correction.</p><div class="source">${entry.kind==='obs'?vitals(s.observed.find(o=>o.id===`${entry.patient}-${id.endsWith('rechart')?'followup':'obs'}`).values):people[entry.patient].fluidSource}</div><form id="amend-form">${entry.kind==='obs'?`<div class="field-grid">${measures.map((m,i)=>`<label>${m.label}<input name="${m.key}" type="number" min="${m.min}" max="${m.max}" step="${m.step}" required value="${entry.values[i]}"></label>`).join('')}</div>`:`<label>Volume (mL)<input name="volume" type="number" min="1" max="5000" required value="${entry.volume}"></label>`}<label>Reason for amendment<input name="reason" maxlength="180" minlength="5" required placeholder="Explain what you checked or corrected"></label><p id="form-error" role="alert"></p><button class="primary">Save amendment · 3 min / 1 energy</button></form>${button('back','Cancel amendment','quiet full')}`,{patient:entry.patient});
 $('#amend-form').onsubmit=e=>{e.preventDefault();if(s.paused)return;const f=new FormData(e.target),values=entry.kind==='obs'?measures.map(m=>Number(f.get(m.key))):Number(f.get('volume')),expected=entry.kind==='obs'?s.observed.find(o=>o.id===`${entry.patient}-${id.endsWith('rechart')?'followup':'obs'}`).values:people[entry.patient].fluid.volume;
 if(JSON.stringify(values)!==JSON.stringify(expected)){$('#form-error').textContent='The amendment must match the measured source.';return;}
 entry.history.push({at:s.minutes,reason:f.get('reason'),previous:entry.kind==='obs'?[...entry.values]:entry.volume});
 if(entry.kind==='obs')entry.values=values;else entry.volume=values;
 E.advance(s,3);s.energy=Math.max(0,s.energy-1);s.spent++;E.log(s,`Amended ${people[entry.patient].short}'s chart entry; original retained.`);saveUpdate();verified=null;records(entry.patient);
 };footerBack(()=>records(entry.patient));
}
function breakView(){
 const available=E.canBreak(s);
 show(`<span class="eyebrow">COVERED BREAK</span><h2>${s.breakState==='taken'?'Break already taken.':'Hand over before you step away.'}</h2><p>${available?'Jess can accept cover for 15 simulated minutes. Review active concerns and outstanding tasks together.':'Address active patient concerns and agree a response plan before taking a break. Jess can help now.'}</p><div class="source">${s.tasks.filter(t=>t.status!=='done'&&E.visibleTask(s,t)&&t.at<=s.minutes).map(t=>`<p class="small">${people[t.patient].short}: ${esc(t.title)}${t.due!==null?` · follow-up ${E.timeLabel(t.due)}`:''}</p>`).join('')||'No currently released tasks outstanding.'}</div><p>15 simulated minutes · recover 25 energy · once this shift. Jess accepts active follow-up responsibilities during cover.</p>${button('take-break','Agree cover, take break & receive return update')}${button('back','Back to ward','quiet full')}`);
 $('#take-break').disabled=!available||s.breakState==='taken';$('#take-break').onclick=()=>{if(E.takeBreak(s)){saveUpdate();feedback('Welcome back.','Jess has handed back your patients and outstanding tasks. Your covered break is recorded and cannot be taken twice.');}};footerBack();
}
function finalHandover(){
 const remaining=s.tasks.filter(t=>t.status!=='done');
 show(`<span class="eyebrow">FINAL HANDOVER</span><h2>${remaining.length?'Make outstanding care explicit.':'Close the loop.'}</h2><p>${remaining.length} of ${s.tasks.length} tasks remain incomplete. ${remaining.length?'Finishing now creates an incomplete-shift debrief.':'The next nurse still needs a clear monitoring and follow-up plan.'}</p>${s.minutes<480?'<p class="notice">This is an early handover before 21:00. Remaining shift coverage must be transferred even when all authored tasks are complete.</p>':''}<aside class="isbar-prompt" aria-labelledby="isbar-title"><h3 id="isbar-title">Hand over with ISBAR</h3><ul><li><b>I</b>dentify yourself and the patient</li><li><b>S</b>ituation: what is happening now</li><li><b>B</b>ackground: relevant history and admission</li><li><b>A</b>ssessment: your findings and concerns</li><li><b>R</b>ecommendation: what needs to happen next, and by when</li></ul><p><a href="/clinical-tip-make-an-isbar-call.html" target="_blank" rel="noopener">Watch the ISBAR clinical tip ↗</a></p></aside><form id="handover-form">${people.map(p=>`<fieldset><legend>${p.name}</legend><p>${esc(s.notes.find(n=>n.patient===p.id)?.text||'No signed progress note. Review available findings and outstanding care.')}</p><label><input type="checkbox" required>Communicate changes, care and response for ${p.short}.</label><label><input type="checkbox" required>Agree ownership of outstanding monitoring, results and care.</label><small>${E.tasksFor(s,p.id).filter(t=>t.status!=='done'&&E.visibleTask(s,t)).map(t=>esc(t.title)).join(' · ')||'All authored tasks complete; ongoing monitoring remains in the plan.'}</small></fieldset>`).join('')}<button class="primary">${remaining.length?'Finish with outstanding care recorded':s.minutes<480?'Complete early handover & view debrief':'Complete handover & view debrief'}</button></form>${button('back','Return to care','quiet full')}`);
 $('#handover-form').onsubmit=e=>{e.preventDefault();s.handedOver=true;s.finished=true;E.log(s,'Structured handover completed, including outstanding care and monitoring responsibilities.');saveUpdate();dialog.close();summary();};footerBack();
}
function summary(){
 const done=s.tasks.filter(t=>t.status==='done').length,good=s.decisions.filter(d=>d.quality==='appropriate').length;
 $('#summary-body').innerHTML=`<span class="eyebrow">SHIFT DEBRIEF · ${E.timeLabel(s.minutes)}</span><h2>${s.minutes<480?'Early handover: shift coverage transferred.':done===s.tasks.length?'A shift with follow-through.':'An unfinished shift, handed over.'}</h2><div class="score">${done}<small> / ${s.tasks.length} tasks completed</small></div><p>Energy used: ${s.spent} points before recovery. ${s.breakState==='taken'?'One covered break taken.':'No covered break recorded; consider whether workload and cover allowed one.'}</p><div class="review-item"><b>Safety & judgement</b><p>${good} of ${s.decisions.length} care decisions used an appropriate approach. ${s.branch==='early'?'You requested urgent help early.':s.branch==='pending'?(s.concerns[0]?.revealed?'Margaret’s urgent response was not completed.':'No new breathing concern was reported before handover.'):'Review the timeline of Margaret’s changing needs.'}</p></div><div class="review-item"><b>Timely follow-through</b><p>${s.missed?'Margaret’s reassessment was missed or delayed; review how the task could have been tracked or handed over.':'No missed-reassessment alert for Margaret.'} ${s.tasks.filter(t=>t.status==='reported').length} delegated reports still await review.</p></div><div class="review-item"><b>Communication & teamwork</b><p>${s.notes.length}/4 progress notes recorded. ${s.handedOver?'Outstanding responsibilities included in handover.':'Handover not completed.'} Asking for help never reduced your score.</p></div>${s.decisions.filter(d=>d.quality!=='appropriate').map(d=>`<div class="feedback warn"><p>${esc(d.response)}</p></div>`).join('')}<h3>Patient continuity</h3>${people.map(p=>`<p><b>${p.short}</b> · ${E.tasksFor(s,p.id).filter(t=>t.status==='done').length}/${E.tasksFor(s,p.id).length} tasks. ${E.tasksFor(s,p.id).filter(t=>t.status!=='done'&&E.visibleTask(s,t)).map(t=>esc(t.title)).join('; ')||'Continue the agreed monitoring plan.'}</p>`).join('')}<p class="notice">Educational prototype, not a competency assessment. Clinical review and a timed learner playtest remain required.</p><p><a href="https://www.safetyandquality.gov.au/national-standards/nsqhs-standards/recognising-and-responding-acute-deterioration-standard" target="_blank" rel="noopener">Review recognition and response principles</a></p><div class="dialog-actions">${button('download','Save debrief','quiet')}${button('restart','Start a new shift')}</div>`;
 $('#summary').showModal();$('#restart').onclick=reset;
 $('#download').onclick=()=>{const data=`Ward Shift ${CASE_VERSION}\n${done}/${s.tasks.length} tasks. Energy spent ${s.spent}. Break: ${s.breakState}.\n\n${s.log.map(l=>`${E.timeLabel(l.at)} ${l.text}`).join('\n')}\n\nEducational prototype. Not a competency assessment.`;const url=URL.createObjectURL(new Blob([data],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download='ward-shift-debrief.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
}
function reset(){persistenceEnabled=false;try{localStorage.removeItem(SAVE);}catch{}location.reload();}
$('#start').onclick=()=>{persistenceEnabled=true;$('#intro').close();handover(true);};
$('#plan').onclick=()=>planner();$('#handover').onclick=()=>handover();$('#break').onclick=breakView;$('#urgent').onclick=helpNow;
$('#pause').onclick=()=>{s.paused=!s.paused;visual.keys.clear();saveUpdate();message(s.paused?'Paused. No time or energy is consumed.':'Resumed.');if(!s.paused)presentAlert();};
$('#next').onclick=()=>{
 const time=E.nextEvent(s),ready=s.tasks.filter(t=>E.ready(s,t));
 show(`<span class="eyebrow">ADVANCE THE SHIFT</span><h2>Continue until the next update?</h2><p>${ready.length} tasks are currently ready. Advancing may make outstanding follow-up overdue. No energy is charged for waiting.</p><p>The clock will stop at the next task, report or new patient need. You can also stay on the ward and let time pass.</p>${button('advance-confirm','Continue to next event')}${button('back','Return to care','quiet full')}`);
 $('#advance-confirm').onclick=()=>{E.advance(s,time-s.minutes);close();message(s.log.at(-1)?.text||'The next shift event is ready.');if(s.minutes>=480)finalHandover();};footerBack();
};
$('#help').onclick=()=>{show(`<span class="eyebrow">HOW TO PLAY · 0.5</span><h2>Plan. Care. Record. Follow through.</h2><p>Start with handover and your plan. Tap a bed to walk to the patient, tap the floor to walk, or use the patient buttons for direct access. Tap Jess at the station for help. The Equipment button opens the emergency trolley workflow. Confirm identifiers, perform care, then record measured findings. Read the monitor and plot each measurement in the practice chart. Charts do not fill themselves.</p><p>Reading, planning and entering records pause the clock. Committing a task advances simulated time and uses its displayed energy. Waiting uses no energy. Use “Next event” during quiet periods.</p><p>Reassessments and Jess’s reports return later. Asking for help is free. One covered break restores 25 energy. Low energy is a workload signal, never a control penalty.</p><p>Drag routine tiles to prioritise rounds. New concerns arrive after observations; respond when they occur. Keep checking your plan; notes become available later in the shift. You may hand over early, but incomplete care will be shown in your debrief.</p><p>Your shift saves on this browser. Resume is paused. No real patient data should be entered.</p>${button('back','Back','primary')}`);footerBack();};
$('#intro').addEventListener('cancel',e=>e.preventDefault());$('#summary').addEventListener('cancel',e=>e.preventDefault());
dialog.addEventListener('cancel',e=>{e.preventDefault();if(s.started)close();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&s.started&&!s.finished){s.paused=true;visual.keys.clear();saveUpdate();}});
window.addEventListener('blur',()=>visual.keys.clear());
window.addEventListener('pagehide',persist);
document.addEventListener('keydown',e=>{
 if(dialog.open||$('#intro').open||$('#summary').open)return;
 const k=e.key.toLowerCase();if(k==='p'&&s.started&&!s.finished&&!e.repeat){$('#pause').click();return;}
 if(!s.started||s.paused||s.finished)return;
 if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){e.preventDefault();visual.keys.add(k);}
 if(k==='e'){const near=people.map(p=>({p,d:Math.hypot(visual.player.x-((p.id%2?540:65)+200),visual.player.y-(p.id<2?282:395))})).sort((a,b)=>a.d-b.d)[0];if(near.d<110)visit(near.p.id);else message('Move near a room door, or tap a patient.');}
});
document.addEventListener('keyup',e=>visual.keys.delete(e.key.toLowerCase()));
function walkTo(point,action=null){
 if(!s.started||s.paused||s.finished||dialog.open)return;
 visual.path=walkRoute(visual.player,point);arrivalAction=action;
 message(s.trolley.status==='collected'?'Moving with the emergency trolley. Jess remains with Margaret.':'Walking to the selected location…');
 if(reducedMotion.matches){visual.player={...point};visual.path=[];const next=arrivalAction;arrivalAction=null;if(next)next();else message('Arrived. Select a patient, Jess or equipment to interact.');}
}
canvas.addEventListener('pointerdown',e=>{
 if(!s.started||s.paused||s.finished)return;
 const r=canvas.getBoundingClientRect(),scale=Math.min(r.width/1000,r.height/660),x=(e.clientX-r.left-(r.width-1000*scale)/2)/scale,y=(e.clientY-r.top-(r.height-660*scale)/2)/scale;
 const target=mapTarget(x,y);if(!target)return;
 walkTo(target.point,target.kind==='patient'?()=>{if(target.id===0&&s.trolley.status==='collected'){E.deliverTrolley(s);saveUpdate();}patientView(target.id);}:target.kind==='jess'?helpNow:target.kind==='trolley'?equipmentView:null);
});
function equipmentView(){
 const active=!!s.concerns[0]?.revealed;
 const status=s.trolley.status;
 show(`<span class="eyebrow">EMERGENCY EQUIPMENT</span><h2>${status==='bedside'?'Trolley at the bedside.':'Emergency trolley'}</h2><p>${!active?'The trolley is parked in the corridor. During an emergency, call for help first and confirm someone stays with the patient.':status==='bedside'?'The trolley is ready for the responding team. Continue assessment, communication and follow-up.':!s.trolley.cover?'Call for the emergency response and confirm Jess will stay with Margaret before collecting equipment.':'Jess is with Margaret. The emergency call is active; you can collect and bring the trolley.'}</p>${active&&status==='parked'?button('trolley-action',s.trolley.cover?'Walk to trolley & collect':'Call for the emergency response & confirm bedside cover'):active&&status==='collected'?button('trolley-action','Bring trolley to Margaret'):''}<p class="notice">Equipment retrieval is a team task. It does not replace the emergency call, patient assessment or care within your scope. No drugs or defibrillator actions are simulated.</p>${button('back','Back to ward','quiet full')}`);
 const action=$('#trolley-action');if(action)action.onclick=()=>{
  if(!s.trolley.cover){if(E.arrangeEmergencyCover(s)){saveUpdate();equipmentView();}return;}
  const collecting=s.trolley.status==='parked';close();
  walkTo(collecting?trolleyPoint:bedsidePoint(0),()=>{
   const ok=collecting?E.collectTrolley(s):E.deliverTrolley(s);saveUpdate();if(ok)equipmentView();
  });
 };footerBack();
}
$('#equipment').onclick=equipmentView;
let last=performance.now(),tick=0;
function frame(now){
 const dt=Math.min((now-last)/1000,.1);last=now;
 if(s.started&&!s.paused&&!s.finished&&!dialog.open&&!$('#summary').open&&!document.hidden){
  const k=visual.keys;let dx=(k.has('d')||k.has('arrowright')?1:0)-(k.has('a')||k.has('arrowleft')?1:0),dy=(k.has('s')||k.has('arrowdown')?1:0)-(k.has('w')||k.has('arrowup')?1:0),l=Math.hypot(dx,dy)||1;
  if(dx||dy){visual.path=[];arrivalAction=null;visual.player.x=Math.max(65,Math.min(930,visual.player.x+dx/l*200*dt));visual.player.y=Math.max(280,Math.min(392,visual.player.y+dy/l*200*dt));}
  else if(visual.path.length&&stepWalk(visual.player,visual.path,260*dt)){const next=arrivalAction;arrivalAction=null;if(next)next();else message('Arrived. Select a patient, Jess or equipment to interact.');}
  tick+=dt;if(tick>=5){tick=0;E.advance(s,1);saveUpdate();presentAlert();if(s.minutes>=480)finalHandover();}
 }
 draw(reducedMotion.matches?0:now);requestAnimationFrame(frame);
}
try{const raw=localStorage.getItem(SAVE);if(raw)saveCandidate=E.validateSave(JSON.parse(raw));}
catch(e){$('#resume-area').innerHTML=`<p class="notice">Saved shift could not be restored: ${esc(e.message)} Your existing save is retained until you choose a new shift.</p>`;}
if(saveCandidate){
 $('#resume-area').innerHTML=`<p class="notice">Saved shift · ${E.timeLabel(saveCandidate.minutes)} · ${saveCandidate.tasks.filter(t=>t.status==='done').length}/${s.tasks.length} tasks. Resume starts paused.</p>${button('resume','Resume saved shift','secondary full')}${button('new-shift','Start a new shift','quiet full')}`;
  $('#new-shift').onclick=()=>{try{localStorage.removeItem(SAVE);}catch{}saveCandidate=null;persistenceEnabled=true;$('#intro').close();handover(true);};
 $('#resume').onclick=()=>{s=saveCandidate;persistenceEnabled=true;$('#intro').close();update();if(s.finished)summary();else if(!s.started)handover(true);else message('Saved shift restored, paused. Press Resume when ready.');};
}
update();$('#intro').showModal();requestAnimationFrame(frame);
