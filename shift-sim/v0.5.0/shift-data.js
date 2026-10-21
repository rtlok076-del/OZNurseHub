export const VERSION = 5;
export const CASE_VERSION = 'playtest-0.5';
export const people = [
 {id:0,bed:'01',name:'Margaret Ellis',short:'Margaret',dob:'18 March 1952',mrn:'WS-41001',age:74,colour:'#c79172',condition:'Pneumonia · ongoing monitoring',handover:'Resting comfortably at handover on her prescribed oxygen plan. Continue observations, fluid balance and assisted pressure area care. Review changes against her baseline and local escalation plan.',baseline:[18,96,88,118,72,37.4],readings:[18,96,88,118,72,37.4],repeat:[23,94,99,110,68,37.9],fluid:{type:'output',category:'Urine',volume:180},fluidSource:'Measured urine: 180 mL. No other fluid measurements are available in this exercise.'},
 {id:1,bed:'02',name:'Noah Williams',short:'Noah',dob:'7 August 1980',mrn:'WS-41002',age:46,colour:'#a77356',condition:'Postoperative · pain review',handover:'Day one after abdominal surgery. Comfortable at rest at handover. Review the current prescription, patient identifiers, allergy status and administration record before medication care.',baseline:[16,97,80,126,76,36.9],readings:[17,97,88,128,76,37.1],repeat:[16,98,82,124,74,37.0]},
 {id:2,bed:'03',name:'Arthur Chen',short:'Arthur',dob:'21 May 1944',mrn:'WS-41003',age:82,colour:'#ceac87',condition:'Urinary infection · assisted mobility',handover:'Admitted with a urinary infection. Usually orientated. Mobility plan: assistance from one appropriately trained staff member using his walking aid. Continue planned pressure area care and monitor for changes.',baseline:[18,96,84,122,72,37.2],readings:[20,96,94,118,68,37.8],repeat:[18,97,88,120,70,37.4],fluid:{type:'input',category:'Oral drink',volume:200},fluidSource:'Arthur finished 200 mL of water, measured from his marked cup. No other fluid measurements are available in this exercise.'},
 {id:3,bed:'04',name:'Sofia Patel',short:'Sofia',dob:'12 January 1991',mrn:'WS-41004',age:35,colour:'#a8755c',condition:'Stable · waiting for results',handover:'Under observation for abdominal symptoms. No new symptoms reported at handover. Awaiting an update on results. Ask whom she wants involved in discussions.',baseline:[14,99,76,116,72,36.8],readings:[14,99,78,118,72,36.8],repeat:[14,99,74,116,70,36.7]}
];
export const measures = [
 {key:'rr',label:'Respiratory rate',unit:'/min',min:1,max:80,step:1},
 {key:'spo2',label:'SpO₂',unit:'%',min:1,max:100,step:1},
 {key:'hr',label:'Heart rate',unit:'/min',min:1,max:250,step:1},
 {key:'sbp',label:'Systolic BP',unit:'mmHg',min:30,max:300,step:1},
 {key:'dbp',label:'Diastolic BP',unit:'mmHg',min:10,max:200,step:1},
 {key:'temp',label:'Temperature',unit:'°C',min:30,max:43,step:.1}
];
const option=(id,text,response,quality='appropriate')=>({id,text,response,quality});
export const decisions = {
 0:{
  prompt:'Margaret is visibly more breathless and speaks in short phrases. Choose your next action; do not wait for routine charting to seek help.',
  options:[
   option('urgent','Call for urgent assistance now, stay with Margaret and continue focused assessment.','Jess acknowledges the urgency and joins you. You agree who will stay, what needs checking and how the response will be followed up.'),
   option('team','Ask Jess to activate the urgent response while you remain with Margaret and assess.','Jess accepts the request and activates the response. You remain with Margaret and confirm the response plan.'),
   option('complete','Complete the observation chart first, then make a structured call with the full set.','The findings already justify prompt help. Documentation can follow or be delegated; completing the chart should not delay assistance. Jess helps you obtain urgent review.','needs-review')
  ]},
 1:{
  prompt:'Noah reports ongoing pain. The chart shows the requested PRN is not yet due. What will you do?',
  options:[
   option('review','Assess the pain, offer suitable positioning and request review of the current plan.','Noah explains what is making movement difficult. The treating team agrees to review the plan, and you arrange reassessment.'),
   option('team','Ask the team leader to help arrange a pain review while you assess and offer comfort measures.','Jess accepts the request and confirms who will review Noah. You continue bedside care and agree to reassess his response.'),
   option('wait','Explain the next dose time and return then to review his pain.','The timing explanation helps, but uncontrolled pain needs assessment and a plan now. You arrange review rather than leaving the episode pending until the next dose.','needs-review')
  ]},
 2:{
  prompt:'Arthur wants the toilet and seems newly confused. His mobility plan requires assistance. Choose your approach.',
  options:[
   option('assist','Stay with Arthur, arrange appropriate assistance and assess the change from baseline.','Arthur is supported with toileting using his mobility plan. You report the new confusion and agree further review.'),
   option('delegate','Ask Jess to provide the planned mobility assistance while you assess and escalate the new confusion.','Jess accepts the mobility task and agrees to report back. You assess the change and coordinate review; the care episode still needs follow-up.'),
   option('reorient','Reorient Arthur, put his walking aid within reach and ask him to ring before standing.','Reorientation and access to the bell help, but they do not meet his documented need for assistance or address the new confusion. Arrange support and assessment now.','needs-review')
  ]},
 3:{
  prompt:'Sofia is worried about pending results. A routine task is also waiting. How will you respond?',
  options:[
   option('listen','Explore her main concern, explain what is confirmed and agree a specific update time.','Sofia is mainly worried that she has been forgotten. You explain the confirmed plan and agree to obtain an update.'),
   option('return','Acknowledge the concern, agree a short return time and ask Jess to obtain a team update.','Jess accepts the request. You return as agreed, discuss the update and check Sofia’s understanding.'),
   option('results','Explain that results are pending and suggest discussing questions when the doctor next rounds.','The information is accurate, but Sofia still has no agreed follow-up. You arrange an update rather than leaving the concern open-ended.','needs-review')
  ]}
};
export const followups = [
 'The team has reviewed Margaret. Check her response, compare observations and confirm the ongoing monitoring plan.',
 'A revised pain plan has been reviewed and implemented by the team. Assess pain, alertness and other adverse effects; review the response.',
 'Jess reports that toileting was supported safely. Review the report, check Arthur’s current state and confirm the plan for the new confusion.',
 'The team has provided an update. Return to Sofia, check for new concerns and ask her to explain the next steps in her own words.'
];
export const costs={obs:[5,2],chart:[3,1],care:[12,4],followup:[5,3],rechart:[3,1],note:[3,1],fluid:[8,4],med:[8,4],consent:[8,4],pressure:[10,4]};
export const routineGroups = [
 {id:'obs',title:'Observations round',detail:'Four patients · record readings as you go',window:'early'},
 {id:'med',title:'Medication checks',detail:'Noah · verify chart, allergies and current orders',window:'middle'},
 {id:'pressure',title:'Pressure area care',detail:'Margaret & Arthur · follow individual care plans',window:'middle'},
 {id:'fluid',title:'Fluids & patient updates',detail:'Measured balance and agreed family communication',window:'middle'},
 {id:'note',title:'Progress notes',detail:'Document completed care and prepare handover',window:'late'},
 {id:'break',title:'Covered break',detail:'15 minutes · agree cover with Jess',window:'middle'}
];
export const groupFor = t => ['obs','chart'].includes(t.kind)?'obs':t.kind==='consent'?'fluid':t.kind;
export const concernMessages = [
 'Margaret rings: “My breathing feels harder.” She is now visibly breathless and speaking in short phrases. Obtain urgent assistance and assess her now.',
 'Noah rings to report increasing pain. His requested PRN is not yet due. Assess his needs and review the plan.',
 'Arthur rings for the toilet and seems newly confused. Stay with him, arrange assistance and assess the change.',
 'Sofia asks to speak with you. She is increasingly worried about waiting for her results.'
];
export function taskSet(){
 const tasks=[];
 for(const p of people){
  const add=(kind,title,at,requires=[],due=null)=>tasks.push({id:`${p.id}-${kind}`,patient:p.id,kind,title,at,requires,due,status:'pending',duration:costs[kind][0],effort:costs[kind][1],window:at<160?'early':at<320?'middle':'late'});
  add('obs','Initial bedside observations',0);
  add('chart','Record initial observations',0,[`${p.id}-obs`]);
  add('care',['Respond to breathing concern','Review pain and comfort','Assist mobility & assess confusion','Reassure and explain the plan'][p.id],10000,[`${p.id}-obs`]);
  add('followup','Reassess & review the team response',10000,[`${p.id}-care`]);
  add('rechart','Record reassessment observations',10000,[`${p.id}-followup`]);
  const last=p.id===1?'med':p.id===3?'consent':'fluid';
  add(last,last==='med'?'Scheduled medication checks':last==='consent'?'Agreed family update':'Record measured fluid balance',160);
  if([0,2].includes(p.id))add('pressure','Planned pressure area care',160);
  add('note','Document findings, response & follow-up',320,[`${p.id}-rechart`,`${p.id}-${last}`]);
 }
 return tasks;
}
