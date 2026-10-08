/* OzNurseHub obs chart and escalation simulator (clinical-escalation.html).
   Example zones only, based on ADDS-style track-and-trigger charts and the bands on SA Health's
   public sample adult RDR chart (MR59A, 2020 revision). Nothing typed here is stored, apart from
   scenario scores and checklist ticks (localStorage via student-tools.js). No doses anywhere. */
(function(){'use strict';
var O=window.OZT,$=O.$,$$=O.$$,el=O.el;
var SVGNS='http://www.w3.org/2000/svg';
var RANK={w:0,y:1,r:2,p:3};
var ZNAME={w:'no trigger',y:'yellow',r:'red',p:'purple'};
var ZLETTER={w:'–',y:'Y',r:'R',p:'P'};
var ZFILL={w:'#ffffff',y:'#fff4b8',r:'#fbd5cf',p:'#e6dbf5'};
var DEV={RA:'room air',NP:'nasal prongs',FM:'a simple face mask',VM:'a Venturi mask',NRB:'a non-rebreather mask',HF:'high-flow nasal oxygen',OT:'other oxygen delivery'};
var LOC={0:'alert',1:'drowsy but rouses easily to voice',2:'rouses to voice but can\u2019t stay awake',3:'hard to rouse (responds only to touch or pain, or not at all)'};
function lc(t){return /^(SpO|RR|HR|BP)/.test(t)?t:t.charAt(0).toLowerCase()+t.slice(1);}
function maxZ(a,b){return RANK[b]>RANK[a]?b:a;}

/* Bands, top of chart to bottom. A value falls in the first band whose lo it reaches. */
var PARAMS=[
 {k:'rr',name:'Respiratory rate',chart:'Resp rate /min',unit:'breaths/min',short:'RR',round:0,min:0,max:80,bands:[['\u2265 36',36,'p'],['31\u201335',31,'p'],['26\u201330',26,'r'],['21\u201325',21,'y'],['16\u201320',16,'w'],['11\u201315',11,'w'],['8\u201310',8,'y'],['\u2264 7',-Infinity,'p']]},
 {k:'spo2',name:'SpO\u2082',chart:'SpO\u2082 %',unit:'%',short:'SpO\u2082',round:0,min:40,max:100,bands:[['\u2265 98',98,'w'],['95\u201397',95,'w'],['92\u201394',92,'y'],['89\u201391',89,'r'],['\u2264 88',-Infinity,'p']]},
 {k:'flow',name:'O\u2082 flow',chart:'O\u2082 flow L/min',unit:'L/min',short:'O\u2082',round:1,min:0,max:80,bands:[['> 8',8.01,'p'],['7\u20138',7,'r'],['5\u20136',5,'y'],['0\u20134',-Infinity,'w']]},
 {k:'sbp',name:'Systolic BP',chart:'BP (systolic)',unit:'mmHg',short:'BP',round:0,min:30,max:300,bands:[['\u2265 200',200,'p'],['190s',190,'r'],['180s',180,'r'],['170s',170,'y'],['150\u2013169',150,'w'],['130\u2013149',130,'w'],['110\u2013129',110,'w'],['100s',100,'w'],['90s',90,'r'],['80s',80,'p'],['\u2264 79',-Infinity,'p']]},
 {k:'hr',name:'Heart rate',chart:'Heart rate /min',unit:'beats/min',short:'HR',round:0,min:10,max:250,bands:[['\u2265 140',140,'p'],['130s',130,'r'],['120s',120,'r'],['110s',110,'y'],['100s',100,'y'],['80\u201399',80,'w'],['60\u201379',60,'w'],['50s',50,'y'],['40s',40,'r'],['\u2264 39',-Infinity,'p']]},
 {k:'temp',name:'Temperature',chart:'Temp \u00b0C',unit:'\u00b0C',short:'Temp',round:1,min:30,max:44,bands:[['\u2265 39.1',39.1,'r'],['38.6\u201339.0',38.6,'r'],['38.1\u201338.5',38.1,'y'],['37.1\u201338.0',37.1,'w'],['36.1\u201337.0',36.1,'w'],['35.6\u201336.0',35.6,'w'],['35.1\u201335.5',35.1,'y'],['\u2264 35.0',-Infinity,'r']]},
 {k:'loc',name:'Consciousness / sedation',chart:'Conscious level',unit:'',short:'LOC',round:0,min:0,max:3,bands:[['3 Hard to rouse',3,'p'],['2 Can\u2019t stay awake',2,'r'],['1 Drowsy, rousable',1,'w'],['0 Alert',-Infinity,'w']]},
 {k:'pain',name:'Pain at rest',chart:'Pain 0\u201310',unit:'0\u201310',short:'Pain',round:0,min:0,max:10,bands:[['8\u201310',8,'y'],['5\u20137',5,'w'],['0\u20134',-Infinity,'w']]}
];
var PBY={};PARAMS.forEach(function(p){PBY[p.k]=p;});
function band(p,v){for(var i=0;i<p.bands.length;i++){if(v>=p.bands[i][1])return {i:i,label:p.bands[i][0],z:p.bands[i][2]};}return null;}
function num(v,r){if(v===''||v==null)return null;var n=+v;if(!isFinite(n))return null;var f=Math.pow(10,r||0);return Math.round(n*f)/f;}

var EXTRA={
 airway:{z:'p',t:'Threatened airway or new noisy breathing'},arrest:{z:'p',t:'Not breathing or no pulse'},locdrop:{z:'p',t:'Sudden drop in level of consciousness'},
 seizure:{z:'p',t:'New, prolonged or repeated seizure'},bleed:{z:'p',t:'Significant bleeding'},chestpain:{z:'r',t:'Chest pain that isn\u2019t relieved'},
 novoid:{z:'r',t:'No urine passed for over 12 hours'},behaviour:{z:'y',t:'New or unexplained change in behaviour or confusion'},newpain:{z:'y',t:'New or unexpected pain'},
 rndelay:{z:'r',t:'RN review asked for over 30 minutes ago and not done'},mddelay:{z:'p',t:'Medical review asked for over 30 minutes ago and not done'}
};
var WSIGN={breathing:'breathing has changed',circulation:'circulation has changed',rigors:'shivering or rigors',mentation:'thinking has changed',agitation:'restless or agitated',pain:'pain that\u2019s new, worse or won\u2019t settle',trajectory:'not on the expected track',unwell:'says they feel unwell',look:'doesn\u2019t look right',family:'patient or family is worried'};

/* ---------- Evaluate one set ---------- */
function evaluate(o){
  var items=[],reasons=[],level='w',cnt={y:0,r:0,p:0},notes=[];
  PARAMS.forEach(function(p){
    var v=o[p.k];if(v==null)return;
    var b=band(p,v);if(!b)return;var z=b.z,note='';
    if(p.k==='spo2'&&o.target){
      if(v>=88&&v<=92){z='w';note='within the documented 88\u201392% target';}
      else if(v>92&&o.o2dev!=='RA'){z='r';note='above the documented 88\u201392% target while on oxygen';}
    }
    items.push({k:p.k,name:p.name,short:p.short,v:v,disp:display(p.k,o),z:z,band:b,note:note});
    if(z!=='w'){cnt[z]++;level=maxZ(level,z);reasons.push({z:z,t:display(p.k,o)+' is '+ZNAME[z]+(note?' ('+note+')':'')});}
    else if(note){notes.push('SpO\u2082 '+v+'% is '+note+'.');}
  });
  if(o.uo!=null&&o.uo<30){level=maxZ(level,'r');reasons.push({z:'r',t:'Urine output '+o.uo+' mL/hr is under 30 mL/hr over 4 hours'});}
  (o.x||[]).forEach(function(k){var e=EXTRA[k];if(!e)return;level=maxZ(level,e.z);reasons.push({z:e.z,t:e.t});});
  if(cnt.y>=3){level=maxZ(level,'r');reasons.push({z:'r',t:cnt.y+' observations are yellow: three or more yellows need a medical review'});}
  if(cnt.r>=3){level='p';reasons.push({z:'p',t:cnt.r+' observations are red: three or more reds need a rapid response call'});}
  var ws=(o.w||[]).filter(function(k){return WSIGN[k];});
  if(ws.length){level=maxZ(level,'y');reasons.push({z:'y',t:'Worry signs: '+ws.map(function(k){return WSIGN[k];}).join(', ')});}
  if(o.worry&&RANK[o.worry]){level=maxZ(level,o.worry);reasons.push({z:o.worry,t:{y:'You feel something\u2019s not right',r:'You\u2019re worried',p:'You\u2019re seriously worried'}[o.worry]});}
  var missing=['rr','spo2','sbp','hr','temp','loc'].filter(function(k){return o[k]==null;}).map(function(k){return PBY[k].short;});
  if(o.o2dev&&o.o2dev!=='RA')notes.push('They\u2019re on oxygen ('+DEV[o.o2dev]+'). A new or rising oxygen need is a warning sign even when the SpO\u2082 looks fine.');
  if(o.o2dev==='HF'||(o.flow!=null&&o.flow>15))notes.push('High flows sit in the purple band on many ward charts. Patients on them usually need a documented plan or a higher-care area.');
  return {level:level,items:items,reasons:reasons,cnt:cnt,missing:missing,notes:notes};
}
function display(k,o){
  if(k==='rr')return 'RR '+o.rr;
  if(k==='spo2')return 'SpO\u2082 '+o.spo2+'%'+(o.o2dev?(o.o2dev==='RA'?' on room air':' on '+(o.flow!=null?o.flow+' L/min ':'')+DEV[o.o2dev]):'');
  if(k==='flow')return o.o2dev==='RA'?'Room air':'O\u2082 '+o.flow+' L/min';
  if(k==='sbp')return 'BP '+o.sbp+(o.dbp!=null?'/'+o.dbp:'');
  if(k==='hr')return 'HR '+o.hr;
  if(k==='temp')return 'Temp '+o.temp.toFixed(1)+' \u00b0C';
  if(k==='loc')return 'Consciousness: '+LOC[o.loc];
  if(k==='pain')return 'Pain '+o.pain+'/10';
  return '';
}
function obsSentence(o){
  var a=[];
  if(o.rr!=null)a.push('RR '+o.rr);
  if(o.spo2!=null)a.push('SpO\u2082 '+o.spo2+'% '+(o.o2dev&&o.o2dev!=='RA'?'on '+(o.flow!=null?o.flow+' L/min via ':'')+DEV[o.o2dev]:'on room air'));
  if(o.hr!=null)a.push('HR '+o.hr);
  if(o.sbp!=null)a.push('BP '+o.sbp+(o.dbp!=null?'/'+o.dbp:''));
  if(o.temp!=null)a.push('temp '+o.temp.toFixed(1)+' \u00b0C');
  if(o.loc!=null)a.push(LOC[o.loc]);
  if(o.pain!=null)a.push('pain '+o.pain+'/10');
  if(o.uo!=null)a.push('urine output '+o.uo+' mL/hr');
  return a.join(', ');
}

/* ---------- Actions for each level ---------- */
var ACT={
 w:{title:'No trigger on this example chart',lead:'Keep going with observations as planned.',steps:['Compare with their usual obs and the last set. A set can be in range but heading the wrong way.','Keep watching anything that bothers you, and recheck sooner if you\u2019re unsure.','If you\u2019re worried, that is a trigger on its own. Say so.']},
 y:{title:'Yellow zone: RN review',lead:'Tell the RN in charge now. An RN reviews the patient within 30 minutes.',steps:['Increase how often you do obs.','Look for the cause and treat what you can: pain, anxiety, position, oxygen as ordered.','If the review hasn\u2019t happened in 30 minutes, or you\u2019re more worried, go up to a medical review.','Three or more yellow observations need a medical review.']},
 r:{title:'Red zone: medical review',lead:'Tell the RN in charge and call the patient\u2019s doctor. A doctor reviews them within 30 minutes.',steps:['Stay close and increase how often you do obs.','Get your ISBAR ready: what you\u2019re asking for, and by when.','If the review hasn\u2019t happened in 30 minutes, or they get worse, call a rapid response.','Three or more red observations need a rapid response call.']},
 p:{title:'Purple zone: call a rapid response (MET) now',lead:'Call your hospital\u2019s emergency number and say exactly where you are.',steps:['Stay with the patient and call for help. Start basic life support if needed: airway, breathing, circulation.','Tell the RN in charge and the treating team.','Check the resuscitation plan or goals of care. "Not for CPR" doesn\u2019t mean "not for a rapid response" unless the plan says so.','Get ready to hand over with ISBAR when the team arrives.']}
};
function zbadge(z,text){return el('span',{class:'ce-z '+z},[el('b',{'aria-hidden':'true',text:ZLETTER[z]}),text||(z==='w'?'No trigger':ZNAME[z][0].toUpperCase()+ZNAME[z].slice(1)+' zone')]);}
function renderResult(root,ev,opts){
  opts=opts||{};root.textContent='';root.className='ce-result '+ev.level;
  var a=ACT[ev.level];
  root.appendChild(el('p',{class:'overline',style:'margin:0 0 6px'},[opts.label||'Suggested response']));
  root.appendChild(zbadge(ev.level));
  root.appendChild(el('h3',{text:a.title}));
  var reasons=ev.reasons.slice().sort(function(x,y){return RANK[y.z]-RANK[x.z];});
  root.appendChild(el('p',{class:'ce-why',text:reasons.length?'Why: '+reasons.map(function(r){return lc(r.t);}).join('; ')+'.':'Why: every observation entered is in a no-trigger band, and nothing else has been flagged.'}));
  root.appendChild(el('p',{style:'margin:0 0 8px;font-weight:600',text:a.lead}));
  root.appendChild(el('ul',null,a.steps.map(function(s){return el('li',{text:s});})));
  if(!opts.brief){
    if(ev.items.length){
      root.appendChild(el('p',{class:'ce-sub',text:'Each observation',style:'margin:16px 0 6px'}));
      root.appendChild(el('ul',{class:'ce-list'},ev.items.map(function(it){return el('li',null,[el('span',{text:it.disp}),zbadge(it.z,it.z==='w'?'No trigger':ZNAME[it.z][0].toUpperCase()+ZNAME[it.z].slice(1))]);})));
      root.appendChild(el('p',{class:'ce-counts',text:'Yellow: '+ev.cnt.y+' \u00b7 Red: '+ev.cnt.r+' \u00b7 Purple: '+ev.cnt.p}));
    }
    if(ev.missing.length)root.appendChild(el('p',{class:'ce-note',text:'Incomplete set: no '+ev.missing.join(', ')+'. A full set is RR, SpO\u2082, BP, HR, temperature and consciousness.'}));
    ev.notes.forEach(function(n){root.appendChild(el('p',{class:'ce-note',text:n}));});
    root.appendChild(el('p',{class:'ce-student'},[el('strong',{text:'As a student: '}),'tell your supervising RN straight away, whatever the zone. Never sit on a set of obs that worries you. Check for documented modifications and the resuscitation plan.']));
  }
}

/* ---------- SVG chart ---------- */
function svg(tag,attrs,text){var n=document.createElementNS(SVGNS,tag);Object.keys(attrs||{}).forEach(function(k){n.setAttribute(k,attrs[k]);});if(text!=null)n.textContent=text;return n;}
function headVal(k,o){
  if(k==='flow')return o.o2dev==='RA'?'RA':(o.flow!=null?o.flow+(o.o2dev?' '+o.o2dev:''):'');
  if(k==='sbp')return o.sbp!=null?o.sbp+(o.dbp!=null?'/'+o.dbp:''):'';
  var v=o[k];if(v==null)return '';return k==='temp'?v.toFixed(1):String(v);
}
function drawChart(root,sets,opts){
  opts=opts||{};root.textContent='';
  var LW=112,KW=16,CW=sets.length>5?50:56,RH=13,HH=17,TH=24,cols=Math.max(sets.length,1);
  var W=LW+KW+cols*CW+2;
  var rows=0;PARAMS.forEach(function(p){rows+=p.bands.length;});
  var H=TH+PARAMS.length*HH+rows*RH+2;
  var s=svg('svg',{width:W,height:H,viewBox:'0 0 '+W+' '+H,role:'img','aria-labelledby':(opts.id||'c')+'-t '+(opts.id||'c')+'-d',style:'font-family:DM Sans,Arial,sans-serif'});
  s.appendChild(svg('title',{id:(opts.id||'c')+'-t'},'Example observation chart'));
  var desc=sets.map(function(o,i){var ev=evaluate(o);return (o.time||'Set '+(i+1))+': '+ev.items.map(function(it){return it.disp+' ('+ZNAME[it.z]+')';}).join(', ');}).join('. ');
  s.appendChild(svg('desc',{id:(opts.id||'c')+'-d'},desc||'No observations yet.'));
  var defs=svg('defs');var pat=svg('pattern',{id:(opts.id||'c')+'-hatch',width:6,height:6,patternUnits:'userSpaceOnUse',patternTransform:'rotate(45)'});pat.appendChild(svg('rect',{width:6,height:6,fill:ZFILL.p}));pat.appendChild(svg('line',{x1:0,y1:0,x2:0,y2:6,stroke:'#c7b1e6','stroke-width':2}));defs.appendChild(pat);s.appendChild(defs);
  /* time header */
  s.appendChild(svg('rect',{x:0,y:0,width:W,height:TH,fill:'#155e53'}));
  s.appendChild(svg('text',{x:6,y:16,fill:'#fff','font-size':11,'font-weight':700},'Time'));
  sets.forEach(function(o,i){s.appendChild(svg('text',{x:LW+KW+i*CW+CW/2,y:16,fill:'#fff','font-size':11,'text-anchor':'middle','font-weight':600},o.time||('Set '+(i+1))));});
  var y=TH;
  PARAMS.forEach(function(p){
    s.appendChild(svg('rect',{x:0,y:y,width:W,height:HH,fill:'#eaf2ec'}));
    s.appendChild(svg('text',{x:6,y:y+12,fill:'#155e53','font-size':10.5,'font-weight':700},p.chart));
    sets.forEach(function(o,i){var hv=headVal(p.k,o);if(hv)s.appendChild(svg('text',{x:LW+KW+i*CW+CW/2,y:y+12,fill:'#193c35','font-size':10.5,'text-anchor':'middle','font-weight':700},hv));});
    y+=HH;var top=y,pts=[];
    p.bands.forEach(function(b,bi){
      var fill=b[2]==='p'?'url(#'+(opts.id||'c')+'-hatch)':ZFILL[b[2]];
      s.appendChild(svg('rect',{x:0,y:y,width:W,height:RH,fill:fill,stroke:'#d5ddd6','stroke-width':.5}));
      s.appendChild(svg('text',{x:LW-4,y:y+10,'font-size':9.5,'text-anchor':'end',fill:'#33433d'},b[0]));
      if(b[2]!=='w')s.appendChild(svg('text',{x:LW+KW/2,y:y+10,'font-size':9,'text-anchor':'middle','font-weight':700,fill:b[2]==='y'?'#6b5a00':b[2]==='r'?'#8e2d20':'#4b2c78'},ZLETTER[b[2]]));
      y+=RH;
    });
    s.appendChild(svg('line',{x1:LW+KW,y1:top,x2:LW+KW,y2:y,stroke:'#9fb0a6','stroke-width':.8}));
    sets.forEach(function(o,i){
      var v=p.k==='flow'?(o.o2dev==='RA'?0:o.flow):o[p.k];if(v==null)return;var b=band(p,v);if(!b)return;
      pts.push([LW+KW+i*CW+CW/2,top+b.i*RH+RH/2]);
    });
    if(pts.length>1)s.appendChild(svg('polyline',{points:pts.map(function(q){return q.join(',');}).join(' '),fill:'none',stroke:'#193c35','stroke-width':1.4}));
    pts.forEach(function(q){s.appendChild(svg('circle',{cx:q[0],cy:q[1],r:3.8,fill:'#193c35'}));});
  });
  for(var c=1;c<cols;c++)s.appendChild(svg('line',{x1:LW+KW+c*CW,y1:TH,x2:LW+KW+c*CW,y2:H,stroke:'#c3cec6','stroke-width':.6,'stroke-dasharray':'2 2'}));
  s.appendChild(svg('rect',{x:.5,y:.5,width:W-1,height:H-1,fill:'none',stroke:'#9fb0a6'}));
  root.appendChild(s);
}

/* ---------- Tool 1: obs form ---------- */
var form=$('#obs-form'),chartSets=[],lastObs=null,lastEval=null;
function readForm(){
  var f=form.elements,o={},err=[];
  ['rr','spo2','sbp','dbp','hr','temp','pain','uo','flow','loc'].forEach(function(k){
    var p=PBY[k],r=p?p.round:0;if(k==='uo'||k==='dbp')r=0;
    var v=num(f[k].value,r);if(v==null)return;
    var lo=+f[k].min,hi=+f[k].max;
    if(f[k].disabled)return;
    if(v<lo||v>hi){err.push((p?p.short:(k==='uo'?'Urine output':'Diastolic BP'))+' of '+f[k].value+' looks like a typo');return;}
    o[k]=v;
  });
  o.o2dev=f.o2dev.value;if(o.o2dev==='RA')o.flow=null;
  if(o.o2dev!=='RA'&&o.flow==null)err.push('Add the oxygen flow rate');
  o.time=f.time.value||'';
  o.x=$$('input[name=x]:checked',form).map(function(c){return c.value;});
  o.w=$$('input[name=w]:checked',form).map(function(c){return c.value;});
  o.worry=(($('input[name=worry]:checked',form)||{}).value)||'';
  o.target=f.target.checked;
  return {o:o,err:err};
}
function hasAny(o){return ['rr','spo2','sbp','hr','temp','loc','pain','uo'].some(function(k){return o[k]!=null;})||o.x.length||o.w.length||o.worry;}
function syncFlow(){var f=form.elements;f.flow.disabled=f.o2dev.value==='RA';if(f.o2dev.value==='RA')f.flow.value='';}
form.elements.o2dev.addEventListener('change',syncFlow);
function showObs(r){
  $('#obs-err').textContent=r.err.join('. ')+(r.err.length?'.':'');
  if(!hasAny(r.o)){if(!r.err.length)$('#obs-err').textContent='Enter at least one observation first.';return false;}
  lastObs=r.o;lastEval=evaluate(r.o);
  $('#obs-out').hidden=false;
  renderResult($('#obs-result'),lastEval);
  var sets=chartSets.slice();var added=chartSets.length&&chartSets[chartSets.length-1]._src===JSON.stringify(r.o);
  if(!added){var cur=JSON.parse(JSON.stringify(r.o));if(!cur.time)cur.time='Now';sets.push(cur);}
  drawChart($('#obs-chart'),sets.slice(-8),{id:'oc'});
  $('#obs-chart-n').textContent=chartSets.length?chartSets.length+' set'+(chartSets.length>1?'s':'')+' on the chart'+(added?'.':', plus this one (not added yet).'):'Use "Add this set to the chart" to track a trend.';
  return true;
}
form.addEventListener('submit',function(e){e.preventDefault();if(showObs(readForm()))$('#obs-result').focus();});
$('#obs-add').addEventListener('click',function(){
  var r=readForm();if(!hasAny(r.o)){$('#obs-err').textContent='Enter at least one observation first.';return;}
  var o=JSON.parse(JSON.stringify(r.o));o._src=JSON.stringify(r.o);if(!o.time)o.time='Set '+(chartSets.length+1);
  chartSets.push(o);if(chartSets.length>8)chartSets.shift();
  showObs(r);O.status($('#obs-status'),'Added. Change the values for your next set, then add it too.');
});
function fillForm(o){
  form.reset();var f=form.elements;
  ['rr','spo2','sbp','dbp','hr','temp','pain','uo','loc','time'].forEach(function(k){if(o[k]!=null)f[k].value=o[k];});
  f.o2dev.value=o.o2dev||'RA';syncFlow();if(o.flow!=null)f.flow.value=o.flow;
  $$('input[name=x]',form).forEach(function(c){c.checked=(o.x||[]).indexOf(c.value)>-1;});
  $$('input[name=w]',form).forEach(function(c){c.checked=(o.w||[]).indexOf(c.value)>-1;});
  $$('input[name=worry]',form).forEach(function(c){c.checked=c.value===(o.worry||'');});
  f.target.checked=!!o.target;
}
$('#obs-example').addEventListener('click',function(){
  var c=CASES[0];chartSets=c.steps.slice(0,2).map(function(st){var o=stepObs(st);o._src='ex';return o;});
  fillForm(stepObs(c.steps[2]));showObs(readForm());
  O.status($('#obs-status'),'Loaded Dorothy (fictional): two earlier sets on the chart, and the latest set in the form.');
});
$('#obs-clear').addEventListener('click',function(){form.reset();syncFlow();$('#obs-err').textContent='';});
$('#obs-reset-chart').addEventListener('click',function(){chartSets=[];var r=readForm();if(hasAny(r.o))showObs(r);else $('#obs-out').hidden=true;});
$('#obs-print').addEventListener('click',function(){O.printSection($('#chart'),{className:'print-obs'});});
$('#obs-to-isbar').addEventListener('click',function(){fillIsbarFromObs();});

/* ---------- Tool 2: scenarios ---------- */
function stepObs(st){var o=JSON.parse(JSON.stringify(st.o));o.time=st.time;o.x=st.x||[];o.w=st.w||[];o.worry=st.worry||'';o.target=!!st.target;if(!o.o2dev)o.o2dev='RA';return o;}
var OPTS=[{id:'routine',t:'Carry on with routine obs as planned'},{id:'rn',t:'Tell the RN in charge now, increase obs and get an RN review'},{id:'med',t:'Tell the RN in charge and get a medical review within 30 minutes'},{id:'met',t:'Call a rapid response (MET) now'}];
var ORANK={routine:0,rn:1,med:2,met:3},LV2OPT={w:'routine',y:'rn',r:'med',p:'met'};
var CASES=[
{id:'dorothy',name:'Dorothy, 85',ward:'Medical ward',hook:'Day 5 after a fall. Short of breath and sore when she breathes in.',
 bg:{adm:'Day 5 of her admission after a fall at home, with a sore right leg (no fracture found).',hx:'Heart failure (on a 1.5 L fluid restriction), atrial fibrillation (her anticoagulant has been withheld since the fall), dementia.',base:'Usually SpO\u2082 95\u201397% on room air. BP usually around 100\u2013110 systolic. Pleasantly confused: knows who and where she is, but not the year.',plan:'Allergic to codeine (rash, nausea). Resuscitation plan: not for CPR or intubation, but for ICU review if the cause is reversible. Contact precautions for a resistant organism. Her daughter is her substitute decision-maker and is on her mobile.'},
 steps:[
  {time:'08:00',o:{rr:18,spo2:96,o2dev:'RA',sbp:108,dbp:62,hr:84,temp:36.8,loc:0,pain:3},seen:'Sitting out for breakfast and chatting with the physio about walking to the bathroom. Her right leg is still sore when she walks.',answer:'routine',why:'Every observation is in a no-trigger band and matches her baseline. Keep doing obs as planned. A good baseline set makes the next change easier to spot.'},
  {time:'11:30',o:{rr:24,spo2:93,o2dev:'RA',sbp:104,dbp:60,hr:104,temp:37.6,loc:0,pain:6},x:['newpain'],w:['breathing','family'],seen:'She says it hurts on the right side of her chest when she breathes in. She looks anxious and is a bit breathless talking. Her daughter rang earlier: "Mum didn\u2019t sound herself."',answer:'med',why:'Three observations are yellow (RR 24, SpO\u2082 93%, HR 104), and three or more yellows means a medical review, not just an RN review. New chest pain on breathing in, after a fall, with her anticoagulant on hold, raises the possibility of a clot in the lung. Her daughter\u2019s worry counts too.'},
  {time:'11:50',o:{rr:30,spo2:85,o2dev:'RA',sbp:100,dbp:58,hr:110,temp:38.1,loc:0,pain:7},x:['newpain'],w:['breathing','agitation','circulation'],seen:'Now speaking in short phrases and using her shoulders to breathe. The doctor was paged 20 minutes ago and hasn\u2019t arrived. You sit her up and start oxygen per your ward\u2019s protocol. Her SpO\u2082 comes up to 94% on 4 L/min via nasal prongs.',answer:'met',why:'SpO\u2082 85% on room air is purple, so this is a rapid response call now, even though oxygen has brought it up. Don\u2019t wait for the paged doctor. "Not for CPR" doesn\u2019t mean "not for a MET": her plan says she\u2019s for ICU review if the cause is reversible.'}],
 debrief:['Her RR went 18, 24, 30 in under four hours. The trend told the story before the purple value did.','Three yellows add up to a medical review.','A resuscitation plan limits some treatments, not the response. Read what it actually says.','Next, hand over to the MET team. Try it in Tool 4 with "Load the Dorothy example".'],
 isbar:{me:'Sam, RN',ward:'the medical ward, bed 8',who:'the medical registrar',pt:'Dorothy, 85',sit:'I\u2019ve called a rapid response for Dorothy. In the last 20 minutes her breathing has got much worse and her SpO\u2082 dropped to 85% on room air. She has new right-sided chest pain when she breathes in.',worried:true,obs:'RR 30 (18 at 08:00), SpO\u2082 85% on room air, now 94% on 4 L/min via nasal prongs. HR 110 in AF. BP 100/58. Temp 38.1 \u00b0C. Alert and anxious.',see:'Speaking in short phrases, using her shoulders to breathe, pale. Right leg still sore.',done:'Sat her up, started oxygen, coached slow breathing. ECG done. BGL 6.9. IV cannula in her right forearm, working. Paracetamol given 30 minutes ago as charted.',think:'I\u2019m worried this could be a clot in her lung or a chest infection.',ask:'I\u2019m letting you know that I\u2019ve called a rapid response',when:'now'}},
{id:'peter',name:'Peter, 62',ward:'Surgical ward',hook:'Day 1 after bowel surgery. Quietly getting faster and paler.',
 bg:{adm:'Day 1 after an open bowel resection for cancer.',hx:'High blood pressure, type 2 diabetes.',base:'Usual BP around 135\u2013145 systolic. Independent and fully oriented.',plan:'No known allergies. For full active treatment. Wound drain, IV fluids and a urinary catheter in place.'},
 steps:[
  {time:'14:00',o:{rr:18,spo2:96,o2dev:'NP',flow:2,sbp:132,dbp:78,hr:92,temp:37.2,loc:0,pain:3,uo:45},seen:'Comfortable, pain well controlled. Drain has a small amount of old, dark fluid.',answer:'routine',why:'All in no-trigger bands. 2 L/min of oxygen sits in the lowest flow band. Note it as part of the picture, and keep doing obs as planned.'},
  {time:'16:00',o:{rr:22,spo2:95,o2dev:'NP',flow:2,sbp:118,dbp:70,hr:108,temp:37.3,loc:0,pain:4,uo:25},w:['circulation','trajectory','unwell'],seen:'The drain has filled with 150 mL of fresh, blood-stained fluid in two hours. He looks pale and says he feels "a bit off". Urine output has averaged 25 mL/hr over the last 4 hours.',answer:'med',why:'Two yellows (RR 22, HR 108) and urine output under 30 mL/hr for 4 hours, which is a red trigger. Add the fresh drain loss, his BP falling from 132 to 118, and the pallor, and bleeding is the worry. Medical review within 30 minutes, and tell the RN in charge. If the bleeding looks significant, that\u2019s a rapid response on its own.'},
  {time:'16:30',o:{rr:26,spo2:94,o2dev:'NP',flow:2,sbp:96,dbp:60,hr:124,temp:36.9,loc:1,pain:5,uo:10},x:['mddelay'],w:['circulation','mentation','trajectory'],seen:'Cool, clammy hands and more drain loss. Drowsy but rouses easily. The surgical doctor was paged 30 minutes ago and hasn\u2019t come.',answer:'met',why:'Three red observations (RR 26, HR 124, SBP 96) mean a rapid response. So does a medical review that hasn\u2019t happened within 30 minutes. Bleeding can look "fine" until it suddenly isn\u2019t: his heart rate climbed first, then his BP fell.'}],
 debrief:['A rising heart rate and falling urine output are often the first signs of bleeding. BP can hold up until late.','Use the 30-minute rule. A review that doesn\u2019t happen is a reason to go up a level.','Know your patient\u2019s usual BP. 118 is in range, but it was 132.'],
 isbar:{me:'Sam, RN',ward:'the surgical ward, bed 12',who:'the surgical registrar',pt:'Peter, 62',sit:'I\u2019ve called a rapid response for Peter, day 1 after a bowel resection. I think he\u2019s bleeding: his heart rate is 124, BP has dropped to 96 systolic and his drain is filling with fresh blood.',worried:true,obs:'HR 124 (92 at 14:00), BP 96/60 (132/78 at 14:00), RR 26, SpO\u2082 94% on 2 L/min nasal prongs, temp 36.9 \u00b0C. Drowsy but rousable. Urine output 10 mL/hr.',see:'Pale, cool and clammy. Drain has more fresh blood-stained loss since 16:00.',done:'Lay him flat, checked IV access is working, increased obs. Surgical doctor paged at 16:00.',think:'I\u2019m worried he\u2019s bleeding.',ask:'I\u2019m letting you know that I\u2019ve called a rapid response',when:'now'}},
{id:'mei',name:'Mei, 47',ward:'Medical ward',hook:'Admitted with a kidney infection. Shivering at 10 pm.',
 bg:{adm:'Admitted last night with a kidney infection (pyelonephritis).',hx:'Usually well. Recurrent urine infections.',base:'Independent, fully oriented. Usual BP around 120\u2013125 systolic.',plan:'No known allergies. For full active treatment.'},
 steps:[
  {time:'22:00',o:{rr:20,spo2:97,o2dev:'RA',sbp:124,dbp:76,hr:102,temp:38.3,loc:0,pain:5},w:['rigors'],seen:'She had a shaking chill about half an hour ago. Sore in her right flank.',answer:'rn',why:'HR 102 and temp 38.3 are yellow, and rigors are a worry sign. Get an RN review within 30 minutes and increase obs. Many hospitals have a sepsis pathway that also asks for a medical review for suspected infection with abnormal obs, so check yours.'},
  {time:'00:00',o:{rr:24,spo2:95,o2dev:'RA',sbp:102,dbp:64,hr:118,temp:38.9,loc:0,pain:5},w:['unwell','circulation'],seen:'Her BP has drifted from 124 to 102. She says she feels awful. She\u2019s hot and flushed and hasn\u2019t passed much urine.',answer:'med',why:'Temp 38.9 is red, and RR 24 and HR 118 are yellow. That\u2019s a medical review within 30 minutes. A falling BP with a rising heart rate and RR in someone with an infection points to sepsis.'},
  {time:'00:20',o:{rr:28,spo2:93,o2dev:'RA',sbp:86,dbp:50,hr:126,temp:38.9,loc:0,pain:5},x:['behaviour'],w:['mentation','circulation'],seen:'Now muddled about where she is, with mottled skin over her knees. The doctor is on the way but not here yet.',answer:'met',why:'SBP 86 is purple: call a rapid response now. New confusion, low BP and a rising RR are signs of sepsis with poor blood flow to the organs. This is time-critical.'}],
 debrief:['Rigors, a rising heart rate and a falling BP in someone with an infection should make you think sepsis.','New confusion is a sign of poor perfusion, not "just tired".','Know your local sepsis pathway. It may ask for a faster response than the chart alone.'],
 isbar:{me:'Sam, RN',ward:'the medical ward, bed 3',who:'the medical registrar',pt:'Mei, 47',sit:'I\u2019ve called a rapid response for Mei, admitted with pyelonephritis. Her BP has dropped to 86 systolic and she\u2019s newly confused. I\u2019m worried she\u2019s septic.',worried:true,obs:'BP 86/50 (124/76 at 22:00), HR 126, RR 28, SpO\u2082 93% on room air, temp 38.9 \u00b0C. Newly confused.',see:'Mottled knees, flushed, poor urine output.',done:'Increased obs, checked IV access. Medical review requested at 00:00.',think:'I think this could be sepsis.',ask:'I\u2019m letting you know that I\u2019ve called a rapid response',when:'now'}},
{id:'frank',name:'Frank, 81',ward:'Orthopaedic (surgical) ward',hook:'Day 2 after hip surgery. "This isn\u2019t him," says his wife.',
 bg:{adm:'Day 2 after surgery for a broken hip.',hx:'High blood pressure, mild kidney impairment. No known memory problems.',base:'Lives alone and manages independently. Fully oriented on admission.',plan:'No known allergies. For full active treatment.'},
 steps:[
  {time:'09:00',o:{rr:16,spo2:96,o2dev:'RA',sbp:136,dbp:78,hr:82,temp:36.9,loc:0,pain:4},seen:'Chatty and oriented. Did the crossword with his wife yesterday.',answer:'routine',why:'All in no-trigger bands, and he\u2019s himself. This is your baseline for cognition as well as for obs. Delirium is common after hip surgery, so knowing his usual self matters.'},
  {time:'15:00',o:{rr:18,spo2:95,o2dev:'RA',sbp:138,dbp:80,hr:96,temp:37.4,loc:0,pain:4},x:['behaviour'],w:['agitation','family'],seen:'He\u2019s trying to climb out of bed, picking at his cannula and says he\u2019s at the bus depot. His wife says, "This isn\u2019t him." He hasn\u2019t passed urine since his catheter came out this morning.',answer:'rn',why:'His obs are all in range, but new confusion is a yellow trigger on its own, and his wife\u2019s worry counts. This looks like delirium. It always needs a cause looked for: pain, a full bladder, constipation, infection, low oxygen, dehydration or medicines. Get an RN review, do your local delirium screen (such as the 4AT) and check his bladder. Some wards ask for a medical review for any new delirium, so check yours.'},
  {time:'21:00',o:{rr:10,spo2:93,o2dev:'RA',sbp:128,dbp:74,hr:84,temp:37.5,loc:2,pain:2},w:['mentation'],seen:'At 19:00 he was given charted pain relief and a medicine for agitation. Now he opens his eyes to your voice but drifts off within a few seconds.',answer:'med',why:'A sedation score of 2 is red, and RR 10 and SpO\u2082 93% are yellow: medical review within 30 minutes. Too much sedation usually shows as sleepiness before the breathing slows, so watch both. If he becomes hard to rouse, or his RR drops to 7 or below, call a rapid response.'}],
 debrief:['Normal numbers don\u2019t rule out deterioration. Behaviour change is a trigger.','Families know the person\u2019s baseline best. Listen to them.','Sedation scores matter, especially after medicines that cause drowsiness.'],
 isbar:{me:'Sam, RN',ward:'the orthopaedic ward, bed 5',who:'the orthopaedic resident',pt:'Frank, 81',sit:'I\u2019m calling about Frank, day 2 after a hip repair. He\u2019s very drowsy: he can\u2019t stay awake for more than a few seconds, and his RR is 10.',worried:true,obs:'RR 10, SpO\u2082 93% on room air, HR 84, BP 128/74, temp 37.5 \u00b0C. Sedation score 2.',see:'Opens his eyes to voice, then drifts off. New delirium this afternoon.',done:'Sat him up and increased obs. No further sedating medicines given. Charted pain relief and a medicine for agitation were given at 19:00.',think:'I think he may be oversedated, on top of a delirium.',ask:'Please come and review the patient and the medication chart',when:'within 30 minutes'}},
{id:'alan',name:'Alan, 58',ward:'Neurosurgical ward',hook:'Day 1 after brain surgery. A worse headache and a new mix-up.',
 bg:{adm:'Day 1 after a craniotomy to remove a benign brain tumour.',hx:'High blood pressure.',base:'GCS 15 after surgery, pupils equal and reactive, full strength in all limbs.',plan:'No known allergies. For full active treatment. Hourly neuro obs.'},
 steps:[
  {time:'02:00',o:{rr:16,spo2:97,o2dev:'RA',sbp:142,dbp:80,hr:72,temp:37,loc:0,pain:3},seen:'GCS 15, pupils equal and reacting. Moving all limbs with full strength.',answer:'routine',why:'Everything is in range and matches his post-op baseline. Keep doing hourly neuro obs.'},
  {time:'04:00',o:{rr:16,spo2:96,o2dev:'RA',sbp:158,dbp:84,hr:64,temp:37.1,loc:1,pain:7},x:['behaviour','newpain'],worry:'r',seen:'GCS is now 14: he\u2019s confused and thinks it\u2019s the afternoon. His headache is worse. Pupils still equal. You\u2019re worried.',answer:'med',why:'On the example chart, new confusion and worse pain are yellow. But after brain surgery any drop in GCS is a warning sign, and your worry lifts this to a medical review. Neurosurgical wards often have lower triggers for neuro changes. That\u2019s what modifications are for. Call the team that did the surgery.'},
  {time:'04:30',o:{rr:12,spo2:95,o2dev:'RA',sbp:176,dbp:88,hr:52,temp:37.1,loc:3},x:['locdrop'],w:['mentation'],seen:'GCS 10: he opens his eyes only to pain and his words are muddled. His right pupil is now bigger and slow to react.',answer:'met',why:'A sudden fall in consciousness and a new unequal pupil mean a rapid response now. A rising BP with a slowing heart rate can mean rising pressure inside the skull. It\u2019s a late, time-critical sign.'}],
 debrief:['In neuro patients, a change in GCS or pupils matters more than any single vital sign.','Your worry is a valid reason to escalate, even when the chart only says yellow.','A rising BP with a falling heart rate in a neuro patient is a late sign. Don\u2019t wait for it.'],
 isbar:{me:'Sam, RN',ward:'the neurosurgical ward, bed 2',who:'the neurosurgical registrar',pt:'Alan, 58',sit:'I\u2019ve called a rapid response for Alan, day 1 after a craniotomy. His GCS has dropped from 15 to 10 and his right pupil is now larger and sluggish.',worried:true,obs:'GCS 10 (15 at 02:00, 14 at 04:00). Right pupil larger and sluggish. BP 176/88, HR 52, RR 12, SpO\u2082 95% on room air, temp 37.1 \u00b0C.',see:'Opens his eyes only to pain, muddled speech. Worse headache since 04:00.',done:'Head of bed up, airway checked, increased neuro obs. Neurosurgical team called at 04:00.',think:'I\u2019m worried about a bleed or swelling after surgery.',ask:'I\u2019m letting you know that I\u2019ve called a rapid response',when:'now'}},
{id:'joan',name:'Joan, 72',ward:'Respiratory (medical) ward',hook:'A COPD flare, a documented SpO\u2082 target, and a visitor who meant well.',
 mod:'Modification, documented by her doctor and in date: target SpO\u2082 88\u201392%. Call for a medical review if her SpO\u2082 is above 92% while on oxygen.',
 bg:{adm:'Admitted yesterday with a flare of her COPD.',hx:'COPD, ex-smoker. Retains carbon dioxide.',base:'Usual SpO\u2082 88\u201392%. Fully oriented and chatty.',plan:'No known allergies. For full active treatment. Documented SpO\u2082 target 88\u201392%.'},
 steps:[
  {time:'10:00',o:{rr:22,spo2:90,o2dev:'NP',flow:1,sbp:134,dbp:76,hr:96,temp:37.2,loc:0},target:true,seen:'Chatting in full sentences. Using her inhalers as charted.',answer:'rn',why:'On the chart, SpO\u2082 90% sits in a red band. But her doctor has documented a target of 88\u201392%, so 90% is where it should be. Check the modification is current and signed. Her RR of 22 is still yellow, so tell the RN in charge and keep a close eye on her.'},
  {time:'14:00',o:{rr:10,spo2:97,o2dev:'NP',flow:4,sbp:142,dbp:80,hr:100,temp:37.2,loc:2},target:true,w:['mentation','breathing'],seen:'A visitor said she "looked puffed", so someone turned her oxygen up to 4 L/min. Now she\u2019s hard to keep awake, and her breathing is slow and shallow.',answer:'med',why:'A sedation score of 2 is red, and SpO\u2082 97% is above her target while on oxygen, which her modification says needs a medical review. RR 10 and HR 100 are yellow. Too much oxygen can make some people with COPD hold on to carbon dioxide, which makes them drowsy. Follow your oxygen policy and her prescribed target. If she becomes hard to rouse, or her RR falls to 7 or below, call a rapid response.'}],
 debrief:['Modifications change what\u2019s "normal" for one patient. Always check they\u2019re current and signed.','Higher SpO\u2082 isn\u2019t always better. Know the patient\u2019s target.','Drowsiness in someone with COPD on oxygen is a red flag.'],
 isbar:{me:'Sam, RN',ward:'the respiratory ward, bed 9',who:'the medical registrar',pt:'Joan, 72',sit:'I\u2019m calling about Joan, admitted with a COPD flare. She\u2019s become very drowsy and her breathing is slow since her oxygen was turned up to 4 L/min.',worried:true,obs:'RR 10 (22 at 10:00), SpO\u2082 97% on 4 L/min nasal prongs (target 88\u201392%), HR 100, BP 142/80, temp 37.2 \u00b0C. Sedation score 2.',see:'Hard to keep awake, slow shallow breathing.',done:'Sat her up, increased obs, told the RN in charge.',think:'I\u2019m worried she\u2019s retaining carbon dioxide.',ask:'Please come and review the patient',when:'within 30 minutes',spec:'a blood gas and a plan for her oxygen'}}
];
var scores=O.get('scores',{})||{};
function renderCases(){
  var list=$('#sc-list');list.textContent='';
  CASES.forEach(function(c,i){
    var sc=scores[c.id];
    var b=el('button',{class:'ce-case',type:'button',onclick:function(){startCase(i);}},[el('em',{text:c.ward}),el('strong',{text:c.name}),el('span',{text:c.hook}),el('span',{class:'ce-score',text:sc?'Your best: '+sc.best+' / '+c.steps.length*2:c.steps.length+' decisions'})]);
    list.appendChild(b);
  });
}
var play=$('#sc-play'),cur=null;
function startCase(i){cur={c:CASES[i],step:0,score:0};play.hidden=false;renderStep();play.scrollIntoView({behavior:'smooth',block:'start'});}
function renderStep(){
  var c=cur.c,st=c.steps[cur.step];play.textContent='';
  var panel=el('div',{class:'st-panel'});
  panel.appendChild(el('div',{class:'st-actions ce-noprint',style:'margin:0 0 12px;justify-content:space-between'},[el('span',{class:'st-tag gold',text:c.ward+' \u00b7 fictional'}),el('button',{class:'st-btn ghost small',type:'button',text:'\u2190 All scenarios',onclick:function(){play.hidden=true;cur=null;$('#scenarios').scrollIntoView({behavior:'smooth'});}})]));
  panel.appendChild(el('h3',{text:c.name}));
  {
    var bg=el('details',{class:'st-acc',open:cur.step===0?'':null},[el('summary',{text:'Background'}),el('ul',{class:'st-list'},[el('li',{text:c.bg.adm}),el('li',{text:'History: '+c.bg.hx}),el('li',{text:'Baseline: '+c.bg.base}),el('li',{text:c.bg.plan})])]);
    panel.appendChild(bg);
  }
  if(c.mod)panel.appendChild(el('p',{class:'ce-mod',text:c.mod}));
  var grid=el('div',{class:'ce-step'});
  var left=el('div');
  left.appendChild(el('p',{class:'ce-when',text:'Decision '+(cur.step+1)+' of '+c.steps.length+' \u00b7 '+st.time}));
  var o=stepObs(st);
  left.appendChild(el('p',{class:'ce-obsline'},obsSentence(o).split(', ').map(function(s){return el('span',{text:s});})));
  left.appendChild(el('p',{class:'ce-seen',text:st.seen}));
  left.appendChild(el('p',{style:'font-weight:600;margin:14px 0 0',id:'sc-q',text:'What do you do now?'}));
  var opts=el('div',{class:'ce-opts',role:'group','aria-labelledby':'sc-q'});
  OPTS.forEach(function(op,k){opts.appendChild(el('button',{class:'ce-opt',type:'button','data-id':op.id,onclick:function(){answer(op.id,opts,fb);}},[el('b',{'aria-hidden':'true',text:'ABCD'[k]}),el('span',{text:op.t})]));});
  left.appendChild(opts);
  var fb=el('div',{'aria-live':'polite'});left.appendChild(fb);
  var right=el('div');var cw=el('div',{class:'ce-chartwrap'});right.appendChild(cw);
  right.appendChild(el('p',{class:'ce-chartcap',text:'The chart so far. Each column is one set of obs.'}));
  drawChart(cw,c.steps.slice(0,cur.step+1).map(stepObs),{id:'sc'});
  grid.appendChild(left);grid.appendChild(right);panel.appendChild(grid);
  play.appendChild(panel);
}
function answer(id,opts,fb){
  var c=cur.c,st=c.steps[cur.step];
  $$('button',opts).forEach(function(b){b.disabled=true;if(b.getAttribute('data-id')===id)b.classList.add('chosen');if(b.getAttribute('data-id')===st.answer)b.classList.add('best');});
  var diff=ORANK[id]-ORANK[st.answer],pts=diff===0?2:diff===1?1:0;cur.score+=pts;
  var verdict=diff===0?'Spot on.':diff>0?'Safe, but more than this situation asks for.':'This under-escalates.';
  var extra=diff>0?'Calling too early is far better than calling too late, and if you\u2019re seriously worried you are always right to call. Here, though, the chart points to a smaller step.':diff<0?'The patient needs a faster or more senior response than this. Waiting is the risk.':'';
  var ev=evaluate(stepObs(st));
  var best=OPTS.filter(function(x){return x.id===st.answer;})[0].t;
  fb.textContent='';
  var box=el('div',{class:'ce-fb'},[el('h4',{text:verdict+' Best answer: '+best+'.'}),extra?el('p',{text:extra}):null,el('p',{text:st.why})]);
  var zl=el('p',{style:'font-size:13.5px;color:var(--muted)'},['On the example chart: ',zbadge(ev.level),' ',ev.reasons.length?ev.reasons.map(function(r){return lc(r.t);}).join('; ')+'.':'no triggers.']);
  box.appendChild(zl);
  var last=cur.step===c.steps.length-1;
  box.appendChild(el('div',{class:'st-actions'},[el('button',{class:'st-btn',type:'button',text:last?'See the debrief':'Next set of obs \u2192',onclick:function(){if(last)debrief();else{cur.step++;renderStep();play.scrollIntoView({behavior:'smooth',block:'start'});}}})]));
  fb.appendChild(box);
}
function debrief(){
  var c=cur.c,max=c.steps.length*2,prev=scores[c.id];
  scores[c.id]={best:Math.max(cur.score,prev?prev.best:0),last:cur.score,at:Date.now()};O.set('scores',scores);
  play.textContent='';
  var panel=el('div',{class:'st-panel'},[el('p',{class:'overline',text:'Debrief \u00b7 '+c.name}),el('h3',{text:'You scored '+cur.score+' out of '+max+'.'}),el('p',{class:'st-help',text:'2 points for the best answer, 1 for escalating one step more than needed, 0 for under-escalating.'}),
    el('ul',{class:'st-list',style:'margin-top:12px'},c.debrief.map(function(d){return el('li',{text:d});}))]);
  var cw=el('div',{class:'ce-chartwrap',style:'margin-top:16px;display:inline-block'});panel.appendChild(cw);drawChart(cw,c.steps.map(stepObs),{id:'db'});
  panel.appendChild(el('div',{class:'st-actions'},[el('button',{class:'st-btn',type:'button',text:'Practise this call in the ISBAR builder',onclick:function(){loadIsbar(c);$('#isbar').scrollIntoView({behavior:'smooth'});}}),el('button',{class:'st-btn ghost',type:'button',text:'Try it again',onclick:function(){startCase(CASES.indexOf(c));}}),el('button',{class:'st-btn ghost',type:'button',text:'All scenarios',onclick:function(){play.hidden=true;$('#scenarios').scrollIntoView({behavior:'smooth'});}})]));
  play.appendChild(panel);renderCases();
}
renderCases();

/* ---------- Tool 3: ISBAR ---------- */
var isf=$('#isbar-form');
function isv(n){var f=isf.elements[n];if(!f)return '';if(f.type==='checkbox')return f.checked;return (f.value||'').trim();}
function sentence(s){s=(s||'').trim();if(!s)return '';return /[.!?]$/.test(s)?s:s+'.';}
function readback(){
  var L=[];
  if(isv('their'))L.push('Just to confirm: you\u2019ll '+isv('their').replace(/[.]$/,'')+'.');
  if(isv('mine'))L.push('In the meantime I\u2019ll '+isv('mine').replace(/[.]$/,'')+'.');
  if(isv('cb'))L.push('I\u2019ll call you back if '+isv('cb').replace(/[.]$/,'')+'.');
  return L.join(' ');
}
function isbarText(){
  var L=[],x;
  x=[];if(isv('me'))x.push('This is '+isv('me')+(isv('ward')?' on '+isv('ward'):'')+'.');else if(isv('ward'))x.push('I\u2019m calling from '+isv('ward')+'.');
  if(isv('pt'))x.push('I\u2019m calling'+(isv('who')?' '+isv('who'):'')+' about '+isv('pt')+'.');
  if(x.length)L.push('I \u2014 Identify\n'+x.join(' '));
  x=[];if(isv('sit'))x.push(sentence(isv('sit')));if(isv('worried'))x.push('I am worried about this patient.');
  if(x.length)L.push('S \u2014 Situation\n'+x.join(' '));
  x=[];if(isv('adm'))x.push(sentence(isv('adm')));if(isv('hx'))x.push('History: '+sentence(isv('hx')));if(isv('base'))x.push('Baseline: '+sentence(isv('base')));if(isv('plan'))x.push(sentence(isv('plan')));
  if(x.length)L.push('B \u2014 Background\n'+x.join(' '));
  x=[];if(isv('obs'))x.push('Obs: '+sentence(isv('obs')));if(isv('see'))x.push('I can see: '+sentence(isv('see')));if(isv('done'))x.push('So far I\u2019ve: '+sentence(isv('done')));if(isv('think'))x.push(sentence(isv('think')));
  if(x.length)L.push('A \u2014 Assessment\n'+x.join(' '));
  x=[];if(isv('ask'))x.push(isv('ask')+(isv('when')?' '+isv('when'):'')+'.');else if(isv('when'))x.push('I need this '+isv('when')+'.');
  if(isv('spec'))x.push('I\u2019d also like '+sentence(isv('spec')));
  if(isv('meantime')&&(x.length||L.length))x.push('What would you like me to do in the meantime?');
  if(isv('callback')&&(x.length||L.length))x.push('What should I call you back for?');
  if(x.length)L.push('R \u2014 Recommendation\n'+x.join(' '));
  var rb=readback();if(rb)L.push('Read-back\n'+rb);
  if(L.length)L.push('Then document: the time, who you spoke to, what you reported and the plan.');
  return L.join('\n\n');
}
function updIsbar(){$('#is-preview').textContent=isbarText();var rb=readback();$('#is-readback').textContent=rb||'Your read-back appears here.';}
isf.addEventListener('input',updIsbar);isf.addEventListener('change',updIsbar);
function setIs(d){Object.keys(d).forEach(function(k){var f=isf.elements[k];if(!f)return;if(f.type==='checkbox')f.checked=!!d[k];else f.value=d[k];});updIsbar();}
function loadIsbar(c){isf.reset();var d={};Object.keys(c.bg).forEach(function(k){d[k]=c.bg[k];});Object.keys(c.isbar).forEach(function(k){d[k]=c.isbar[k];});setIs(d);O.status($('#is-status'),'Loaded '+c.name+' (fictional). Edit anything you like.');}
function fillIsbarFromObs(){
  var r=readForm();if(!hasAny(r.o)){O.status($('#is-status'),'Enter some obs in Tool 1 first.');return;}
  var ev=evaluate(r.o);var d={obs:sentence(obsSentence(r.o))+(ev.level!=='w'?' On our chart that\u2019s the '+ZNAME[ev.level]+' zone: '+ev.reasons.slice().sort(function(x,y){return RANK[y.z]-RANK[x.z];}).map(function(x){return lc(x.t);}).join('; ')+'.':'')};
  if(!isv('sit'))d.sit={w:'',y:'Their obs have changed and they\u2019ve triggered an RN review on our chart.',r:'They\u2019ve triggered a medical review on our chart.',p:'I\u2019ve called a rapid response.'}[ev.level];
  if(!isv('who'))d.who=ev.level==='y'?'the RN in charge':'the treating doctor';
  if(!isv('ask'))d.ask={w:'',y:'I\u2019d like advice on what to do now',r:'Please come and review the patient',p:'I\u2019m letting you know that I\u2019ve called a rapid response'}[ev.level];
  if(!isv('when'))d.when={w:'',y:'within 30 minutes',r:'within 30 minutes',p:'now'}[ev.level];
  if(r.o.worry||r.o.w.length)d.worried=true;
  setIs(d);O.status($('#is-status'),'Added your obs from Tool 1.');
}
$('#is-fill').addEventListener('click',fillIsbarFromObs);
$('#is-example').addEventListener('click',function(){loadIsbar(CASES[0]);});
$('#is-clear').addEventListener('click',function(){if(confirm('Clear this ISBAR?')){isf.reset();updIsbar();}});
$('#is-copy').addEventListener('click',function(){var t=isbarText();if(!t){O.status($('#is-status'),'Nothing to copy yet.');return;}O.copy(t,$('#is-status'));});
$('#is-print').addEventListener('click',function(){O.printSection($('#isbar'),{className:'print-isbar'});});
updIsbar();

/* ---------- Tool 4: MET handover ---------- */
var mp=$('#met-panel'),TT={medical:'Medical ward',surgical:'Surgical ward',neuro:'Neuro ward'};
function setType(t){mp.setAttribute('data-met',t);$('#met-title-print').textContent=TT[t];}
$$('input[name=mettype]').forEach(function(r){r.addEventListener('change',function(){if(r.checked)setType(r.value);});});
var MEX={mi:'Sam, RN caring for Dorothy, 85.',ms:'Called for a rapid rise in RR and a drop in SpO\u2082, with new right-sided chest pain on breathing. Day 5 after admission with a fall and a sore right leg.',mb:'Heart failure (1.5 L fluid restriction), AF (anticoagulant withheld since the fall), dementia: oriented to person and place, not the year. Allergic to codeine (rash, nausea). Not for CPR or intubation; for ICU review if reversible. Contact precautions.',ma:'RR 30, SpO\u2082 85% on room air, now 94% on 4 L/min via nasal prongs. HR 110 (AF), BP 100/58, temp 38.1 \u00b0C. Usually SpO\u2082 95\u201397% on room air, BP around 100\u2013110 systolic. ECG done, BGL 6.9. IV cannula right forearm, working. Sat up, oxygen started, slow breathing coached. Paracetamol 30 minutes ago as charted.',mr:'Treating team: general medicine. Paged 20 minutes ago, not yet reviewed. Daughter is her substitute decision-maker, on her mobile. I need a review now and a plan for her breathing.'};
function metText(){var t=mp.getAttribute('data-met');var L=[TT[t]+' MET handover (ISBAR)'];[['mi','I'],['ms','S'],['mb','B'],['ma','A'],['mr','R']].forEach(function(x){var v=($('[name='+x[0]+']',mp).value||'').trim();if(v)L.push(x[1]+': '+v);});return L.join('\n');}
$('#met-example').addEventListener('click',function(){$$('input[name=mettype]').forEach(function(r){r.checked=r.value==='medical';});setType('medical');Object.keys(MEX).forEach(function(k){$('[name='+k+']',mp).value=MEX[k];});O.status($('#met-status'),'Loaded Dorothy (fictional).');});
$('#met-clear').addEventListener('click',function(){$$('textarea',mp).forEach(function(t){t.value='';});});
$('#met-copy').addEventListener('click',function(){O.copy(metText(),$('#met-status'));});
$('#met-print').addEventListener('click',function(){O.printSection($('#met'));});
$('#met-blank').addEventListener('click',function(){O.printSection($('#met'),{className:'met-blank'});});
var prep=O.checklist($('#prep-list'),'metprep',[
 {title:'Get the information ready',items:[{id:'p1',text:'Notes, latest results and the obs chart open, on the computer or on paper'},{id:'p2',text:'Medication chart at the bedside'},{id:'p3',text:'Know the resuscitation plan or goals of care'},{id:'p4',text:'If it won\u2019t delay anything: ECG and BGL done, history checked',note:'Never delay the call to do these. Call first, prepare while the team is on the way.'},{id:'p5',text:'Your ISBAR handover ready: why you called, what\u2019s changed, what you\u2019ve done'}]},
 {title:'Get the space ready',items:[{id:'s1',text:'Stay with the patient. Position them (for example, sit up if breathless) and start first steps as per protocol'},{id:'s2',text:'Clear the bed space: move tables, chairs and clutter'},{id:'s3',text:'Emergency trolley, suction and oxygen within reach'},{id:'s4',text:'Check IV access works'},{id:'s5',text:'Only the people needed in the room. Someone looks after the rest of the ward, and someone supports the family'}]}
],$('#prep-progress'));

/* ---------- Tool 5: phrases ---------- */
var PH=[
 {t:'Raising a concern',p:['I\u2019m worried about [patient]. Their [obs] has gone from [x] to [y].','Something isn\u2019t right with [patient], and I\u2019d like you to see them.','I\u2019ve looked after her for three shifts, and this isn\u2019t her normal.']},
 {t:'Asking clearly',p:['I need you to review [patient] within 30 minutes.','I think we need [team] involved. This may be beyond what we can manage on the ward.','Can we agree on what I should call you back for?']},
 {t:'Checking and clarifying',p:['Can I check I\u2019ve understood the plan?','Can you help me understand why you\u2019re not worried? I might be missing something.','Just to confirm, you\u2019d like me to [plan].']},
 {t:'Escalating',p:['I\u2019m still concerned, so I\u2019m going to talk to the RN in charge.','I\u2019m not comfortable with this plan. I\u2019d like to speak to someone more senior.','[Patient] meets the criteria, so I\u2019m calling a rapid response.']},
 {t:'As a student, to your RN',p:['Could you look at Bed 4\u2019s obs with me? His breathing rate has gone up.','I\u2019m not sure this is normal for her. Can we check together?','I haven\u2019t seen this before. Who\u2019s the best person to ask?']}
];
var phr=$('#phrases');
PH.forEach(function(g){phr.appendChild(el('div',{class:'st-checkgroup'},[el('h3',{text:g.t}),el('ul',{class:'st-bank'},g.p.map(function(p){return el('li',{style:'padding:0;border:0;margin:0 0 6px;background:none'},[el('button',{class:'ce-opt',type:'button',style:'width:100%','aria-label':'Copy: '+p,onclick:function(){O.copy(p,$('#ph-status'));}},[el('span',{text:'\u201c'+p+'\u201d'})])]);}))]));});

/* Print helpers */
var st=document.createElement('style');st.textContent='@media print{body.print-obs #obs-form,body.print-obs #chart>details{display:none!important}body.print-obs #obs-out{display:block!important;margin-top:0}body.print-obs #obs-out>div:first-child{float:left;width:52%}body.print-obs #obs-out>div:last-child{margin-left:55%}body.print-obs #obs-out::after{content:"";display:block;clear:both}body.print-obs .ce-result{font-size:9.5pt;padding:12px 14px}body.print-obs .ce-result h3{font-size:15pt}body.print-obs .ce-result li,body.print-obs .ce-list{font-size:9.5pt}body.print-obs .ce-list li{padding:3px 0}body.print-isbar #isbar-form,body.print-isbar .st-two>div>.st-panel>.st-help{display:none!important}body.print-isbar .st-two{display:block}body.print-isbar #is-preview{border:0;padding:0;font-size:11pt}}';document.head.appendChild(st);

window.OZESC={evaluate:evaluate,CASES:CASES,stepObs:stepObs,LV2OPT:LV2OPT,PARAMS:PARAMS};
})();
