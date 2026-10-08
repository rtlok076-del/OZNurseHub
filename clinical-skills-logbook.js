/* OzNurseHub clinical skills logbook. Everything is stored in this browser only (localStorage, via student-tools.js). No doses, no patient details. */
(function(){'use strict';
var O=window.OZT,$=O.$,$$=O.$$,el=O.el;

/* ---------- Reference data ---------- */
var LEVELS=[
  {id:'obs',n:1,name:'Observed',abbr:'O',desc:'You watched an RN or another clinician do it and talked it through with them.'},
  {id:'ast',n:2,name:'Assisted',abbr:'A',desc:'You did part of it alongside the RN, who led and did the rest.'},
  {id:'sup',n:3,name:'Performed under supervision',abbr:'S',desc:'You did it yourself with the RN directly supervising, guiding you and ready to step in.'},
  {id:'min',n:4,name:'Performed with minimal prompting',abbr:'MP',desc:'You did it safely and confidently with the RN present, needing only the odd cue.'}
];
var LV={};LEVELS.forEach(function(l){LV[l.id]=l;});
var STD={1:'Thinks critically and analyses nursing practice',2:'Engages in therapeutic and professional relationships',3:'Maintains the capability for practice',4:'Comprehensively conducts assessments',5:'Develops a plan for nursing practice',6:'Provides safe, appropriate and responsive quality nursing practice',7:'Evaluates outcomes to inform nursing practice'};
var STD_SHORT={1:'Critical thinking',2:'Relationships',3:'Capability',4:'Assessment',5:'Planning',6:'Safe, quality practice',7:'Evaluation'};
var SETTINGS=['Medical ward','Surgical ward','Aged care','Rehabilitation','Mental health','Community or primary care','Emergency','Perioperative','Critical care','Paediatrics','Maternity','Palliative care','Other'];
var AREAS=[
 {id:'as',name:'Assessment and observations',skills:[
  ['as-vitals','Full set of vital signs (RR, SpO\u2082, BP, HR, temperature, level of consciousness)'],
  ['as-chart','Charting observations on an observation and response chart'],
  ['as-pain','Pain assessment using a pain scale'],
  ['as-neuro','Neurological observations (GCS, pupils, limb strength)'],
  ['as-nvo','Neurovascular observations'],
  ['as-bgl','Blood glucose level (BGL) check'],
  ['as-head','Head-to-toe or systems assessment'],
  ['as-fbc','Fluid balance chart'],
  ['as-wt','Weight, height and BMI'],
  ['as-cog','Delirium and cognition screening'],
  ['as-ecg','Recording a 12-lead ECG'],
  ['as-adm','Admission nursing assessment']]},
 {id:'md',name:'Medication administration',note:'No doses here. Students give medicines only under the direct supervision of an RN, whatever level you log. Rules for Schedule 8 medicines, IV medicines and acting as a second checker vary, so always check first.',skills:[
  ['md-chart','Checking a medication chart against the rights of medication administration'],
  ['md-id','Patient identification and allergy check before giving medicines'],
  ['md-oral','Oral medicines'],
  ['md-sc','Subcutaneous injection'],
  ['md-im','Intramuscular injection'],
  ['md-top','Topical or transdermal medicines (creams, patches)'],
  ['md-inh','Inhaled medicines (puffer and spacer, nebuliser)'],
  ['md-eye','Eye or ear drops'],
  ['md-prn','PRN medicine: assessing the need and evaluating the effect'],
  ['md-edu','Explaining a medicine to a patient'],
  ['md-iv','IV medicine checking and preparation (observed)']]},
 {id:'wd',name:'Wound care and ANTT',skills:[
  ['wd-hh','Hand hygiene at the 5 Moments'],
  ['wd-ppe','Putting on and taking off PPE'],
  ['wd-field','Setting up an aseptic field (protecting key parts and key sites)'],
  ['wd-simple','Simple wound dressing using ANTT'],
  ['wd-assess','Wound assessment and documentation'],
  ['wd-sut','Removing sutures or staples'],
  ['wd-drain','Wound drain care and measuring output'],
  ['wd-sharps','Safe sharps handling and disposal']]},
 {id:'iv',name:'IV and PIVC site care',note:'Many facilities limit what students can do with IV lines and infusions. Check before you\u2019re involved.',skills:[
  ['iv-site','PIVC site check (e.g. VIP score)'],
  ['iv-doc','Documenting a PIVC check'],
  ['iv-dress','PIVC dressing and securement check'],
  ['iv-remove','Removing a PIVC'],
  ['iv-flush','Flushing a PIVC (medicine rules apply)'],
  ['iv-fluid','Monitoring an IV fluid infusion and pump'],
  ['iv-prime','Priming an IV giving set']]},
 {id:'mb',name:'Mobility and falls',skills:[
  ['mb-falls','Falls risk assessment'],
  ['mb-aids','Helping a patient walk with a gait aid'],
  ['mb-transfer','Bed-to-chair transfer'],
  ['mb-equip','Using a slide sheet or lifting machine'],
  ['mb-repos','Repositioning in bed'],
  ['mb-stock','Applying compression stockings (VTE prevention)'],
  ['mb-postfall','Post-fall checks and observations']]},
 {id:'hy',name:'Hygiene and pressure care',skills:[
  ['hy-wash','Assisted shower or bed wash'],
  ['hy-oral','Mouth care'],
  ['hy-pi','Pressure injury risk assessment'],
  ['hy-skin','Skin inspection'],
  ['hy-bed','Making an occupied bed'],
  ['hy-cont','Continence care']]},
 {id:'nu',name:'Nutrition and elimination',skills:[
  ['nu-meal','Helping with meals and drinks'],
  ['nu-chart','Food and fluid charts'],
  ['nu-iddsi','Texture-modified food and thickened fluids (IDDSI)'],
  ['nu-idc','Catheter care and emptying a drainage bag'],
  ['nu-bowel','Bowel chart (Bristol stool chart)'],
  ['nu-stoma','Stoma care'],
  ['nu-ngt','Caring for a nasogastric or enteral feeding tube']]},
 {id:'cm',name:'Communication and handover',skills:[
  ['cm-isbar','ISBAR handover to your RN'],
  ['cm-bedside','Bedside handover'],
  ['cm-edu','Patient education'],
  ['cm-family','Talking with families and carers'],
  ['cm-interp','Working with an interpreter'],
  ['cm-distress','Responding to a distressed or anxious patient'],
  ['cm-team','Speaking up in a team huddle or ward round']]},
 {id:'dc',name:'Documentation',skills:[
  ['dc-prog','Writing a progress note'],
  ['dc-care','Updating a care plan'],
  ['dc-adm','Admission documentation'],
  ['dc-dis','Discharge planning and education'],
  ['dc-emr','Documenting in electronic records (if students are given access)'],
  ['dc-inc','Incident report (observed or contributed)']]},
 {id:'es',name:'Escalation and deterioration',skills:[
  ['es-abn','Recognising abnormal observations and telling your RN'],
  ['es-isbar','Escalating a concern using ISBAR'],
  ['es-rrt','Rapid response or MET call (observed or assisted)'],
  ['es-bls','Basic life support (CPR)'],
  ['es-trolley','Emergency trolley check'],
  ['es-o2','Oxygen delivery devices: applying and monitoring']]},
 {id:'sp',name:'Specimen collection',skills:[
  ['sp-ua','Urinalysis (dipstick)'],
  ['sp-msu','Midstream urine (MSU) collection'],
  ['sp-csu','Catheter specimen of urine (CSU)'],
  ['sp-swab','Wound swab'],
  ['sp-faeces','Faecal specimen'],
  ['sp-sputum','Sputum specimen'],
  ['sp-nt','Nose and throat swab'],
  ['sp-label','Labelling specimens and request forms at the bedside'],
  ['sp-bc','Blood cultures (observed)']]},
 {id:'ot',name:'Perioperative and other care',skills:[
  ['ot-preop','Pre-operative checklist'],
  ['ot-postop','Post-operative observations and care'],
  ['ot-admit','Welcoming and orienting a new patient'],
  ['ot-dis','Discharging a patient'],
  ['ot-after','After-death care (observed or assisted)']]}
];
var AREA={};AREAS.forEach(function(a){AREA[a.id]=a;});

/* ---------- Data ---------- */
function blank(){return {v:1,entries:[],custom:[],profile:{},opts:{range:true,refl:false,gaps:false}};}
function str(v,max){return typeof v==='string'?v.slice(0,max):'';}
var ISO=/^\d{4}-\d{2}-\d{2}$/;
function cleanEntry(e){
  if(!e||typeof e!=='object'||!str(e.skill,80)||!ISO.test(e.date)||!LV[e.level])return null;
  var stds=Array.isArray(e.stds)?e.stds.map(Number).filter(function(n){return n>=1&&n<=7;}):[];
  return {id:str(e.id,40)||O.uid(),skill:str(e.skill,80),sn:str(e.sn,120),date:e.date,setting:str(e.setting,60),level:e.level,sup:str(e.sup,4).toUpperCase().replace(/[^A-Z]/g,''),stds:stds.filter(function(n,i){return stds.indexOf(n)===i;}).sort(),note:str(e.note,1000),t:+e.t||Date.now()};
}
function cleanCustom(c){if(!c||!str(c.id,40)||!str(c.name,90)||!AREA[c.area])return null;return {id:str(c.id,40),name:str(c.name,90),area:c.area};}
function clean(d){
  var out=blank();if(!d||typeof d!=='object')return out;
  out.entries=(Array.isArray(d.entries)?d.entries:[]).map(cleanEntry).filter(Boolean);
  out.custom=(Array.isArray(d.custom)?d.custom:[]).map(cleanCustom).filter(Boolean);
  var p=d.profile||{};['name','sid','uni','course','placement','facilitator'].forEach(function(k){out.profile[k]=str(p[k],120);});
  ['start','end'].forEach(function(k){out.profile[k]=ISO.test(p[k])?p[k]:'';});
  var o=d.opts||{};out.opts={range:o.range!==false,refl:!!o.refl,gaps:!!o.gaps};
  return out;
}
var D=clean(O.get('log',null));
function save(){O.set('log',D);}

function skills(){
  var list=[];
  AREAS.forEach(function(a){
    a.skills.forEach(function(s){list.push({id:s[0],name:s[1],area:a.id});});
    D.custom.forEach(function(c){if(c.area===a.id)list.push({id:c.id,name:c.name,area:a.id,custom:true});});
  });
  return list;
}
function skillMap(){var m={};skills().forEach(function(s){m[s.id]=s;});return m;}
function skillName(e,map){var s=(map||skillMap())[e.skill];return s?s.name:(e.sn||'Skill no longer in your list');}

/* ---------- Dates ---------- */
function pad(n){return (n<10?'0':'')+n;}
function todayISO(){var d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function toDate(iso){var p=iso.split('-');return new Date(+p[0],+p[1]-1,+p[2]);}
function fmt(iso){return iso?toDate(iso).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}):'';}
function fmtNum(iso){if(!iso)return '';var p=iso.split('-');return p[2]+'/'+p[1]+'/'+p[0];}

/* ---------- Per-skill stats ---------- */
function stats(entries){
  var m={};
  (entries||D.entries).forEach(function(e){
    var s=m[e.skill]||(m[e.skill]={count:0,best:0,last:'',first:'',by:{}});
    s.count++;s.best=Math.max(s.best,LV[e.level].n);s.by[e.level]=(s.by[e.level]||0)+1;
    if(e.date>s.last)s.last=e.date;if(!s.first||e.date<s.first)s.first=e.date;
  });
  return m;
}
function pips(best){
  var lab=best?'Highest level: '+LEVELS[best-1].name:'Not logged yet';
  var n=el('span',{class:'lb-pips','data-best':String(best),role:'img','aria-label':lab,title:lab});
  for(var i=1;i<=4;i++)n.appendChild(el('i',{class:i<=best?'on':null}));
  return n;
}

/* ---------- Form ---------- */
var editing=null,warnedFor=null;
function fillSkillSelect(sel,first){
  var cur=sel.value;sel.textContent='';
  if(first)sel.appendChild(el('option',{value:'',text:first}));
  AREAS.forEach(function(a){
    var g=el('optgroup',{label:a.name});
    skills().forEach(function(s){if(s.area===a.id)g.appendChild(el('option',{value:s.id,text:s.custom?s.name+' (your skill)':s.name}));});
    sel.appendChild(g);
  });
  sel.value=cur;
}
function opts(sel,list,allText){sel.textContent='';if(allText)sel.appendChild(el('option',{value:'all',text:allText}));list.forEach(function(o){sel.appendChild(el('option',{value:o[0],text:o[1]}));});}
function initForm(){
  fillSkillSelect($('#lb-skill'),'Choose a skill\u2026');
  opts($('#lb-setting'),[['','Choose (optional)']].concat(SETTINGS.map(function(s){return [s,s];})));
  var lv=$('#lb-levels'),guide=$('#lb-guide');
  LEVELS.forEach(function(l){
    lv.appendChild(el('label',null,[el('input',{type:'radio',name:'lblevel',value:l.id}),el('span',null,[l.name,el('small',{text:l.desc})])]));
    guide.appendChild(el('dt',null,[pips(l.n),l.name]));guide.appendChild(el('dd',{text:l.desc}));
  });
  var st=$('#lb-stds');
  Object.keys(STD).forEach(function(k){st.appendChild(el('label',{title:'Standard '+k+': '+STD[k]},[el('input',{type:'checkbox',name:'lbstd',value:k}),'Std '+k+' \u00b7 '+STD_SHORT[k]]));});
  $('#lb-date').value=todayISO();$('#lb-date').max=todayISO();
  var last=O.get('last-setting','');if(last)$('#lb-setting').value=last;
  $('#lb-sup').addEventListener('input',function(){var f=this,v=f.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,4);if(v!==f.value)f.value=v;});
  $('#lb-note').addEventListener('input',function(){$('#lb-count').textContent=this.value.length+' / 1000';checkPrivacy();});
  $('#lb-save').addEventListener('click',saveEntry);
  $('#lb-cancel').addEventListener('click',resetForm);$('#lb-cancel2').addEventListener('click',resetForm);
}
function checkPrivacy(){
  var t=$('#lb-note').value,found=[];
  if(/\b\d{6,}\b/.test(t))found.push('a long number (like a record or Medicare number)');
  if(/\b(?:Mr|Mrs|Ms|Miss|Mx|Master)\.?\s+[A-Z]/.test(t))found.push('a title and name');
  if(/\b(?:dob|d\.o\.b|date of birth|urn|mrn|ur number|medicare)\b/i.test(t))found.push('an ID or date-of-birth reference');
  if(/\b(?:bed|room|bay)\s*\d+/i.test(t))found.push('a bed or room number');
  if(/\b\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}\b/.test(t))found.push('a full date (it could be a date of birth)');
  var w=$('#lb-warn');
  if(found.length){w.textContent='Check before you save: this looks like it might include '+found.join(', ')+'. Remove anything that could identify a patient.';w.hidden=false;}
  else{w.hidden=true;w.textContent='';}
  return found.length?t:null;
}
function saveEntry(){
  var st=$('#lb-status'),skill=$('#lb-skill').value,date=$('#lb-date').value,lvl=$('input[name=lblevel]:checked');
  if(!skill){O.status(st,'Choose a skill first.');$('#lb-skill').focus();return;}
  if(!ISO.test(date)){O.status(st,'Add the date you did it.');$('#lb-date').focus();return;}
  if(date>todayISO()){O.status(st,'The date can\u2019t be in the future.');$('#lb-date').focus();return;}
  if(!lvl){O.status(st,'Choose your level of involvement.');$('input[name=lblevel]').focus();return;}
  var flagged=checkPrivacy();
  if(flagged&&warnedFor!==flagged){warnedFor=flagged;O.status(st,'Check the privacy warning, then press Save again to keep it as it is.');return;}
  var map=skillMap();
  var e=cleanEntry({id:editing||O.uid(),skill:skill,sn:map[skill]?map[skill].name:'',date:date,setting:$('#lb-setting').value,level:lvl.value,sup:$('#lb-sup').value,
    stds:$$('input[name=lbstd]:checked').map(function(c){return +c.value;}),note:$('#lb-note').value.trim(),t:Date.now()});
  if(editing){var i=D.entries.findIndex(function(x){return x.id===editing;});if(i>-1){e.t=D.entries[i].t;D.entries[i]=e;}}else{D.entries.push(e);}
  O.set('last-setting',e.setting);save();
  var msg=editing?'Entry updated.':'Saved: '+map[skill].name.split(' (')[0]+', '+LV[e.level].name.toLowerCase()+'.';
  resetForm(true);renderAll();O.status(st,msg);
}
function resetForm(keep){
  editing=null;warnedFor=null;
  $('#lb-note').value='';$('#lb-count').textContent='0 / 1000';$('#lb-warn').hidden=true;
  $$('input[name=lbstd]').forEach(function(c){c.checked=false;});
  $$('input[name=lblevel]').forEach(function(c){c.checked=false;});
  if(keep!==true){$('#lb-date').value=todayISO();$('#lb-sup').value='';}
  $('#lb-skill').value='';
  $('#lb-save').textContent='Save entry';$('#lb-cancel').hidden=true;$('#lb-editing').hidden=true;
}
function editEntry(id){
  var e=D.entries.find(function(x){return x.id===id;});if(!e)return;
  editing=id;warnedFor=null;
  if(!skillMap()[e.skill]){O.status($('#lb-status'),'That skill is no longer in your list. Choose a skill to keep this entry.');}
  $('#lb-skill').value=e.skill;$('#lb-date').value=e.date;$('#lb-setting').value=e.setting;$('#lb-sup').value=e.sup;$('#lb-note').value=e.note;
  $('#lb-count').textContent=e.note.length+' / 1000';
  $$('input[name=lblevel]').forEach(function(c){c.checked=c.value===e.level;});
  $$('input[name=lbstd]').forEach(function(c){c.checked=e.stds.indexOf(+c.value)>-1;});
  checkPrivacy();
  $('#lb-save').textContent='Update entry';$('#lb-cancel').hidden=false;$('#lb-editing').hidden=false;
  goToForm();
}
function goToForm(){$('#lb-form').scrollIntoView({behavior:'smooth',block:'start'});setTimeout(function(){$('#lb-skill').focus({preventScroll:true});},350);}

