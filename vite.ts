import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function serveStatic(app: express.Express) {
  const clientDir = path.resolve(__dirname, "../dist/public");

  app.use(express.static(clientDir));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(clientDir, "index.html"));
  });
}

export async function setupVite(app: express.Express, server: any) {
  const { createServer: createViteServer } = await import("vite");

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });

  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
}