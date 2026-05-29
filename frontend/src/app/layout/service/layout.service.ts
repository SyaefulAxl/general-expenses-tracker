import { Injectable, effect, signal, computed } from '@angular/core';

export interface LayoutConfig {
    preset: string;
    primary: string;
    surface: string | undefined | null;
    darkTheme: boolean;
    menuMode: string;
}

interface LayoutState {
    staticMenuDesktopInactive: boolean;
    overlayMenuActive: boolean;
    configSidebarVisible: boolean;
    mobileMenuActive: boolean;
    menuHoverActive: boolean;
    activePath: string | null;
}

/**
 * Persisted theme key shared with the rest of the General Expenses app.
 * The feature pages style off `:root.dark` and PrimeNG's darkModeSelector
 * is `.dark`, so the dark-mode bridge below toggles `.dark` (NOT Sakai's
 * default `.app-dark`) — one toggle flips both the Sakai shell and the GE
 * feature-page tokens.
 */
const THEME_STORAGE_KEY = 'gen_expenses_theme';

function readPersistedDark(): boolean {
    try {
        return localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
    } catch {
        return false;
    }
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    layoutConfig = signal<LayoutConfig>({
        preset: 'Aura',
        primary: 'emerald',
        surface: null,
        darkTheme: readPersistedDark(),
        menuMode: 'static'
    });

    layoutState = signal<LayoutState>({
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        configSidebarVisible: false,
        mobileMenuActive: false,
        menuHoverActive: false,
        activePath: null
    });

    theme = computed(() => (this.layoutConfig().darkTheme ? 'light' : 'dark'));

    isSidebarActive = computed(() => this.layoutState().overlayMenuActive || this.layoutState().mobileMenuActive);

    isDarkTheme = computed(() => this.layoutConfig().darkTheme);

    getPrimary = computed(() => this.layoutConfig().primary);

    getSurface = computed(() => this.layoutConfig().surface);

    isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

    transitionComplete = signal<boolean>(false);

    private initialized = false;

    constructor() {
        // Seed the DOM class from the persisted choice on startup so the very
        // first paint (and any feature page) already has the right theme — this
        // replaces the old `app.ts` localStorage restore logic.
        this.applyDarkClass(this.layoutConfig().darkTheme);

        effect(() => {
            const config = this.layoutConfig();

            if (!this.initialized || !config) {
                this.initialized = true;
                return;
            }

            this.handleDarkModeTransition(config);
        });
    }

    private handleDarkModeTransition(config: LayoutConfig): void {
        const supportsViewTransition = 'startViewTransition' in document;

        if (supportsViewTransition) {
            this.startViewTransition(config);
        } else {
            this.toggleDarkMode(config);
        }
    }

    private startViewTransition(config: LayoutConfig): void {
        document.startViewTransition(() => {
            this.toggleDarkMode(config);
        });
    }

    /**
     * Dark-mode bridge: toggles `.dark` on <html> (matching PrimeNG
     * darkModeSelector + GE `:root.dark` feature tokens) and persists the
     * choice to localStorage under the shared `gen_expenses_theme` key.
     */
    toggleDarkMode(config?: LayoutConfig): void {
        const _config = config || this.layoutConfig();
        this.applyDarkClass(_config.darkTheme);
    }

    private applyDarkClass(dark: boolean): void {
        if (dark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        try {
            localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
        } catch {
            /* localStorage unavailable — ignore, theme still applied to DOM */
        }
    }

    onMenuToggle() {
        if (this.isOverlay()) {
            this.layoutState.update((prev) => ({ ...prev, overlayMenuActive: !this.layoutState().overlayMenuActive }));
        }

        if (this.isDesktop()) {
            this.layoutState.update((prev) => ({ ...prev, staticMenuDesktopInactive: !this.layoutState().staticMenuDesktopInactive }));
        } else {
            this.layoutState.update((prev) => ({ ...prev, mobileMenuActive: !this.layoutState().mobileMenuActive }));
        }
    }

    showConfigSidebar() {
        this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: true }));
    }

    hideConfigSidebar() {
        this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: false }));
    }

    isDesktop() {
        return window.innerWidth > 991;
    }

    isMobile() {
        return !this.isDesktop();
    }
}