/* ---------- Progress ---------- */
function initProgress(){
  opts($('#pg-area'),AREAS.map(function(a){return [a.id,a.name];}),'All areas');
  opts($('#cs-area'),AREAS.map(function(a){return [a.id,a.name];}));$('#cs-area').value='ot';
  ['pg-q','pg-area','pg-status'].forEach(function(id){$('#'+id).addEventListener('input',renderProgress);});
  $('#lb-areas').addEventListener('click',function(e){
    var b=e.target.closest('[data-log]');if(b){resetForm();$('#lb-skill').value=b.getAttribute('data-log');goToForm();return;}
    var d=e.target.closest('[data-delskill]');if(d)deleteCustom(d.getAttribute('data-delskill'));
  });
  $('#lb-areas').addEventListener('toggle',function(e){var d=e.target;if(d.matches&&d.matches('details[data-area]'))openAreas[d.getAttribute('data-area')]=d.open;},true);
  $('#cs-add').addEventListener('click',addCustom);
  $('#cs-name').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();addCustom();}});
}
function addCustom(){
  var name=$('#cs-name').value.trim().replace(/\s+/g,' '),area=$('#cs-area').value,st=$('#cs-status');
  if(!name){O.status(st,'Type the skill name first.');return;}
  if(skills().some(function(s){return s.name.toLowerCase()===name.toLowerCase();})){O.status(st,'That skill is already in the list.');return;}
  var c={id:'c-'+O.uid(),name:name.slice(0,90),area:area};D.custom.push(c);save();
  $('#cs-name').value='';openAreas[area]=true;renderAll();O.status(st,'Added to '+AREA[area].name+'.');
}
function deleteCustom(id){
  var c=D.custom.find(function(x){return x.id===id;});if(!c)return;
  var n=D.entries.filter(function(e){return e.skill===id;}).length;
  if(!window.confirm('Remove "'+c.name+'" from your skills'+(n?' and delete its '+n+' '+(n===1?'entry':'entries'):'')+'?'))return;
  D.custom=D.custom.filter(function(x){return x.id!==id;});D.entries=D.entries.filter(function(e){return e.skill!==id;});save();renderAll();
}
function renderStats(s){
  var list=skills(),logged=0,sup=0,min=0;
  list.forEach(function(k){var x=s[k.id];if(!x)return;logged++;if(x.best>=3)sup++;if(x.best>=4)min++;});
  var box=$('#lb-stats');box.textContent='';
  [[logged,'of '+list.length+' skills logged'],[D.entries.length,D.entries.length===1?'entry':'entries'],[sup,'skills performed under supervision or better'],[min,'skills with minimal prompting']].forEach(function(r){
    box.appendChild(el('div',{class:'lb-stat'},[el('b',{text:String(r[0])}),el('span',{text:r[1]})]));
  });
}
var openAreas={},WIDE=window.matchMedia('(min-width:701px)');
function renderProgress(){
  var s=stats(),q=$('#pg-q').value.trim().toLowerCase(),area=$('#pg-area').value,show=$('#pg-status').value;
  renderStats(s);
  var root=$('#lb-areas');root.textContent='';var shown=0;
  AREAS.forEach(function(a){
    if(area!=='all'&&area!==a.id)return;
    var all=skills().filter(function(k){return k.area===a.id;});
    var rows=all.filter(function(k){
      var x=s[k.id],best=x?x.best:0;
      if(q&&(k.name+' '+a.name).toLowerCase().indexOf(q)<0)return false;
      if(show==='todo')return !best;if(show==='logged')return best>0;if(show==='below3')return best>0&&best<3;
      if(show==='3')return best>=3;if(show==='4')return best>=4;return true;
    });
    if(!rows.length)return;
    var done=all.filter(function(k){return s[k.id];}).length;
    var filtered=q||area!=='all'||show!=='all';
    var card=el('details',{class:'lb-area','data-area':a.id,open:filtered||(a.id in openAreas?openAreas[a.id]:WIDE.matches)},[el('summary',null,[el('h3',null,[a.name,el('small',{text:done+' of '+all.length+' logged'})])])]);
    if(a.note)card.appendChild(el('p',{text:a.note}));
    rows.forEach(function(k){
      var x=s[k.id];shown++;
      var meta=x?x.count+' '+(x.count===1?'entry':'entries')+' \u00b7 last '+fmt(x.last)+' \u00b7 '+LEVELS[x.best-1].name:'Not logged yet';
      var name=el('div',{class:'lb-sname'},[k.name]);
      if(k.custom){name.appendChild(el('span',{class:'lb-custom',text:'Your skill'}));name.appendChild(el('button',{type:'button',class:'lb-del','data-delskill':k.id,'aria-label':'Remove '+k.name,text:'Remove'}));}
      card.appendChild(el('div',{class:'lb-skill'+(x?'':' todo')},[name,el('div',{class:'lb-meta',text:meta}),pips(x?x.best:0),el('button',{type:'button',class:'st-btn ghost small','data-log':k.id,'aria-label':'Log '+k.name,text:'Log'})]));
    });
    root.appendChild(card);
  });
  $('#pg-count').textContent=shown?'Showing '+shown+' skill'+(shown===1?'':'s')+'.':'No skills match. Try a different search or filter.';
}

