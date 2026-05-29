import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ButtonModule } from 'primeng/button';
import { Expense, ExpenseStatus, ExpenseType, EXPENSE_CATEGORIES } from '@core/models';
import { fmtUsd, fmtIdr } from '@core/utils/currency.utils';
import { categoryStyle, CategoryStyle } from '@core/utils/category-style';

export interface ExpenseFormData {
  id?: number;
  expenseDate: Date | null;
  toko: string;
  description: string;
  amount: number | null;
  category: string;
  type: ExpenseType;
  source: string;
  shared: boolean;
  status: ExpenseStatus;
}

export const EMPTY_FORM: ExpenseFormData = {
  expenseDate: new Date(),
  toko: '',
  description: '',
  amount: null,
  category: 'Makan',
  type: 'PERSONAL',
  source: 'Cash',
  shared: false,
  status: 'DRAFT',
};

const CATEGORIES = [...EXPENSE_CATEGORIES];
const SOURCES    = ['Cash', 'Credit Card', 'Debit Card', 'Transfer', 'Winda Cash'];

const SOURCE_ICONS: Record<string, string> = {
  'Cash':        'pi-money-bill',
  'Credit Card': 'pi-credit-card',
  'Debit Card':  'pi-credit-card',
  'Transfer':    'pi-arrow-right-arrow-left',
  'Winda Cash':  'pi-wallet',
};

interface CategoryOption {
  label: string;
  value: string;
  style: CategoryStyle;
}

interface SourceOption {
  label: string;
  value: string;
  icon: string;
}

interface TypeOption {
  label: string;
  value: ExpenseType;
  icon: string;
}

