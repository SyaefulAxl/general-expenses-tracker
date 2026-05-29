export type CategoryTone = 'accent' | 'warning' | 'info' | 'danger' | 'neutral';

export interface CategoryStyle {
  icon: string;   // PrimeIcon class without the 'pi pi-' prefix, e.g. 'pi-car'
  tone: CategoryTone;
}

const STYLES: Record<string, CategoryStyle> = {
  // Kategori Bahasa Indonesia
  Travelling:    { icon: 'pi-car',           tone: 'accent'  },
  Makan:         { icon: 'pi-shopping-bag',  tone: 'warning' },
  Grosir:        { icon: 'pi-shopping-cart', tone: 'info'    },
  Belanja:       { icon: 'pi-tags',          tone: 'accent'  },
  Entertainment: { icon: 'pi-ticket',        tone: 'danger'  },
  Lainnya:       { icon: 'pi-box',           tone: 'neutral' },
  // Legacy English keys (back-compat with older stored data)
  Transport:     { icon: 'pi-car',           tone: 'accent'  },
  Food:          { icon: 'pi-shopping-bag',  tone: 'warning' },
  Accommodation: { icon: 'pi-home',          tone: 'info'    },
  Other:         { icon: 'pi-box',           tone: 'neutral' },
};

export function categoryStyle(category: string | undefined | null): CategoryStyle {
  return STYLES[category ?? ''] ?? STYLES['Lainnya'];
}
