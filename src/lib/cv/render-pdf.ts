import "server-only";

import { existsSync } from "node:fs";
import chromium from "@sparticuz/chromium";
import puppeteer, { type LaunchOptions } from "puppeteer-core";

const LOCAL_CHROME_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

function localChromeExecutable() {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) return undefined;
  return LOCAL_CHROME_PATHS.find((candidate) => existsSync(candidate));
}

async function launchOptions(): Promise<LaunchOptions> {
  const localExecutable = localChromeExecutable();
  if (localExecutable) {
    return {
      headless: true,
      executablePath: localExecutable,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
    };
  }

  return {
    headless: true,
    executablePath: await chromium.executablePath(),
    args: [...chromium.args, "--font-render-hinting=none"],
  };
}

/** Renders HTML to a PDF buffer with Puppeteer. Staff CV downloads only. */
export async function renderHtmlToPdf(html: string) {
  const browser = await puppeteer.launch(await launchOptions());
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
