export type CategoryTone = 'accent' | 'warning' | 'info' | 'danger' | 'neutral';

export interface CategoryStyle {
  icon: string;   // PrimeIcon class without the 'pi pi-' prefix, e.g. 'pi-car'
  tone: CategoryTone;
}

const STYLES: Record<string, CategoryStyle> = {
  Transport:     { icon: 'pi-car',           tone: 'accent'  },
  Food:          { icon: 'pi-shopping-bag',  tone: 'warning' },
  Accommodation: { icon: 'pi-home',          tone: 'info'    },
  Entertainment: { icon: 'pi-ticket',        tone: 'danger'  },
  Other:         { icon: 'pi-box',           tone: 'neutral' },
};

export function categoryStyle(category: string | undefined | null): CategoryStyle {
  return STYLES[category ?? ''] ?? STYLES['Other'];
}