/* ---------- Entries ---------- */
var limit=30;
function initEntries(){
  opts($('#en-area'),AREAS.map(function(a){return [a.id,a.name];}),'All areas');
  opts($('#en-level'),LEVELS.map(function(l){return [l.id,l.name];}),'All levels');
  opts($('#en-setting'),SETTINGS.map(function(s){return [s,s];}),'All placement types');
  ['en-q','en-area','en-level','en-setting'].forEach(function(id){$('#'+id).addEventListener('input',function(){limit=30;renderEntries();});});
  $('#en-more').addEventListener('click',function(){limit+=30;renderEntries();});
  $('#lb-entries').addEventListener('click',function(e){
    var ed=e.target.closest('[data-edit]');if(ed){editEntry(ed.getAttribute('data-edit'));return;}
    var del=e.target.closest('[data-del]');if(del&&window.confirm('Delete this entry? This can\u2019t be undone.')){var id=del.getAttribute('data-del');D.entries=D.entries.filter(function(x){return x.id!==id;});if(editing===id)resetForm();save();renderAll();}
  });
}
function sorted(list){return list.slice().sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:b.t-a.t;});}
function renderEntries(){
  var map=skillMap(),q=$('#en-q').value.trim().toLowerCase(),area=$('#en-area').value,lv=$('#en-level').value,setg=$('#en-setting').value;
  var list=sorted(D.entries).filter(function(e){
    var s=map[e.skill];
    if(area!=='all'&&(!s||s.area!==area))return false;
    if(lv!=='all'&&e.level!==lv)return false;
    if(setg!=='all'&&e.setting!==setg)return false;
    if(q&&[skillName(e,map),s?AREA[s.area].name:'',e.note,e.sup,e.setting,LV[e.level].name].join(' ').toLowerCase().indexOf(q)<0)return false;
    return true;
  });
  var ul=$('#lb-entries');ul.textContent='';
  list.slice(0,limit).forEach(function(e){
    var meta=[fmt(e.date)];if(e.setting)meta.push(e.setting);if(e.sup)meta.push('Supervisor '+e.sup);if(e.stds.length)meta.push('NMBA standard'+(e.stds.length>1?'s ':' ')+e.stds.join(', '));
    ul.appendChild(el('li',{class:'lb-entry','data-l':String(LV[e.level].n)},[
      el('h3',null,[skillName(e,map),' ',el('span',{class:'st-tag'+(e.level==='min'?' gold':''),text:LV[e.level].name})]),
      el('p',{class:'lb-emeta',text:meta.join(' \u00b7 ')}),
      e.note?el('p',{class:'lb-enote',text:e.note}):null,
      el('div',{class:'st-actions'},[el('button',{type:'button',class:'st-btn ghost small','data-edit':e.id,text:'Edit'}),el('button',{type:'button',class:'st-btn danger small','data-del':e.id,text:'Delete'})])
    ]));
  });
  var total=D.entries.length;
  $('#en-count').textContent=!total?'No entries yet. Log your first skill above.':(list.length===total?total+' entr'+(total===1?'y':'ies')+'.':'Showing '+list.length+' of '+total+' entries.');
  $('#en-more').hidden=list.length<=limit;
}

