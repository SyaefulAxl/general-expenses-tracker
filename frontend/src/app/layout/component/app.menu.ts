import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppMenuitem, LayoutMenuItem } from './app.menuitem';
import { AuthService } from '@core/services/auth.service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        @for (item of model(); track item.label) {
            @if (!item.separator) {
                <li app-menuitem [item]="item" [root]="true"></li>
            } @else {
                <li class="menu-separator"></li>
            }
        }
    </ul> `
})
export class AppMenu {
    private authService = inject(AuthService);

    /**
     * Reactive menu model. The Admin entry is only visible to ADMIN users —
     * `visible` is read by AppMenuitem so the item is filtered out for members.
     */
    model = computed<LayoutMenuItem[]>(() => {
        const isAdmin = this.authService.currentUser()?.role === 'ADMIN';
        return [
            {
                label: 'Menu',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] },
                    { label: 'Pengeluaran', icon: 'pi pi-fw pi-wallet', routerLink: ['/expenses'] },
                    { label: 'Pinjaman', icon: 'pi pi-fw pi-credit-card', routerLink: ['/loans'] },
                    { label: 'Riwayat', icon: 'pi pi-fw pi-clock', routerLink: ['/history'] },
                    { label: 'Admin', icon: 'pi pi-fw pi-users', routerLink: ['/admin'], visible: isAdmin }
                ]
            }
        ];
    });
}
