# JAMINI Studio - Vercel Deployment & Setup Guide

This guide explains how to deploy JAMINI Studio to Vercel and configure multiple API keys to automatically handle quota limits.

## Deploying to Vercel

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com) and click **Add New... > Project**.
3. Import your GitHub repository.
4. Vercel will automatically detect that this is a **Vite** project.
5. Before clicking "Deploy", configure your Environment Variables (see below).

## Configuring Multiple API Keys (Quota Management)

To prevent your application from stopping when a single Gemini API key hits its rate limit or quota, you can provide multiple API keys. The application will automatically rotate to the next key if a "Quota Exceeded" or "Too Many Requests" (429) error occurs.

### Setting up the Environment Variable

In your Vercel project settings (Settings > Environment Variables), add a new variable:

*   **Key:** `VITE_GEMINI_API_KEYS`
*   **Value:** A comma-separated list of your Gemini API keys.
    *   *Example:* `AIzaSyA...,AIzaSyB...,AIzaSyC...`

*(Note: You can also use `VITE_GEMINI_API_KEY` for a single key, but `VITE_GEMINI_API_KEYS` is required for the multi-key rotation feature).*

### How it Works

1. The app reads the `VITE_GEMINI_API_KEYS` variable and splits it into a list of available keys.
2. It uses the first key for all requests by default.
3. If the Gemini API returns a `429 Too Many Requests` or `Resource Exhausted` error, the app automatically catches it.
4. It switches to the next key in the list and retries the exact same request seamlessly.
5. This process continues until a request succeeds or all keys have exhausted their quotas.

## Local Development

To use multiple keys locally, create a `.env` file in the root of your project:

```env
VITE_GEMINI_API_KEYS="your_first_key,your_second_key,your_third_key"
```
