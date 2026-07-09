const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    console.log('Navigating to http://localhost:5173/');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    await page.waitForTimeout(2000);

    const html = await page.content();
    if (html.includes('Something went wrong')) {
      console.log('FOUND "Something went wrong" text on page!');
    } else {
      console.log('Did not find error boundary text.');
    }

    await browser.close();
  } catch (err) {
    console.error('Script Error:', err);
  }
})();