/* ---------- Profile and export ---------- */
function initExport(){
  var f=$('#pf-form');
  $$('input[type=text],input[type=date]',f).forEach(function(i){i.value=D.profile[i.name]||'';});
  $$('input[type=checkbox]',f).forEach(function(c){c.checked=!!D.opts[c.name];});
  f.addEventListener('input',function(){
    $$('input[type=text],input[type=date]',f).forEach(function(i){D.profile[i.name]=i.value.trim().slice(0,120);});
    $$('input[type=checkbox]',f).forEach(function(c){D.opts[c.name]=c.checked;});
    save();renderSummary();if(document.body.classList.contains('lb-show-report'))renderReport();
  });
  $('#ex-print').addEventListener('click',function(){renderReport();window.print();});
  $('#ex-preview').addEventListener('click',function(){
    var on=document.body.classList.toggle('lb-show-report');this.setAttribute('aria-expanded',String(on));this.textContent=on?'Hide the preview':'Preview the summary';
    if(on){renderReport();$('#lb-report').scrollIntoView({behavior:'smooth',block:'start'});}
  });
  $('#ex-json').addEventListener('click',downloadJSON);
  $('#ex-csv').addEventListener('click',downloadCSV);
  $('#ex-restore').addEventListener('click',function(){$('#ex-file').click();});
  $('#ex-file').addEventListener('change',readBackup);
  window.addEventListener('beforeprint',renderReport);
}
function reportEntries(){
  var p=D.profile,useRange=D.opts.range&&p.start&&p.end;
  return D.entries.filter(function(e){return !useRange||(e.date>=p.start&&e.date<=p.end);});
}
function renderSummary(){
  var n=reportEntries().length,p=D.profile;
  $('#ex-summary').textContent=!D.entries.length?'Log some skills first. You can still print the summary to see how it looks.':
    'Your summary will include '+n+' of your '+D.entries.length+' entries'+(D.opts.range&&p.start&&p.end?' (between '+fmt(p.start)+' and '+fmt(p.end)+').':'.');
}
function stamp(){return todayISO();}
function download(name,type,text){
  var blob=new Blob([text],{type:type}),url=URL.createObjectURL(blob),a=el('a',{href:url,download:name});
  document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(url);a.remove();},500);
}
function downloadJSON(){
  download('oznursehub-skills-logbook-'+stamp()+'.json','application/json',JSON.stringify({app:'oznursehub-skills-logbook',version:1,exported:new Date().toISOString(),data:D},null,2));
  O.status($('#ex-status'),'Backup downloaded. Keep it somewhere private.');
}
function csvCell(v){v=String(v==null?'':v);if(/^[=+\-@]/.test(v))v="'"+v;return /[",\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}
function downloadCSV(){
  var map=skillMap(),rows=[['Date','Area','Skill','Level','Placement type','Supervisor initials','NMBA standards','Reflection']];
  sorted(D.entries).reverse().forEach(function(e){var s=map[e.skill];rows.push([fmtNum(e.date),s?AREA[s.area].name:'',skillName(e,map),LV[e.level].name,e.setting,e.sup,e.stds.join(' '),e.note]);});
  download('oznursehub-skills-logbook-'+stamp()+'.csv','text/csv;charset=utf-8','\ufeff'+rows.map(function(r){return r.map(csvCell).join(',');}).join('\r\n'));
  O.status($('#ex-status'),'Spreadsheet downloaded.');
}
function readBackup(){
  var file=this.files&&this.files[0],box=$('#ex-import'),input=this;if(!file)return;
  if(file.size>5e6){O.status($('#ex-status'),'That file is too big to be a logbook backup.');input.value='';return;}
  var r=new FileReader();
  r.onload=function(){
    var raw;try{raw=JSON.parse(r.result);}catch(e){raw=null;}
    var src=raw&&raw.app==='oznursehub-skills-logbook'?raw.data:raw;
    if(!src||!Array.isArray(src.entries)){O.status($('#ex-status'),'That doesn\u2019t look like an OzNurseHub logbook backup.');input.value='';return;}
    var inc=clean(src);
    box.textContent='';box.hidden=false;
    box.appendChild(el('p',{style:'margin:0 0 6px'},[el('strong',{text:'Backup found: '}),inc.entries.length+' entr'+(inc.entries.length===1?'y':'ies')+' and '+inc.custom.length+' custom skill'+(inc.custom.length===1?'':'s')+(raw.exported?', saved '+new Date(raw.exported).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}):'')+'.']));
    box.appendChild(el('div',{class:'st-actions',style:'margin-top:8px'},[
      el('button',{type:'button',class:'st-btn small',text:'Add to my logbook',onclick:function(){merge(inc);done('Backup added. Entries you already had weren\u2019t duplicated.');}}),
      el('button',{type:'button',class:'st-btn ghost small',text:'Replace my logbook',onclick:function(){if(window.confirm('Replace everything on this device with the backup? This can\u2019t be undone.')){D=inc;done('Logbook replaced with the backup.');}}}),
      el('button',{type:'button',class:'st-btn ghost small',text:'Cancel',onclick:function(){box.hidden=true;input.value='';}})
    ]));
    function done(msg){save();box.hidden=true;input.value='';initExportFields();renderAll();O.status($('#ex-status'),msg);}
  };
  r.readAsText(file);
}
function merge(inc){
  var ids={};D.entries.forEach(function(e){ids[e.id]=1;});inc.entries.forEach(function(e){if(!ids[e.id])D.entries.push(e);});
  var cids={};D.custom.forEach(function(c){cids[c.id]=1;});inc.custom.forEach(function(c){if(!cids[c.id])D.custom.push(c);});
  Object.keys(inc.profile).forEach(function(k){if(!D.profile[k]&&inc.profile[k])D.profile[k]=inc.profile[k];});
}
function initExportFields(){var f=$('#pf-form');$$('input[type=text],input[type=date]',f).forEach(function(i){i.value=D.profile[i.name]||'';});$$('input[type=checkbox]',f).forEach(function(c){c.checked=!!D.opts[c.name];});}

