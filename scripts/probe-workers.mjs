/* Patch Worker before page scripts run — log every worker URL + error. */
import puppeteer from 'puppeteer-core';

const EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await puppeteer.launch({
  executablePath: EXE, headless: true,
  args: ['--use-gl=angle', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });

await page.evaluateOnNewDocument(() => {
  const Orig = window.Worker;
  // @ts-expect-error
  window.Worker = class extends Orig {
    constructor(url, opts) {
      console.log('[WORKER-NEW]', String(url), JSON.stringify(opts));
      super(url, opts);
      this.addEventListener('error', (e) => {
        console.log('[WORKER-ERR]', String(url), e.message, e.filename, e.lineno, e.colno);
      });
      this.addEventListener('messageerror', (e) => console.log('[WORKER-MSGERR]', String(url), String(e.data)));
    }
  };
});
page.on('console', (m) => {
  const t = m.text();
  if (t.startsWith('[WORKER') || t.includes('Error') || t.includes('Refused')) console.log(t.slice(0, 300));
});
await page.goto(process.env.URL || 'http://localhost:3100/', { waitUntil: 'networkidle2', timeout: 120000 });
await new Promise((r) => setTimeout(r, 8000));
await browser.close();
