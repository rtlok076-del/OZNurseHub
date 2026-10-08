/* OzNurseHub student tools: shared helpers. Everything is stored in this browser only (localStorage). */
(function(){'use strict';
var PAGE=document.documentElement.getAttribute('data-tools')||'tools';
var PREFIX='ozn.'+PAGE+'.';
var memory={};
function canStore(){try{var k='__ozn_test';localStorage.setItem(k,'1');localStorage.removeItem(k);return true;}catch(e){return false;}}
var STORAGE_OK=canStore();
function get(key,fallback){try{var v=STORAGE_OK?localStorage.getItem(PREFIX+key):memory[key];return v==null?fallback:JSON.parse(v);}catch(e){return fallback;}}
function set(key,value){var s=JSON.stringify(value);try{if(STORAGE_OK){localStorage.setItem(PREFIX+key,s);}else{memory[key]=s;}}catch(e){memory[key]=s;}}
function remove(key){try{if(STORAGE_OK)localStorage.removeItem(PREFIX+key);}catch(e){}delete memory[key];}
function clearPage(){try{if(STORAGE_OK){Object.keys(localStorage).forEach(function(k){if(k.indexOf(PREFIX)===0)localStorage.removeItem(k);});}}catch(e){}memory={};}
function $(sel,root){return (root||document).querySelector(sel);}
function $$(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel));}
function el(tag,attrs,children){var n=document.createElement(tag);if(attrs){Object.keys(attrs).forEach(function(k){var v=attrs[k];if(v==null||v===false)return;if(k==='text')n.textContent=v;else if(k==='class')n.className=v;else if(k.indexOf('on')===0&&typeof v==='function')n.addEventListener(k.slice(2),v);else n.setAttribute(k,v===true?'':v);});}
(children||[]).forEach(function(c){if(c==null)return;n.appendChild(typeof c==='string'?document.createTextNode(c):c);});return n;}
var timers={};
function status(node,msg){if(!node)return;node.textContent=msg;clearTimeout(timers[node.id]);timers[node.id]=setTimeout(function(){node.textContent='';},3500);}
function copy(text,statusNode){
  function fallback(){var t=el('textarea',{style:'position:fixed;top:-1000px;opacity:0','aria-hidden':'true'});t.value=text;document.body.appendChild(t);t.select();var ok=false;try{ok=document.execCommand('copy');}catch(e){}document.body.removeChild(t);status(statusNode,ok?'Copied. Paste it wherever you need it.':'Couldn\u2019t copy automatically. Select the text and copy it yourself.');}
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(function(){status(statusNode,'Copied. Paste it wherever you need it.');},fallback);}else{fallback();}
}
/* Print mirrors: form fields don't print well, so each prints as plain text. */
function syncMirrors(root){
  $$('textarea,input[type=text],input[type=date],input[type=month],input[type=time],input[type=number]',root||document).forEach(function(f){
    var m=f.nextElementSibling;
    if(!m||!m.classList||!m.classList.contains('st-pm')){m=el('div',{class:'st-pm','aria-hidden':'true'});f.parentNode.insertBefore(m,f.nextSibling);}
    var v=f.value||'';
    if(f.type==='date'&&v){var p=v.split('-');v=p[2]+'/'+p[1]+'/'+p[0];}
    if(f.type==='month'&&v){var q=v.split('-');v=new Date(+q[0],+q[1]-1,1).toLocaleDateString('en-AU',{month:'long',year:'numeric'});}
    m.textContent=v;
  });
}
window.addEventListener('beforeprint',function(){if(!document.body.hasAttribute('data-print'))syncMirrors();});
function printSection(section,opts){
  opts=opts||{};syncMirrors();if(opts.prepare)opts.prepare();
  var body=document.body;
  section.classList.add('st-print-target');body.setAttribute('data-print',section.id);
  if(opts.className)body.classList.add(opts.className);
  var done=false;function cleanup(){if(done)return;done=true;section.classList.remove('st-print-target');body.removeAttribute('data-print');if(opts.className)body.classList.remove(opts.className);window.removeEventListener('afterprint',cleanup);}
  window.addEventListener('afterprint',cleanup);
  setTimeout(function(){window.print();setTimeout(cleanup,1500);},30);
}
/* Save any [name] field inside root under key, as you type. */
function persist(root,key,onChange){
  var data=get(key,{})||{};
  function fields(){return $$('input[name],select[name],textarea[name]',root);}
  fields().forEach(function(f){
    var v=data[f.name];if(v===undefined)return;
    if(f.type==='checkbox'){f.checked=Array.isArray(v)?v.indexOf(f.value)>-1:!!v;}
    else if(f.type==='radio'){f.checked=(f.value===v);}
    else{f.value=v;}
  });
  function save(){
    var out={};
    fields().forEach(function(f){
      if(f.type==='checkbox'){var group=fields().filter(function(g){return g.name===f.name&&g.type==='checkbox';});if(group.length>1){out[f.name]=out[f.name]||[];if(f.checked)out[f.name].push(f.value);}else{out[f.name]=f.checked;}}
      else if(f.type==='radio'){if(f.checked)out[f.name]=f.value;}
      else{out[f.name]=f.value;}
    });
    set(key,out);if(onChange)onChange(out);return out;
  }
  root.addEventListener('input',save);root.addEventListener('change',save);
  return {save:save,load:function(){return get(key,{});}};
}
/* Checklists that remember what you've ticked. groups: [{title, items:[{id,text,note}]}] */
function checklist(root,key,groups,progressRoot){
  var done=get(key,{})||{};
  root.textContent='';
  groups.forEach(function(g){
    var ul=el('ul');
    g.items.forEach(function(it){
      var cb=el('input',{type:'checkbox','data-id':it.id});cb.checked=!!done[it.id];
      var span=el('span',null,[it.text,it.note?el('small',{text:it.note}):null]);
      ul.appendChild(el('li',null,[el('label',{class:'st-check'},[cb,span])]));
    });
    root.appendChild(el('div',{class:'st-checkgroup'},[el('h3',{text:g.title}),ul]));
  });
  function update(){var boxes=$$('input[type=checkbox]',root),n=boxes.filter(function(b){return b.checked;}).length;
    if(progressRoot){$('.st-bar span',progressRoot).style.width=(boxes.length?Math.round(n/boxes.length*100):0)+'%';$('.st-progress-text',progressRoot).textContent=n+' of '+boxes.length+' done';}}
  root.addEventListener('change',function(e){var id=e.target.getAttribute('data-id');if(!id)return;if(e.target.checked)done[id]=1;else delete done[id];set(key,done);update();});
  update();
  return {reset:function(){done={};set(key,done);$$('input[type=checkbox]',root).forEach(function(b){b.checked=false;});update();},
          text:function(){return groups.map(function(g){return g.title+'\n'+g.items.map(function(it){return (done[it.id]?'[x] ':'[ ] ')+it.text;}).join('\n');}).join('\n\n');}};
}
function words(s){s=(s||'').trim();return s?s.split(/\s+/).length:0;}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
/* Clear-all buttons */
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-clear-page]');if(!b)return;
  if(window.confirm('Delete everything you\u2019ve saved on this page, on this device? This can\u2019t be undone.')){clearPage();location.reload();}});
document.addEventListener('DOMContentLoaded',function(){if(!STORAGE_OK){$$('.st-storage-off').forEach(function(n){n.hidden=false;});}});
window.OZT={get:get,set:set,remove:remove,clearPage:clearPage,$:$,$$:$$,el:el,status:status,copy:copy,printSection:printSection,syncMirrors:syncMirrors,persist:persist,checklist:checklist,words:words,uid:uid,storageOk:STORAGE_OK};
})();