/* ---------- PDF report ---------- */
function renderReport(){
  var root=$('#lb-report'),p=D.profile,map=skillMap(),list=reportEntries(),s=stats(list),useRange=D.opts.range&&p.start&&p.end;
  root.textContent='';
  /* Cover */
  var cover=el('div',{class:'rp-cover'});
  cover.appendChild(el('p',{class:'rp-brand',text:'OzNurseHub \u00b7 oznursehub.com'}));
  cover.appendChild(el('h1',{class:'rp-title',text:'Clinical skills logbook'}));
  cover.appendChild(el('p',{class:'rp-sub',text:'A summary of skills practised on clinical placement, recorded by the student.'}));
  var rows=[['Student',p.name],['Student ID',p.sid,true],['University',p.uni],['Course and year',p.course],['Placement',p.placement],['Placement dates',p.start||p.end?(fmt(p.start)||'\u2013')+' to '+(fmt(p.end)||'\u2013'):''],['Facilitator',p.facilitator,true],
    ['Entries included',useRange?'Entries dated '+fmt(p.start)+' to '+fmt(p.end):'All entries in the logbook'],['Summary created',fmt(todayISO())]];
  var tb=el('tbody');rows.forEach(function(r){if(r[2]&&!r[1])return;tb.appendChild(el('tr',null,[el('th',{scope:'row',text:r[0]}),el('td',{text:r[1]||'\u00a0'})]));});
  cover.appendChild(el('table',{class:'rp-details'},[tb]));
  var logged=Object.keys(s).length,sup=0,min=0;Object.keys(s).forEach(function(k){if(s[k].best>=3)sup++;if(s[k].best>=4)min++;});
  cover.appendChild(el('div',{class:'rp-stats'},[[logged,'skills logged'],[list.length,list.length===1?'entry':'entries'],[sup,'performed under supervision or better'],[min,'with minimal prompting']].map(function(r){return el('div',null,[el('b',{text:String(r[0])}),r[1]]);})));
  cover.appendChild(el('h2',{class:'rp-h2',text:'Highest level reached, by area'}));
  var at=el('table',{class:'rp-grid'});
  at.appendChild(el('thead',null,[el('tr',null,[el('th',{scope:'col',text:'Area'}),el('th',{scope:'col',class:'n',text:'Logged'})].concat(LEVELS.map(function(l){return el('th',{scope:'col',class:'n',title:l.name,text:l.abbr});})))]));
  var atb=el('tbody'),tot=[0,0,0,0,0];
  AREAS.forEach(function(a){
    var ks=skills().filter(function(k){return k.area===a.id&&s[k.id];});if(!ks.length)return;
    var c=[0,0,0,0];ks.forEach(function(k){c[s[k.id].best-1]++;});tot[0]+=ks.length;c.forEach(function(v,i){tot[i+1]+=v;});
    atb.appendChild(el('tr',null,[el('td',{text:a.name}),el('td',{class:'n',text:String(ks.length)})].concat(c.map(function(v){return el('td',{class:'n',text:v?String(v):'\u2013'});}))));
  });
  if(!tot[0])atb.appendChild(el('tr',null,[el('td',{colspan:'6',class:'rp-empty',text:'No skills logged yet.'})]));
  else atb.appendChild(el('tr',null,[el('td',null,[el('strong',{text:'Total'})]),el('td',{class:'n',text:String(tot[0])})].concat(tot.slice(1).map(function(v){return el('td',{class:'n',text:String(v)});}))));
  at.appendChild(atb);cover.appendChild(at);
  cover.appendChild(el('p',{class:'rp-key',text:'Levels: '+LEVELS.map(function(l){return l.abbr+' = '+l.name.toLowerCase();}).join(' \u00b7 ')+'. Each skill is counted once, at the highest level logged.'}));
  cover.appendChild(el('p',{class:'rp-note',text:'This is the student\u2019s own learning record. It doesn\u2019t replace the university\u2019s official skills record or placement assessment. Skills were practised within the student\u2019s scope as set by their university, the facility and their supervising RN. Medicines were given under direct RN supervision. It contains no patient-identifying information, and supervisors are shown by initials only.'}));
  root.appendChild(cover);
  /* Skills table */
  root.appendChild(el('h2',{class:'rp-h2',style:'margin-top:0',text:'Skills logged'}));
  var t=el('table',{class:'rp-grid'});
  t.appendChild(el('thead',null,[el('tr',null,[el('th',{scope:'col',text:'Skill'}),el('th',{scope:'col',text:'Date \u00b7 level \u00b7 placement type \u00b7 supervisor initials \u00b7 NMBA standards'}),el('th',{scope:'col',text:'Highest level'})])]));
  var body=el('tbody'),any=false;
  var byskill={};list.forEach(function(e){(byskill[e.skill]=byskill[e.skill]||[]).push(e);});
  var areaRows=AREAS.map(function(a){return {a:a,ks:skills().filter(function(k){return k.area===a.id;})};});
  /* Entries for skills no longer in the list go under "Other" */
  var orphans=Object.keys(byskill).filter(function(id){return !map[id];});
  areaRows.forEach(function(ar){
    var ks=ar.ks.filter(function(k){return byskill[k.id]||D.opts.gaps;});
    if(ar.a.id==='ot')orphans.forEach(function(id){ks.push({id:id,name:byskill[id][0].sn||'Skill no longer in the list'});});
    if(!ks.length)return;
    body.appendChild(el('tr',{class:'rp-areahead'},[el('td',{colspan:'3',text:ar.a.name})]));
    ks.sort(function(x,y){return (byskill[x.id]?0:1)-(byskill[y.id]?0:1);});
    ks.forEach(function(k){
      var es=(byskill[k.id]||[]).slice().sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:a.t-b.t;});
      if(!es.length){body.appendChild(el('tr',null,[el('td',{class:'rp-sk',text:k.name+(k.custom?' (own skill)':'')}),el('td',{class:'rp-gap',text:'Not yet logged'}),el('td',{class:'rp-best',text:'\u2013'})]));return;}
      any=true;
      var cell=el('td');
      es.forEach(function(e){
        var bits=[fmtNum(e.date),LV[e.level].abbr,e.setting||'\u2013',e.sup||'\u2013'];if(e.stds.length)bits.push('Std '+e.stds.join(', '));
        cell.appendChild(el('span',{class:'rp-ent'},[bits.join(' \u00b7 '),D.opts.refl&&e.note?el('em',{text:e.note}):null]));
      });
      var best=s[k.id]?s[k.id].best:0;
      body.appendChild(el('tr',null,[el('td',{class:'rp-sk',text:k.name+(k.custom?' (own skill)':'')}),cell,el('td',{class:'rp-best',text:best?LEVELS[best-1].name:'\u2013'})]));
    });
  });
  if(!body.children.length)body.appendChild(el('tr',null,[el('td',{colspan:'3',class:'rp-empty',text:'No entries to show yet.'})]));
  t.appendChild(body);root.appendChild(t);
  root.appendChild(el('p',{class:'rp-key',text:'Levels: '+LEVELS.map(function(l){return l.abbr+' = '+l.name.toLowerCase();}).join(' \u00b7 ')+'. Supervisors are shown by initials only. Standards are the NMBA Registered nurse standards for practice (1 to 7).'}));
  /* Sign-off */
  function ln(t){return el('div',{class:'rp-ln'},[el('div'),el('span',{text:t})]);}
  root.appendChild(el('div',{class:'rp-sign'},[
    el('h3',{text:'Student declaration'}),
    el('p',{text:'I confirm this is an accurate record of my clinical skills practice and that it contains no patient-identifying information.'}),
    el('div',{class:'rp-lines'},[ln('Student signature'),ln('Date')]),
    el('h3',{style:'margin-top:6px',text:'Facilitator or supervising RN review'}),
    el('p',{text:'I have reviewed this logbook with the student.'}),
    el('div',{class:'rp-lines'},[ln('Name'),ln('Role'),ln('Signature'),ln('Date')]),
    el('div',{class:'rp-box',text:'Comments'})
  ]));
  root.appendChild(el('p',{class:'rp-foot',text:'Made with the OzNurseHub clinical skills logbook (oznursehub.com/clinical-skills-logbook.html). Learning support, not clinical direction.'}));
}

/* ---------- Boot ---------- */
function renderAll(){fillSkillSelect($('#lb-skill'),'Choose a skill\u2026');renderProgress();renderEntries();renderSummary();if(document.body.classList.contains('lb-show-report'))renderReport();}
initForm();initProgress();initEntries();initExport();renderAll();
window.OZLB={renderReport:renderReport,data:function(){return D;}};
})();
