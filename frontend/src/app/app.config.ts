import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { apiResponseInterceptor } from './core/interceptors/api-response.interceptor';

/**
 * Full-default Sakai theme: Aura preset, emerald primary (the configurator's
 * default). The configurator applies primary/surface palettes at runtime via
 * `$t()`/`updatePreset`, so we don't hardcode a brand palette here anymore
 * (the old ฿/blue identity is dropped).
 *
 * `formField` tokens are retained so body-level overlays (datepicker, select)
 * keep the consistent radius + focus ring that the global CSS in styles.css
 * lines up with.
 */
const ExpensesPreset = definePreset(Aura, {
  semantic: {
    formField: {
      borderRadius: 'var(--radius-sm)',
      focusRing: {
        width: '3px',
        style: 'solid',
        color: 'var(--accent-soft)',
        offset: '0',
        shadow: 'none'
      }
    }
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([jwtInterceptor, apiResponseInterceptor])
    ),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: ExpensesPreset,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark',   // toggled on <html> by LayoutService (dark-mode bridge)
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities'
          }
        }
      },
      ripple: true,
    }),
  ]
};
