/* Headless smoke test — drives the prod build, captures console + failed
 * requests + whether the map canvas actually initialized. */
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL_ = process.env.URL || 'http://localhost:3100/';

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: true, // full new headless — 'shell' lacks module workers
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });

const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text().slice(0, 400)}`));
page.on('pageerror', (e) => logs.push(`[PAGEERROR] ${String(e).slice(0, 400)}`));
page.on('requestfailed', (r) =>
  logs.push(`[REQFAIL] ${r.url().slice(0, 140)} — ${r.failure()?.errorText}`),
);
page.on('response', (r) => {
  if (r.status() >= 400)
    logs.push(`[HTTP${r.status()}] ${r.url().slice(0, 140)}`);
});

await page.goto(URL_, { waitUntil: 'networkidle2', timeout: 120_000 });
await new Promise((r) => setTimeout(r, 8000));

const state = await page.evaluate(() => {
  const canvas = document.querySelector('.maplibregl-canvas');
  const mapEl = document.querySelector('.maplibregl-map');
  const sm = window.__sitrepMap;
  return {
    hasCanvas: !!canvas,
    canvasSize: canvas ? `${canvas.width}x${canvas.height}` : null,
    canvasStyleSize: canvas ? `${canvas.style.width}x${canvas.style.height}` : null,
    // A collapsed container (0px map element, 300px default canvas) is the
    // "blank center" failure mode — assert the map fills its parent.
    mapElHeight: mapEl ? Math.round(mapEl.getBoundingClientRect().height) : 0,
    parentHeight: mapEl?.parentElement
      ? Math.round(mapEl.parentElement.getBoundingClientRect().height)
      : 0,
    mapClasses: mapEl ? mapEl.className : null,
    mapboxglLoaded: !!mapEl,
    styleLoaded: sm ? sm.isStyleLoaded() : null,
    layers: sm ? sm.getStyle()?.layers?.length : null,
    eventFeatures: sm?.getSource('events') ? 'source-present' : 'missing',
    webgl:
      !!document.createElement('canvas').getContext('webgl2') ||
      !!document.createElement('canvas').getContext('webgl'),
    eventsApi: null,
  };
});
const ev = await page.evaluate(async () => {
  try {
    const r = await fetch('/api/v1/events?limit=3');
    const j = await r.json();
    return { status: r.status, count: j.data?.length };
  } catch (e) {
    return { error: String(e) };
  }
});
state.eventsApi = ev;

console.log('STATE:', JSON.stringify(state, null, 1));
console.log('LOGS:');
for (const l of logs.slice(0, 60)) console.log(' ', l);

const failures = [];
if (!state.hasCanvas) failures.push('no canvas');
if (state.styleLoaded !== true) failures.push('style not loaded');
if ((state.mapElHeight ?? 0) < 400 || state.mapElHeight < (state.parentHeight ?? 0) - 8)
  failures.push(`map element collapsed (${state.mapElHeight}px of ${state.parentHeight}px)`);
console.log(failures.length ? `FAIL: ${failures.join('; ')}` : 'PASS');
await browser.close();
process.exit(failures.length ? 1 : 0);
