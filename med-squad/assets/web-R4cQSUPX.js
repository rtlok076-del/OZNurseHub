import{W as F}from"./index-D_wlyXTD.js";import{_ as U,c as A,x,b as $,i as v,p as M,F as G,u as H,C as J,v as b,d as j}from"./index.esm-Bix1rrn-.js";/**
 * @license
 * Copyright 2017 Google LLC
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
 */const q="type.googleapis.com/google.protobuf.Int64Value",B="type.googleapis.com/google.protobuf.UInt64Value";function D(e,t){const n={};for(const r in e)e.hasOwnProperty(r)&&(n[r]=t(e[r]));return n}function T(e){if(e==null)return null;if(e instanceof Number&&(e=e.valueOf()),typeof e=="number"&&isFinite(e)||e===!0||e===!1||Object.prototype.toString.call(e)==="[object String]")return e;if(e instanceof Date)return e.toISOString();if(Array.isArray(e))return e.map(t=>T(t));if(typeof e=="function"||typeof e=="object")return D(e,t=>T(t));throw new Error("Data cannot be encoded in JSON: "+e)}function g(e){if(e==null)return e;if(e["@type"])switch(e["@type"]){case q:case B:{const t=Number(e.value);if(isNaN(t))throw new Error("Data cannot be decoded from JSON: "+e);return t}default:throw new Error("Data cannot be decoded from JSON: "+e)}return Array.isArray(e)?e.map(t=>g(t)):typeof e=="function"||typeof e=="object"?D(e,t=>g(t)):e}/**
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
 */const N="functions";/**
 * @license
 * Copyright 2017 Google LLC
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
 */const C={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class d extends G{constructor(t,n,r){super(`${N}/${t}`,n||""),this.details=r,Object.setPrototypeOf(this,d.prototype)}}function V(e){if(e>=200&&e<300)return"ok";switch(e){case 0:return"internal";case 400:return"invalid-argument";case 401:return"unauthenticated";case 403:return"permission-denied";case 404:return"not-found";case 409:return"aborted";case 429:return"resource-exhausted";case 499:return"cancelled";case 500:return"internal";case 501:return"unimplemented";case 503:return"unavailable";case 504:return"deadline-exceeded"}return"unknown"}function w(e,t){let n=V(e),r=n,s;try{const i=t&&t.error;if(i){const a=i.status;if(typeof a=="string"){if(!C[a])return new d("internal","internal");n=C[a],r=a}const o=i.message;typeof o=="string"&&(r=o),s=i.details,s!==void 0&&(s=g(s))}}catch{}return n==="ok"?null:new d(n,r,s)}/**
 * @license
 * Copyright 2017 Google LLC
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
 */class W{constructor(t,n,r,s){this.app=t,this.auth=null,this.messaging=null,this.appCheck=null,this.serverAppAppCheckToken=null,j(t)&&t.settings.appCheckToken&&(this.serverAppAppCheckToken=t.settings.appCheckToken),this.auth=n.getImmediate({optional:!0}),this.messaging=r.getImmediate({optional:!0}),this.auth||n.get().then(i=>this.auth=i,()=>{}),this.messaging||r.get().then(i=>this.messaging=i,()=>{}),this.appCheck||s==null||s.get().then(i=>this.appCheck=i,()=>{})}async getAuthToken(){if(this.auth)try{const t=await this.auth.getToken();return t==null?void 0:t.accessToken}catch{return}}async getMessagingToken(){if(!(!this.messaging||!("Notification"in self)||Notification.permission!=="granted"))try{return await this.messaging.getToken()}catch{return}}async getAppCheckToken(t){if(this.serverAppAppCheckToken)return this.serverAppAppCheckToken;if(this.appCheck){const n=t?await this.appCheck.getLimitedUseToken():await this.appCheck.getToken();return n.error?null:n.token}return null}async getContext(t){const n=await this.getAuthToken(),r=await this.getMessagingToken(),s=await this.getAppCheckToken(t);return{authToken:n,messagingToken:r,appCheckToken:s}}}/**
 * @license
 * Copyright 2017 Google LLC
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
 */const k="us-central1",X=/^data: (.*?)(?:\n|$)/;function Y(e){let t=null;return{promise:new Promise((n,r)=>{t=setTimeout(()=>{r(new d("deadline-exceeded","deadline-exceeded"))},e)}),cancel:()=>{t&&clearTimeout(t)}}}class K{constructor(t,n,r,s,i=k,a=(...o)=>fetch(...o)){this.app=t,this.fetchImpl=a,this.emulatorOrigin=null,this.contextProvider=new W(t,n,r,s),this.cancelAllRequests=new Promise(o=>{this.deleteService=()=>Promise.resolve(o())});try{const o=new URL(i);this.customDomain=o.origin+(o.pathname==="/"?"":o.pathname),this.region=k}catch{this.customDomain=null,this.region=i}}_delete(){return this.deleteService()}_url(t){const n=this.app.options.projectId;return this.emulatorOrigin!==null?`${this.emulatorOrigin}/${n}/${this.region}/${t}`:this.customDomain!==null?`${this.customDomain}/${t}`:`https://${this.region}-${n}.cloudfunctions.net/${t}`}}function z(e,t,n){const r=v(t);e.emulatorOrigin=`http${r?"s":""}://${t}:${n}`,r&&M(e.emulatorOrigin+"/backends")}function Q(e,t,n){const r=s=>te(e,t,s,n||{});return r.stream=(s,i)=>ne(e,t,s,i),r}function Z(e,t,n){const r=s=>_(e,t,s,n||{});return r.stream=(s,i)=>R(e,t,s,i||{}),r}function P(e){return e.emulatorOrigin&&v(e.emulatorOrigin)?"include":void 0}async function ee(e,t,n,r,s){n["Content-Type"]="application/json";let i;try{i=await r(e,{method:"POST",body:JSON.stringify(t),headers:n,credentials:P(s)})}catch{return{status:0,json:null}}let a=null;try{a=await i.json()}catch{}return{status:i.status,json:a}}async function I(e,t){const n={},r=await e.contextProvider.getContext(t.limitedUseAppCheckTokens);return r.authToken&&(n.Authorization="Bearer "+r.authToken),r.messagingToken&&(n["Firebase-Instance-ID-Token"]=r.messagingToken),r.appCheckToken!==null&&(n["X-Firebase-AppCheck"]=r.appCheckToken),n}function te(e,t,n,r){const s=e._url(t);return _(e,s,n,r)}async function _(e,t,n,r){n=T(n);const s={data:n},i=await I(e,r),a=r.timeout||7e4,o=Y(a),u=await Promise.race([ee(t,s,i,e.fetchImpl,e),o.promise,e.cancelAllRequests]);if(o.cancel(),!u)throw new d("cancelled","Firebase Functions instance was deleted.");const l=w(u.status,u.json);if(l)throw l;if(!u.json)throw new d("internal","Response is not valid JSON object.");let c=u.json.data;if(typeof c>"u"&&(c=u.json.result),typeof c>"u")throw new d("internal","Response is missing data field.");return{data:g(c)}}function ne(e,t,n,r){const s=e._url(t);return R(e,s,n,r||{})}async function R(e,t,n,r){var h;n=T(n);const s={data:n},i=await I(e,r);i["Content-Type"]="application/json",i.Accept="text/event-stream";let a;try{a=await e.fetchImpl(t,{method:"POST",body:JSON.stringify(s),headers:i,signal:r==null?void 0:r.signal,credentials:P(e)})}catch(f){if(f instanceof Error&&f.name==="AbortError"){const y=new d("cancelled","Request was cancelled.");return{data:Promise.reject(y),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(y)}}}}}}const p=w(0,null);return{data:Promise.reject(p),stream:{[Symbol.asyncIterator](){return{next(){return Promise.reject(p)}}}}}}let o,u;const l=new Promise((f,p)=>{o=f,u=p});(h=r==null?void 0:r.signal)==null||h.addEventListener("abort",()=>{const f=new d("cancelled","Request was cancelled.");u(f)});const c=a.body.getReader(),m=re(c,o,u,r==null?void 0:r.signal);return{stream:{[Symbol.asyncIterator](){const f=m.getReader();return{async next(){const{value:p,done:y}=await f.read();return{value:p,done:y}},async return(){return await f.cancel(),{done:!0,value:void 0}}}}},data:l}}function re(e,t,n,r){const s=(a,o)=>{const u=a.match(X);if(!u)return;const l=u[1];try{const c=JSON.parse(l);if("result"in c){t(g(c.result));return}if("message"in c){o.enqueue(g(c.message));return}if("error"in c){const m=w(0,c);o.error(m),n(m);return}}catch(c){if(c instanceof d){o.error(c),n(c);return}}},i=new TextDecoder;return new ReadableStream({start(a){let o="";return u();async function u(){if(r!=null&&r.aborted){const l=new d("cancelled","Request was cancelled");return a.error(l),n(l),Promise.resolve()}try{const{value:l,done:c}=await e.read();if(c){o.trim()&&s(o.trim(),a),a.close();return}if(r!=null&&r.aborted){const h=new d("cancelled","Request was cancelled");a.error(h),n(h),await e.cancel();return}o+=i.decode(l,{stream:!0});const m=o.split(`
`);o=m.pop()||"";for(const h of m)h.trim()&&s(h.trim(),a);return u()}catch(l){const c=l instanceof d?l:w(0,null);a.error(c),n(c)}}},cancel(){return e.cancel()}})}const O="@firebase/functions",S="0.13.5";/**
 * @license
 * Copyright 2019 Google LLC
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
 */const se="auth-internal",ie="app-check-internal",oe="messaging-internal";function ae(e){const t=(n,{instanceIdentifier:r})=>{const s=n.getProvider("app").getImmediate(),i=n.getProvider(se),a=n.getProvider(oe),o=n.getProvider(ie);return new K(s,i,a,o,r)};H(new J(N,t,"PUBLIC").setMultipleInstances(!0)),b(O,S,e),b(O,S,"esm2020")}/**
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
 */function E(e=$(),t=k){const r=U(A(e),N).getImmediate({identifier:t}),s=x("functions");return s&&L(r,...s),r}function L(e,t,n){z(A(e),t,n)}function ce(e,t,n){return Q(A(e),t,n)}function ue(e,t,n){return Z(A(e),t,n)}ae();class fe extends F{async callByName(t){const n=E(void 0,t.region);return{data:(await ce(n,t.name,{timeout:t.timeout})(t.data)).data}}async callByUrl(t){const n=E();return{data:(await ue(n,t.url,{timeout:t.timeout})(t.data)).data}}async useEmulator(t){const n=E(void 0,t.regionOrCustomDomain),r=t.port||5001;L(n,t.host,r)}}export{fe as FirebaseFunctionsWeb};
