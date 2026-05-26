import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .then(() => {
    const el = document.getElementById('app-boot');
    if (el) el.remove();
    // Also remove the legacy loading spinner if present
    const spinner = document.getElementById('app-loading');
    if (spinner) spinner.remove();
  })
  .catch((err) => {
    // Remove loading spinner so BOOT FAILED is visible
    const spinner = document.getElementById('app-loading');
    if (spinner) spinner.remove();
    const root = document.querySelector('app-root');
    if (root) {
      const msg = err && err.message ? err.message : String(err);
      const stack = err && err.stack ? err.stack.substring(0, 800) : '';
      root.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;color:#f87171;font-family:system-ui,sans-serif;padding:24px">
          <div style="font-size:2rem;margin-bottom:8px">&#9888; BOOT FAILED</div>
          <pre style="font-size:11px;text-align:left;background:#1e293b;padding:16px;border-radius:8px;max-width:100%;overflow:auto;color:#94a3b8;white-space:pre-wrap">${msg}${stack ? '\n\n' + stack : ''}</pre>
        </div>
      `;
    }
  });
