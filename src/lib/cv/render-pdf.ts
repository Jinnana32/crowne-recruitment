import "server-only";

import { existsSync } from "node:fs";
import puppeteer, { type LaunchOptions } from "puppeteer";

function chromeExecutable() {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const mac = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (existsSync(mac)) return mac;
  return undefined;
}

/** Renders HTML to a PDF buffer with Puppeteer. Staff CV downloads only. */
export async function renderHtmlToPdf(html: string) {
  const executablePath = chromeExecutable();
  const options: LaunchOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
    ...(executablePath ? { executablePath } : {}),
  };
  const browser = await puppeteer.launch(options);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
