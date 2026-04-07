// ============================================================
//  Staff Portal – Anthropic API Proxy
//  Deploy this to Cloudflare Workers (free plan is fine)
// ============================================================

export default {
  async fetch(request, env) {

    // ── Allow your GitHub Pages site to call this worker ──
    // Replace the URL below with your actual GitHub Pages URL
    const ALLOWED_ORIGIN = 'https://obrienben202.github.io/staff_portal/index.html';

    // ── Handle browser pre-flight (CORS) ──
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // ── Only accept POST requests ──
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // ── Forward the request to Anthropic ──
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,   // stored as a secret in Cloudflare
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await anthropicResponse.json();

    // ── Return the response back to your chatbot ──
    return new Response(JSON.stringify(data), {
      status: anthropicResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      },
    });
  },
};