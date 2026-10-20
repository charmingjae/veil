// What the capture scripts share: serving the built playground and opening it ready to capture.

import type { Browser, Page } from "playwright";

import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname } from "node:path";

const OUT_DIR = new URL("../apps/playground/out/", import.meta.url);
const PORT = 4321;
// The size the content is set to, so every capture shows the veil at the same size, in CSS pixels.
export const TILE_WIDTH = 240;
export const TILE_HEIGHT = 140;

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};

// Serves the static export, the way GitHub Pages would at the root of a site. Close the returned
// server when done.
export const servePlayground = async () => {
  const server = createServer(async (request, response) => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    const file = new URL(`.${path.endsWith("/") ? `${path}index.html` : path}`, OUT_DIR);
    try {
      const body = await readFile(file);
      response.writeHead(200, {
        "content-type": CONTENT_TYPES[extname(file.pathname)] ?? "application/octet-stream",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  return server;
};

// Opens the playground with the sidebar open and the content sized to a tile. `beforeLoad` runs
// before the page's own scripts, for anything that has to be in place first.
export const openPlayground = async (
  browser: Browser,
  deviceScaleFactor: number,
  beforeLoad?: (page: Page) => Promise<void>,
) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor });
  await beforeLoad?.(page);
  await page.goto(`http://localhost:${PORT}/`);

  // The controls live in the sidebar, which starts closed.
  await page.getByRole("button", { name: "Toggle Sidebar" }).click();
  await page.getByLabel("Width").fill(String(TILE_WIDTH));
  await page.getByLabel("Height").fill(String(TILE_HEIGHT));
  return page;
};

// The veil is the cover canvas's parent; its box is the content's size.
export const getVeil = (page: Page) => page.locator("canvas").first().locator("..");
