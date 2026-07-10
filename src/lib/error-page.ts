export function renderErrorPage(): string {
  // Server-side catastrophic 500 fallback: a standalone HTML document with
  // inline styles (the app stylesheet + token layer may not be reachable at
  // this point), so it uses literal hex values that mirror the Obsidian dark
  // tokens (canvas #0A0A0B, ink #F2F0ED, ember #FF6B2C). Copy matches the
  // client error boundary for a consistent voice. No raw stack is ever shown.
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { color-scheme: dark; }
      body { font: 15px/1.55 "Geist", ui-sans-serif, system-ui, -apple-system, sans-serif; background: #0a0a0b; color: #f2f0ed; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 26rem; width: 100%; text-align: center; padding: 2rem; }
      .mark { display: flex; justify-content: center; margin-bottom: 1.25rem; }
      h1 { font-size: 1.35rem; font-weight: 600; margin: 0 0 0.5rem; letter-spacing: -0.01em; }
      p { color: #9c978f; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.5rem; font: inherit; font-size: 0.8125rem; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #ff6b2c; color: #160903; font-weight: 600; }
      .secondary { background: transparent; color: #c6c0b8; border-color: rgba(255,255,255,0.09); }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="mark" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 24 24">
          <path d="M 12.9 11.2 C 13.6 7.6 16.4 4.9 19.1 4.9 C 21.2 4.9 21.9 6.6 21.0 8.6 C 20.0 10.8 16.9 12.4 13.4 12.2 Z" fill="#ff6b2c" opacity="0.9" />
          <path d="M 13.2 12.9 C 16.1 12.9 18.6 14.3 19.2 16.2 C 19.7 17.9 18.4 19.1 16.5 18.6 C 14.6 18.1 13.1 16.0 12.9 13.4 Z" fill="#e8b44c" opacity="0.9" />
          <path d="M 12.9 11.2 C 13.6 7.6 16.4 4.9 19.1 4.9 C 21.2 4.9 21.9 6.6 21.0 8.6 C 20.0 10.8 16.9 12.4 13.4 12.2 Z" fill="#ff6b2c" opacity="0.9" transform="scale(-1 1) translate(-24 0)" />
          <path d="M 13.2 12.9 C 16.1 12.9 18.6 14.3 19.2 16.2 C 19.7 17.9 18.4 19.1 16.5 18.6 C 14.6 18.1 13.1 16.0 12.9 13.4 Z" fill="#e8b44c" opacity="0.9" transform="scale(-1 1) translate(-24 0)" />
          <path d="M 12 6.8 C 12.35 8.2 12.35 15.8 12 18.0 C 11.65 15.8 11.65 8.2 12 6.8 Z" fill="#f2f0ed" opacity="0.95" />
          <circle cx="12" cy="6.1" r="0.95" fill="#f2f0ed" opacity="0.95" />
        </svg>
      </div>
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. Try again, or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
