import{W as le,_ as ue}from"./index-D_wlyXTD.js";import{v as q,E as he,_ as S,c as de,b as j,L as fe,D as E,y as pe,z as W,A as ge,B as ke,u as O,C as B}from"./index.esm-Bix1rrn-.js";var Ee="firebase",Te="12.16.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */q(Ee,Te,"app");/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const I=new Map,G={activated:!1,tokenObservers:[]},we={initialized:!1,enabled:!1};function c(t){return I.get(t)||{...G}}function me(t,e){return I.set(t,e),I.get(t)}function C(){return we}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const D="https://content-firebaseappcheck.googleapis.com/v1",be="exchangeRecaptchaV3Token",Ae="exchangeRecaptchaEnterpriseToken",_e="exchangeDebugToken",L={RETRIAL_MIN_WAIT:30*1e3,RETRIAL_MAX_WAIT:960*1e3},Ce=1440*60*1e3;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ve{constructor(e,r,n,i,o){if(this.operation=e,this.retryPolicy=r,this.getWaitDuration=n,this.lowerBound=i,this.upperBound=o,this.pending=null,this.nextErrorWaitInterval=i,i>o)throw new Error("Proactive refresh lower bound greater than upper bound!")}start(){this.nextErrorWaitInterval=this.lowerBound,this.process(!0).catch(()=>{})}stop(){this.pending&&(this.pending.reject("cancelled"),this.pending=null)}isRunning(){return!!this.pending}async process(e){this.stop();try{this.pending=new E,this.pending.promise.catch(r=>{}),await ye(this.getNextRun(e)),this.pending.resolve(),await this.pending.promise,this.pending=new E,this.pending.promise.catch(r=>{}),await this.operation(),this.pending.resolve(),await this.pending.promise,this.process(!0).catch(()=>{})}catch(r){this.retryPolicy(r)?this.process(!1).catch(()=>{}):this.stop()}}getNextRun(e){if(e)return this.nextErrorWaitInterval=this.lowerBound,this.getWaitDuration();{const r=this.nextErrorWaitInterval;return this.nextErrorWaitInterval*=2,this.nextErrorWaitInterval>this.upperBound&&(this.nextErrorWaitInterval=this.upperBound),r}}}function ye(t){return new Promise(e=>{setTimeout(e,t)})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Re={"already-initialized":"You have already called initializeAppCheck() for FirebaseApp {$appName} with different options. To avoid this error, call initializeAppCheck() with the same options as when it was originally called. This will return the already initialized instance.","already-internally-initialized":"App Check has already been automatically initialized by {$initializerName} with default options. If you want to initialize App Check with custom options, call initializeAppCheck() with those options before initializing {$initializerName}.","use-before-activation":"App Check is being used before initializeAppCheck() is called for FirebaseApp {$appName}. Call initializeAppCheck() before instantiating other Firebase services.","fetch-network-error":"Fetch failed to connect to a network. Check Internet connection. Original error: {$originalErrorMessage}.","fetch-parse-error":"Fetch client could not parse response. Original error: {$originalErrorMessage}.","fetch-status-error":"Fetch server returned an HTTP error status. HTTP status: {$httpStatus}.","storage-open":"Error thrown when opening storage. Original error: {$originalErrorMessage}.","storage-get":"Error thrown when reading from storage. Original error: {$originalErrorMessage}.","storage-set":"Error thrown when writing to storage. Original error: {$originalErrorMessage}.","recaptcha-error":"ReCAPTCHA error.","no-provider":"No attestation provider was passed to initializeAppCheck() and no ReCAPTCHA Enterprise site key was found in the Firebase config.","initial-throttle":"{$httpStatus} error. Attempts allowed again after {$time}",throttled:"Requests throttled due to previous {$httpStatus} error. Attempts allowed again after {$time}"},h=new he("appCheck","AppCheck",Re);/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function b(t=!1){var e;return t?(e=self.grecaptcha)==null?void 0:e.enterprise:self.grecaptcha}function N(t){if(!c(t).activated)throw h.create("use-before-activation",{appName:t.name})}function x(t){const e=Math.round(t/1e3),r=Math.floor(e/(3600*24)),n=Math.floor((e-r*3600*24)/3600),i=Math.floor((e-r*3600*24-n*3600)/60),o=e-r*3600*24-n*3600-i*60;let a="";return r&&(a+=w(r)+"d:"),n&&(a+=w(n)+"h:"),a+=w(i)+"m:"+w(o)+"s",a}function w(t){return t===0?"00":t>=10?t.toString():"0"+t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function v({url:t,body:e},r){const n={"Content-Type":"application/json"},i=r.getImmediate({optional:!0});if(i){const d=await i.getHeartbeatsHeader();d&&(n["X-Firebase-Client"]=d)}const o={method:"POST",body:JSON.stringify(e),headers:n};let a;try{a=await fetch(t,o)}catch(d){throw h.create("fetch-network-error",{originalErrorMessage:d==null?void 0:d.message})}if(a.status!==200)throw h.create("fetch-status-error",{httpStatus:a.status});let s;try{s=await a.json()}catch(d){throw h.create("fetch-parse-error",{originalErrorMessage:d==null?void 0:d.message})}const l=s.ttl.match(/^([\d.]+)(s)$/);if(!l||!l[2]||isNaN(Number(l[1])))throw h.create("fetch-parse-error",{originalErrorMessage:`ttl field (timeToLive) is not in standard Protobuf Duration format: ${s.ttl}`});const u=Number(l[1])*1e3,g=Date.now();return{token:s.token,expireTimeMillis:g+u,issuedAtTimeMillis:g}}function Pe(t,e){const{projectId:r,appId:n,apiKey:i}=t.options;return{url:`${D}/projects/${r}/apps/${n}:${be}?key=${i}`,body:{recaptcha_v3_token:e}}}function Ie(t,e){const{projectId:r,appId:n,apiKey:i}=t.options;return{url:`${D}/projects/${r}/apps/${n}:${Ae}?key=${i}`,body:{recaptcha_enterprise_token:e}}}function V(t,e){const{projectId:r,appId:n,apiKey:i}=t.options;return{url:`${D}/projects/${r}/apps/${n}:${_e}?key=${i}`,body:{debug_token:e}}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Se="firebase-app-check-database",De=1,T="firebase-app-check-store",X="debug-token";let m=null;function Y(){return m||(m=new Promise((t,e)=>{try{const r=indexedDB.open(Se,De);r.onsuccess=n=>{t(n.target.result)},r.onerror=n=>{var i;e(h.create("storage-open",{originalErrorMessage:(i=n.target.error)==null?void 0:i.message}))},r.onupgradeneeded=n=>{const i=n.target.result;switch(n.oldVersion){case 0:i.createObjectStore(T,{keyPath:"compositeKey"})}}}catch(r){e(h.create("storage-open",{originalErrorMessage:r==null?void 0:r.message}))}}),m)}function Ne(t){return Q(Z(t))}function xe(t,e){return J(Z(t),e)}function Me(t){return J(X,t)}function $e(){return Q(X)}async function J(t,e){const n=(await Y()).transaction(T,"readwrite"),o=n.objectStore(T).put({compositeKey:t,value:e});return new Promise((a,s)=>{o.onsuccess=l=>{a()},n.onerror=l=>{var u;s(h.create("storage-set",{originalErrorMessage:(u=l.target.error)==null?void 0:u.message}))}})}async function Q(t){const r=(await Y()).transaction(T,"readonly"),i=r.objectStore(T).get(t);return new Promise((o,a)=>{i.onsuccess=s=>{const l=s.target.result;o(l?l.value:void 0)},r.onerror=s=>{var l;a(h.create("storage-get",{originalErrorMessage:(l=s.target.error)==null?void 0:l.message}))}})}function Z(t){return`${t.options.appId}-${t.name}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const f=new fe("@firebase/app-check");/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ze(t){if(W()){let e;try{e=await Ne(t)}catch(r){f.warn(`Failed to read token from IndexedDB. Error: ${r}`)}return e}}function R(t,e){return W()?xe(t,e).catch(r=>{f.warn(`Failed to write token to IndexedDB. Error: ${r}`)}):Promise.resolve()}async function He(){let t;try{t=await $e()}catch{}if(t)return t;{const e=crypto.randomUUID();return Me(e).catch(r=>f.warn(`Failed to persist debug token to IndexedDB. Error: ${r}`)),e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function M(){return C().enabled}async function $(){const t=C();if(t.enabled&&t.token)return t.token.promise;throw Error(`
            Can't get debug token in production mode.
        `)}function Ke(){const t=pe(),e=C();if(e.initialized=!0,typeof t.FIREBASE_APPCHECK_DEBUG_TOKEN!="string"&&t.FIREBASE_APPCHECK_DEBUG_TOKEN!==!0)return;e.enabled=!0;const r=new E;e.token=r,typeof t.FIREBASE_APPCHECK_DEBUG_TOKEN=="string"?r.resolve(t.FIREBASE_APPCHECK_DEBUG_TOKEN):r.resolve(He())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Oe={error:"UNKNOWN_ERROR"};function Be(t){return ke.encodeString(JSON.stringify(t),!1)}async function A(t,e=!1,r=!1){const n=t.app;N(n);const i=c(n);let o=i.token,a;if(o&&!k(o)&&(i.token=void 0,o=void 0),!o){const u=await i.cachedTokenPromise;u&&(k(u)?o=u:await R(n,void 0))}if(!e&&o&&k(o))return{token:o.token};let s=!1;if(M())try{const u=await $();i.exchangeTokenPromise||(i.exchangeTokenPromise=v(V(n,u),t.heartbeatServiceProvider).finally(()=>{i.exchangeTokenPromise=void 0}),s=!0);const g=await i.exchangeTokenPromise;return await R(n,g),i.token=g,{token:g.token}}catch(u){return u.code==="appCheck/throttled"||u.code==="appCheck/initial-throttle"?f.warn(u.message):r&&f.error(u),P(u)}try{i.exchangeTokenPromise||(i.exchangeTokenPromise=i.provider.getToken().finally(()=>{i.exchangeTokenPromise=void 0}),s=!0),o=await c(n).exchangeTokenPromise}catch(u){u.code==="appCheck/throttled"||u.code==="appCheck/initial-throttle"?f.warn(u.message):r&&f.error(u),a=u}let l;return o?a?k(o)?l={token:o.token,internalError:a}:l=P(a):(l={token:o.token},i.token=o,await R(n,o)):l=P(a),s&&ee(n,l),l}async function Le(t){const e=t.app;N(e);const{provider:r}=c(e);if(M()){const n=await $(),i=V(e,n);i.body.limited_use=!0;const{token:o}=await v(i,t.heartbeatServiceProvider);return{token:o}}else{const{token:n}=await r.getToken(!0);return{token:n}}}function z(t,e,r,n){const{app:i}=t,o=c(i),a={next:r,error:n,type:e};if(o.tokenObservers=[...o.tokenObservers,a],o.token&&k(o.token)){const s=o.token;Promise.resolve().then(()=>{r({token:s.token}),F(t)}).catch(()=>{})}o.cachedTokenPromise.then(()=>F(t))}function H(t,e){const r=c(t),n=r.tokenObservers.filter(i=>i.next!==e);n.length===0&&r.tokenRefresher&&r.tokenRefresher.isRunning()&&r.tokenRefresher.stop(),r.tokenObservers=n}function F(t){const{app:e}=t,r=c(e);let n=r.tokenRefresher;n||(n=Fe(t),r.tokenRefresher=n),!n.isRunning()&&r.isTokenAutoRefreshEnabled&&n.start()}function Fe(t){const{app:e}=t;return new ve(async()=>{const r=c(e);let n;if(r.token?n=await A(t,!0):n=await A(t),n.error)throw n.error;if(n.internalError)throw n.internalError},()=>!0,()=>{const r=c(e);if(r.token){let n=r.token.issuedAtTimeMillis+(r.token.expireTimeMillis-r.token.issuedAtTimeMillis)*.5+3e5;const i=r.token.expireTimeMillis-300*1e3;return n=Math.min(n,i),Math.max(0,n-Date.now())}else return 0},L.RETRIAL_MIN_WAIT,L.RETRIAL_MAX_WAIT)}function ee(t,e){const r=c(t).tokenObservers;for(const n of r)try{n.type==="EXTERNAL"&&e.error!=null?n.error(e.error):n.next(e)}catch{}}function k(t){return t.expireTimeMillis-Date.now()>0}function P(t){return{token:Be(Oe),error:t}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ue{constructor(e,r){this.app=e,this.heartbeatServiceProvider=r}_delete(){const{tokenObservers:e}=c(this.app);for(const r of e)H(this.app,r.next);return Promise.resolve()}}function qe(t,e){return new Ue(t,e)}function je(t){return{getToken:e=>A(t,e),getLimitedUseToken:()=>Le(t),addTokenListener:e=>z(t,"INTERNAL",e),removeTokenListener:e=>H(t.app,e)}}const We="@firebase/app-check",Ge="0.12.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ve="https://www.google.com/recaptcha/api.js",Xe="https://www.google.com/recaptcha/enterprise.js";function Ye(t,e){const r=new E,n=c(t);n.reCAPTCHAState={initialized:r};const i=te(t),o=b(!1);return o?_(t,e,o,i,r):Ze(()=>{const a=b(!1);if(!a)throw new Error("no recaptcha");_(t,e,a,i,r)}),r.promise}function Je(t,e){const r=new E,n=c(t);n.reCAPTCHAState={initialized:r};const i=te(t),o=b(!0);return o?_(t,e,o,i,r):et(()=>{const a=b(!0);if(!a)throw new Error("no recaptcha");_(t,e,a,i,r)}),r.promise}function _(t,e,r,n,i){r.ready(()=>{Qe(t,e,r,n),i.resolve(r)})}function te(t){const e=`fire_app_check_${t.name}`,r=document.createElement("div");return r.id=e,r.style.display="none",document.body.appendChild(r),e}async function re(t){N(t);const r=await c(t).reCAPTCHAState.initialized.promise;return new Promise((n,i)=>{const o=c(t).reCAPTCHAState;r.ready(()=>{n(r.execute(o.widgetId,{action:"fire_app_check"}))})})}function Qe(t,e,r,n){const i=r.render(n,{sitekey:e,size:"invisible",callback:()=>{c(t).reCAPTCHAState.succeeded=!0},"error-callback":()=>{c(t).reCAPTCHAState.succeeded=!1}}),o=c(t);o.reCAPTCHAState={...o.reCAPTCHAState,widgetId:i}}function Ze(t){const e=document.createElement("script");e.src=Ve,e.onload=t,document.head.appendChild(e)}function et(t){const e=document.createElement("script");e.src=Xe+"?render=explicit",e.onload=t,document.head.appendChild(e)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class K{constructor(e){this._siteKey=e,this._throttleData=null}async getToken(e=!1){var i,o,a;ie(this._throttleData);const r=await re(this._app).catch(s=>{throw h.create("recaptcha-error")});if(!((i=c(this._app).reCAPTCHAState)!=null&&i.succeeded))throw h.create("recaptcha-error");let n;try{const s=Pe(this._app,r);e&&(s.body.limited_use=!0),n=await v(s,this._heartbeatServiceProvider)}catch(s){throw(o=s.code)!=null&&o.includes("fetch-status-error")?(this._throttleData=ne(Number((a=s.customData)==null?void 0:a.httpStatus),this._throttleData),h.create("initial-throttle",{time:x(this._throttleData.allowRequestsAfter-Date.now()),httpStatus:this._throttleData.httpStatus})):s}return this._throttleData=null,n}initialize(e){this._app=e,this._heartbeatServiceProvider=S(e,"heartbeat"),Ye(e,this._siteKey).catch(()=>{})}isEqual(e){return e instanceof K?this._siteKey===e._siteKey:!1}}class y{constructor(e){this._siteKey=e,this._throttleData=null}async getToken(e=!1){var i,o,a;ie(this._throttleData);const r=await re(this._app).catch(s=>{throw h.create("recaptcha-error")});if(!((i=c(this._app).reCAPTCHAState)!=null&&i.succeeded))throw h.create("recaptcha-error");let n;try{const s=Ie(this._app,r);e&&(s.body.limited_use=!0),n=await v(s,this._heartbeatServiceProvider)}catch(s){throw(o=s.code)!=null&&o.includes("fetch-status-error")?(this._throttleData=ne(Number((a=s.customData)==null?void 0:a.httpStatus),this._throttleData),h.create("initial-throttle",{time:x(this._throttleData.allowRequestsAfter-Date.now()),httpStatus:this._throttleData.httpStatus})):s}return this._throttleData=null,n}initialize(e){this._app=e,this._heartbeatServiceProvider=S(e,"heartbeat"),Je(e,this._siteKey).catch(()=>{})}isEqual(e){return e instanceof y?this._siteKey===e._siteKey:!1}}function ne(t,e){if(t===404||t===403)return{backoffCount:1,allowRequestsAfter:Date.now()+Ce,httpStatus:t};{const r=e?e.backoffCount:0,n=ge(r,1e3,2);return{backoffCount:r+1,allowRequestsAfter:Date.now()+n,httpStatus:t}}}function ie(t){if(t&&Date.now()-t.allowRequestsAfter<=0)throw h.create("throttled",{time:x(t.allowRequestsAfter-Date.now()),httpStatus:t.httpStatus})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function oe(t=j(),e){var a;t=de(t),C().initialized||Ke(),M()&&$().then(s=>console.log(`App Check debug token: ${s}. You will need to add it to your app's App Check settings in the Firebase console for it to work.`));let r;if(!(e!=null&&e.provider)&&t.options.recaptchaSiteKey&&(r=new y(t.options.recaptchaSiteKey)),!(e!=null&&e.provider)&&!r)throw h.create("no-provider");const n={...e,provider:(e==null?void 0:e.provider)||r},i=S(t,"app-check");if(i.isInitialized()){const s=i.getImmediate(),l=i.getOptions();if(l.isTokenAutoRefreshEnabled===n.isTokenAutoRefreshEnabled&&((a=l.provider)!=null&&a.isEqual(n.provider)))return s;throw typeof c(t).internallyInitializedBy=="string"?h.create("already-internally-initialized",{initializerName:c(t).internallyInitializedBy}):h.create("already-initialized",{appName:t.name})}const o=i.initialize({options:n});return tt(t,n.provider,n.isTokenAutoRefreshEnabled),c(t).isTokenAutoRefreshEnabled&&z(o,"INTERNAL",()=>{}),o}function tt(t,e,r=!1){const n=me(t,{...G});n.activated=!0,n.provider=e,n.cachedTokenPromise=ze(t).then(i=>(i&&k(i)&&(n.token=i,ee(t,{token:i.token})),i)),n.isTokenAutoRefreshEnabled=r&&t.automaticDataCollectionEnabled,!t.automaticDataCollectionEnabled&&r&&f.warn("`isTokenAutoRefreshEnabled` is true but `automaticDataCollectionEnabled` was set to false during `initializeApp()`. This blocks automatic token refresh."),n.provider.initialize(t)}function ae(t,e){const r=t.app,n=c(r);n.tokenRefresher&&(e===!0?n.tokenRefresher.start():n.tokenRefresher.stop()),n.isTokenAutoRefreshEnabled=e}async function se(t,e){const r=await A(t,e);if(r.error)throw r.error;if(r.internalError)throw r.internalError;return{token:r.token}}function ce(t,e,r,n){let i=()=>{},o=()=>{};return e.next!=null?i=e.next.bind(e):i=e,e.error!=null&&(o=e.error.bind(e)),z(t,"EXTERNAL",i,o),()=>H(t.app,i)}const rt="app-check",U="app-check-internal";function nt(){O(new B(rt,t=>{const e=t.getProvider("app").getImmediate(),r=t.getProvider("heartbeat");return qe(e,r)},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((t,e,r)=>{t.getProvider(U).initialize()})),O(new B(U,t=>{const e=t.getProvider("app-check").getImmediate();return je(e)},"PUBLIC").setInstantiationMode("EXPLICIT")),q(We,Ge)}nt();const it=Object.freeze(Object.defineProperty({__proto__:null,ReCaptchaEnterpriseProvider:y,ReCaptchaV3Provider:K,getToken:se,initializeAppCheck:oe,onTokenChanged:ce,setTokenAutoRefreshEnabled:ae},Symbol.toStringTag,{value:"Module"}));class p extends le{get appCheckInstance(){return this._appCheckInstance}set appCheckInstance(e){this._appCheckInstance=e,e?this.registerOnTokenChangedListener():this.unregisterOnTokenChangedListener()}async getToken(e){if(!this.appCheckInstance)throw new Error(p.errorNotInitialized);return{token:(await se(this.appCheckInstance,e==null?void 0:e.forceRefresh)).token}}async initialize(e){e!=null&&e.debugToken?self.FIREBASE_APPCHECK_DEBUG_TOKEN=e.debugToken:e!=null&&e.debug&&(self.FIREBASE_APPCHECK_DEBUG_TOKEN=!0);let r=e==null?void 0:e.provider;if(!r){if(!(e!=null&&e.siteKey))throw new Error(p.errorSiteKeyMissing);const{ReCaptchaV3Provider:i}=await ue(async()=>{const{ReCaptchaV3Provider:o}=await Promise.resolve().then(()=>it);return{ReCaptchaV3Provider:o}},void 0,import.meta.url);r=new i(e==null?void 0:e.siteKey)}const n=j();this.appCheckInstance=oe(n,{provider:r,isTokenAutoRefreshEnabled:e==null?void 0:e.isTokenAutoRefreshEnabled})}async setTokenAutoRefreshEnabled(e){if(!this.appCheckInstance)throw new Error(p.errorNotInitialized);ae(this.appCheckInstance,e.enabled)}registerOnTokenChangedListener(){this.appCheckInstance&&(this.onTokenChangedListenerUnsubscribe=ce(this.appCheckInstance,e=>this.handleTokenChanged(e.token)))}unregisterOnTokenChangedListener(){this.onTokenChangedListenerUnsubscribe&&this.onTokenChangedListenerUnsubscribe()}handleTokenChanged(e){const r={token:e};this.notifyListeners(p.tokenChangedEvent,r)}}p.tokenChangedEvent="tokenChanged";p.errorNotInitialized="AppCheck has not been initialized.";p.errorSiteKeyMissing="siteKey must be provided.";export{p as FirebaseAppCheckWeb};
