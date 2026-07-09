const { chromium } = require('playwright');

(async () => {
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    console.log('Navigating to https://whisprr.xyz/');
    await page.goto('https://whisprr.xyz/', { waitUntil: 'domcontentloaded' });

    await page.waitForTimeout(4000);

    await page.screenshot({ path: 'scratch/playwright_test/whisprr_home.png' });
    
    const html = await page.content();
    if (html.includes('Something went wrong')) {
      console.log('FOUND "Something went wrong" text on page!');
    } else {
      console.log('Did not find error boundary text.');
    }
    
    // Let's also check nexa
    console.log('Navigating to https://nexa.whisprr.xyz/');
    await page.goto('https://nexa.whisprr.xyz/', { waitUntil: 'domcontentloaded' });

    await page.waitForTimeout(4000);

    const nexaHtml = await page.content();
    if (nexaHtml.includes('Something went wrong')) {
      console.log('FOUND "Something went wrong" text on NEXA!');
    } else {
      console.log('Did not find error boundary text on NEXA.');
    }

    await browser.close();
  } catch (err) {
    console.error('Script Error:', err);
  }
})();
