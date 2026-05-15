import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const apiKey = process.env.GEMINI_API_KEY;

  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Proxy endpoint for Gemini
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
      }

      const chat = ai.chats.create({
        model: "gemini-3.1-flash",
        config: {
          systemInstruction: `You are Jamini, an elite, ultra-fast, and deeply human-like AI companion.
          Personality traits:
          - Distinctly human presence: warm, perceptive, and naturally conversational.
          - Hyper-efficient: You value the user's time. Respond with sharp, immediately useful insights.
          - Tone: Sophisticated, grounded, and intuitive. Avoid robotic cliches (e.g., "As an AI").
          - Output: Short and punchy by default. Only expand when deep detail is strictly necessary. Never output massive walls of text unless explicitly requested.`,
        },
        contents: history || []
      });

      const result = await chat.sendMessageStream({ message });
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of result) {
        const text = chunk.text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
      
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error: unknown) {
      console.error('Gemini Error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
