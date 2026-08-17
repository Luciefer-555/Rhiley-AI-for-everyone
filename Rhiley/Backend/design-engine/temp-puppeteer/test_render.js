const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const consoleLogs = [];
  const pageErrors = [];

  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => pageErrors.push(err.toString()));

  await page.setViewport({ width: 1280, height: 800 });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: 'screenshot.png', fullPage: true });
    console.log('--- PAGE ERRORS ---');
    console.log(pageErrors.length ? pageErrors.join('\n') : 'None');
    console.log('--- CONSOLE LOGS ---');
    console.log(consoleLogs.length ? consoleLogs.join('\n') : 'None');
    console.log('Screenshot saved to screenshot.png');
  } catch (e) {
    console.error('Failed to load page:', e.message);
  } finally {
    await browser.close();
  }
})();
