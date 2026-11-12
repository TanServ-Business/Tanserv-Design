const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const root = require('node:path').resolve(__dirname, '..');
const source = fs.readFileSync(root + '/scripts/ai-server-sample.js', 'utf8');

function setup({ baseUrl = 'https://sample-api.example.test', fetchImpl, protocol = 'https:' } = {}) {
  const elements = {};
  for (const id of ['aiServerSample', 'aiServerSampleFetch', 'aiServerSampleStatus', 'aiServerSampleContent']) {
    elements[id] = {
      dataset: {}, attributes: {}, listeners: {}, disabled: false, hidden: true, textContent: '',
      setAttribute(name, value) { this.attributes[name] = value; },
      addEventListener(name, listener) { this.listeners[name] = listener; },
      set innerHTML(_) { throw new Error('Server content must never be interpreted as HTML.'); }
    };
  }
  const timers = new Map();
  const requests = [];
  let nextTimer = 0;
  const window = { IneburaAiServerConfig: { baseUrl, timeoutMs: 10000 }, location: { protocol } };
  for (const key of ['localStorage', 'sessionStorage']) {
    Object.defineProperty(window, key, { get() { throw new Error('Connection test must not access suggestion storage.'); } });
  }
  const context = {
    window, URL, AbortController, Error, TypeError,
    document: { getElementById: id => elements[id] },
    setTimeout(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
    clearTimeout(id) { timers.delete(id); },
    async fetch(url, options) {
      requests.push({ url, options });
      return fetchImpl ? fetchImpl(url, options) : { ok: true, json: async () => ({ source: 'sample.txt', content: 'fixture\n' }) };
    }
  };
  vm.runInNewContext(source, context);
  return {
    region: elements.aiServerSample, button: elements.aiServerSampleFetch,
    status: elements.aiServerSampleStatus, content: elements.aiServerSampleContent,
    requests, timers, window,
    click: () => elements.aiServerSampleFetch.listeners.click(),
    expire: () => { for (const callback of [...timers.values()]) callback(); }
  };
}

test('initialization makes no request and missing configuration never fabricates a sample', async () => {
  const ui = setup({ baseUrl: '' });
  assert.equal(ui.requests.length, 0);
  await ui.click();
  assert.equal(ui.requests.length, 0);
  assert.equal(ui.region.dataset.state, 'error');
  assert.match(ui.status.textContent, /not configured/);
  assert.equal(ui.content.textContent, '');
  assert.equal(ui.content.hidden, true);
  assert.equal(ui.button.disabled, false);
});

test('unsafe, relative and mixed-content addresses are rejected before any request', async () => {
  for (const baseUrl of ['not-a-url', '/api', 'javascript:alert(1)', 'https://user:secret@sample-api.example.test', 'https://sample-api.example.test?key=x', 'http://sample-api.example.test']) {
    const ui = setup({ baseUrl });
    await ui.click();
    assert.equal(ui.requests.length, 0, baseUrl);
    assert.equal(ui.region.dataset.state, 'error', baseUrl);
  }
});

test('a successful click preserves the exact returned text and uses a read-only credential-free request', async () => {
  const sample = '<img src=x onerror=alert(1)>\nSecond line\n';
  const ui = setup({ baseUrl: 'https://sample-api.example.test/proxy/', fetchImpl: async () => ({ ok: true, json: async () => ({ source: 'sample.txt', content: sample }) }) });
  await ui.click();
  assert.equal(ui.region.dataset.state, 'success');
  assert.equal(ui.content.textContent, sample);
  assert.equal(ui.content.hidden, false);
  assert.equal(ui.requests[0].url, 'https://sample-api.example.test/proxy/api/v1/sample');
  const options = ui.requests[0].options;
  assert.equal(options.method, 'GET');
  assert.equal(options.credentials, 'omit');
  assert.equal(options.cache, 'no-store');
  assert.equal(options.mode, 'cors');
  assert.equal(options.redirect, 'error');
  assert.equal(options.body, undefined);
  assert.equal(options.headers.Authorization, undefined);
  assert.equal(ui.timers.size, 0);
  assert.equal(ui.region.attributes['aria-busy'], 'false');
});

test('loading disables duplicate requests and retry reads the current server response', async () => {
  let resolveFetch;
  const ui = setup({ fetchImpl: () => new Promise(resolve => { resolveFetch = resolve; }) });
  const first = ui.click();
  assert.equal(ui.button.disabled, true);
  assert.equal(ui.region.dataset.state, 'loading');
  assert.equal(ui.region.attributes['aria-busy'], 'true');
  await ui.click();
  assert.equal(ui.requests.length, 1);
  resolveFetch({ ok: true, json: async () => ({ source: 'sample.txt', content: 'first\n' }) });
  await first;
  assert.equal(ui.content.textContent, 'first\n');
  const second = ui.click();
  assert.equal(ui.content.hidden, true);
  assert.equal(ui.content.textContent, '');
  resolveFetch({ ok: true, json: async () => ({ source: 'sample.txt', content: 'changed\n' }) });
  await second;
  assert.equal(ui.content.textContent, 'changed\n');
  assert.equal(ui.requests.length, 2);
});

test('HTTP and network errors show retry without a fabricated result, then recover', async () => {
  let response = { ok: false, status: 503 };
  const ui = setup({ fetchImpl: async () => {
    if (response instanceof Error) throw response;
    return response;
  } });
  await ui.click();
  assert.match(ui.status.textContent, /HTTP 503/);
  assert.equal(ui.button.textContent, 'Retry AI Server Sample');
  assert.equal(ui.content.textContent, '');
  response = new TypeError('Failed to fetch');
  await ui.click();
  assert.match(ui.status.textContent, /Unable to reach/);
  response = { ok: true, json: async () => ({ source: 'sample.txt', content: 'recovered\n' }) };
  await ui.click();
  assert.equal(ui.content.textContent, 'recovered\n');
  assert.equal(ui.region.dataset.state, 'success');
});

test('malformed JSON, incorrect source and non-text content fail closed', async () => {
  for (const json of [async () => { throw new SyntaxError('Unexpected token'); }, async () => null, async () => ({ source: 'other.txt', content: 'x' }), async () => ({ source: 'sample.txt', content: 42 })]) {
    const ui = setup({ fetchImpl: async () => ({ ok: true, json }) });
    await ui.click();
    assert.equal(ui.region.dataset.state, 'error');
    assert.match(ui.status.textContent, /invalid sample response/);
    assert.equal(ui.content.hidden, true);
    assert.equal(ui.content.textContent, '');
  }
});

test('an empty file is a successful response with no placeholder substituted', async () => {
  const ui = setup({ fetchImpl: async () => ({ ok: true, json: async () => ({ source: 'sample.txt', content: '' }) }) });
  await ui.click();
  assert.equal(ui.region.dataset.state, 'success');
  assert.match(ui.status.textContent, /file is empty/);
  assert.equal(ui.content.textContent, '');
  assert.equal(ui.content.hidden, false);
});

test('a stalled fetch aborts on timeout and re-enables retry', async () => {
  const ui = setup({ fetchImpl: (_, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('Aborted')));
  }) });
  const request = ui.click();
  ui.expire();
  await request;
  assert.equal(ui.requests[0].options.signal.aborted, true);
  assert.match(ui.status.textContent, /timed out/);
  assert.equal(ui.content.hidden, true);
  assert.equal(ui.button.disabled, false);
  assert.equal(ui.timers.size, 0);
});

test('the timeout also covers reading a stalled response body', async () => {
  let reading;
  const bodyStarted = new Promise(resolve => { reading = resolve; });
  const ui = setup({ fetchImpl: async (_, options) => ({ ok: true, json: () => {
    reading();
    return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('Aborted'))));
  } }) });
  const request = ui.click();
  await bodyStarted;
  ui.expire();
  await request;
  assert.match(ui.status.textContent, /timed out/);
  assert.equal(ui.button.disabled, false);
});