export function toFormData(exp: Expense): ExpenseFormData {
  return {
    id: exp.id,
    expenseDate: exp.expenseDate ? new Date(exp.expenseDate) : new Date(),
    toko: exp.toko ?? '',
    description: exp.description,
    amount: exp.amount,
    category: exp.category,
    type: exp.type ?? 'PERSONAL',
    source: exp.source ?? 'Cash',
    shared: exp.shared ?? false,
    status: exp.status,
  };
}

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DialogModule,
    InputTextModule, InputNumberModule, SelectModule, DatePickerModule,
    CheckboxModule, ToggleSwitchModule,
    InputGroupModule, InputGroupAddonModule, ButtonModule,
  ],
  template: `
    <p-dialog
      [visible]="open"
      (visibleChange)="openChange.emit($event)"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="true"
      [showHeader]="false"
      [style]="{ width: '580px', maxWidth: '94vw' }"
      contentStyleClass="ef-dialog-content"
      styleClass="ef-dialog"
      appendTo="body">

      <!-- ── Header band ─────────────────────────────────────── -->
      <header class="ef-head">
        <span class="ef-head-icon" [class]="'tone-' + activeCategory().style.tone">
          <i class="pi" [class]="activeCategory().style.icon"></i>
        </span>
        <div class="ef-head-text">
          <h2 class="ef-head-title">{{ form.id ? 'Edit Pengeluaran' : 'Tambah Pengeluaran' }}</h2>
          <p class="ef-head-sub">{{ form.id
            ? 'Perbarui rincian pengeluaran ini.'
            : 'Catat pengeluaran baru. Mulai sebagai Draf.' }}</p>
        </div>
        <button type="button" class="ef-head-close" (click)="openChange.emit(false)" aria-label="Tutup">
          <i class="pi pi-times"></i>
        </button>
      </header>

      <!-- ── Body ────────────────────────────────────────────── -->
      <div class="ef-body">

        <!-- Tanggal + Toko -->
        <div class="ef-grid-2">
          <div class="ef-field">
            <label class="ef-label" for="ef-date">Tanggal <span class="ef-req">*</span></label>
            <p-datepicker
              inputId="ef-date"
              [(ngModel)]="form.expenseDate"
              [showIcon]="true"
              iconDisplay="input"
              dateFormat="dd M yy"
              placeholder="Pilih tanggal"
              [maxDate]="today"
              appendTo="body"
              styleClass="ef-w-full">
            </p-datepicker>
          </div>
          <div class="ef-field">
            <label class="ef-label" for="ef-toko">Toko</label>
            <p-inputgroup>
              <p-inputgroup-addon><i class="pi pi-shop"></i></p-inputgroup-addon>
              <input pInputText id="ef-toko" type="text" [(ngModel)]="form.toko" placeholder="cth. Seven 11" />
            </p-inputgroup>
          </div>
        </div>

        <!-- Deskripsi -->
        <div class="ef-field">
          <label class="ef-label" for="ef-desc">Deskripsi <span class="ef-req">*</span></label>
          <p-inputgroup>
            <p-inputgroup-addon><i class="pi pi-align-left"></i></p-inputgroup-addon>
            <input pInputText id="ef-desc" type="text" [(ngModel)]="form.description"
                   placeholder="Untuk apa pengeluaran ini?" />
          </p-inputgroup>
        </div>

        <!-- Jumlah — prominent -->
        <div class="ef-field ef-amount-field">
          <label class="ef-label" for="ef-amount">Jumlah <span class="ef-cur-tag">THB</span> <span class="ef-req">*</span></label>
          <div class="ef-amount-shell" [class.is-empty]="!hasAmount()">
            <span class="ef-amount-sym">฿</span>
            <p-inputnumber
              inputId="ef-amount"
              [(ngModel)]="form.amount"
              mode="decimal"
              [minFractionDigits]="2"
              [maxFractionDigits]="2"
              [min]="0"
              placeholder="0.00"
              styleClass="ef-amount-input">
            </p-inputnumber>
          </div>
          <div class="ef-fx" [class.is-on]="hasAmount()">
            <span class="ef-fx-pill tone-success num">≈ {{ fmtUsd(form.amount) }}</span>
            <span class="ef-fx-pill tone-accent num">≈ {{ fmtIdr(form.amount) }}</span>
          </div>
        </div>

        <!-- Kategori + Sumber Dana -->
        <div class="ef-grid-2">
          <div class="ef-field">
            <label class="ef-label" for="ef-cat">Kategori <span class="ef-req">*</span></label>
            <p-select
              inputId="ef-cat"
              [(ngModel)]="categoryModel"
              [options]="categoryOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Pilih kategori"
              appendTo="body"
              styleClass="ef-w-full">
              <ng-template #selectedItem let-opt>
                @if (opt) {
                  <span class="ef-opt">
                    <i class="ef-opt-ic pi" [class]="opt.style.icon + ' tone-' + opt.style.tone"></i>
                    <span>{{ opt.label }}</span>
                  </span>
                }
              </ng-template>
              <ng-template #item let-opt>
                <span class="ef-opt">
                  <i class="ef-opt-ic pi" [class]="opt.style.icon + ' tone-' + opt.style.tone"></i>
                  <span>{{ opt.label }}</span>
                </span>
              </ng-template>
            </p-select>
          </div>
          <div class="ef-field">
            <label class="ef-label" for="ef-src">Sumber Dana</label>
            <p-select
              inputId="ef-src"
              [(ngModel)]="form.source"
              [options]="sourceOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Pilih sumber"
              appendTo="body"
              styleClass="ef-w-full">
              <ng-template #selectedItem let-opt>
                @if (opt) {
                  <span class="ef-opt"><i class="ef-opt-ic pi" [class]="opt.icon"></i><span>{{ opt.label }}</span></span>
                }
              </ng-template>
              <ng-template #item let-opt>
                <span class="ef-opt"><i class="ef-opt-ic pi" [class]="opt.icon"></i><span>{{ opt.label }}</span></span>
              </ng-template>
            </p-select>
          </div>
        </div>

        <!-- Tipe — custom segmented control (full control, no Aura internals) -->
        <div class="ef-field">
          <label class="ef-label">Tipe <span class="ef-req">*</span></label>
          <div class="ef-seg" role="group" aria-label="Tipe pengeluaran">
            @for (opt of typeOptions; track opt.value) {
              <button type="button" class="ef-seg-btn" [class.is-active]="form.type === opt.value"
                      (click)="form.type = opt.value">
                <i class="pi" [class]="opt.icon"></i>
                <span>{{ opt.label }}</span>
              </button>
            }
          </div>
          <small class="ef-hint">
            <i class="pi pi-info-circle"></i>
            Resmi (official) bisa di-export untuk reimburse kantor.
          </small>
        </div>

        <!-- Shared toggle card -->
        <button type="button" class="ef-toggle-card" [class.is-on]="form.shared"
                (click)="form.shared = !form.shared">
          <span class="ef-toggle-ic"><i class="pi pi-users"></i></span>
          <span class="ef-toggle-text">
            <span class="ef-toggle-title">Dibagi dengan anggota tim</span>
            <span class="ef-toggle-sub">Aktifkan jika pengeluaran ini ditanggung bersama.</span>
          </span>
          <p-toggleswitch [(ngModel)]="form.shared" (click)="$event.stopPropagation()" />
        </button>
      </div>

      <!-- ── Footer ──────────────────────────────────────────── -->
      <footer class="ef-foot">
        <button type="button" class="ef-cancel" (click)="openChange.emit(false)">Batal</button>
        <p-button
          [label]="form.id ? 'Simpan Perubahan' : 'Tambah Pengeluaran'"
          [icon]="form.id ? 'pi pi-check' : 'pi pi-plus'"
          [disabled]="!isValid()"
          (onClick)="onSave()"
          styleClass="ef-submit" />
      </footer>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep .ef-dialog { border-radius: var(--radius-lg) !important; overflow: hidden !important; }
    :host ::ng-deep .ef-dialog .ef-dialog-content { padding: 0 !important; background: var(--surface) !important; }

    /* ── Header band ───────────────────────────────────────── */
    .ef-head {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 22px;
      background:
        linear-gradient(180deg, var(--surface-muted) 0%, var(--surface) 100%);
      border-bottom: 1px solid var(--border);
    }
    .ef-head-icon {
      flex-shrink: 0; width: 46px; height: 46px;
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: var(--radius); font-size: 1.2rem;
      transition: background 0.2s, color 0.2s;
    }
    .ef-head-text  { flex: 1; min-width: 0; }
    .ef-head-title { margin: 0; font-size: 1.12rem; font-weight: 800; color: var(--text); letter-spacing: -0.02em; }
    .ef-head-sub   { margin: 3px 0 0; font-size: 0.78rem; color: var(--text-subtle); line-height: 1.35; }
    .ef-head-close {
      flex-shrink: 0; width: 32px; height: 32px; border-radius: var(--radius-sm);
      border: 1px solid var(--border); background: var(--surface);
      color: var(--text-faint); cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .ef-head-close:hover { background: var(--danger-soft); color: var(--danger); border-color: transparent; }

    /* ── Body ──────────────────────────────────────────────── */
    /* Even Sakai rhythm: 16px field gap, label→control 6px, grid gap 16px. */
    .ef-body {
      display: flex; flex-direction: column; gap: 16px;
      padding: 24px;
    }
    .ef-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 520px) { .ef-grid-2 { grid-template-columns: 1fr; } }

    .ef-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
    .ef-label {
      font-size: 0.76rem; font-weight: 700; color: var(--text-muted);
      letter-spacing: 0.01em; display: inline-flex; align-items: center; gap: 6px;
    }
    .ef-req { color: var(--danger); font-weight: 700; }
    .ef-cur-tag {
      font-size: 0.6rem; font-weight: 800; letter-spacing: 0.05em;
      padding: 1px 6px; border-radius: 999px;
      background: var(--accent-soft); color: var(--accent);
    }
    .ef-hint {
      display: inline-flex; align-items: center; gap: 6px;
      margin-top: 2px;
      font-size: 0.7rem; color: var(--text-faint); line-height: 1.3;
    }
    .ef-hint .pi { font-size: 0.72rem; }

    /* Layout-only: stretch PrimeNG controls to full width.
       Control SKIN (border/focus/overlay) is owned by the global theme. */
    :host ::ng-deep .ef-w-full,
    :host ::ng-deep .ef-w-full .p-select,
    :host ::ng-deep .ef-w-full .p-datepicker,
    :host ::ng-deep .ef-w-full input { width: 100% !important; }

    :host ::ng-deep .p-inputgroup { width: 100%; }

    /* ── Amount field — prominent (deliberate custom control) ── */
    .ef-amount-field { gap: 8px; }
    .ef-amount-shell {
      display: flex; align-items: center; gap: 4px;
      border: 1.5px solid var(--border-strong); border-radius: var(--radius);
      background: var(--surface-muted);
      padding: 4px 6px 4px 14px;
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    }
    .ef-amount-shell:focus-within {
      border-color: var(--accent); background: var(--surface);
      box-shadow: 0 0 0 3px var(--accent-soft);
    }
    .ef-amount-sym {
      font-size: 1.5rem; font-weight: 800; color: var(--accent);
      line-height: 1; font-family: var(--font-mono);
    }
    .ef-amount-shell.is-empty .ef-amount-sym { color: var(--text-faint); }
    :host ::ng-deep .ef-amount-input { flex: 1; }
    :host ::ng-deep .ef-amount-input input {
      border: none !important; background: transparent !important; box-shadow: none !important;
      font-size: 1.55rem !important; font-weight: 700 !important;
      font-family: var(--font-mono) !important; font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em; color: var(--text) !important;
      padding: 6px 8px !important; width: 100% !important;
    }
    :host ::ng-deep .ef-amount-input input:focus { outline: none !important; }

    .ef-fx {
      display: flex; gap: 8px; flex-wrap: wrap;
      opacity: 0; transform: translateY(-3px);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .ef-fx.is-on { opacity: 1; transform: none; }
    .ef-fx-pill {
      padding: 4px 11px; border-radius: 999px;
      font-size: 0.74rem; font-weight: 700;
    }

    /* ── Select option rows ────────────────────────────────── */
    .ef-opt { display: inline-flex; align-items: center; gap: 9px; }
    .ef-opt-ic { font-size: 0.8rem; width: 16px; text-align: center; }
    .ef-opt-ic.tone-accent  { color: var(--accent); }
    .ef-opt-ic.tone-success { color: var(--success); }
    .ef-opt-ic.tone-warning { color: var(--warning); }
    .ef-opt-ic.tone-info    { color: var(--info); }
    .ef-opt-ic.tone-danger  { color: var(--danger); }
    .ef-opt-ic.tone-neutral { color: var(--text-subtle); }

    /* ── Tipe segmented control (self-contained, iOS-style) ──── */
    .ef-seg {
      display: flex; gap: 4px; width: 100%;
      padding: 4px; border-radius: var(--radius);
      background: var(--surface-muted); border: 1px solid var(--border);
    }
    .ef-seg-btn {
      flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 9px 10px; border: none; background: transparent; cursor: pointer;
      border-radius: var(--radius-sm); font-family: inherit;
      font-size: 0.85rem; font-weight: 600; color: var(--text-muted);
      transition: background 0.15s, color 0.15s, box-shadow 0.15s;
    }
    .ef-seg-btn .pi { font-size: 0.85rem; color: var(--text-faint); transition: color 0.15s; }
    .ef-seg-btn:hover:not(.is-active) { color: var(--text); }
    .ef-seg-btn.is-active {
      background: var(--surface); color: var(--accent); font-weight: 700;
      box-shadow: var(--shadow-sm);
    }
    .ef-seg-btn.is-active .pi { color: var(--accent); }

    /* ── Shared toggle card ────────────────────────────────── */
    .ef-toggle-card {
      display: flex; align-items: center; gap: 14px; width: 100%;
      text-align: left; font-family: inherit; cursor: pointer;
      padding: 14px 16px; border-radius: var(--radius);
      border: 1.5px solid var(--border); background: var(--surface-muted);
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    }
    .ef-toggle-card:hover { border-color: var(--border-strong); }
    .ef-toggle-card.is-on {
      border-color: var(--accent); background: var(--accent-soft);
      box-shadow: 0 0 0 3px var(--accent-soft);
    }
    .ef-toggle-ic {
      flex-shrink: 0; width: 38px; height: 38px; border-radius: var(--radius-sm);
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--surface); color: var(--text-subtle);
      border: 1px solid var(--border); font-size: 0.95rem;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .ef-toggle-card.is-on .ef-toggle-ic { background: var(--accent); color: #fff; border-color: var(--accent); }
    .ef-toggle-text  { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .ef-toggle-title { font-size: 0.85rem; font-weight: 700; color: var(--text); }
    .ef-toggle-sub   { font-size: 0.72rem; color: var(--text-subtle); line-height: 1.3; }
    /* Force the switch to sit vertically centered (was reading low against the 2-line text). */
    :host ::ng-deep .ef-toggle-card p-toggleswitch,
    :host ::ng-deep .ef-toggle-card .p-toggleswitch {
      align-self: center; flex-shrink: 0; margin: 0;
      display: inline-flex; align-items: center;
    }

    /* ── Footer ────────────────────────────────────────────── */
    .ef-foot {
      display: flex; align-items: center; justify-content: flex-end; gap: 10px;
      padding: 16px 22px;
      background: var(--surface-muted);
      border-top: 1px solid var(--border);
    }
    .ef-cancel {
      padding: 10px 18px; border-radius: var(--radius);
      font-size: 0.85rem; font-weight: 600; font-family: inherit;
      background: transparent; color: var(--text-muted);
      border: 1px solid transparent; cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .ef-cancel:hover { background: var(--surface-sunken); color: var(--text); }
    :host ::ng-deep .ef-submit {
      box-shadow: 0 4px 12px var(--accent-soft);
    }
    :host ::ng-deep .ef-submit:not(:disabled):hover { box-shadow: var(--shadow-md); }
  `]
})
export class ExpenseFormComponent {
  @Input() open = false;
  @Input()
  set form(value: ExpenseFormData) {
    this._form = value;
    this.category.set(value.category);
  }
  get form(): ExpenseFormData { return this._form; }
  private _form: ExpenseFormData = { ...EMPTY_FORM };

