import puppeteer from 'puppeteer';
import config from '../config.js';

let browserPromise = null;

export async function getBrowser() {
  if (!browserPromise) {
    const launchOptions = {
      headless: true,
      args: config.puppeteerArgs
    };
    if (config.puppeteerExecutablePath) {
      launchOptions.executablePath = config.puppeteerExecutablePath;
    }
    browserPromise = puppeteer.launch(launchOptions).catch((error) => {
      browserPromise = null;
      throw error;
    });
  }
  return browserPromise;
}

export async function withPage(fn) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(config.userAgent);
  await page.setViewport({ width: 1280, height: 720 });
  try {
    return await fn(page);
  } finally {
    await page.close();
  }
}

export async function closeBrowser() {
  if (!browserPromise) return;
  const pending = browserPromise;
  browserPromise = null;
  try {
    const browser = await pending;
    await browser.close();
  } catch {
    // Browser may fail to launch in restricted environments; ignore on shutdown.
  }
}
