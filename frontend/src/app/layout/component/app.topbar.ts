import { Component, computed, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { AuthService } from '@core/services/auth.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator],
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
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
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
                            <span class="topbar-user-name">{{ currentUser.name }}</span>
                            <span class="badge" [class.badge-blue]="currentUser.role === 'ADMIN'" [class.badge-gray]="currentUser.role !== 'ADMIN'">
                                {{ currentUser.role }}
                            </span>
                        </div>
                    }
                    <button type="button" class="layout-topbar-action" (click)="logout()" title="Keluar">
                        <i class="pi pi-sign-out"></i>
                        <span>Keluar</span>
                    </button>
                </div>
            </div>
        </div>
    </div>`,
    styles: [
        `
            .topbar-user-chip {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0 0.5rem;
            }

            .topbar-user-name {
                font-size: 0.9rem;
                font-weight: 600;
                color: var(--text-color);
                white-space: nowrap;
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
