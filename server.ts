import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Example API route for video generation
  app.post("/api/generate-video", async (req, res) => {
    try {
        const { prompt } = req.body;
        // Placeholder implementation for starting video gen
        const operation = await ai.models.generateVideos({
            model: 'veo-3.1-lite-generate-preview',
            prompt: prompt || 'A neon hologram of a cat driving at top speed',
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });
        res.json({ operationName: operation.name });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
  });

  // Example API route for status polling
  app.post("/api/video-status", async (req, res) => {
      try {
          const { operationName } = req.body;
          const op = new GenerateVideosOperation();
          op.name = operationName;
          const updated = await ai.operations.getVideosOperation({ operation: op });
          res.json({ done: updated.done });
      } catch (e) {
          res.status(500).json({ error: e.message });
      }
  });

  // Example API route for streaming download
  app.post("/api/video-download", async (req, res) => {
      try {
          const { operationName } = req.body;
          const op = new GenerateVideosOperation();
          op.name = operationName;
          const updated = await ai.operations.getVideosOperation({ operation: op });
          const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
          
          if (!uri) throw new Error("No video URI found");
          
          const videoRes = await fetch(uri, {
              headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY! },
          });
          
          res.setHeader('Content-Type', 'video/mp4');
          if (videoRes.body) {
              const reader = videoRes.body.getReader();
              while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  res.write(value);
              }
          }
          res.end();
      } catch (e) {
          res.status(500).json({ error: e.message });
      }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