  @Output() openChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<ExpenseFormData>();

  protected readonly today = new Date();

  protected categoryOptions: CategoryOption[] = CATEGORIES.map(c => ({
    label: c, value: c, style: categoryStyle(c),
  }));
  protected sourceOptions: SourceOption[] = SOURCES.map(s => ({
    label: s, value: s, icon: 'pi ' + (SOURCE_ICONS[s] ?? 'pi-wallet'),
  }));
  protected typeOptions: TypeOption[] = [
    { label: 'Pribadi', value: 'PERSONAL', icon: 'pi-user' },
    { label: 'Resmi',   value: 'OFFICIAL', icon: 'pi-briefcase' },
  ];

  protected fmtUsd = fmtUsd;
  protected fmtIdr = fmtIdr;

  // Tracks the selected category reactively so the header icon/tone updates live.
  private category = signal<string>(EMPTY_FORM.category);
  protected activeCategory = computed<CategoryOption>(() => {
    const cat = this.category();
    return this.categoryOptions.find(o => o.value === cat)
      ?? { label: cat, value: cat, style: categoryStyle(cat) };
  });

  /** ngModel bridge: writes the category to the shared form and the reactive signal. */
  protected get categoryModel(): string { return this._form.category; }
  protected set categoryModel(value: string) {
    this._form.category = value;
    this.category.set(value);
  }

  protected hasAmount(): boolean {
    return this._form.amount != null && this._form.amount > 0;
  }

  isValid(): boolean {
    return !!(this._form.description?.trim() && this._form.amount && this._form.amount > 0 && this._form.expenseDate);
  }

  onSave(): void {
    if (!this.isValid()) return;
    this.save.emit(this._form);
  }
}
