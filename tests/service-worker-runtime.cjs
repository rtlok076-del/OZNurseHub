const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const handlers = {}, entries = new Map();
let now = 1000000, requests = 0, offline = false, full = false;
const cache = {
  match: async key => entries.get(typeof key === 'string' ? key : key.url)?.clone(),
  put: async (key, response) => {
    if (full) throw new Error('Quota exceeded');
    entries.set(key.url, response.clone());
  },
};
vm.runInNewContext(fs.readFileSync('sw.js', 'utf8'), {
  self: { location: { origin: 'https://example.test' }, addEventListener: (name, fn) => handlers[name] = fn },
  caches: { open: async () => cache },
  URL, Response, Map, Date: { now: () => now },
  fetch: async () => {
    requests++;
    if (offline) throw new Error('Offline');
    return new Response('fresh');
  },
});
async function request(path, options = {}) {
  let response, lifetime;
  handlers.fetch({
    request: { url: 'https://example.test' + path, method: 'GET', mode: 'cors', headers: new Headers(), ...options },
    respondWith: value => response = value,
    waitUntil: value => lifetime = value,
  });
  const result = await response;
  await lifetime;
  return result;
}
(async () => {
  entries.set('https://example.test/theme.js', new Response('cached'));
  assert.equal(await (await request('/theme.js')).text(), 'cached');
  assert.equal(requests, 1);
  assert.equal(await (await request('/theme.js')).text(), 'fresh');
  assert.equal(requests, 1, 'Repeated visits reuse assets within the recheck window');
  now += 300001;
  await request('/theme.js');
  assert.equal(requests, 2, 'Assets are rechecked after five minutes');
  now += 300001;
  offline = true;
  assert.equal(await (await request('/theme.js')).text(), 'fresh');
  offline = false;
  await request('/theme.js');
  assert.equal(requests, 4, 'Failed revalidation can retry immediately');
  full = true;
  assert.equal(await (await request('/uncached.js')).text(), 'fresh', 'Storage failures do not block network responses');
  full = false;
  await request('/index.html', { mode: 'navigate' });
  const count = requests;
  await request('/index.html', { mode: 'navigate' });
  assert.equal(requests, count + 1, 'Navigation always tries the network');
  offline = true;
  assert.equal(await (await request('/index.html', { mode: 'navigate' })).text(), 'fresh');
  assert.equal((await request('/missing.js')).type, 'error');
  const before = requests;
  for (const path of ['/media/test.mp4', '/downloads/file.pdf', '/med-survivor/index.html', '/api/data', '/auth/login']) {
    assert.equal(await request(path), undefined);
  }
  assert.equal(await request('/audio.bin', { headers: new Headers({ Range: 'bytes=0-10' }) }), undefined);
  assert.equal(await request('/form', { method: 'POST' }), undefined);
  assert.equal(requests, before);
  console.log('PASS cache recheck window, retry, quota failure, network-first HTML, offline fallback, asset errors and bypasses');
})().catch(error => { console.error(error); process.exitCode = 1; });
