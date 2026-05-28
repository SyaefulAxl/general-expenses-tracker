import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { Expense, ExpenseStatus } from '@core/models';
import { fmtUsd, fmtIdr } from '@core/utils/currency.utils';

export interface ExpenseFormData {
  id?: number;
  expenseDate: Date | null;
  toko: string;
  description: string;
  amount: number | null;
  category: string;
  source: string;
  shared: boolean;
  status: ExpenseStatus;
}

export const EMPTY_FORM: ExpenseFormData = {
  expenseDate: new Date(),
  toko: '',
  description: '',
  amount: null,
  category: 'Food',
  source: 'Cash',
  shared: false,
  status: 'PENDING',
};

const CATEGORIES = ['Transport', 'Food', 'Accommodation', 'Entertainment', 'Other'];
const SOURCES    = ['Cash', 'Credit Card', 'Debit Card', 'Transfer', 'Winda Cash'];
const STATUSES: ExpenseStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED'];

export function toFormData(exp: Expense): ExpenseFormData {
  return {
    id: exp.id,
    expenseDate: exp.expenseDate ? new Date(exp.expenseDate) : new Date(),
    toko: exp.toko ?? '',
    description: exp.description,
    amount: exp.amount,
    category: exp.category,
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
    InputTextModule, InputNumberModule, SelectModule, DatePickerModule, CheckboxModule,
  ],
  template: `
    <p-dialog
      [visible]="open"
      (visibleChange)="openChange.emit($event)"
      [header]="form.id ? 'Edit expense' : 'Add expense'"
      [modal]="true"
      [draggable]="false"
      [resizable]="false"
      [style]="{ width: '520px' }"
      appendTo="body">

      <div class="dialog-body">
        <div class="form-row">
          <div class="form-grp">
            <label class="form-lbl">Date <span class="req">*</span></label>
            <p-datepicker
              [(ngModel)]="form.expenseDate"
              [showIcon]="true"
              dateFormat="yy-mm-dd"
              placeholder="Select date"
              styleClass="w-full">
            </p-datepicker>
          </div>
          <div class="form-grp">
            <label class="form-lbl">Store / Toko</label>
            <input class="form-inp" type="text" [(ngModel)]="form.toko" placeholder="e.g. Seven 11" />
          </div>
        </div>

        <div class="form-grp">
          <label class="form-lbl">Description <span class="req">*</span></label>
          <input class="form-inp" type="text" [(ngModel)]="form.description" placeholder="What was this expense for?" />
        </div>

        <div class="form-row">
          <div class="form-grp">
            <label class="form-lbl">Amount (THB) <span class="req">*</span></label>
            <p-inputnumber
              [(ngModel)]="form.amount"
              mode="decimal"
              [minFractionDigits]="2"
              [maxFractionDigits]="2"
              placeholder="0.00"
              styleClass="w-full">
            </p-inputnumber>
            @if (form.amount && form.amount > 0) {
              <div class="amount-preview">
                <span class="prev-pill tone-success num">≈ {{ fmtUsd(form.amount) }}</span>
                <span class="prev-pill tone-accent  num">≈ {{ fmtIdr(form.amount) }}</span>
              </div>
            }
          </div>
          <div class="form-grp">
            <label class="form-lbl">Category <span class="req">*</span></label>
            <p-select
              [(ngModel)]="form.category"
              [options]="categoryOptions"
              placeholder="Select category"
              styleClass="w-full">
            </p-select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-grp">
            <label class="form-lbl">Payment source</label>
            <p-select
              [(ngModel)]="form.source"
              [options]="sourceOptions"
              placeholder="Select source"
              styleClass="w-full">
            </p-select>
          </div>
          <div class="form-grp">
            <label class="form-lbl">Status</label>
            <p-select
              [(ngModel)]="form.status"
              [options]="statusOptions"
              placeholder="Select status"
              styleClass="w-full">
            </p-select>
          </div>
        </div>

        <div class="form-check">
          <p-checkbox [(ngModel)]="form.shared" [binary]="true" inputId="shared"></p-checkbox>
          <label for="shared" class="check-lbl">This expense is shared among team members</label>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button type="button" class="dlg-btn dlg-cancel" (click)="openChange.emit(false)">Cancel</button>
        <button type="button" class="dlg-btn dlg-save" (click)="onSave()" [disabled]="!isValid()">
          {{ form.id ? 'Update expense' : 'Add expense' }}
        </button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .dialog-body { display: flex; flex-direction: column; gap: 16px; }
    .form-row    { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 540px) { .form-row { grid-template-columns: 1fr; } }
    .form-grp    { display: flex; flex-direction: column; gap: 6px; }
    .form-lbl    { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); }
    .req         { color: var(--danger); }
    .form-inp {
      width: 100%; padding: 9px 12px;
      border: 1.5px solid var(--border); border-radius: var(--radius-sm);
      font-size: 0.875rem; font-family: inherit; color: var(--text);
      background: var(--surface); outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .form-inp:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }

    .amount-preview { display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap; }
    .prev-pill { padding: 3px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; }

    .form-check { display: flex; align-items: center; gap: 8px; }
    .check-lbl  { font-size: 0.85rem; color: var(--text-muted); cursor: pointer; }

    .dlg-btn {
      padding: 9px 18px; border-radius: var(--radius-sm);
      font-size: 0.875rem; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: background 0.15s;
    }
    .dlg-cancel {
      background: var(--surface); color: var(--text-muted); border: 1px solid var(--border);
    }
    .dlg-cancel:hover { background: var(--surface-muted); }
    .dlg-save {
      background: var(--accent); color: #fff; border: none;
      box-shadow: 0 4px 12px rgba(37,99,235,0.25);
    }
    .dlg-save:hover:not(:disabled) { background: var(--accent-hover); }
    .dlg-save:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
  `]
})
export class ExpenseFormComponent {
  @Input() open = false;
  @Input() form: ExpenseFormData = { ...EMPTY_FORM };

  @Output() openChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<ExpenseFormData>();

  protected categoryOptions = CATEGORIES.map(c => ({ label: c, value: c }));
  protected sourceOptions   = SOURCES.map(s => ({ label: s, value: s }));
  protected statusOptions   = STATUSES.map(s => ({ label: s, value: s }));
  protected fmtUsd = fmtUsd;
  protected fmtIdr = fmtIdr;

  isValid(): boolean {
    return !!(this.form.description?.trim() && this.form.amount && this.form.amount > 0 && this.form.expenseDate);
  }

  onSave(): void {
    if (!this.isValid()) return;
    this.save.emit(this.form);
  }
}
