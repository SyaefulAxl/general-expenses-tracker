import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Thin application root. The Sakai shell (topbar / sidebar / menu / footer) is
 * now a routed component (AppLayout) wrapping the authenticated feature pages,
 * so the root only hosts the router outlet. Theme restoration from
 * localStorage is owned by LayoutService (the dark-mode bridge), not here.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
})
export class App {}
