import { Component, computed, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { AuthService } from '@core/services/auth.service';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AvatarComponent, AppConfigurator],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/dashboard">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <rect x="1.5" y="1.5" width="29" height="29" rx="8" stroke="var(--primary-color)" stroke-width="3" />
                    <path d="M11 16h10M16 11v10" stroke="var(--primary-color)" stroke-width="3" stroke-linecap="round" />
                </svg>
                <span>Expenses</span>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()" title="Ganti tema">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        type="button"
                        class="layout-topbar-action"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                        title="Atur tema">
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    @if (user(); as currentUser) {
                        <div class="topbar-user-chip">
                            <app-avatar [name]="currentUser.name" size="sm" />
                            <div class="topbar-user-meta">
                                <span class="topbar-user-name">{{ currentUser.name }}</span>
                                <span class="badge" [class.badge-blue]="currentUser.role === 'ADMIN'" [class.badge-gray]="currentUser.role !== 'ADMIN'">
                                    {{ currentUser.role }}
                                </span>
                            </div>
                        </div>
                    }
                    <button type="button" class="topbar-logout" (click)="logout()" title="Keluar">
                        <i class="pi pi-sign-out"></i>
                        <span>Keluar</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`,
    styles: [
        `
            /* The configurator anchors to this wrapper. \`relative\` is a Tailwind
               utility this build does not generate, so define it explicitly. */
            .relative { position: relative; }

            .topbar-user-chip {
                display: inline-flex;
                align-items: center;
                gap: 0.55rem;
                padding: 3px 12px 3px 3px;
                background: var(--surface-muted);
                border: 1px solid var(--border);
                border-radius: 999px;
            }

            .topbar-user-meta {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
            }

            .topbar-user-name {
                font-size: 0.85rem;
                font-weight: 600;
                color: var(--text);
                white-space: nowrap;
            }

            .topbar-logout {
                display: inline-flex;
                align-items: center;
                gap: 0.45rem;
                height: 2.25rem;
                padding: 0 0.9rem;
                border-radius: 999px;
                background: transparent;
                border: 1px solid var(--border);
                color: var(--text-muted);
                font-family: inherit;
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.15s, color 0.15s, border-color 0.15s;
            }

            .topbar-logout:hover {
                background: var(--danger-soft);
                color: var(--danger);
                border-color: transparent;
            }

            .topbar-logout i {
                font-size: 0.95rem;
            }

            /* Mobile dropdown: stack full-width like the rest of the menu. */
            @media (max-width: 991px) {
                .topbar-user-chip {
                    width: 100%;
                }
                .topbar-logout {
                    width: 100%;
                    justify-content: flex-start;
                    height: auto;
                    padding: 0.55rem 1rem;
                }
            }
        `
    ]
})
export class AppTopbar {
    layoutService = inject(LayoutService);

    private authService = inject(AuthService);

    private router = inject(Router);

    user = computed(() => this.authService.currentUser());

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }

    logout(): void {
        this.authService.logout();
        void this.router.navigate(['/login']);
    }
}
